// src/lib/auth.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sri_pavan_computers_secret_jwt_key_secure_2026';

// Password hashing
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Server-side JWT signature signing
export function signToken(payload: { id: string; email: string; role: string; name: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Server-side JWT signature verification
export function verifyToken(token: string): { id: string; email: string; role: string; name: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; name: string };
  } catch (error) {
    return null;
  }
}

// Edge Runtime compatible decoder (for Middleware role-checks)
// Decodes and parses payload without verifying signature (backend APIs will verify signature securely)
export function decodeToken(token: string): { id: string; email: string; role: string; name: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Base64Url decode payload
    let payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = payloadBase64.length % 4;
    if (pad) {
      if (pad === 1) return null;
      payloadBase64 += new Array(5 - pad).join('=');
    }
    
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
    return JSON.parse(payloadJson);
  } catch (error) {
    return null;
  }
}
