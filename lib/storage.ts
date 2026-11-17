import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

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

interface FileRecord {
  id: string;
  organization_id: string;
  name: string;
  key: string;
  size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

/**
 * Upload file to S3/R2
 */
export async function uploadFile({ key, body, contentType, metadata }: UploadOptions): Promise<void> {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  }));
}

/**
 * Generate presigned upload URL (client-side direct upload)
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Generate presigned download URL
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Delete file from S3/R2
 */
export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * List files in a prefix
 */
export async function listFiles(prefix: string, maxKeys = 100): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });
  const response = await s3.send(command);
  return (response.Contents || []).map(obj => ({
    key: obj.Key!,
    size: obj.Size || 0,
    lastModified: obj.LastModified!,
  }));
}

/**
 * Generate unique storage key
 */
export function generateStorageKey(
  organizationId: string,
  fileName: string,
  folder = 'uploads'
): string {
  const ext = fileName.split('.').pop() || '';
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  return `${folder}/${organizationId}/${timestamp}-${uuid}.${ext}`;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'text/plain', 'text/csv', 'text/markdown',
    'application/json',
    'application/zip', 'application/x-zip-compressed',
  ];

  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: 'File too large (max 50MB)' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}

/**
 * Upload API endpoint handler
 */
export async function handleFileUpload(
  req: Request,
  user: { id: string; organization_id: string }
): Promise<{ id: string; name: string; size: number; url: string } | { error: string; status: number }> {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) return { error: 'No file provided', status: 400 };

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) return { error: validation.error!, status: 400 };

  // Generate storage key
  const key = generateStorageKey(user.organization_id, file.name);

  // Upload to S3/R2
  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadFile({ key, body: buffer, contentType: file.type });

  // Generate download URL
  const downloadUrl = await getPresignedDownloadUrl(key);

  // Save file record to DB
  const db = await import('./db').then(m => m.getDb());
  const id = crypto.randomUUID();
  const dbModule = await import('./db');
  const dbInstance = dbModule.getDb();
  
  dbInstance.prepare(
    'INSERT INTO files (id, organization_id, name, key, size, mime_type, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))'
  ).run(crypto.randomUUID(), user.organization_id, file.name, key, file.size, file.type, user.id);

  return { id: crypto.randomUUID(), name: file.name, size: file.size, url: downloadUrl };
}
