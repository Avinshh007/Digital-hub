// server/vendors.ts
import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { logAudit } from './audit';

export const vendorRouter = Router();

// Helper to check admin session
const isAdmin = (req: Request, res: Response, next: any) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// 1. Vendor CRUD
vendorRouter.get('/vendors', isAdmin, async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        purchaseOrders: true,
        ledgerEntries: true
      }
    });
    return res.json(vendors);
  } catch (error) {
    console.error('Fetch vendors error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

vendorRouter.post('/vendors', isAdmin, async (req: Request, res: Response) => {
  try {
    const { name, contactPerson, mobile, email, gstNumber, address } = req.body;
    if (!name || !mobile || !email || !gstNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const vendor = await prisma.vendor.create({
      data: { name, contactPerson: contactPerson || '', mobile, email, gstNumber, address: address || '' }
    });

    await logAudit(req.user!.id, req.user!.email, 'VENDOR_CREATE', vendor, req.ip);
    return res.json({ message: 'Vendor added successfully', vendor });
  } catch (error) {
    console.error('Create vendor error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

vendorRouter.put('/vendors/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, contactPerson, mobile, email, gstNumber, address } = req.body;

    const vendor = await prisma.vendor.update({
      where: { id },
      data: { name, contactPerson, mobile, email, gstNumber, address }
    });

    await logAudit(req.user!.id, req.user!.email, 'VENDOR_UPDATE', vendor, req.ip);
    return res.json({ message: 'Vendor updated successfully', vendor });
  } catch (error) {
    console.error('Update vendor error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

vendorRouter.delete('/vendors/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.vendor.delete({ where: { id } });
    await logAudit(req.user!.id, req.user!.email, 'VENDOR_DELETE', { id }, req.ip);
    return res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Vendor Ledger & Payments
vendorRouter.get('/vendors/:id/ledger', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const entries = await prisma.vendorLedger.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: 'desc' }
    });

    const balance = entries.reduce((sum, entry) => sum + entry.amount, 0); // Positive = we owe, Negative = we paid
    return res.json({ balance, entries });
  } catch (error) {
    console.error('Fetch ledger error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

vendorRouter.post('/vendors/:id/ledger', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { amount, transactionType, reference } = req.body; // transactionType: "PAYMENT" | "PURCHASE"

    if (!amount || !transactionType) {
      return res.status(400).json({ error: 'Amount and Transaction Type are required' });
    }

    const value = transactionType === 'PAYMENT' ? -Math.abs(amount) : Math.abs(amount);

    const entry = await prisma.vendorLedger.create({
      data: {
        vendorId: id,
        amount: value,
        transactionType,
        reference: reference || null
      }
    });

    await logAudit(req.user!.id, req.user!.email, 'VENDOR_LEDGER_ADJUSTMENT', entry, req.ip);
    return res.json({ message: 'Ledger entry posted successfully', entry });
  } catch (error) {
    console.error('Create ledger entry error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Purchase Order Management
vendorRouter.get('/pos', isAdmin, async (req: Request, res: Response) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        vendor: true,
        items: { include: { product: true } },
        serialNumbers: true
      },
      orderBy: { date: 'desc' }
    });
    return res.json(pos);
  } catch (error) {
    console.error('Fetch PO error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

vendorRouter.post('/pos', isAdmin, async (req: Request, res: Response) => {
  try {
    const { vendorId, items } = req.body; // items: [{ productId, quantity, costPrice, gstRate }]
    if (!vendorId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing vendor or items list' });
    }

    const poNumber = `PO-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId,
        status: 'DRAFT',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: parseInt(item.quantity) || 1,
            costPrice: parseFloat(item.costPrice) || 0,
            gstRate: parseFloat(item.gstRate) || 18.0
          }))
        }
      },
      include: { items: true }
    });

    await logAudit(req.user!.id, req.user!.email, 'PO_DRAFT', po, req.ip);
    return res.json({ message: 'Purchase Order drafted successfully', po });
  } catch (error) {
    console.error('Create PO error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

vendorRouter.put('/pos/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body; // "APPROVED" or "CANCELLED"

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: { items: true }
    });

    await logAudit(req.user!.id, req.user!.email, 'PO_STATUS_UPDATE', po, req.ip);
    return res.json({ message: 'PO updated successfully', po });
  } catch (error) {
    console.error('Update PO error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Stock receiving & Auto-Inventory updates & Serial generation
vendorRouter.post('/pos/:id/receive', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { items } = req.body; // items: [{ productId, receivedQty, serialNumbers: string[] }]

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items list is required for receipt' });
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!po || po.status === 'DRAFT' || po.status === 'CANCELLED' || po.status === 'RECEIVED') {
      return res.status(400).json({ error: 'PO is not in a receivable state (must be APPROVED or PARTIAL)' });
    }

    const poCast = po as any;
    let ledgerBillAmount = 0;

    for (const item of items) {
      const dbItem = poCast.items.find((i: any) => i.productId === item.productId);
      if (!dbItem) continue;

      const receivedQty = parseInt(item.receivedQty) || 0;
      if (receivedQty <= 0) continue;

      // Update PO items received count
      await prisma.purchaseOrderItem.update({
        where: { id: dbItem.id },
        data: { receivedQty: dbItem.receivedQty + receivedQty }
      });

      // Increment product availability inventory
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        const prevQuantity = product.stock;
        const newQuantity = prevQuantity + receivedQty;

        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: newQuantity }
        });

        // Stock movement logs
        await prisma.stockMovementLog.create({
          data: {
            productId: item.productId,
            prevQuantity,
            newQuantity,
            actionType: 'RESTOCK',
            userId: req.user!.id,
            userEmail: req.user!.email
          }
        });
      }

      // Generate actual serial number records in DB
      if (Array.isArray(item.serialNumbers)) {
        for (const serial of item.serialNumbers) {
          if (!serial.trim()) continue;
          try {
            await prisma.productSerialNumber.create({
              data: {
                productId: item.productId,
                serialNumber: serial.trim().toUpperCase(),
                purchaseOrderId: po.id,
                status: 'AVAILABLE'
              }
            });
          } catch (serialErr) {
            console.warn(`Serial creation failed: ${serial}. Might be duplicate.`, serialErr);
          }
        }
      }

      // Add to Ledger Invoice value (Price * Qty * tax)
      const itemCost = dbItem.costPrice * receivedQty;
      const taxCost = itemCost * (dbItem.gstRate / 100);
      ledgerBillAmount += (itemCost + taxCost);
    }

    // Auto post purchases bill amount to Vendor Ledger balance
    if (ledgerBillAmount > 0) {
      await prisma.vendorLedger.create({
        data: {
          vendorId: po.vendorId,
          amount: ledgerBillAmount,
          transactionType: 'PURCHASE',
          reference: po.poNumber
        }
      });
    }

    // Determine finalized status (RECEIVED if all items are fully received)
    const updatedPo = await prisma.purchaseOrder.findUnique({
      where: { id: po.id },
      include: { items: true }
    });

    let fullyReceived = true;
    if (updatedPo) {
      const updatedPoCast = updatedPo as any;
      for (const item of updatedPoCast.items) {
        if (item.receivedQty < item.quantity) {
          fullyReceived = false;
          break;
        }
      }
    }

    const finalStatus = fullyReceived ? 'RECEIVED' : 'PARTIAL';
    await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: { status: finalStatus }
    });

    await logAudit(req.user!.id, req.user!.email, 'PO_RECEIPT', { poId: po.id, receivedItems: items }, req.ip);
    return res.json({ message: 'Purchase Order items received successfully', finalStatus });
  } catch (error) {
    console.error('Receive PO stock error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
