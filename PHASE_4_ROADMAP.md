# Phase 4 Roadmap
## Database Migration, Monitoring & Production Hardening (Week 4-6)

**Date:** 2024-11-15  
**Status:** PLANNED

---

## Phase 4 Objectives

1. **PostgreSQL Migration** - Replace SQLite for horizontal scaling
2. **Monitoring & Alerting** - Prometheus/Grafana stack
3. **Backup/Restore Automation** - Verified recovery procedures
4. **Auth Hardening** - MFA, SSO/SAML, passwordless
5. **Real-time Infrastructure** - WebSocket/SSE for chat/notifications
6. **File Storage** - S3/R2 integration for documents/attachments

---

## 4.1 PostgreSQL Migration (Week 4-5)

### Why PostgreSQL?
- SQLite is single-node only (no horizontal scaling)
- Better connection pooling (PgBouncer)
- Advanced features: JSONB, full-text search, partitioning
- Production-grade reliability

### Migration Strategy

#### Step 1: Schema Translation
```
-- SQLite to PostgreSQL type mapping
INTEGER to BIGINT
TEXT to TEXT / VARCHAR
REAL to DOUBLE PRECISION
BOOLEAN to BOOLEAN
DATETIME to TIMESTAMP WITH TIME ZONE
JSON to JSONB
```

#### Step 2: Migration Scripts
```bash
# Create migration directory
mkdir -p migrations/postgres

# Generate initial schema
pg_dump --schema-only --no-owner --no-privileges \
  -h localhost -U nexus_user nexus_db > migrations/postgres/001_initial_schema.sql
```

#### Step 3: Data Migration
```bash
# Use pgloader or custom ETL
pgloader sqlite://data/nexus.db postgresql://user:pass@localhost/nexus
```

#### Step 4: Connection Pooling
```javascript
// lib/db-postgres.ts
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### Step 5: Migration Runner
```typescript
// lib/migrate-postgres.ts
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(50) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  
  const migrationsDir = path.join(__dirname, '../migrations/postgres');
  const files = fs.readdirSync(migrationsDir).sort();
  
  for (const file of files) {
    const version = file.replace('.sql', '');
    const [applied] = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE version = $1',
      [version]
    );
    
    if (!applied.rows.length) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      await pool.query(
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        [version]
      );
      console.log('Applied migration: ' + version);
    }
  }
}
```

### Dual-Database Support (Transition Period)
```typescript
// lib/db.ts - Factory pattern
const USE_POSTGRES = process.env.USE_POSTGRES === 'true';

export function getDb() {
  if (USE_POSTGRES) return getPostgresDb();
  return getSqliteDb();
}
```

---

## 4.2 Monitoring & Alerting (Week 4-5)

### Prometheus + Grafana Stack

#### Docker Compose (Development)
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
    depends_on:
      - prometheus

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  prometheus-data:
  grafana-data:
```

#### Prometheus Config
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - 'alerts/*.yml'

scrape_configs:
  - job_name: 'nexus-os'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/api/metrics'

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

#### Application Metrics Endpoint
```typescript
// app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const REGISTRY = new Map<string, number>();

function incMetric(name: string, value = 1) {
  REGISTRY.set(name, (REGISTRY.get(name) || 0) + value);
}

function getMetrics() {
  const lines = [];
  for (const [name, value] of REGISTRY) {
    lines.push('# TYPE ' + name + ' counter');
    lines.push(name + ' ' + value);
  }
  
  // System metrics
  const mem = process.memoryUsage();
  lines.push('# TYPE process_memory_bytes gauge');
  lines.push('process_memory_rss_bytes ' + mem.rss);
  lines.push('process_memory_heap_used_bytes ' + mem.heapUsed);
  lines.push('process_memory_heap_total_bytes ' + mem.heapTotal);
  
  lines.push('# TYPE process_uptime_seconds gauge');
  lines.push('process_uptime_seconds ' + process.uptime());
  
  // DB metrics
  try {
    const db = getDb();
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get()?.c || 0;
    lines.push('# TYPE nexos_users_total gauge');
    lines.push('nexos_users_total ' + userCount);
  } catch {}
  
  return lines.join('\n');
}

export async function GET() {
  return new NextResponse(getMetrics(), {
    headers: { 'Content-Type': 'text/plain; version=0.0.4' },
  });
}
```

