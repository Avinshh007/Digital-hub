// src/app/(customer)/products/[id]/page.tsx
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import ProductDetailClient from '@/components/customer/ProductDetailClient';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const revalidate = 0; // Fresh stock status and reviews on load

export default async function ProductDetailPage(context: RouteContext) {
  const { id } = await context.params;

  // 1. Fetch Product
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      brand: true,
      reviews: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!product) {
    return notFound();
  }

  // 2. Fetch Related Products (same category, excluding current product)
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      NOT: { id: product.id },
      status: 'ACTIVE'
    },
    take: 4,
    include: {
      category: true,
      brand: true
    }
  });

  // 3. Fetch general active products as fallback recommendations if related is empty
  let recommendations = relatedProducts;
  if (recommendations.length === 0) {
    recommendations = await prisma.product.findMany({
      where: {
        NOT: { id: product.id },
        status: 'ACTIVE'
      },
      take: 4,
      include: {
        category: true,
        brand: true
      }
    });
  }

  return (
    <ProductDetailClient 
      product={product} 
      relatedProducts={recommendations} 
    />
  );
}
