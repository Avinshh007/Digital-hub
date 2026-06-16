// server/auth.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { Response } from 'express';

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

// Server-side JWT signature verification
export function verifyToken(token: string): { id: string; email: string; role: string; name: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; name: string };
  } catch (error) {
    return null;
  }
}

// Sets short-lived access token and HttpOnly refresh token
export function setAuthCookies(res: Response, payload: { id: string; email: string; role: string; name: string }, rememberMe = false) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: rememberMe ? '30d' : '7d' });

  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 15, // 15 minutes
    path: '/'
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24 * 7,
    path: '/'
  });
}
