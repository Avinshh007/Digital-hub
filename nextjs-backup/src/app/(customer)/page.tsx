// src/app/(customer)/page.tsx
import { prisma } from '@/lib/db';
import HomepageClient from '@/components/customer/HomepageClient';

export const revalidate = 0; // Disable SSR caching for real-time stock and checkout tracking

export default async function Homepage() {
  // Load Homepage Config (singleton)
  const config = await prisma.homepageConfig.findUnique({
    where: { id: 'singleton' },
  });

  // Load Categories & Brands
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
  });

  let banners = [];
  let featuredProductIds = [];
  if (config) {
    try {
      banners = JSON.parse(config.heroBanners);
      featuredProductIds = JSON.parse(config.featuredProducts);
    } catch (e) {
      console.error('Failed parsing homepage config JSON fields', e);
    }
  }

  // Fetch Featured Products
  const featuredProducts = await prisma.product.findMany({
    where: {
      id: { in: featuredProductIds },
      status: 'ACTIVE',
    },
    include: {
      category: true,
      brand: true,
    },
  });

  // Fetch New Arrivals (General backup/fallback list)
  const activeProducts = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    take: 8,
    include: {
      category: true,
      brand: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Safe checks if db configuration is empty
  const bannerList = banners.length > 0 ? banners : [
    {
      imageUrl: '/uploads/hero_banner.jpg',
      title: 'Sri Pavan Computers',
      subtitle: 'Premium Electronics & Computer Repair Store at Best Prices',
      linkUrl: '/products',
    }
  ];

  return (
    <HomepageClient
      initialBanners={bannerList}
      categories={categories}
      featuredProducts={featuredProducts.length > 0 ? featuredProducts : activeProducts.slice(0, 4)}
      allProducts={activeProducts}
      brands={brands}
    />
  );
}
