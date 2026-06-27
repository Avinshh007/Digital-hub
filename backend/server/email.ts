// server/email.ts
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Setup email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

/**
 * Generic email sending function with SMTP and log fallback
 */
export async function sendEmail(to: string, subject: string, htmlContent: string) {
  const fromAddress = process.env.SMTP_FROM || '"SRI PAVAN COMPUTERS" <noreply@sripavancomputers.com>';
  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    html: htmlContent,
  };

  const isSmtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!isSmtpConfigured) {
    const logPath = path.resolve(process.cwd(), 'email_messages.log');
    const textContent = htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const logEntry = `[${new Date().toISOString()}] To: ${to} | Subject: ${subject}\n--- BODY ---\n${textContent}\n-------------\n\n`;
    fs.appendFileSync(logPath, logEntry);
    console.log(`[Email Mock Sent] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email Sent] To: ${to} | Subject: ${subject}`);
  } catch (error: any) {
    console.error(`[Email Send Error] Failed to send email to ${to}:`, error);
    // Write to log even if SMTP failed as fallback/debug
    const logPath = path.resolve(process.cwd(), 'email_messages.log');
    const logEntry = `[${new Date().toISOString()}] [FAILED-SMTP] To: ${to} | Subject: ${subject} | Error: ${error?.message || String(error)}\n`;
    fs.appendFileSync(logPath, logEntry);
  }
}

/**
 * Base email layout wrapper
 */
