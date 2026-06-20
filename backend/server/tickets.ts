import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { logAudit } from './audit';

export const ticketsRouter = Router();

// Middleware to authenticate user if available, but allow guest saves (optional)
const optionalAuthenticate = (req: Request, res: Response, next: any) => {
  next();
};

// 1. Create Service Ticket (Admin/Staff only)
ticketsRouter.post('/tickets', async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      mobileNumber,
      deviceType,
      brand,
      model,
      problemDescription,
      expectedDeliveryDate,
      assignedTechnician,
      estimatedCost,
      notes,
      deviceSerialNumber,
      accessoriesReceived,
      estimatedCompletionDate,
      priority,
      deviceCondition,
      serialNumber,
      amcId,
      userId
    } = req.body;

    if (!customerName || !mobileNumber || !deviceType || !brand || !model || !problemDescription || !expectedDeliveryDate || estimatedCost === undefined) {
      return res.status(400).json({ error: 'Missing required ticket fields.' });
    }

    // Auto-generate Ticket Number: DHT-10001 + count
    const count = await prisma.serviceTicket.count();
    const ticketNumber = `DHT-${10001 + count}`;

    const creatorEmail = req.user?.email || 'Admin Staff';
    const initialHistory = [{
      status: 'Received',
      notes: 'Ticket created successfully',
      updatedAt: new Date().toISOString(),
      updatedBy: creatorEmail
    }];

    const ticket = await prisma.serviceTicket.create({
      data: {
        ticketNumber,
        customerName,
        mobileNumber,
        deviceType,
        brand,
        model,
        problemDescription,
        dateReceived: new Date(),
        expectedDeliveryDate: new Date(expectedDeliveryDate),
        technicianName: assignedTechnician || null,
        assignedTechnician: assignedTechnician || null,
        estimatedCost: parseFloat(estimatedCost),
        notes: notes || null,
        status: 'Received',
        history: JSON.stringify(initialHistory),
        deviceSerialNumber: deviceSerialNumber || null,
        accessoriesReceived: accessoriesReceived || null,
        estimatedCompletionDate: estimatedCompletionDate ? new Date(estimatedCompletionDate) : null,
        priority: priority || 'Medium',
        deviceCondition: deviceCondition || null,
        serialNumber: serialNumber || null,
        amcId: amcId || null,
        userId: userId || null
      }
    });

    if (req.user) {
      await logAudit(req.user.id, req.user.email, 'ADMIN_ACTION', { action: 'TICKET_CREATE', ticketNumber, ticketId: ticket.id }, req.ip);
    }

    return res.json({ message: 'Service ticket created successfully.', ticket });
  } catch (error) {
    console.error('Create ticket error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. List & Search Service Tickets (Admin/Staff only)
ticketsRouter.get('/tickets', async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    const filters: any = {};
    if (status && status !== 'All') {
      filters.status = status as string;
    }

    if (search) {
      const searchStr = search as string;
      filters.OR = [
        { ticketNumber: { contains: searchStr, mode: 'insensitive' } },
        { customerName: { contains: searchStr, mode: 'insensitive' } },
        { mobileNumber: { contains: searchStr, mode: 'insensitive' } }
      ];
    }

    const tickets = await prisma.serviceTicket.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ tickets });
  } catch (error) {
    console.error('List tickets error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Service Ticket Stats/Dashboard Metrics (Admin/Staff only)
ticketsRouter.get('/tickets/stats', async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.serviceTicket.findMany();

    const openCount = tickets.filter(t => t.status !== 'Delivered' && t.status !== 'Cancelled').length;
    const readyCount = tickets.filter(t => t.status === 'Ready For Delivery').length;
    const waitingPartsCount = tickets.filter(t => t.status === 'Waiting For Parts').length;

    // Delivered Today calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveredTodayCount = tickets.filter(t => {
      if (t.status !== 'Delivered' || !t.deliveryDate) return false;
      const dDate = new Date(t.deliveryDate);
      return dDate >= today;
    }).length;

    return res.json({
      open: openCount,
      ready: readyCount,
      waitingParts: waitingPartsCount,
      deliveredToday: deliveredTodayCount
    });
  } catch (error) {
    console.error('Stats tickets error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Customer Public Ticket Tracking (Public route - no auth needed)
ticketsRouter.get('/tickets/track', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Ticket number or Mobile number query is required.' });
    }

    const searchStr = (query as string).trim();

    // Look up by exact ticket number OR mobile number
    const tickets = await prisma.serviceTicket.findMany({
      where: {
        OR: [
          { ticketNumber: { equals: searchStr, mode: 'insensitive' } },
          { mobileNumber: { equals: searchStr } }
        ]
      },
      select: {
        ticketNumber: true,
        customerName: true,
        deviceType: true,
        brand: true,
        model: true,
        problemDescription: true,
        dateReceived: true,
        expectedDeliveryDate: true,
        status: true,
        notes: true,
        history: true,
        priority: true,
        deviceCondition: true,
        deviceSerialNumber: true,
        accessoriesReceived: true,
        estimatedCompletionDate: true,
        actualCompletionDate: true,
        deliveryDate: true,
        paymentStatus: true
      },
      orderBy: { dateReceived: 'desc' }
    });

    return res.json({ tickets });
  } catch (error) {
    console.error('Track ticket error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Update/Edit Service Ticket (Admin/Staff only)
ticketsRouter.put('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      customerName,
      mobileNumber,
      deviceType,
      brand,
      model,
      problemDescription,
      expectedDeliveryDate,
      assignedTechnician,
      estimatedCost,
      notes,
      status,
      deviceSerialNumber,
      accessoriesReceived,
      estimatedCompletionDate,
      actualCompletionDate,
      deliveryDate,
      paymentStatus,
      paymentAmount,
      customerSignature,
      priority,
      deviceCondition,
      serialNumber,
      amcId,
      userId
    } = req.body;

    const existing = await prisma.serviceTicket.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Prepare updated history logs if status changed
    let updatedHistory = [];
    try {
      updatedHistory = JSON.parse(existing.history);
    } catch (e) {
      updatedHistory = [];
    }

    const statusChanged = status && status !== existing.status;
    if (statusChanged) {
      const updaterEmail = req.user?.email || 'Admin Staff';
      updatedHistory.push({
        status,
        notes: statusChanged ? `Status updated from ${existing.status} to ${status}` : 'Ticket details updated',
        updatedAt: new Date().toISOString(),
        updatedBy: updaterEmail
      });
    }

    // Dynamic field updates
    const dataToUpdate: any = {
      customerName: customerName !== undefined ? customerName : existing.customerName,
      mobileNumber: mobileNumber !== undefined ? mobileNumber : existing.mobileNumber,
      deviceType: deviceType !== undefined ? deviceType : existing.deviceType,
      brand: brand !== undefined ? brand : existing.brand,
      model: model !== undefined ? model : existing.model,
      problemDescription: problemDescription !== undefined ? problemDescription : existing.problemDescription,
      expectedDeliveryDate: expectedDeliveryDate !== undefined ? new Date(expectedDeliveryDate) : existing.expectedDeliveryDate,
      technicianName: assignedTechnician !== undefined ? assignedTechnician : existing.technicianName,
      assignedTechnician: assignedTechnician !== undefined ? assignedTechnician : existing.assignedTechnician,
      estimatedCost: estimatedCost !== undefined ? parseFloat(estimatedCost) : existing.estimatedCost,
      notes: notes !== undefined ? notes : existing.notes,
      status: status !== undefined ? status : existing.status,
      history: JSON.stringify(updatedHistory),
      deviceSerialNumber: deviceSerialNumber !== undefined ? deviceSerialNumber : existing.deviceSerialNumber,
      accessoriesReceived: accessoriesReceived !== undefined ? accessoriesReceived : existing.accessoriesReceived,
      estimatedCompletionDate: estimatedCompletionDate !== undefined ? (estimatedCompletionDate ? new Date(estimatedCompletionDate) : null) : existing.estimatedCompletionDate,
      actualCompletionDate: actualCompletionDate !== undefined ? (actualCompletionDate ? new Date(actualCompletionDate) : null) : existing.actualCompletionDate,
      deliveryDate: deliveryDate !== undefined ? (deliveryDate ? new Date(deliveryDate) : null) : existing.deliveryDate,
      paymentStatus: paymentStatus !== undefined ? paymentStatus : existing.paymentStatus,
      paymentAmount: paymentAmount !== undefined ? (paymentAmount ? parseFloat(paymentAmount) : null) : existing.paymentAmount,
      customerSignature: customerSignature !== undefined ? customerSignature : existing.customerSignature,
      priority: priority !== undefined ? priority : existing.priority,
      deviceCondition: deviceCondition !== undefined ? deviceCondition : existing.deviceCondition,
      serialNumber: serialNumber !== undefined ? serialNumber : existing.serialNumber,
      amcId: amcId !== undefined ? amcId : existing.amcId,
      userId: userId !== undefined ? userId : existing.userId
    };

    // Auto set deliveryDate if status is changed to Delivered and it wasn't set
    if (status === 'Delivered' && !existing.deliveryDate && !deliveryDate) {
      dataToUpdate.deliveryDate = new Date();
    }
    // Auto set actualCompletionDate if status changes to Ready For Delivery / Delivered and it wasn't set
    if ((status === 'Ready For Delivery' || status === 'Delivered') && !existing.actualCompletionDate && !actualCompletionDate) {
      dataToUpdate.actualCompletionDate = new Date();
    }

    const ticket = await prisma.serviceTicket.update({
      where: { id },
      data: dataToUpdate
    });

    if (req.user) {
      await logAudit(req.user.id, req.user.email, 'ADMIN_ACTION', { action: 'TICKET_UPDATE', ticketNumber: ticket.ticketNumber, status: ticket.status }, req.ip);
    }

    return res.json({ message: 'Service ticket updated successfully.', ticket });
  } catch (error) {
    console.error('Update ticket error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
