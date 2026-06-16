// server/expenses.ts
import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { logAudit } from './audit';

export const expenseRouter = Router();

const isAdmin = (req: Request, res: Response, next: any) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// 1. Operational Expenses CRUD
expenseRouter.get('/expenses', isAdmin, async (req: Request, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' }
    });
    return res.json(expenses);
  } catch (error) {
    console.error('Fetch expenses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

expenseRouter.post('/expenses', isAdmin, async (req: Request, res: Response) => {
  try {
    const { category, amount, description, date } = req.body;
    if (!category || !amount) {
      return res.status(400).json({ error: 'Category and Amount are required' });
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        amount: parseFloat(amount),
        description: description || '',
        date: date ? new Date(date) : new Date()
      }
    });

    await logAudit(req.user!.id, req.user!.email, 'EXPENSE_CREATE', expense, req.ip);
    return res.json({ message: 'Expense logged successfully', expense });
  } catch (error) {
    console.error('Create expense error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

expenseRouter.put('/expenses/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { category, amount, description, date } = req.body;

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        category,
        amount: amount ? parseFloat(amount) : undefined,
        description,
        date: date ? new Date(date) : undefined
      }
    });

    await logAudit(req.user!.id, req.user!.email, 'EXPENSE_UPDATE', expense, req.ip);
    return res.json({ message: 'Expense updated successfully', expense });
  } catch (error) {
    console.error('Update expense error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

expenseRouter.delete('/expenses/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.expense.delete({ where: { id } });
    await logAudit(req.user!.id, req.user!.email, 'EXPENSE_DELETE', { id }, req.ip);
    return res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Profit & Loss Report Engine
expenseRouter.get('/reports/profit-loss', isAdmin, async (req: Request, res: Response) => {
  try {
    // A. Revenue
    const orders = await prisma.order.findMany({
      where: { NOT: { status: 'CANCELLED' } },
      include: { items: true }
    });
    const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // B. Cost of Goods Sold (COGS)
    // Preload latest cost prices from PurchaseOrders
    const poItems = await prisma.purchaseOrderItem.findMany({
      select: { productId: true, costPrice: true },
      orderBy: { purchaseOrder: { date: 'desc' } }
    });
    const cogsMap = new Map<string, number>();
    poItems.forEach(item => {
      if (!cogsMap.has(item.productId)) {
        cogsMap.set(item.productId, item.costPrice);
      }
    });

    let cogs = 0;
    for (const order of orders) {
      for (const item of order.items) {
        // Fallback cost is 70% of selling price if product was never purchased via PO
        const costPrice = cogsMap.get(item.productId) || (item.price * 0.70);
        cogs += costPrice * item.quantity;
      }
    }

    // C. Operating Expenses
    const expensesList = await prisma.expense.findMany();
    const expenses = expensesList.reduce((sum, exp) => sum + exp.amount, 0);

    // D. Inventory Valuation (Valued at default cost price or price*0.7)
    const products = await prisma.product.findMany();
    let inventoryValue = 0;
    for (const prod of products) {
      const cost = cogsMap.get(prod.id) || (prod.price * 0.70);
      inventoryValue += cost * prod.stock;
    }

    // E. Calculations
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;

    // F. Expense Category Breakdown
    const expenseBreakdown: { [category: string]: number } = {};
    expensesList.forEach(exp => {
      expenseBreakdown[exp.category] = (expenseBreakdown[exp.category] || 0) + exp.amount;
    });

    return res.json({
      revenue,
      cogs,
      grossProfit,
      expenses,
      netProfit,
      inventoryValue,
      expenseBreakdown
    });
  } catch (error) {
    console.error('Profit & Loss calculation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
