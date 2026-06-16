// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '9999999');
    const inStock = searchParams.get('inStock') === 'true';
    const sortBy = searchParams.get('sortBy') || 'createdAt';

    const where: any = {
      status: 'ACTIVE',
      price: {
        gte: minPrice,
        lte: maxPrice,
      },
    };

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
        { sku: { contains: query } },
      ];
    }

    if (category) {
      // Find category by slug
      const cat = await prisma.category.findUnique({ where: { slug: category } });
      if (cat) {
        where.categoryId = cat.id;
      } else {
        where.categoryId = 'non-existent-id';
      }
    }

    if (brand) {
      // Find brand by slug
      const br = await prisma.brand.findUnique({ where: { slug: brand } });
      if (br) {
        where.brandId = br.id;
      } else {
        where.brandId = 'non-existent-id';
      }
    }

    if (inStock) {
      where.stock = { gt: 0 };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
        brand: true,
      },
    });

    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });

    return NextResponse.json({ products, categories, brands });
  } catch (error) {
    console.error('Fetch products error:', error);
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
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, originalPrice, stock, sku, categoryId, brandId, images, specs } = body;

    if (!name || !price || !sku || !categoryId || !brandId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check SKU duplicate
    const existingProduct = await prisma.product.findUnique({ where: { sku } });
    if (existingProduct) {
      return NextResponse.json({ error: `SKU '${sku}' already exists` }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description || '',
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price),
        stock: parseInt(stock) || 0,
        sku: sku.trim().toUpperCase(),
        categoryId,
        brandId,
        images: JSON.stringify(images || ['/uploads/hero_banner.jpg']),
        specs: JSON.stringify(specs || {}),
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
