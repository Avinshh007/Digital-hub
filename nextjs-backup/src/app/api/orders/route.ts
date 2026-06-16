// src/app/api/orders/route.ts
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
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    let orders;
    if (decoded.role === 'ADMIN') {
      orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          },
          items: {
            include: { product: true }
          }
        }
      });
    } else {
      orders = await prisma.order.findMany({
        where: { userId: decoded.id },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { product: true }
          }
        }
      });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { items, shippingAddress, paymentMethod, couponCode } = body;

    if (!items || !items.length || !shippingAddress || !paymentMethod) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    const resolvedItems: { productId: string; quantity: number; price: number; gstAmount: number }[] = [];
    let subtotal = 0;
    let totalTax = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for product: ${product.name}` }, { status: 400 });
      }

      const itemTotal = product.price * item.quantity;
      const gstRate = product.gstRate || 18.0;
      const basePrice = product.price / (1 + gstRate / 100);
      const itemTax = (product.price - basePrice) * item.quantity;

      subtotal += itemTotal;
      totalTax += itemTax;

      resolvedItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        gstAmount: itemTax
      });
    }

    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() }
      });

      if (coupon && coupon.isActive && new Date(coupon.expiresAt) > new Date() && subtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else if (coupon.discountType === 'FIXED') {
          discountAmount = coupon.discountValue;
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    // Run order processing inside transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const newOrder = await tx.order.create({
        data: {
          userId: decoded.id,
          status: 'PENDING',
          totalAmount,
          taxAmount: totalTax,
          discountAmount,
          paymentMethod,
          paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'COMPLETED',
          shippingAddress: JSON.stringify(shippingAddress),
          couponCode: couponCode ? couponCode.toUpperCase().trim() : null,
          items: {
            create: resolvedItems.map(ri => ({
              productId: ri.productId,
              quantity: ri.quantity,
              price: ri.price,
              gstAmount: ri.gstAmount
            }))
          }
        },
        include: {
          items: true
        }
      });

      // 2. Decrement stock
      for (const ri of resolvedItems) {
        await tx.product.update({
          where: { id: ri.productId },
          data: {
            stock: {
              decrement: ri.quantity
            }
          }
        });
      }

      return newOrder;
    });

    return NextResponse.json({ message: 'Order placed successfully', order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
