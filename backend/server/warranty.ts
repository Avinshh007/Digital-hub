// server/warranty.ts
import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { logAudit } from './audit';

export const warrantyRouter = Router();

const isAdmin = (req: Request, res: Response, next: any) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// 1. Unprotected Warranty Lookup (Customer Portal)
warrantyRouter.get('/warranty/check/:serialNumber', async (req: Request, res: Response) => {
  try {
    const serialNumber = req.params.serialNumber as string;
    const warranty = await prisma.warranty.findUnique({
      where: { serialNumber: serialNumber.trim().toUpperCase() },
      include: { product: true }
    });

    if (!warranty) {
      return res.status(404).json({ error: 'Serial number not found or holds no warranty registry.' });
    }

    const today = new Date();
    const end = new Date(warranty.endDate);
    const timeDiff = end.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    let status = warranty.status;
    if (today > end) {
      status = 'EXPIRED';
      if (warranty.status !== 'EXPIRED') {
        await prisma.warranty.update({ where: { id: warranty.id }, data: { status: 'EXPIRED' } });
      }
    }

    return res.json({
      serialNumber: warranty.serialNumber,
      productName: warranty.product.name,
      modelNumber: warranty.product.modelNumber,
      customerName: warranty.customerName,
      startDate: warranty.startDate,
      endDate: warranty.endDate,
      daysRemaining,
      status
    });
  } catch (error) {
    console.error('Warranty lookup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Admin Warranty Registrations CRUD
warrantyRouter.get('/admin/warranties', isAdmin, async (req: Request, res: Response) => {
  try {
    const warranties = await prisma.warranty.findMany({
      include: { product: true },
      orderBy: { endDate: 'asc' }
    });
    return res.json(warranties);
  } catch (error) {
    console.error('Fetch warranties error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

warrantyRouter.post('/admin/warranties', isAdmin, async (req: Request, res: Response) => {
  try {
    const { serialNumber, productId, orderId, customerName, customerEmail, customerPhone, durationMonths } = req.body;

    if (!serialNumber || !productId || !customerName || !durationMonths) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure serial number exists in inventory
    const serialRecord = await prisma.productSerialNumber.findUnique({
      where: { serialNumber: serialNumber.trim().toUpperCase() }
    });

    if (!serialRecord) {
      // Auto register serial number in inventory if it doesn't exist
      await prisma.productSerialNumber.create({
        data: {
          productId,
          serialNumber: serialNumber.trim().toUpperCase(),
          status: 'SOLD'
        }
      });
    } else {
      // Update status to SOLD
      await prisma.productSerialNumber.update({
        where: { id: serialRecord.id },
        data: { status: 'SOLD' }
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));

    const warranty = await prisma.warranty.create({
      data: {
        serialNumber: serialNumber.trim().toUpperCase(),
        productId,
        orderId: orderId || null,
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        startDate,
        endDate,
        status: 'ACTIVE'
      }
    });

    await logAudit(req.user!.id, req.user!.email, 'WARRANTY_REGISTER', warranty, req.ip);
    return res.json({ message: 'Warranty registered successfully', warranty });
  } catch (error) {
    console.error('Register warranty error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Expiring Warranties Dashboard Summary
warrantyRouter.get('/admin/warranties/expiring', isAdmin, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    const warranties = await prisma.warranty.findMany({
      where: {
        endDate: {
          gte: today,
          lte: nextMonth
        },
        status: 'ACTIVE'
      },
      include: { product: true },
      orderBy: { endDate: 'asc' }
    });

    return res.json(warranties);
  } catch (error) {
    console.error('Fetch expiring warranties error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Serial Numbers Lookup / Inventory list
warrantyRouter.get('/admin/serials', isAdmin, async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    
    const serials = await prisma.productSerialNumber.findMany({
      where: query ? {
        OR: [
          { serialNumber: { contains: query.toUpperCase() } },
          { product: { name: { contains: query } } },
          { product: { sku: { contains: query.toUpperCase() } } }
        ]
      } : {},
      include: { product: true, warranty: true },
      take: 50
    });
    
    return res.json(serials);
  } catch (error) {
    console.error('Fetch serials error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