#### Key Alerts
```yaml
# monitoring/alerts/nexos.yml
groups:
  - name: nexos-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(nexos_http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on Nexus OS"
          description: "Error rate is {{ $value }}%"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(nexos_http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency on Nexus OS"

      - alert: DatabaseDown
        expr: up{job="postgres-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL is down"

      - alert: HighMemoryUsage
        expr: (process_memory_rss_bytes / 1024 / 1024) > 500
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage (>500MB)"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space low (<10% free)"
```

#### Grafana Dashboards
```json
{
  "dashboard": {
    "title": "Nexus OS - Overview",
    "panels": [
      {"title": "Request Rate", "type": "graph", "targets": [{"expr": "rate(nexos_http_requests_total[5m])"}]},
      {"title": "Error Rate", "type": "graph", "targets": [{"expr": "rate(nexos_http_requests_total{status=~\"5..\"}[5m])"}]},
      {"title": "Latency (p95)", "type": "graph", "targets": [{"expr": "histogram_quantile(0.95, rate(nexos_http_request_duration_seconds_bucket[5m]))"}]},
      {"title": "Active Users", "type": "stat", "targets": [{"expr": "nexos_active_users"}]},
      {"title": "Database Connections", "type": "graph", "targets": [{"expr": "pg_stat_database_numbackends"}]},
      {"title": "Memory Usage", "type": "graph", "targets": [{"expr": "process_memory_rss_bytes / 1024 / 1024"}]}
    ]
  }
}
```

---

## 4.3 Backup/Restore Automation (Week 5)

### Backup Strategy

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Full (pg_dump) | Daily 02:00 UTC | 30 days | S3/R2 |
| Incremental (WAL) | Every 5 min | 7 days | S3/R2 |
| Schema-only | Weekly | 90 days | S3/R2 |
| Config/Secrets | On change | Indefinite | Vault/1Password |

### Automated Backup Script
```bash
#!/bin/bash
# scripts/backup-postgres.sh
set -euo pipefail

DB_URL="${DATABASE_URL}"
S3_BUCKET="${BACKUP_S3_BUCKET}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="nexos_backup_${DATE}.sql.gz"

# Full backup
pg_dump "${DB_URL}" \
  --no-owner --no-privileges \
  --format=custom --compress=9 \
  | gzip > "/tmp/${BACKUP_FILE}"

# Upload to S3
aws s3 cp "/tmp/${BACKUP_FILE}" "s3://${S3_BUCKET}/daily/${BACKUP_FILE}"
  --storage-class STANDARD_IA

# Cleanup old backups (keep 30 days)
aws s3 ls "s3://${S3_BUCKET}/daily/" | \
  awk '$1 < "'$(date -d '30 days ago' +%Y-%m-%d)'" {print $4}' | \
  xargs -I {} aws s3 rm "s3://${S3_BUCKET}/daily/{}"

# Verify backup
BACKUP_SIZE=$(aws s3api head-object --bucket "${S3_BUCKET}" --key "daily/${BACKUP_FILE}" --query 'ContentLength')
if [ "${BACKUP_SIZE}" -lt 1000 ]; then
  echo "ERROR: Backup too small (${BACKUP_SIZE} bytes)"
  exit 1
fi

echo "Backup completed: ${BACKUP_FILE} (${BACKUP_SIZE} bytes)"
```

### Restore Procedure (Documented & Tested)
```bash
#!/bin/bash
# scripts/restore-postgres.sh
set -euo pipefail

BACKUP_FILE="${1}"
DB_URL="${DATABASE_URL}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

# Download from S3
aws s3 cp "s3://${BACKUP_S3_BUCKET}/daily/${BACKUP_FILE}" "/tmp/${BACKUP_FILE}"

# Verify backup integrity
gzip -t "/tmp/${BACKUP_FILE}"

# Restore (requires downtime)
echo "WARNING: This will REPLACE the database. Continue? (y/N)"
read -r CONFIRM
if [ "${CONFIRM}" != "y" ]; then
  exit 1
fi

pg_restore --clean --if-exists --no-owner --no-privileges \
  -d "${DB_URL}" "/tmp/${BACKUP_FILE}"

echo "Restore completed successfully"
```

