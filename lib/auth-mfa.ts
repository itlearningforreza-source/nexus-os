import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

const MFA_ISSUER = 'Nexus OS';

/**
 * Generate a new MFA secret for a user
 */
export function generateMFASecret(userEmail: string): string {
  return authenticator.generateSecret();
}

/**
 * Generate QR code for MFA setup
 */
export async function getMFAQRCode(userEmail: string, secret: string): Promise<string> {
  const otpauth = authenticator.keyuri(userEmail, MFA_ISSUER, secret);
  return QRCode.toDataURL(otpauth);
}

/**
 * Verify MFA token
 */
export function verifyMFAToken(secret: string, token: string): boolean {
  try {
    return authenticator.check(token, secret);
  } catch {
    return false;
  }
}

/**
 * Generate backup codes for MFA recovery
 */
export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
}

/**
 * Hash backup code for storage
 */
export async function hashBackupCode(code: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hashSync(code.toUpperCase(), 10);
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(code: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  try {
    return bcrypt.compareSync(code.toUpperCase(), hash);
  } catch {
    return false;
  }
}
