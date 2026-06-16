// backend/scripts/export-sqlite.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting SQLite database export...');
  try {
    const users = await prisma.user.findMany();
    const categories = await prisma.category.findMany();
    const brands = await prisma.brand.findMany();
    const products = await prisma.product.findMany();
    const orders = await prisma.order.findMany();
    const orderItems = await prisma.orderItem.findMany();
    const reviews = await prisma.review.findMany();
    const coupons = await prisma.coupon.findMany();
    const homepageConfigs = await prisma.homepageConfig.findMany();
    const addresses = await prisma.address.findMany();
    const wishlistItems = await prisma.wishlistItem.findMany();
    const cartItems = await prisma.cartItem.findMany();
    const serviceBookings = await prisma.serviceBooking.findMany();
    const quoteRequests = await prisma.quoteRequest.findMany();
    const bulkOrders = await prisma.bulkOrder.findMany();
    const notifications = await prisma.notification.findMany();

    const data = {
      users,
      categories,
      brands,
      products,
      orders,
      orderItems,
      reviews,
      coupons,
      homepageConfigs,
      addresses,
      wishlistItems,
      cartItems,
      serviceBookings,
      quoteRequests,
      bulkOrders,
      notifications
    };

    const outputPath = path.resolve(__dirname, '../prisma/backup-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    
    console.log(`SQLite database successfully exported to: ${outputPath}`);
    console.log(`Export summary:
      - Users: ${users.length}
      - Categories: ${categories.length}
      - Brands: ${brands.length}
      - Products: ${products.length}
      - Orders: ${orders.length}
      - OrderItems: ${orderItems.length}
      - Reviews: ${reviews.length}
      - Coupons: ${coupons.length}
      - HomepageConfigs: ${homepageConfigs.length}
      - Addresses: ${addresses.length}
      - WishlistItems: ${wishlistItems.length}
      - CartItems: ${cartItems.length}
      - ServiceBookings: ${serviceBookings.length}
      - QuoteRequests: ${quoteRequests.length}
      - BulkOrders: ${bulkOrders.length}
      - Notifications: ${notifications.length}
    `);
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