### Automated Restore Testing (Monthly)
```yaml
# .github/workflows/backup-test.yml
name: Backup Restore Test
on:
  schedule:
    - cron: '0 3 1 * *'  # Monthly 1st day 03:00 UTC

jobs:
  test-restore:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup PostgreSQL
        uses: harmon758/postgresql-action@v1
        with:
          postgresql version: '16'
          postgresql db: 'nexos_test'
      - name: Download latest backup
        run: |
          aws s3 cp s3://${{ secrets.BACKUP_S3_BUCKET }}/daily/$(aws s3 ls s3://${{ secrets.BACKUP_S3_BUCKET }}/daily/ | tail -1 | awk '{print $4}') /tmp/backup.sql.gz
      - name: Restore backup
        run: |
          gzip -d /tmp/backup.sql.gz
          pg_restore --clean --if-exists --no-owner --no-privileges -d nexos_test /tmp/backup.sql
      - name: Verify data integrity
        run: |
          psql -d nexos_test -c "SELECT COUNT(*) FROM users;"
          psql -d nexos_test -c "SELECT COUNT(*) FROM organizations;"
          psql -d nexos_test -c "SELECT COUNT(*) FROM contacts;"
```

---

## 4.4 Auth Hardening (Week 5-6)

### MFA (TOTP)
```typescript
// lib/auth-mfa.ts
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

const MFA_ISSUER = 'Nexus OS';

export function generateMFASecret(userEmail: string): string {
  return authenticator.generateSecret();
}

export function getMFAQRCode(userEmail: string, secret: string): Promise<string> {
  const otpauth = authenticator.keyuri(userEmail, MFA_ISSUER, secret);
  return QRCode.toDataURL(otpauth);
}

export function verifyMFAToken(secret: string, token: string): boolean {
  return authenticator.check(token, secret);
}

export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
}
```

### SSO/SAML (NextAuth.js Integration)
```typescript
// lib/auth-sso.ts
import NextAuth from 'next-auth';
import SAMLProvider from 'next-auth/providers/saml';

const SAML_PROVIDERS = {
  okta: {
    issuer: process.env.OKTA_ISSUER,
    callbackUrl: process.env.SAML_CALLBACK_URL,
    certificate: process.env.SAML_CERT,
  },
  azure: {
    issuer: process.env.AZURE_ISSUER,
    callbackUrl: process.env.SAML_CALLBACK_URL,
    certificate: process.env.SAML_CERT,
  },
  generic: {
    issuer: process.env.SAML_ISSUER,
    callbackUrl: process.env.SAML_CALLBACK_URL,
    certificate: process.env.SAML_CERT,
  },
};

export const authConfig = {
  providers: [
    ...Object.entries(SAML_PROVIDERS).map(([id, config]) =>
      SAMLProvider({
        id,
        name: id,
        issuer: config.issuer,
        callbackUrl: config.callbackUrl,
        certificate: config.certificate,
        audience: 'nexus-os',
      })
    ),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Map SAML attributes to user
      // Create/update user in DB
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account) token.saml = account;
      return token;
    },
    async session({ session, token }) {
      session.saml = token.saml;
      return session;
    },
  },
};
```

### Passwordless (Magic Links)
```typescript
// lib/auth-passwordless.ts
import { createToken, verifyToken } from './auth';
import { sendEmail } from './email';

const MAGIC_LINK_TTL = 15 * 60 * 1000; // 15 minutes

export async function sendMagicLink(email: string) {
  const token = await createToken(email, { type: 'magic-link' });
  const link = process.env.NEXTAUTH_URL + '/auth/verify?token=' + token;
  
  await sendEmail({
    to: email,
    subject: 'Your Nexus OS Magic Link',
    html: '
      <p>Click the link below to sign in (expires in 15 minutes):</p>
      <p><a href="' + link + '">' + link + '</a></p>
      <p>If you didn't request this, please ignore.</p>
    ',
  });
}

export async function verifyMagicLink(token: string) {
  try {
    const payload = await verifyToken(token);
    if (payload.type !== 'magic-link') return null;
    if (Date.now() > payload.exp * 1000) return null;
    return payload.sub; // email
  } catch {
    return null;
  }
}
```

---

## 4.5 Real-time Infrastructure (Week 6)

