// server/invoice.ts
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from './db';

export async function generateInvoicePDF(orderId: string, res: Response): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } }
      }
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    let shipping;
    try {
      shipping = JSON.parse(order.shippingAddress);
    } catch (e) {
      shipping = {
        fullName: order.user?.name || 'Customer',
        phone: 'N/A',
        street: 'N/A',
        city: 'N/A',
        state: 'N/A',
        pinCode: 'N/A'
      };
    }

    // Initialize PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Stream PDF directly to HTTP response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.id.slice(0, 8).toUpperCase()}.pdf`);
    doc.pipe(res);

    // Color Palette
    const primaryColor = '#0f4c81'; // Brand Blue
    const secondaryColor = '#475569'; // Slate Grey
    const lightGrey = '#f8fafc';
    const darkGrey = '#1e293b';

    // Header Section
    doc.fillColor(primaryColor)
       .fontSize(20)
       .text(' DIGITAL HUB', 50, 45);
    
    doc.fillColor(secondaryColor)
       .fontSize(9)
       .text('Krishna Kanth Plaza, R R Road, Kakinada, AP - 533001', 50, 70)
       .text('Phone: +91 98482 57578 | Email: sales@  DIGITAL HUB.com', 50, 82)
       .text('GSTIN: 37AAAAA0000A1Z0 (Sample)', 50, 94);

    doc.fillColor(primaryColor)
       .fontSize(16)
       .text('TAX INVOICE', 400, 45, { align: 'right' });

    doc.fillColor(secondaryColor)
       .fontSize(9)
       .text(`Invoice No: #INV-${order.id.slice(0, 8).toUpperCase()}`, 300, 70, { align: 'right' })
       .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 300, 82, { align: 'right' })
       .text(`Status: ${order.paymentStatus}`, 300, 94, { align: 'right' });

    // Horizontal Rule
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .moveTo(50, 115)
       .lineTo(545, 115)
       .stroke();

    // Bill To / Ship To
    doc.fillColor(primaryColor)
       .fontSize(10)
       .text('BILLED TO', 50, 130)
       .text('SHIPPING ADDRESS', 300, 130);

    doc.fillColor(darkGrey)
       .fontSize(9)
       .text(shipping.fullName || 'N/A', 50, 145)
       .text(`Phone: ${shipping.phone || 'N/A'}`, 50, 157)
       .text(`Email: ${order.user?.email || 'N/A'}`, 50, 169);

    doc.text(shipping.fullName || 'N/A', 300, 145)
       .text(`${shipping.street || 'N/A'}`, 300, 157)
       .text(`${shipping.city || 'N/A'} - ${shipping.pinCode || 'N/A'}, ${shipping.state || 'N/A'}`, 300, 169)
       .text('Country: India', 300, 181);

    // Items Table Header
    const tableTop = 210;
    doc.fillColor(primaryColor)
       .rect(50, tableTop, 495, 20)
       .fill();

    doc.fillColor('#ffffff')
       .fontSize(8)
       .text('Product Description', 60, tableTop + 6)
       .text('SKU', 250, tableTop + 6)
       .text('Qty', 330, tableTop + 6, { align: 'center', width: 30 })
       .text('Unit Price (INR)', 370, tableTop + 6, { align: 'right', width: 75 })
       .text('Total (INR)', 460, tableTop + 6, { align: 'right', width: 75 });

    // Items List
    let currentY = tableTop + 20;
    doc.fillColor(darkGrey);

    for (const item of order.items) {
      // Background shading for alternating rows
      if ((currentY - (tableTop + 20)) % 40 === 0) {
        doc.fillColor(lightGrey)
           .rect(50, currentY, 495, 20)
           .fill();
        doc.fillColor(darkGrey);
      }

      doc.fontSize(8)
         .text(item.product?.name || 'N/A', 60, currentY + 6, { width: 180 })
         .text(item.product?.sku || 'N/A', 250, currentY + 6)
         .text(item.quantity.toString(), 330, currentY + 6, { align: 'center', width: 30 })
         .text(`Rs. ${item.price.toFixed(2)}`, 370, currentY + 6, { align: 'right', width: 75 })
         .text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, 460, currentY + 6, { align: 'right', width: 75 });

      currentY += 20;
    }

    // Financial calculations
    const subtotal = order.totalAmount + order.discountAmount;
    const taxAmount = order.taxAmount;

    // Totals Section
    currentY += 15;
    doc.strokeColor('#f1f5f9')
       .lineWidth(1)
       .moveTo(50, currentY)
       .lineTo(545, currentY)
       .stroke();

    currentY += 10;
    doc.fontSize(8)
       .fillColor(secondaryColor)
       .text('Payment Method:', 50, currentY)
       .fillColor(darkGrey)
       .text(order.paymentMethod, 130, currentY)
       .fillColor(secondaryColor)
       .text('Subtotal:', 350, currentY, { align: 'right', width: 100 })
       .fillColor(darkGrey)
       .text(`Rs. ${subtotal.toFixed(2)}`, 460, currentY, { align: 'right', width: 75 });

    currentY += 14;
    doc.fillColor(secondaryColor)
       .text('Payment Status:', 50, currentY)
       .fillColor(darkGrey)
       .text(order.paymentStatus, 130, currentY)
       .fillColor(secondaryColor)
       .text('GST Included (18%):', 350, currentY, { align: 'right', width: 100 })
       .fillColor(darkGrey)
       .text(`Rs. ${taxAmount.toFixed(2)}`, 460, currentY, { align: 'right', width: 75 });

    if (order.discountAmount > 0) {
      currentY += 14;
      doc.fillColor(secondaryColor)
         .text('Coupon Applied:', 50, currentY)
         .fillColor(darkGrey)
         .text(order.couponCode || 'N/A', 130, currentY)
         .fillColor(secondaryColor)
         .text('Discount Applied:', 350, currentY, { align: 'right', width: 100 })
         .fillColor('#10b981')
         .text(`- Rs. ${order.discountAmount.toFixed(2)}`, 460, currentY, { align: 'right', width: 75 });
    }

    currentY += 18;
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .moveTo(350, currentY)
       .lineTo(545, currentY)
       .stroke();

    currentY += 8;
    doc.fontSize(10)
       .fillColor(primaryColor)
       .text('Grand Total:', 350, currentY, { align: 'right', width: 100 })
       .text(`Rs. ${order.totalAmount.toFixed(2)}`, 460, currentY, { align: 'right', width: 75 });

    // Terms and Footer
    const footerTop = 720;
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .moveTo(50, footerTop)
       .lineTo(545, footerTop)
       .stroke();

    doc.fillColor(secondaryColor)
       .fontSize(7)
       .text('TERMS & CONDITIONS:', 50, footerTop + 10)
       .text('1. All items come with manufacturer warranty only unless stated otherwise.', 50, footerTop + 20)
       .text('2. Goods once sold cannot be taken back or exchanged.', 50, footerTop + 30)
       .text('3. This is a computer generated invoice and requires no signature.', 50, footerTop + 40);

    doc.fillColor(primaryColor)
       .fontSize(9)
       .text('Thank you for your business!', 50, footerTop + 60, { align: 'center' });

    // End / close the PDF document
    doc.end();

  } catch (err) {
    console.error('PDF Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate invoice PDF' });
  }
}