function getEmailLayout(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 20px; }
        .container { max-width: 600px; background-color: #ffffff; padding: 35px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); margin: 0 auto; border: 1px solid #e2e8f0; }
        .header { font-size: 20px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 25px; letter-spacing: 1px; }
        .footer { font-size: 11px; color: #94a3b8; margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .highlight { color: #4f46e5; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">SRI PAVAN COMPUTERS</div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          SRI PAVAN COMPUTERS &copy; 2026 | All Rights Reserved
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 1. Registration OTP Email
 */
export async function sendRegistrationOtpEmail(email: string, name: string, otp: string) {
  const title = 'Verify Your Account';
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>Thank you for registering at SRI PAVAN COMPUTERS. To complete your signup and activate your account, please enter the following 6-digit OTP verification code:</p>
    <div style="font-size: 32px; font-weight: 800; color: #4f46e5; letter-spacing: 4px; padding: 15px; background-color: #f1f5f9; border-radius: 12px; text-align: center; margin: 25px 0; font-family: monospace;">
      ${otp}
    </div>
    <p style="font-size: 12px; color: #ef4444; font-weight: 600;">Note: This OTP code is valid for 10 minutes and can only be used once.</p>
    <p>If you did not initiate this registration, you can safely ignore this email.</p>
  `;
  await sendEmail(email, `${title} - SRI PAVAN COMPUTERS`, getEmailLayout(title, content));
}

/**
 * 2. Password Reset OTP Email
 */
export async function sendPasswordResetOtpEmail(email: string, otp: string) {
  const title = 'Reset Your Password';
  const content = `
    <p>Hello,</p>
    <p>We received a request to reset your password for your SRI PAVAN COMPUTERS customer account. Please enter the following 6-digit OTP code on the reset page:</p>
    <div style="font-size: 32px; font-weight: 800; color: #dc2626; letter-spacing: 4px; padding: 15px; background-color: #fef2f2; border-radius: 12px; text-align: center; margin: 25px 0; font-family: monospace; border: 1px solid #fee2e2;">
      ${otp}
    </div>
    <p style="font-size: 12px; color: #ef4444; font-weight: 600;">Note: This OTP code is valid for 10 minutes and will expire afterwards.</p>
    <p>If you did not request a password reset, please secure your account immediately.</p>
  `;
  await sendEmail(email, `${title} - SRI PAVAN COMPUTERS`, getEmailLayout(title, content));
}

/**
 * Helper to format order items HTML
 */
function formatOrderItemsHtml(items: any[]): string {
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
      <thead>
        <tr style="border-bottom: 2px solid #e2e8f0; color: #475569; text-align: left;">
          <th style="padding: 8px 0;">Item Name</th>
          <th style="padding: 8px 0; text-align: center;">Qty</th>
          <th style="padding: 8px 0; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600;">${item.product?.name || 'Product'}</td>
            <td style="padding: 10px 0; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700;">₹${item.price.toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * 3. Order Confirmation Email
 */
export async function sendOrderConfirmationEmail(email: string, name: string, order: any) {
  const title = `Order Confirmed #${order.id.slice(0, 8).toUpperCase()}`;
  
  let items: any[] = [];
  if (order.items) {
    items = order.items;
  }

  const shipping = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress;

  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>Thank you for shopping at SRI PAVAN COMPUTERS! Your order has been successfully placed and is being processed.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; color: #0f172a; font-size: 14px;">Order Summary</h3>
      <p style="margin: 5px 0; font-size: 13px;">Order ID: <strong>#${order.id.toUpperCase()}</strong></p>
      <p style="margin: 5px 0; font-size: 13px;">Payment Method: <strong>${order.paymentMethod}</strong></p>
      
      ${formatOrderItemsHtml(items)}
      
      <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; margin-top: 10px; text-align: right; font-weight: 800; font-size: 14px; color: #4f46e5;">
        Total Paid/Due: ₹${order.totalAmount.toLocaleString('en-IN')}
      </div>
    </div>

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; font-size: 13px;">
      <h3 style="margin-top: 0; color: #0f172a; font-size: 14px;">Shipping Address</h3>
      <p style="margin: 3px 0;"><strong>${shipping.fullName}</strong></p>
      <p style="margin: 3px 0;">${shipping.street}</p>
      <p style="margin: 3px 0;">${shipping.city}, ${shipping.state} - ${shipping.pinCode}</p>
      <p style="margin: 3px 0;">Phone: ${shipping.phone}</p>
    </div>
  `;
  await sendEmail(email, `Order Confirmation - SRI PAVAN COMPUTERS`, getEmailLayout(title, content));
}

/**
 * 4. Payment Success Email
 */
export async function sendPaymentSuccessEmail(email: string, name: string, order: any, paymentId: string) {
  const title = 'Payment Successful';
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>We have successfully verified your online payment of <span class="highlight">₹${order.totalAmount.toLocaleString('en-IN')}</span> for Order <strong>#${order.id.slice(0, 8).toUpperCase()}</strong>.</p>
    
    <div style="background-color: #ecfdf5; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #a7f3d0; font-size: 13px;">
      <h3 style="margin-top: 0; color: #065f46; font-size: 14px;">Payment Metadata</h3>
      <p style="margin: 5px 0;">Transaction Status: <strong>SUCCESS</strong></p>
      <p style="margin: 5px 0;">Razorpay Payment ID: <strong>${paymentId}</strong></p>
      <p style="margin: 5px 0;">Amount Cleared: <strong>₹${order.totalAmount.toLocaleString('en-IN')}</strong></p>
    </div>
    <p>Your delivery package is now queued for immediate dispatch. Thank you for placing your trust in our service!</p>
  `;
  await sendEmail(email, `Payment Successful for Order #${order.id.slice(0,8).toUpperCase()} - SRI PAVAN COMPUTERS`, getEmailLayout(title, content));
}

/**
 * 5. Order Status Updates
 */
export async function sendOrderStatusUpdateEmail(email: string, name: string, orderId: string, status: string, trackingNumber?: string | null, courierName?: string | null) {
  const title = `Order Status Updated: ${status}`;
  
  let trackingHtml = '';
  if (trackingNumber) {
    trackingHtml = `
      <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #bfdbfe; font-size: 13px;">
        <h3 style="margin-top: 0; color: #1e40af; font-size: 14px;">Shipment Tracking Info</h3>
        <p style="margin: 5px 0;">Courier Partner: <strong>${courierName || 'Courier Service'}</strong></p>
        <p style="margin: 5px 0;">Tracking Number: <strong>${trackingNumber}</strong></p>
        <p style="margin: 5px 0; font-size: 11px; color: #64748b;">(Please use the courier's official portal to track your shipment progress using the ID provided above)</p>
      </div>
    `;
  }

  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>The status of your order <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> has been updated to: <span class="highlight" style="font-size: 14px; text-transform: uppercase;">${status}</span>.</p>
    
    ${trackingHtml}
    
    <p>If you have any questions or require further assistance, please feel free to reach out to our customer support desk.</p>
  `;
  await sendEmail(email, `Order #${orderId.slice(0, 8).toUpperCase()} Status Update: ${status} - SRI PAVAN COMPUTERS`, getEmailLayout(title, content));
}

/**
 * 6. Admin: New Order Alert
 */
export async function sendAdminNewOrderEmail(adminEmail: string, order: any) {
  const title = `[Admin Alert] New Order #${order.id.slice(0, 8).toUpperCase()}`;
  const content = `
    <p>Attention Admin,</p>
    <p>A new order has been logged on the platform. Please check the fulfillment portal to prepare the package.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; font-size: 13px;">
      <p style="margin: 5px 0;">Order Reference: <strong>#${order.id}</strong></p>
      <p style="margin: 5px 0;">Total Amount: <strong>₹${order.totalAmount.toLocaleString('en-IN')}</strong></p>
      <p style="margin: 5px 0;">Payment Method: <strong>${order.paymentMethod}</strong></p>
      <p style="margin: 5px 0;">Payment Status: <strong>${order.paymentStatus}</strong></p>
    </div>
  `;
  await sendEmail(adminEmail, title, getEmailLayout(title, content));
}

/**
 * 7. Admin: New Customer Registration Alert
 */
export async function sendAdminNewUserEmail(adminEmail: string, newUser: any) {
  const title = `[Admin Alert] New Customer Joined`;
  const content = `
    <p>Attention Admin,</p>
    <p>A new customer has successfully completed email OTP verification and registered on the platform.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; font-size: 13px;">
      <p style="margin: 5px 0;">Customer Name: <strong>${newUser.name}</strong></p>
      <p style="margin: 5px 0;">Email Address: <strong>${newUser.email}</strong></p>
      <p style="margin: 5px 0;">Role: <strong>${newUser.role}</strong></p>
      <p style="margin: 5px 0;">Signup Time: <strong>${new Date(newUser.createdAt).toLocaleString()}</strong></p>
    </div>
  `;
  await sendEmail(adminEmail, title, getEmailLayout(title, content));
}
