// server/audit.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from './db';

export async function logAudit(
  userId: string | null,
  email: string | null,
  action: string,
  details: any,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail: email,
        action,
        details: JSON.stringify(details),
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('[Audit Log Error]:', error);
  }
}

// Middleware to audit specific route actions
export const auditAction = (actionName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Intercept response to check if transaction succeeded before logging
    const originalSend = res.send;
    res.send = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id || null;
        const email = req.user?.email || null;
        const details = {
          url: req.originalUrl,
          method: req.method,
          params: req.params,
          query: req.query,
          body: req.method !== 'GET' ? req.body : undefined
        };
        logAudit(userId, email, actionName, details, req.ip);
      }
      return originalSend.apply(res, arguments as any);
    };
    next();
  };
};
