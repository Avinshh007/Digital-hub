// src/app/api/products/[id]/reviews/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

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
    const { rating, comment } = body;

    if (!rating || !comment || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Missing or invalid review fields' }, { status: 400 });
    }

    // Run atomically in a transaction
    const review = await prisma.$transaction(async (tx) => {
      // 1. Create review
      const newReview = await tx.review.create({
        data: {
          productId: id,
          userId: decoded.id,
          userName: decoded.name,
          rating: parseInt(rating),
          comment: comment.trim(),
        },
      });

      // 2. Fetch all reviews for this product to recalculate averages
      const allReviews = await tx.review.findMany({
        where: { productId: id },
      });

      const ratingCount = allReviews.length;
      const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount;

      // 3. Update product fields
      await tx.product.update({
        where: { id },
        data: {
          rating: parseFloat(averageRating.toFixed(2)),
          ratingCount: ratingCount,
        },
      });

      return newReview;
    });

    return NextResponse.json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
