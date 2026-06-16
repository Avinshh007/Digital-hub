// server/import-postgres.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data import into PostgreSQL...');
  
  const backupPath = path.resolve(process.cwd(), 'prisma/backup-data.json');
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup file not found at: ${backupPath}. Please run SQLite export first.`);
    return;
  }

  const rawData = fs.readFileSync(backupPath, 'utf8');
  const data = JSON.parse(rawData);

  try {
    // 1. Import Users
    console.log(`Importing ${data.users.length} Users...`);
    for (const u of data.users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          email: u.email,
          passwordHash: u.passwordHash,
          name: u.name,
          role: u.role,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt)
        }
      });
    }

    // 2. Import Categories
    console.log(`Importing ${data.categories.length} Categories...`);
    for (const c of data.categories) {
      await prisma.category.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          image: c.image,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }
      });
    }

    // 3. Import Brands
    console.log(`Importing ${data.brands.length} Brands...`);
    for (const b of data.brands) {
      await prisma.brand.upsert({
        where: { id: b.id },
        update: {},
        create: {
          id: b.id,
          name: b.name,
          slug: b.slug,
          logo: b.logo,
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt)
        }
      });
    }

    // 4. Import Products
    console.log(`Importing ${data.products.length} Products...`);
    for (const p of data.products) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          originalPrice: p.originalPrice,
          stock: p.stock,
          sku: p.sku,
          gstRate: p.gstRate,
          categoryId: p.categoryId,
          brandId: p.brandId,
          images: p.images,
          specs: p.specs,
          rating: p.rating,
          ratingCount: p.ratingCount,
          status: p.status,
          subcategory: p.subcategory,
          warranty: p.warranty,
          modelNumber: p.modelNumber,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          source: p.source,
          lockDescription: p.lockDescription,
          lockImages: p.lockImages,
          lockSpecs: p.lockSpecs,
          lockPrice: p.lockPrice,
          lockStock: p.lockStock,
          lockSeo: p.lockSeo,
          barcode: p.barcode || null,
          lowStockThreshold: p.lowStockThreshold || 5,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }
      });
    }

    // 5. Import Addresses
    console.log(`Importing ${data.addresses.length} Addresses...`);
    for (const a of data.addresses) {
      await prisma.address.create({
        data: {
          id: a.id,
          userId: a.userId,
          fullName: a.fullName,
          phone: a.phone,
          alternatePhone: a.alternatePhone,
          houseNumber: a.houseNumber,
          street: a.street,
          landmark: a.landmark,
          city: a.city,
          state: a.state,
          pinCode: a.pinCode,
          country: a.country || 'India',
          isDefault: a.isDefault,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt)
        }
      });
    }

    // 6. Import Orders
    console.log(`Importing ${data.orders.length} Orders...`);
    for (const o of data.orders) {
      await prisma.order.create({
        data: {
          id: o.id,
          userId: o.userId,
          status: o.status,
          totalAmount: o.totalAmount,
          taxAmount: o.taxAmount,
          discountAmount: o.discountAmount,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          paymentId: o.paymentId,
          shippingAddress: o.shippingAddress,
          trackingNumber: o.trackingNumber,
          couponCode: o.couponCode,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt)
        }
      });
    }

    // 7. Import OrderItems
    console.log(`Importing ${data.orderItems.length} OrderItems...`);
    for (const item of data.orderItems) {
      await prisma.orderItem.create({
        data: {
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          gstAmount: item.gstAmount
        }
      });
    }

    // 8. Import Reviews
    console.log(`Importing ${data.reviews.length} Reviews...`);
    for (const r of data.reviews) {
      await prisma.review.create({
        data: {
          id: r.id,
          productId: r.productId,
          userId: r.userId,
          userName: r.userName,
          rating: r.rating,
          comment: r.comment,
          createdAt: new Date(r.createdAt)
        }
      });
    }

    // 9. Import Coupons
    console.log(`Importing ${data.coupons.length} Coupons...`);
    for (const cp of data.coupons) {
      await prisma.coupon.upsert({
        where: { id: cp.id },
        update: {},
        create: {
          id: cp.id,
          code: cp.code,
          discountType: cp.discountType,
          discountValue: cp.discountValue,
          minOrderValue: cp.minOrderValue,
          maxDiscount: cp.maxDiscount,
          expiresAt: new Date(cp.expiresAt),
          isActive: cp.isActive,
          createdAt: new Date(cp.createdAt)
        }
      });
    }

    // 10. Import HomepageConfig
    console.log(`Importing ${data.homepageConfigs.length} HomepageConfigs...`);
    for (const config of data.homepageConfigs) {
      await prisma.homepageConfig.upsert({
        where: { id: config.id },
        update: {},
        create: {
          id: config.id,
          heroBanners: config.heroBanners,
          featuredCategories: config.featuredCategories,
          featuredProducts: config.featuredProducts,
          updatedAt: new Date(config.updatedAt)
        }
      });
    }

    // 11. Import WishlistItems
    console.log(`Importing ${data.wishlistItems.length} WishlistItems...`);
    for (const w of data.wishlistItems) {
      await prisma.wishlistItem.create({
        data: {
          id: w.id,
          userId: w.userId,
          productId: w.productId,
          createdAt: new Date(w.createdAt)
        }
      });
    }

    // 12. Import CartItems
    console.log(`Importing ${data.cartItems.length} CartItems...`);
    for (const ci of data.cartItems) {
      await prisma.cartItem.create({
        data: {
          id: ci.id,
          userId: ci.userId,
          productId: ci.productId,
          quantity: ci.quantity,
          createdAt: new Date(ci.createdAt),
          updatedAt: new Date(ci.updatedAt)
        }
      });
    }

    // 13. Import ServiceBookings
    console.log(`Importing ${data.serviceBookings.length} ServiceBookings...`);
    for (const s of data.serviceBookings) {
      await prisma.serviceBooking.create({
        data: {
          id: s.id,
          userId: s.userId,
          customerName: s.customerName,
          mobileNumber: s.mobileNumber,
          deviceType: s.deviceType,
          problemDescription: s.problemDescription,
          preferredDate: new Date(s.preferredDate),
          status: s.status,
          ticketNumber: s.ticketNumber,
          technicianName: s.technicianName,
          serviceNotes: s.serviceNotes,
          repairCost: s.repairCost || 0.0,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        }
      });
    }

    // 14. Import QuoteRequests
    console.log(`Importing ${data.quoteRequests.length} QuoteRequests...`);
    for (const q of data.quoteRequests) {
      await prisma.quoteRequest.create({
        data: {
          id: q.id,
          userId: q.userId,
          customerName: q.customerName,
          email: q.email,
          phone: q.phone,
          requirements: q.requirements,
          documentUrl: q.documentUrl,
          customPricing: q.customPricing,
          status: q.status,
          createdAt: new Date(q.createdAt),
          updatedAt: new Date(q.updatedAt)
        }
      });
    }

    // 15. Import BulkOrders
    console.log(`Importing ${data.bulkOrders.length} BulkOrders...`);
    for (const bo of data.bulkOrders) {
      await prisma.bulkOrder.create({
        data: {
          id: bo.id,
          organizationName: bo.organizationName,
          contactName: bo.contactName,
          email: bo.email,
          phone: bo.phone,
          quantity: bo.quantity,
          requirements: bo.requirements,
          status: bo.status,
          createdAt: new Date(bo.createdAt)
        }
      });
    }

    // 16. Import Notifications
    console.log(`Importing ${data.notifications.length} Notifications...`);
    for (const n of data.notifications) {
      await prisma.notification.create({
        data: {
          id: n.id,
          userId: n.userId,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
          createdAt: new Date(n.createdAt)
        }
      });
    }

    console.log('PostgreSQL database successfully seeded!');
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
