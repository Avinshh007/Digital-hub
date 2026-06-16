// server/amc.ts
import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { logAudit } from './audit';

export const amcRouter = Router();

const isAdmin = (req: Request, res: Response, next: any) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// 1. Fetch all AMCs
amcRouter.get('/amcs', isAdmin, async (req: Request, res: Response) => {
  try {
    const amcs = await prisma.aMC.findMany({
      orderBy: { endDate: 'asc' }
    });
    return res.json(amcs);
  } catch (error) {
    console.error('Fetch AMCs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Register new AMC
amcRouter.post('/amcs', isAdmin, async (req: Request, res: Response) => {
  try {
    const { customerName, customerEmail, customerPhone, device, startDate, endDate, contractValue } = req.body;

    if (!customerName || !customerEmail || !device || !startDate || !endDate || !contractValue) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const amc = await prisma.aMC.create({
      data: {
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        device,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        contractValue: parseFloat(contractValue),
        status: 'ACTIVE',
        serviceHistory: JSON.stringify([])
      }
    });

    await logAudit(req.user!.id, req.user!.email, 'AMC_CREATE', amc, req.ip);
    return res.json({ message: 'AMC contract registered successfully', amc });
  } catch (error) {
    console.error('Create AMC error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Update AMC Details
amcRouter.put('/amcs/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { customerName, customerEmail, customerPhone, device, startDate, endDate, contractValue, status } = req.body;

    const amc = await prisma.aMC.update({
      where: { id },
      data: {
        customerName,
        customerEmail,
        customerPhone,
        device,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        contractValue: contractValue ? parseFloat(contractValue) : undefined,
        status
      }
    });

    await logAudit(req.user!.id, req.user!.email, 'AMC_UPDATE', amc, req.ip);
    return res.json({ message: 'AMC contract updated successfully', amc });
  } catch (error) {
    console.error('Update AMC error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Delete AMC
amcRouter.delete('/amcs/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.aMC.delete({ where: { id } });
    await logAudit(req.user!.id, req.user!.email, 'AMC_DELETE', { id }, req.ip);
    return res.json({ message: 'AMC contract deleted successfully' });
  } catch (error) {
    console.error('Delete AMC error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. AMC Service History Logger
amcRouter.post('/amcs/:id/service', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { note } = req.body; // note: string

    if (!note) {
      return res.status(400).json({ error: 'Maintenance note is required' });
    }

    const amc = await prisma.aMC.findUnique({ where: { id } });
    if (!amc) {
      return res.status(404).json({ error: 'AMC contract not found' });
    }

    let history: any[] = [];
    try {
      history = JSON.parse(amc.serviceHistory);
      if (!Array.isArray(history)) history = [];
    } catch (e) {
      history = [];
    }

    const logEntry = {
      date: new Date().toISOString(),
      note,
      author: req.user!.name
    };

    history.push(logEntry);

    const updatedAmc = await prisma.aMC.update({
      where: { id },
      data: { serviceHistory: JSON.stringify(history) }
    });

    return res.json({ message: 'Maintenance service log added successfully', amc: updatedAmc });
  } catch (error) {
    console.error('Add AMC service history error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. Expiring AMCs in 30 days
amcRouter.get('/amcs/expiring', isAdmin, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    const amcs = await prisma.aMC.findMany({
      where: {
        endDate: {
          gte: today,
          lte: nextMonth
        },
        status: 'ACTIVE'
      },
      orderBy: { endDate: 'asc' }
    });

    return res.json(amcs);
  } catch (error) {
    console.error('Fetch expiring AMCs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
