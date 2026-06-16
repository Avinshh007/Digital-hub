// src/app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Core aggregates
    const ordersCount = await prisma.order.count();
    const productsCount = await prisma.product.count();
    const customersCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });

    const orders = await prisma.order.findMany({
      where: {
        NOT: { status: 'CANCELLED' }
      }
    });

    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // 2. Low Stock Alerts (stock <= 5)
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lte: 5 } },
      include: { category: true, brand: true }
    });

    // 3. Category Sales breakdown
    const orderItems = await prisma.orderItem.findMany({
      include: {
        product: {
          include: { category: true }
        }
      }
    });

    const categorySalesMap: { [key: string]: { name: string; sales: number; count: number } } = {};
    for (const item of orderItems) {
      if (item.product && item.product.category) {
        const cat = item.product.category;
        if (!categorySalesMap[cat.id]) {
          categorySalesMap[cat.id] = { name: cat.name, sales: 0, count: 0 };
        }
        categorySalesMap[cat.id].sales += item.price * item.quantity;
        categorySalesMap[cat.id].count += item.quantity;
      }
    }
    const categorySales = Object.values(categorySalesMap);

    // 4. Recent Orders (limit 5)
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    // 5. Sales Trend (by day, for the last 7 days)
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dailyOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          NOT: { status: 'CANCELLED' }
        }
      });

      const revenue = dailyOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      salesTrend.push({ date: dateString, revenue, orders: dailyOrders.length });
    }

    return NextResponse.json({
      aggregates: {
        totalSales,
        ordersCount,
        productsCount,
        customersCount
      },
      lowStockProducts,
      categorySales,
      recentOrders,
      salesTrend
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
