// server/notifications.ts
import { prisma } from './db';
import * as fs from 'fs';
import * as path from 'path';

export interface NotificationPayload {
  recipient: string; // phone or email
  title: string;
  message: string;
  channels: ('WHATSAPP' | 'EMAIL' | 'SMS' | 'PUSH')[];
  userId?: string;
}

export async function sendNotification(payload: NotificationPayload) {
  const { recipient, title, message, channels, userId } = payload;

  for (const channel of channels) {
    let status = 'SENT';
    let error: string | null = null;

    try {
      if (channel === 'WHATSAPP') {
        // Simulated WhatsApp logging to file
        const logPath = path.resolve(process.cwd(), 'whatsapp_messages.log');
        const logEntry = `[${new Date().toISOString()}] [WHATSAPP] To: ${recipient} | Title: ${title} | Msg: ${message}\n`;
        fs.appendFileSync(logPath, logEntry);
        console.log(`[WhatsApp Mock Sent] To: ${recipient} | Msg: ${message}`);
      } else if (channel === 'EMAIL') {
        console.log(`[Email Mock Sent] To: ${recipient} | Subject: ${title} | Msg: ${message}`);
      } else if (channel === 'SMS') {
        console.log(`[SMS Mock Sent] To: ${recipient} | Msg: ${message}`);
      } else if (channel === 'PUSH') {
        console.log(`[Push Mock Sent] User: ${userId || recipient} | Title: ${title}`);
      }
    } catch (e: any) {
      status = 'FAILED';
      error = e.message || String(e);
      console.error(`[Notification Failure] ${channel} channel to ${recipient}:`, e);
    }

    // Save execution metadata log to PostgreSQL
    try {
      await prisma.notificationLog.create({
        data: {
          recipient,
          channel,
          title,
          message,
          status,
          error,
        },
      });

      // Populate in-app notification center for users
      if (userId) {
        await prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type: channel === 'WHATSAPP' || channel === 'SMS' ? 'SYSTEM' : 'ORDER',
            isRead: false,
          },
        });
      }
    } catch (dbErr) {
      console.error('[Notification DB Logging failed]:', dbErr);
    }
  }
}