### WebSocket Server (Socket.io)
```typescript
// lib/realtime-server.ts
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { verifyToken } from './auth';

const io = new SocketIOServer({
  cors: { origin: process.env.NEXTAUTH_URL, credentials: true },
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  
  const userId = await verifyToken(token);
  if (!userId) return next(new Error('Invalid token'));
  
  socket.data.userId = userId;
  next();
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  
  // Join organization room
  socket.join('org:' + socket.data.orgId);
  
  // Chat events
  socket.on('message:send', async (data) => {
    // Validate, save to DB, broadcast
    io.to('org:' + socket.data.orgId).emit('message:new', data);
  });
  
  // Notifications
  socket.on('notification:read', async (notificationId) => {
    // Mark as read in DB
  });
  
  // Typing indicators
  socket.on('typing:start', (conversationId) => {
    socket.to('org:' + socket.data.orgId).emit('typing:start', {
      userId, conversationId
    });
  });
});

export { io };
```

### Server-Sent Events (Simpler Alternative)
```typescript
// app/api/events/route.ts
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  
  const stream = new ReadableStream({
    start(controller) {
      // Subscribe to user's notification channel
      const channel = 'notifications:' + user.organization_id + ':' + user.id;
      subscribe(channel, (data) => {
        controller.enqueue('data: ' + JSON.stringify(data) + '\n\n');
      });
      
      // Heartbeat
      const interval = setInterval(() => {
        controller.enqueue(': heartbeat\n\n');
      }, 30000);
      
      req.signal.addEventListener('abort', () => {
        unsubscribe(channel);
        clearInterval(interval);
      });
    },
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## 4.6 File Storage (S3/R2) (Week 6)

### S3 Client Configuration
```typescript
// lib/storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;

interface UploadOptions {
  key: string;
  body: Buffer | Uint8Array | Readable;
  contentType: string;
  metadata?: Record<string, string>;
}

export async function uploadFile({ key, body, contentType, metadata }: UploadOptions) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  }));
}

export async function getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function deleteFile(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
```

### Upload API Endpoint
```typescript
// app/api/upload/route.ts
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 401 });
  
  // Validate file
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 413 });
  }
  
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
  ];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
  }
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = 'uploads/' + user.organization_id + '/' + crypto.randomUUID() + '-' + file.name;
  
  await uploadFile({ key, body: buffer, contentType: file.type, metadata: {
    originalName: file.name,
    uploadedBy: user.id,
  }});
  
  const downloadUrl = await getPresignedDownloadUrl(key);
  
  // Save file record to DB
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO files (id, organization_id, name, key, size, mime_type, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))')
    .run(id, user.organization_id, file.name, key, file.size, file.type, user.id);
  
  return NextResponse.json({ id, name: file.name, size: file.size, url: downloadUrl });
}
```

---

## 4.7 Implementation Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| 4 | PostgreSQL Migration | Schema migration, data migration, dual-DB support, PgBouncer |
| 4-5 | Monitoring | Prometheus/Grafana stack, dashboards, alerts, metrics endpoint |
| 5 | Backup/Restore | Automated daily backups, monthly restore testing, S3 storage |
| 5-6 | Auth Hardening | MFA (TOTP), SSO/SAML, magic links, backup codes |
| 6 | Real-time | WebSocket/SSE server, chat, notifications, typing indicators |
| 6 | File Storage | S3/R2 upload API, presigned URLs, file records |

---

## 4.8 Success Criteria

| Metric | Target |
|--------|--------|
| PostgreSQL migration | Zero data loss, <1hr downtime |
| Monitoring coverage | 100% critical paths |
| Backup success rate | 100% (verified monthly) |
| Restore time (RTO) | < 1 hour |
| Data loss (RPO) | < 5 minutes (WAL) |
| MFA adoption | > 80% of admin users |
| Real-time latency | < 100ms |
| File upload success | > 99.9% |
| Bundle size | < 200KB gzipped |
| API latency (p95) | < 500ms |

---

## Next Actions

1. **Start PostgreSQL migration** - Set up staging PostgreSQL instance
2. **Deploy monitoring stack** - Docker Compose or Kubernetes
3. **Configure S3/R2 bucket** - For backups and file storage
4. **Schedule team sync** - Review Phase 4 priorities

---

*Phase 4 Ready to Begin*
