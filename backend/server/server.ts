// server/server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { prisma } from './db';
import { verifyToken, comparePassword, hashPassword, signToken, setAuthCookies } from './auth';
import { generateInvoicePDF } from './invoice';
import { isCloudinaryConfigured, uploadToCloudinary, deleteFromCloudinary } from './cloudinary';
import { vendorRouter } from './vendors';
import { expenseRouter } from './expenses';
import { warrantyRouter } from './warranty';
import { amcRouter } from './amc';
import { pcBuilderRouter } from './pcbuilder';
import { logAudit } from './audit';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_sripavanelectronics',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_sripavanelectronics',
});

// In-memory OTP storage for registration email verification
const emailOtps = new Map<string, { otp: string; expiresAt: number; userData?: any }>();

// In-memory Password Reset Tokens
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS setup: Allow Angular frontend to share cookies/sessions
app.use(cors({
  origin: ['http://localhost:4200'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-xsrf-token']
}));

app.use(express.json());
app.use(cookieParser());

// CSRF double-submit cookie middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // If the XSRF-TOKEN cookie doesn't exist, generate one
  let xsrfToken = req.cookies['XSRF-TOKEN'];
  if (!xsrfToken) {
    xsrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', xsrfToken, {
      httpOnly: false, // Must be readable by Angular frontend
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  }

  // Validate CSRF token for state-modifying requests
  const method = req.method;
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (!safeMethods.includes(method)) {
    const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
    if (!headerToken || headerToken !== xsrfToken) {
      return res.status(403).json({ error: 'CSRF token validation failed' });
    }
  }

  next();
});

// Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many service bookings. Please try again later.' }
});

// Extend Request interface to hold session info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name: string;
      };
    }
  }
}

// Authentication Middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  req.user = decoded;
  next();
};

// Optional Authentication Middleware (for guests/logged-in users alike)
const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
};

// Admin Protection Middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  authenticate(req, res, () => {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  });
};

/* ==========================================================================
   AUTH ENDPOINTS
   ========================================================================== */

// GET /api/auth/me
app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.json({ user: null });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return res.json({ user });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.json({ user: null });
  }
});

// POST /api/auth/register
app.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const emailClean = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: emailClean },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Save temporary registration details in-memory until OTP verified
    emailOtps.set(emailClean, {
      otp,
      expiresAt,
      userData: { name: name.trim(), email: emailClean, password }
    });

    // SIMULATED EMAIL NOTIFICATION
    console.log(`\n======================================================`);
    console.log(`[EMAIL SIMULATOR] To: ${emailClean}`);
    console.log(`Subject: Verify Your Account - Sri Pavan Computers`);
    console.log(`Your verification code is: ${otp}`);
    console.log(`======================================================\n`);

    return res.json({
      message: 'OTP verification code sent to your email',
      email: emailClean
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify-email
app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const emailClean = email.toLowerCase().trim();
    const stored = emailOtps.get(emailClean);

    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    const { name, password } = stored.userData;
    const passwordHash = hashPassword(password);

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'CUSTOMER';

    const user = await prisma.user.create({
      data: {
        name,
        email: emailClean,
        passwordHash,
        role,
      },
    });

    // Clear verification OTP
    emailOtps.delete(emailClean);

    setAuthCookies(res, {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    }, false);

    // Create a Welcome Notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to Sri Pavan Computers!',
        message: `Hello ${user.name}, your account is verified. Happy shopping!`,
        type: 'SYSTEM'
      }
    });

    return res.json({
      message: 'Account verified and registered successfully',
      user: { id: user.id, email: user.email, role: user.role, name: user.name }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !comparePassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    setAuthCookies(res, {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    }, !!rememberMe);

    return res.json({
      message: 'Logged in successfully',
      user: { id: user.id, email: user.email, role: user.role, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('token', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  return res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/refresh
app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new access and refresh token cookies
    setAuthCookies(res, {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    }, false); // Default to standard 7 days session

    return res.json({
      message: 'Token refreshed successfully',
      user: { id: user.id, email: user.email, role: user.role, name: user.name }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailClean = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: emailClean } });

    if (!user) {
      // For security, don't reveal user doesn't exist
      return res.json({ message: 'If the email exists, a password reset link has been generated.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    resetTokens.set(token, {
      email: emailClean,
      expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour expiry
    });

    // SIMULATED EMAIL
    console.log(`\n======================================================`);
    console.log(`[EMAIL SIMULATOR] To: ${emailClean}`);
    console.log(`Subject: Password Reset Request - Sri Pavan Computers`);
    console.log(`Reset link: http://localhost:4200/reset-password?token=${token}`);
    console.log(`======================================================\n`);

    return res.json({
      message: 'Password reset instructions have been logged to the server console.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const stored = resetTokens.get(token);
    if (!stored || stored.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = hashPassword(newPassword);
    await prisma.user.update({
      where: { email: stored.email },
      data: { passwordHash }
    });

    resetTokens.delete(token);

    return res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/profile (Edit Profile)
app.put('/api/auth/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const emailClean = email.toLowerCase().trim();
    if (emailClean !== req.user!.email) {
      const existing = await prisma.user.findUnique({ where: { email: emailClean } });
      if (existing) {
        return res.status(400).json({ error: 'Email is already taken by another account' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: name.trim(), email: emailClean },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    // Re-sign token
    setAuthCookies(res, {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role as any,
      name: updatedUser.name
    }, false);

    return res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/change-password
app.put('/api/auth/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !comparePassword(currentPassword, user.passwordHash)) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash: hashPassword(newPassword) }
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==========================================================================
   ADDRESS MANAGEMENT ENDPOINTS
   ========================================================================== */

// GET /api/addresses
app.get('/api/addresses', authenticate, async (req: Request, res: Response) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/addresses
app.post('/api/addresses', authenticate, async (req: Request, res: Response) => {
  try {
    const { fullName, phone, alternatePhone, houseNumber, street, landmark, city, state, pinCode, isDefault } = req.body;

    if (!fullName || !phone || !houseNumber || !street || !city || !state || !pinCode) {
      return res.status(400).json({ error: 'Missing required address fields' });
    }

    if (isDefault) {
      // Remove default from previous addresses
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false }
      });
    }

    // If first address, make it default
    const count = await prisma.address.count({ where: { userId: req.user!.id } });
    const makeDefault = count === 0 ? true : isDefault;

    const address = await prisma.address.create({
      data: {
        userId: req.user!.id,
        fullName,
        phone,
        alternatePhone,
        houseNumber,
        street,
        landmark,
        city,
        state,
        pinCode,
        isDefault: makeDefault
      }
    });

    return res.json({ message: 'Address added successfully', address });
  } catch (error) {
    console.error('Create address error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/addresses/:id
app.put('/api/addresses/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { fullName, phone, alternatePhone, houseNumber, street, landmark, city, state, pinCode, isDefault } = req.body;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Address not found' });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        fullName,
        phone,
        alternatePhone,
        houseNumber,
        street,
        landmark,
        city,
        state,
        pinCode,
        isDefault
      }
    });

    return res.json({ message: 'Address updated successfully', address });
  } catch (error) {
    console.error('Update address error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/addresses/:id
app.delete('/api/addresses/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.address.findUnique({ where: { id } });

    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.address.delete({ where: { id } });

    // If deleted address was default, set another address as default
    if (existing.isDefault) {
      const remaining = await prisma.address.findFirst({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' }
      });
      if (remaining) {
        await prisma.address.update({
          where: { id: remaining.id },
          data: { isDefault: true }
        });
      }
    }

    return res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/addresses/:id/default
app.post('/api/addresses/:id/default', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.address.findUnique({ where: { id } });

    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.address.updateMany({
      where: { userId: req.user!.id },
      data: { isDefault: false }
    });

    const address = await prisma.address.update({
      where: { id },
      data: { isDefault: true }
    });

    return res.json({ message: 'Address set as default', address });
  } catch (error) {
    console.error('Set default address error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==========================================================================
   CART & WISHLIST PERSISTENCE ENDPOINTS
   ========================================================================== */

// GET /api/cart
app.get('/api/cart', authenticate, async (req: Request, res: Response) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user!.id },
      include: { product: true }
    });
    return res.json({ cartItems });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cart/sync (Merge local cart into DB cart)
app.post('/api/cart/sync', authenticate, async (req: Request, res: Response) => {
  try {
    const { items } = req.body; // Array: [{ productId: string, quantity: number }]
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid cart items format' });
    }

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;

      const qty = Math.min(item.quantity, product.stock);
      if (qty <= 0) continue;

      await prisma.cartItem.upsert({
        where: {
          userId_productId: {
            userId: req.user!.id,
            productId: item.productId
          }
        },
        create: {
          userId: req.user!.id,
          productId: item.productId,
          quantity: qty
        },
        update: {
          quantity: {
            set: qty
          }
        }
      });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user!.id },
      include: { product: true }
    });
    return res.json({ message: 'Cart synchronized successfully', cartItems });
  } catch (error) {
    console.error('Sync cart error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cart (Add/Update Item)
app.post('/api/cart', authenticate, async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity === undefined) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ error: `Only ${product.stock} items available in stock.` });
    }

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: req.user!.id, productId }
      });
      return res.json({ message: 'Item removed from cart' });
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: req.user!.id,
          productId
        }
      },
      create: {
        userId: req.user!.id,
        productId,
        quantity
      },
      update: {
        quantity
      },
      include: { product: true }
    });

    return res.json({ message: 'Cart updated', cartItem });
  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cart/:productId
app.delete('/api/cart/:productId', authenticate, async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    await prisma.cartItem.deleteMany({
      where: { userId: req.user!.id, productId }
    });
    return res.json({ message: 'Item deleted from cart' });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cart (Clear Cart)
app.delete('/api/cart', authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user!.id }
    });
    return res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/wishlist
app.get('/api/wishlist', authenticate, async (req: Request, res: Response) => {
  try {
    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.id },
      include: { product: true }
    });
    return res.json({ wishlist });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/wishlist
app.post('/api/wishlist', authenticate, async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: req.user!.id,
          productId
        }
      },
      create: {
        userId: req.user!.id,
        productId
      },
      update: {}
    });

    return res.json({ message: 'Added to wishlist', item });
  } catch (error) {
    console.error('Add wishlist error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/wishlist/:productId
app.delete('/api/wishlist/:productId', authenticate, async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user!.id, productId }
    });
    return res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Delete wishlist error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


/* ==========================================================================
   PRODUCTS ENDPOINTS
   ========================================================================== */

// GET /api/products
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const category = (req.query.category as string) || '';
    const brand = (req.query.brand as string) || '';
    const minPrice = parseFloat((req.query.minPrice as string) || '0');
    const maxPrice = parseFloat((req.query.maxPrice as string) || '9999999');
    const inStock = req.query.inStock === 'true';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '12');
    const skip = (page - 1) * limit;

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
      const cat = await prisma.category.findUnique({ where: { slug: category } });
      if (cat) {
        where.categoryId = cat.id;
      } else {
        where.categoryId = 'non-existent-id';
      }
    }

    if (brand) {
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
    } else if (sortBy === 'popularity') {
      orderBy = { ratingCount: 'desc' };
    }

    const totalProducts = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: true,
        brand: true,
      },
    });

    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });

    return res.json({ products, categories, brands, total: totalProducts, page, limit });
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/:id
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product });
  } catch (error) {
    console.error('Fetch product detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products (Admin only)
app.post('/api/products', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      name, description, price, originalPrice, stock, sku, categoryId, brandId, images, specs,
      gstRate, subcategory, warranty, modelNumber, seoTitle, seoDescription, source,
      lockDescription, lockImages, lockSpecs, lockPrice, lockStock, lockSeo
    } = req.body;

    if (!name || !price || !sku || !categoryId || !brandId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingProduct = await prisma.product.findUnique({ where: { sku: sku.trim().toUpperCase() } });
    if (existingProduct) {
      return res.status(400).json({ error: `SKU '${sku}' already exists` });
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
        gstRate: gstRate !== undefined ? parseFloat(gstRate) : 18.0,
        subcategory: subcategory || null,
        warranty: warranty || null,
        modelNumber: modelNumber || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        source: source || 'MANUAL',
        lockDescription: !!lockDescription,
        lockImages: !!lockImages,
        lockSpecs: !!lockSpecs,
        lockPrice: !!lockPrice,
        lockStock: !!lockStock,
        lockSeo: !!lockSeo,
        status: 'ACTIVE',
      },
    });

    // Notify low stock on creation if stock is low
    if (product.stock <= 5) {
      await prisma.notification.create({
        data: {
          title: 'Low Stock Alert',
          message: `Product "${product.name}" is low in stock (${product.stock} items remaining).`,
          type: 'LOW_STOCK'
        }
      });
    }

    return res.json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/products/:id (Admin only)
app.put('/api/products/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      name, description, price, originalPrice, stock, sku, categoryId, brandId, images, specs, status,
      gstRate, subcategory, warranty, modelNumber, seoTitle, seoDescription, source,
      lockDescription, lockImages, lockSpecs, lockPrice, lockStock, lockSeo
    } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (sku && sku !== existingProduct.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku: sku.trim().toUpperCase() } });
      if (skuCheck) {
        return res.status(400).json({ error: `SKU '${sku}' already exists` });
      }
    }

    if (images !== undefined && existingProduct) {
      try {
        const oldImages: string[] = JSON.parse(existingProduct.images);
        const newImages: string[] = images;
        if (Array.isArray(oldImages) && Array.isArray(newImages)) {
          const removedImages = oldImages.filter(img => !newImages.includes(img));
          for (const img of removedImages) {
            await deleteFromCloudinary(img);
          }
        }
      } catch (e) {}
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        originalPrice: originalPrice !== undefined ? parseFloat(originalPrice) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        sku: sku !== undefined ? sku.trim().toUpperCase() : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        brandId: brandId !== undefined ? brandId : undefined,
        images: images !== undefined ? JSON.stringify(images) : undefined,
        specs: specs !== undefined ? JSON.stringify(specs) : undefined,
        status: status !== undefined ? status : undefined,
        gstRate: gstRate !== undefined ? parseFloat(gstRate) : undefined,
        subcategory: subcategory !== undefined ? (subcategory || null) : undefined,
        warranty: warranty !== undefined ? (warranty || null) : undefined,
        modelNumber: modelNumber !== undefined ? (modelNumber || null) : undefined,
        seoTitle: seoTitle !== undefined ? (seoTitle || null) : undefined,
        seoDescription: seoDescription !== undefined ? (seoDescription || null) : undefined,
        source: source !== undefined ? source : undefined,
        lockDescription: lockDescription !== undefined ? !!lockDescription : undefined,
        lockImages: lockImages !== undefined ? !!lockImages : undefined,
        lockSpecs: lockSpecs !== undefined ? !!lockSpecs : undefined,
        lockPrice: lockPrice !== undefined ? !!lockPrice : undefined,
        lockStock: lockStock !== undefined ? !!lockStock : undefined,
        lockSeo: lockSeo !== undefined ? !!lockSeo : undefined,
      },
    });

    if (updatedProduct.stock <= 5 && updatedProduct.stock < existingProduct.stock) {
      await prisma.notification.create({
        data: {
          title: 'Low Stock Alert',
          message: `Product "${updatedProduct.name}" is low in stock (${updatedProduct.stock} items remaining).`,
          type: 'LOW_STOCK'
        }
      });
    }

    return res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/products/:id (Admin only)
app.delete('/api/products/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({ where: { id } });
    if (product) {
      try {
        const images: string[] = JSON.parse(product.images);
        if (Array.isArray(images)) {
          for (const img of images) {
            await deleteFromCloudinary(img);
          }
        }
      } catch (e) {}
    }
    await prisma.product.delete({ where: { id } });
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/products/upload (Admin only) - Single image upload
app.post('/api/products/upload', requireAdmin, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (isCloudinaryConfigured) {
      const cloudinaryUrl = await uploadToCloudinary(req.file.buffer);
      return res.json({ url: cloudinaryUrl });
    }

    const uploadDir = path.resolve(process.cwd(), '../frontend/public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    const destPath = path.join(uploadDir, filename);

    fs.writeFileSync(destPath, req.file.buffer);

    return res.json({
      url: `/uploads/${filename}`,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products/import-images (Admin only) - ZIP file images import
app.post('/api/products/import-images', requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a ZIP file.' });
    }

    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();
    const uploadDir = path.resolve(process.cwd(), '../frontend/public/uploads');

    if (!isCloudinaryConfigured && !fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let matchedCount = 0;
    let totalImages = 0;
    const errors: string[] = [];

    const skuImagesMap: { [sku: string]: string[] } = {};

    for (const entry of zipEntries) {
      if (entry.isDirectory || entry.entryName.startsWith('__MACOSX') || entry.entryName.includes('/.')) {
        continue;
      }

      totalImages++;
      const filename = path.basename(entry.entryName);
      const ext = path.extname(filename).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        errors.push(`Skipped non-image file: ${filename}`);
        continue;
      }

      const nameWithoutExt = path.basename(filename, ext);
      const skuMatch = nameWithoutExt.split('_')[0].trim().toUpperCase();

      if (!skuMatch) {
        errors.push(`Could not determine SKU from filename: ${filename}`);
        continue;
      }

      let webPath = '';
      if (isCloudinaryConfigured) {
        try {
          webPath = await uploadToCloudinary(entry.getData());
        } catch (e: any) {
          errors.push(`Cloudinary upload failed for ${filename}: ${e.message || e}`);
          continue;
        }
      } else {
        const destFilename = `${skuMatch}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
        const destPath = path.join(uploadDir, destFilename);
        
        fs.writeFileSync(destPath, entry.getData());
        webPath = `/uploads/${destFilename}`;
      }

      if (!skuImagesMap[skuMatch]) {
        skuImagesMap[skuMatch] = [];
      }
      skuImagesMap[skuMatch].push(webPath);
    }

    for (const sku of Object.keys(skuImagesMap)) {
      const product = await prisma.product.findUnique({ where: { sku } });
      if (!product) {
        errors.push(`SKU '${sku}' not found in database. Images extracted but not linked.`);
        continue;
      }

      if (product.lockImages) {
        errors.push(`SKU '${sku}' has image lock enabled. Skipped link updates.`);
        continue;
      }

      let currentImages: string[] = [];
      try {
        currentImages = JSON.parse(product.images);
        if (!Array.isArray(currentImages)) {
          currentImages = [];
        }
      } catch (e) {
        currentImages = [];
      }

      const newImages = [...currentImages, ...skuImagesMap[sku]];

      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: JSON.stringify(newImages),
        },
      });

      matchedCount += skuImagesMap[sku].length;
    }

    return res.json({
      message: 'Images import completed',
      summary: {
        totalImages,
        matchedCount,
        errors,
      },
    });
  } catch (error) {
    console.error('Import images error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products/import', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { products, mode, source, filename } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Payload products must be an array' });
    }

    const targetMode = mode || 'CREATE_AND_UPDATE';
    const importSource = source || 'EXCEL_IMPORT';
    const file = filename || 'bulk-import.csv';

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const createdSkuList: string[] = [];
    const updatedProductsSnapshot: any[] = [];

    // Cache categories and brands to prevent redundant database hits
    const categoriesList = await prisma.category.findMany();
    const categoryCache = new Map<string, string>();
    categoriesList.forEach(c => categoryCache.set(c.slug, c.id));

    const brandsList = await prisma.brand.findMany();
    const brandCache = new Map<string, string>();
    brandsList.forEach(b => brandCache.set(b.slug, b.id));

    const getOrCreateCategory = async (name: string): Promise<string> => {
      const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (categoryCache.has(slug)) {
        return categoryCache.get(slug)!;
      }
      const newCat = await prisma.category.create({ data: { name: name.trim(), slug } });
      categoryCache.set(slug, newCat.id);
      return newCat.id;
    };

    const getOrCreateBrand = async (name: string): Promise<string> => {
      const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (brandCache.has(slug)) {
        return brandCache.get(slug)!;
      }
      const newBrand = await prisma.brand.create({ data: { name: name.trim(), slug } });
      brandCache.set(slug, newBrand.id);
      return newBrand.id;
    };

    for (const p of products) {
      try {
        const rawSku = p.sku || p['SKU/Product Code'] || p['SKU'] || p['Product Code'] || p['sku_code'];
        if (!rawSku) {
          skipped++;
          errors.push(`Row skipped: missing SKU/Product Code.`);
          continue;
        }
        const sku = String(rawSku).trim().toUpperCase();

        const existing = await prisma.product.findUnique({ where: { sku } });

        const name = (p.name || p['Product Name'] || p['Name'] || '').trim();
        const catInput = p.categoryName || p['Category'] || p.category || '';
        const brandInput = p.brandName || p['Brand'] || p.brand || '';
        
        let categoryId = p.categoryId;
        if (!categoryId && catInput) {
          categoryId = await getOrCreateCategory(String(catInput));
        }

        let brandId = p.brandId;
        if (!brandId && brandInput) {
          brandId = await getOrCreateBrand(String(brandInput));
        }

        const subcategory = p.subcategory || p['Subcategory'] || null;
        const description = p.description || p['Description'] || '';
        
        const inputPrice = parseFloat(p.price || p['Discount Price'] || p['DiscountPrice'] || p['Sell Price'] || 0);
        const inputOriginalPrice = parseFloat(p.originalPrice || p['Price'] || p['MRP'] || p['Original Price'] || p['OriginalPrice'] || 0);
        
        let price = inputPrice;
        let originalPrice = inputOriginalPrice;
        if (price === 0 && originalPrice > 0) {
          price = originalPrice;
        } else if (originalPrice === 0 && price > 0) {
          originalPrice = price;
        }
        if (originalPrice > 0 && price > originalPrice) {
          const temp = price;
          price = originalPrice;
          originalPrice = temp;
        }

        const stock = parseInt(p.stock !== undefined ? p.stock : (p.quantity || p['Stock Quantity'] || p['Stock'] || 0));
        const gstRate = parseFloat(p.gstRate !== undefined ? p.gstRate : (p['GST Rate'] || p['GST'] || 18.0));
        const warranty = p.warranty || p['Warranty'] || null;
        const modelNumber = p.modelNumber || p['Model Number'] || p['ModelNumber'] || null;
        
        let specs = {};
        const rawSpecs = p.specs || p['Product Specifications'] || p['Specifications'] || p['Specs'];
        if (rawSpecs) {
          if (typeof rawSpecs === 'string') {
            try {
              specs = JSON.parse(rawSpecs);
            } catch (e) {
              const parts = rawSpecs.split(',');
              parts.forEach((part: string) => {
                const [k, v] = part.split(':');
                if (k && v) {
                  (specs as any)[k.trim()] = v.trim();
                }
              });
            }
          } else if (typeof rawSpecs === 'object') {
            specs = rawSpecs;
          }
        }

        const seoTitle = p.seoTitle || p['SEO Title'] || p['SeoTitle'] || null;
        const seoDescription = p.seoDescription || p['SEO Description'] || p['SeoDescription'] || null;

        let images: string[] = [];
        const rawImages = p.images || p['Product Images'] || p['Images'];
        if (rawImages) {
          if (Array.isArray(rawImages)) {
            images = rawImages;
          } else if (typeof rawImages === 'string') {
            try {
              images = JSON.parse(rawImages);
            } catch (e) {
              images = rawImages.split(',').map((img: string) => img.trim());
            }
          }
        }
        if (images.length === 0) {
          images = ['/uploads/hero_banner.jpg'];
        }

        if (existing) {
          if (targetMode === 'CREATE_ONLY') {
            skipped++;
            continue;
          }

          const updateData: any = {};

          if (targetMode === 'STOCK_ONLY') {
            if (!existing.lockStock) {
              updatedProductsSnapshot.push({ ...existing });
              updateData.stock = stock;
              await prisma.product.update({ where: { id: existing.id }, data: updateData });
              updated++;
            } else {
              skipped++;
            }
          } else if (targetMode === 'PRICE_ONLY') {
            if (!existing.lockPrice) {
              updatedProductsSnapshot.push({ ...existing });
              updateData.price = price;
              updateData.originalPrice = originalPrice;
              await prisma.product.update({ where: { id: existing.id }, data: updateData });
              updated++;
            } else {
              skipped++;
            }
          } else {
            updateData.source = importSource;

            if (name) updateData.name = name;
            if (categoryId) updateData.categoryId = categoryId;
            if (brandId) updateData.brandId = brandId;
            if (subcategory !== undefined) updateData.subcategory = subcategory;
            if (warranty !== undefined) updateData.warranty = warranty;
            if (modelNumber !== undefined) updateData.modelNumber = modelNumber;
            if (gstRate !== undefined) updateData.gstRate = gstRate;

            if (!existing.lockDescription) {
              updateData.description = description;
            }
            if (!existing.lockPrice) {
              updateData.price = price;
              updateData.originalPrice = originalPrice;
            }
            if (!existing.lockStock) {
              updateData.stock = stock;
            }
            if (!existing.lockImages && images.length > 0 && images[0] !== '/uploads/hero_banner.jpg') {
              updateData.images = JSON.stringify(images);
            }
            if (!existing.lockSpecs) {
              updateData.specs = JSON.stringify(specs);
            }
            if (!existing.lockSeo) {
              updateData.seoTitle = seoTitle;
              updateData.seoDescription = seoDescription;
            }

            updatedProductsSnapshot.push({ ...existing });
            await prisma.product.update({
              where: { id: existing.id },
              data: updateData,
            });
            updated++;
          }
        } else {
          if (targetMode === 'UPDATE_ONLY' || targetMode === 'STOCK_ONLY' || targetMode === 'PRICE_ONLY') {
            skipped++;
            continue;
          }

          if (!name || !categoryId || !brandId) {
            skipped++;
            errors.push(`SKU '${sku}': Name, Category, and Brand are required to create new product.`);
            continue;
          }

          await prisma.product.create({
            data: {
              name,
              description,
              price,
              originalPrice,
              stock,
              sku,
              gstRate,
              categoryId,
              brandId,
              images: JSON.stringify(images),
              specs: JSON.stringify(specs),
              subcategory,
              warranty,
              modelNumber,
              seoTitle,
              seoDescription,
              source: importSource,
              status: 'ACTIVE',
            },
          });
          createdSkuList.push(sku);
          created++;
        }
      } catch (e: any) {
        skipped++;
        errors.push(`Error processing SKU row: ${e.message || e}`);
      }
    }

    // Save history log
    await prisma.importHistory.create({
      data: {
        filename: file,
        mode: targetMode,
        source: importSource,
        createdCnt: created,
        updatedCnt: updated,
        skippedCnt: skipped,
        errors: JSON.stringify(errors),
        prevStates: JSON.stringify({ createdSkuList, updatedProducts: updatedProductsSnapshot }),
        rolledBack: false
      }
    });

    return res.json({
      message: 'Bulk import processed successfully',
      summary: {
        created,
        updated,
        skipped,
        errors,
      },
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products/import/preview (Admin only) - Dry run bulk import analysis
app.post('/api/products/import/preview', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { products, mode } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Payload products must be an array' });
    }

    const targetMode = mode || 'CREATE_AND_UPDATE';
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    const categoriesList = await prisma.category.findMany();
    const categoryCache = new Map<string, string>();
    categoriesList.forEach(c => categoryCache.set(c.slug, c.id));

    const brandsList = await prisma.brand.findMany();
    const brandCache = new Map<string, string>();
    brandsList.forEach(b => brandCache.set(b.slug, b.id));

    for (const p of products) {
      const rawSku = p.sku || p['SKU/Product Code'] || p['SKU'] || p['Product Code'] || p['sku_code'];
      if (!rawSku) {
        skipped++;
        errors.push(`Row skipped: missing SKU/Product Code.`);
        continue;
      }
      const sku = String(rawSku).trim().toUpperCase();

      const existing = await prisma.product.findUnique({ where: { sku } });
      const name = (p.name || p['Product Name'] || p['Name'] || '').trim();
      const catInput = p.categoryName || p['Category'] || p.category || '';
      const brandInput = p.brandName || p['Brand'] || p.brand || '';

      const slugCat = catInput ? String(catInput).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '';
      const slugBrand = brandInput ? String(brandInput).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '';

      const catExists = categoryCache.has(slugCat);
      const brandExists = brandCache.has(slugBrand);

      if (existing) {
        if (targetMode === 'CREATE_ONLY') {
          skipped++;
          warnings.push(`SKU '${sku}' exists in DB and will be skipped in CREATE_ONLY mode.`);
          continue;
        }
        updated++;
        if (catInput && !catExists) {
          warnings.push(`SKU '${sku}': Category '${catInput}' will be created dynamically.`);
        }
        if (brandInput && !brandExists) {
          warnings.push(`SKU '${sku}': Brand '${brandInput}' will be created dynamically.`);
        }
      } else {
        if (targetMode === 'UPDATE_ONLY' || targetMode === 'STOCK_ONLY' || targetMode === 'PRICE_ONLY') {
          skipped++;
          warnings.push(`SKU '${sku}' does not exist in DB and will be skipped in UPDATE_ONLY/STOCK_ONLY/PRICE_ONLY mode.`);
          continue;
        }
        if (!name || !catInput || !brandInput) {
          skipped++;
          errors.push(`SKU '${sku}': Missing Name, Category, or Brand. Cannot create product.`);
          continue;
        }
        created++;
        if (!catExists) {
          warnings.push(`SKU '${sku}': New Category '${catInput}' will be created.`);
        }
        if (!brandExists) {
          warnings.push(`SKU '${sku}': New Brand '${brandInput}' will be created.`);
        }
      }
    }

    return res.json({
      summary: { created, updated, skipped },
      errors,
      warnings
    });
  } catch (error) {
    console.error('Import preview error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products/import/rollback/:id (Admin only) - Rollback bulk import snapshot
app.post('/api/products/import/rollback/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const history = await prisma.importHistory.findUnique({ where: { id } });
    if (!history) {
      return res.status(404).json({ error: 'Import log not found' });
    }
    if (history.rolledBack) {
      return res.status(400).json({ error: 'This import has already been rolled back' });
    }

    const { createdSkuList, updatedProducts } = JSON.parse(history.prevStates);

    // 1. Delete created products
    if (Array.isArray(createdSkuList) && createdSkuList.length > 0) {
      await prisma.product.deleteMany({
        where: { sku: { in: createdSkuList } }
      });
    }

    // 2. Restore updated products
    if (Array.isArray(updatedProducts) && updatedProducts.length > 0) {
      for (const p of updatedProducts) {
        await prisma.product.update({
          where: { id: p.id },
          data: {
            name: p.name,
            description: p.description,
            price: p.price,
            originalPrice: p.originalPrice,
            stock: p.stock,
            gstRate: p.gstRate,
            categoryId: p.categoryId,
            brandId: p.brandId,
            images: p.images,
            specs: p.specs,
            subcategory: p.subcategory,
            warranty: p.warranty,
            modelNumber: p.modelNumber,
            seoTitle: p.seoTitle,
            seoDescription: p.seoDescription,
            source: p.source,
            status: p.status
          }
        });
      }
    }

    await prisma.importHistory.update({
      where: { id },
      data: { rolledBack: true }
    });

    await logAudit(req.user!.id, req.user!.email, 'IMPORT_ROLLBACK', { importHistoryId: id }, req.ip);
    return res.json({ message: 'Import rolled back successfully' });
  } catch (error) {
    console.error('Import rollback error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/import/history (Admin only) - Fetch import history log
app.get('/api/products/import/history', requireAdmin, async (req: Request, res: Response) => {
  try {
    const history = await prisma.importHistory.findMany({
      orderBy: { timestamp: 'desc' }
    });
    return res.json({ history });
  } catch (error) {
    console.error('Fetch import history error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/import/missing-images (Admin only) - Report of products holding placeholders
app.get('/api/products/import/missing-images', requireAdmin, async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { images: { contains: 'hero_banner.jpg' } },
          { images: { contains: 'placeholder' } }
        ]
      },
      include: { category: true, brand: true }
    });
    return res.json({ missingImages: products });
  } catch (error) {
    console.error('Fetch missing images report error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==========================================================================
   REVIEWS ENDPOINTS
   ========================================================================== */

// POST /api/products/:id/reviews
app.post('/api/products/:id/reviews', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { rating, comment } = req.body;

    if (!rating || !comment || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Missing or invalid review fields' });
    }

    // Rule: Verified Buyers Only
    const buyerCheck = await prisma.order.findFirst({
      where: {
        userId: req.user!.id,
        status: 'DELIVERED',
        items: {
          some: { productId: id }
        }
      }
    });

    if (!buyerCheck) {
      return res.status(403).json({ error: 'Only verified buyers who received this item can submit reviews.' });
    }

    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          productId: id,
          userId: req.user!.id,
          userName: req.user!.name,
          rating: parseInt(rating),
          comment: comment.trim(),
        },
      });

      const allReviews = await tx.review.findMany({ where: { productId: id } });
      const ratingCount = allReviews.length;
      const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount;

      await tx.product.update({
        where: { id },
        data: {
          rating: parseFloat(averageRating.toFixed(2)),
          ratingCount: ratingCount,
        },
      });

      return newReview;
    });

    return res.json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Submit review error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


/* ==========================================================================
   ORDERS ENDPOINTS
   ========================================================================== */

// GET /api/orders
app.get('/api/orders', authenticate, async (req: Request, res: Response) => {
  try {
    let orders;
    if (req.user!.role === 'ADMIN') {
      orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: true } }
        }
      });
    } else {
      orders = await prisma.order.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: true } }
        }
      });
    }
    return res.json({ orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id
app.get('/api/orders/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (req.user!.role !== 'ADMIN' && order.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json({ order });
  } catch (error) {
    console.error('Fetch order detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id/invoice (Stream Generated GST Invoice PDF)
app.get('/api/orders/:id/invoice', authenticate, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  
  // Verify ownership
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (req.user!.role !== 'ADMIN' && order.userId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await generateInvoicePDF(id, res);
});

// POST /api/orders (Create Order - COD only, online uses Razorpay checkouts)
app.post('/api/orders', authenticate, async (req: Request, res: Response) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;

    if (!items || !items.length || !shippingAddress || !paymentMethod) {
      return res.status(400).json({ error: 'Missing order details' });
    }

    if (paymentMethod === 'ONLINE') {
      return res.status(400).json({ error: 'Online payments must go through Razorpay checkout APIs' });
    }

    const resolvedItems: { productId: string; quantity: number; price: number; gstAmount: number }[] = [];
    let subtotal = 0;
    let totalTax = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product: ${product.name}` });
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

    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: {
          userId: req.user!.id,
          status: 'PENDING',
          totalAmount,
          taxAmount: totalTax,
          discountAmount,
          paymentMethod,
          paymentStatus: 'PENDING',
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

      // Decrement stock
      for (const ri of resolvedItems) {
        await tx.product.update({
          where: { id: ri.productId },
          data: { stock: { decrement: ri.quantity } }
        });
      }

      // Clear DB Cart
      await tx.cartItem.deleteMany({
        where: { userId: req.user!.id }
      });

      return newOrder;
    });

    // Create Notification and WhatsApp Simulator
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Order Placed!',
        message: `Your COD order #${order.id.slice(0,8).toUpperCase()} of Rs. ${order.totalAmount} has been placed.`,
        type: 'ORDER'
      }
    });

    console.log(`\n======================================================`);
    console.log(`[WHATSAPP SIMULATOR] To: ${shippingAddress.phone}`);
    console.log(`Message: Sri Pavan Computers - Your order #${order.id.slice(0,8).toUpperCase()} for Rs. ${order.totalAmount} is confirmed! Method: Cash On Delivery.`);
    console.log(`======================================================\n`);

    return res.json({ message: 'Order placed successfully', order });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/orders/:id (Admin Order update)
app.put('/api/orders/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, paymentStatus, trackingNumber } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { user: true }
    });
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: status !== undefined ? status : undefined,
        paymentStatus: paymentStatus !== undefined ? paymentStatus : undefined,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : undefined
      }
    });

    // Create notifications on updates
    if (status && status !== existingOrder.status) {
      await prisma.notification.create({
        data: {
          userId: existingOrder.userId,
          title: `Order Status: ${status}`,
          message: `Your order #${existingOrder.id.slice(0,8).toUpperCase()} has been updated to: ${status}.`,
          type: 'ORDER'
        }
      });

      // WhatsApp Simulator notification
      let shipping: any = {};
      try { shipping = JSON.parse(existingOrder.shippingAddress); } catch(e) {}
      if (shipping.phone) {
        console.log(`\n======================================================`);
        console.log(`[WHATSAPP SIMULATOR] To: ${shipping.phone}`);
        console.log(`Message: Sri Pavan Computers - Update: Your order #${existingOrder.id.slice(0,8).toUpperCase()} status is now: ${status}!`);
        if (trackingNumber) console.log(`Tracking ID: ${trackingNumber}`);
        console.log(`======================================================\n`);
      }
    }

    return res.json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


/* ==========================================================================
   COUPONS ENDPOINTS
   ========================================================================== */

// POST /api/coupons/validate
app.post('/api/coupons/validate', async (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() }
    });

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ error: 'Coupon is invalid or inactive' });
    }

    if (new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    if (subtotal < coupon.minOrderValue) {
      return res.status(400).json({ error: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon` });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    return res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==========================================================================
   REPAIR SERVICE BOOKING ENDPOINTS
   ========================================================================== */

// POST /api/services/bookings (Submit Service Repair request)
app.post('/api/services/bookings', bookingLimiter, optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const { customerName, mobileNumber, deviceType, problemDescription, preferredDate } = req.body;

    if (!customerName || !mobileNumber || !deviceType || !problemDescription || !preferredDate) {
      return res.status(400).json({ error: 'All service fields are required' });
    }

    const booking = await prisma.serviceBooking.create({
      data: {
        userId: req.user?.id || null,
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        deviceType,
        problemDescription: problemDescription.trim(),
        preferredDate: new Date(preferredDate),
        status: 'SUBMITTED'
      }
    });

    // Create Admin notification
    await prisma.notification.create({
      data: {
        title: 'New Service Booking',
        message: `New ${deviceType} repair request from ${customerName} (${mobileNumber}).`,
        type: 'SERVICE'
      }
    });

    console.log(`\n======================================================`);
    console.log(`[WHATSAPP SIMULATOR] To: ${mobileNumber}`);
    console.log(`Message: Sri Pavan Computers - Service Booking Confirmed! We received your repair request for: ${deviceType}. Tracking ID: #${booking.id.slice(0,8).toUpperCase()}`);
    console.log(`======================================================\n`);

    return res.json({ message: 'Service booking request submitted successfully', booking });
  } catch (error) {
    console.error('Create service booking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/services/bookings (Customer/Admin list bookings)
app.get('/api/services/bookings', authenticate, async (req: Request, res: Response) => {
  try {
    let bookings;
    if (req.user!.role === 'ADMIN') {
      bookings = await prisma.serviceBooking.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } else {
      bookings = await prisma.serviceBooking.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' }
      });
    }
    return res.json({ bookings });
  } catch (error) {
    console.error('Get service bookings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==========================================================================
   CUSTOM QUOTE REQUEST ENDPOINTS
   ========================================================================== */

// POST /api/quotes
app.post('/api/quotes', optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const { customerName, email, phone, requirements, documentUrl } = req.body;

    if (!customerName || !email || !phone || !requirements) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const quote = await prisma.quoteRequest.create({
      data: {
        userId: req.user?.id || null,
        customerName: customerName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        requirements: requirements.trim(),
        documentUrl: documentUrl || null,
        status: 'PENDING'
      }
    });

    await prisma.notification.create({
      data: {
        title: 'New Quote Request',
        message: `Quote request submitted by ${customerName} (${phone}).`,
        type: 'SYSTEM'
      }
    });

    return res.json({ message: 'Quote request submitted successfully', quote });
  } catch (error) {
    console.error('Create quote error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quotes (Customer/Admin list quotes)
app.get('/api/quotes', authenticate, async (req: Request, res: Response) => {
  try {
    let quotes;
    if (req.user!.role === 'ADMIN') {
      quotes = await prisma.quoteRequest.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } else {
      quotes = await prisma.quoteRequest.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' }
      });
    }
    return res.json({ quotes });
  } catch (error) {
    console.error('Get quotes error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==========================================================================
   BULK ORDER REQUEST ENDPOINTS
   ========================================================================== */

// POST /api/bulk-orders
app.post('/api/bulk-orders', async (req: Request, res: Response) => {
  try {
    const { organizationName, contactName, email, phone, quantity, requirements } = req.body;

    if (!organizationName || !contactName || !email || !phone || !quantity || !requirements) {
      return res.status(400).json({ error: 'All bulk inquiry fields are required' });
    }

    const bulkOrder = await prisma.bulkOrder.create({
      data: {
        organizationName: organizationName.trim(),
        contactName: contactName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        quantity: parseInt(quantity),
        requirements: requirements.trim()
      }
    });

    await prisma.notification.create({
      data: {
        title: 'New Bulk Order Inquiry',
        message: `Bulk inquiry from ${organizationName} for Qty ${quantity}.`,
        type: 'SYSTEM'
      }
    });

    return res.json({ message: 'Bulk order inquiry submitted successfully', bulkOrder });
  } catch (error) {
    console.error('Create bulk order error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==========================================================================
   NOTIFICATIONS ENDPOINTS
   ========================================================================== */

// GET /api/notifications
app.get('/api/notifications', authenticate, async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: req.user!.id },
          { userId: null } // Global/Admin alerts
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/notifications/:id/read
app.put('/api/notifications/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read notification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==========================================================================
   RAZORPAY PAYMENTS ENDPOINTS
   ========================================================================== */

// POST /api/payments/create-order
app.post('/api/payments/create-order', authenticate, async (req: Request, res: Response) => {
  try {
    const { items, couponCode } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: 'Missing items in payment request' });
    }

    // Double check stock and compile subtotal
    let subtotal = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Product "${product.name}" is out of stock.` });
      }
      subtotal += product.price * item.quantity;
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
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }

    const finalAmount = Math.max(0, subtotal - discountAmount);

    // Call Razorpay API to generate transaction order
    const options = {
      amount: Math.round(finalAmount * 100), // in paisa
      currency: 'INR',
      receipt: `receipt_order_${crypto.randomBytes(6).toString('hex')}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return res.json({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_sripavanelectronics',
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id
    });

  } catch (error) {
    console.error('Create Razorpay order error:', error);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// POST /api/payments/verify (Signature validation & Order commit)
app.post('/api/payments/verify', authenticate, async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderData) {
      return res.status(400).json({ error: 'Missing payment signature verification parameters' });
    }

    // Verify cryptographic signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_sripavanelectronics';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment signature verification failed. Tampering suspected.' });
    }

    // Resolve details to commit Order to database
    const { items, shippingAddress, couponCode } = orderData;
    const resolvedItems: { productId: string; quantity: number; price: number; gstAmount: number }[] = [];
    let subtotal = 0;
    let totalTax = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ error: 'Items sold out during payment processing.' });
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
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const newOrder = await tx.order.create({
        data: {
          userId: req.user!.id,
          status: 'CONFIRMED',
          totalAmount,
          taxAmount: totalTax,
          discountAmount,
          paymentMethod: 'ONLINE',
          paymentStatus: 'COMPLETED',
          paymentId: razorpay_payment_id,
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
        }
      });

      // 2. Decrement stock
      for (const ri of resolvedItems) {
        await tx.product.update({
          where: { id: ri.productId },
          data: { stock: { decrement: ri.quantity } }
        });
      }

      // 3. Clear DB Cart
      await tx.cartItem.deleteMany({
        where: { userId: req.user!.id }
      });

      return newOrder;
    });

    // Create notifications and triggers
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Payment Confirmed!',
        message: `Your payment of Rs. ${order.totalAmount} for order #${order.id.slice(0,8).toUpperCase()} was successful.`,
        type: 'ORDER'
      }
    });

    console.log(`\n======================================================`);
    console.log(`[WHATSAPP SIMULATOR] To: ${shippingAddress.phone}`);
    console.log(`Message: Sri Pavan Computers - Payment Confirmed! Your order #${order.id.slice(0,8).toUpperCase()} for Rs. ${order.totalAmount} is confirmed! Payment ID: ${razorpay_payment_id}.`);
    console.log(`======================================================\n`);

    return res.json({ message: 'Payment verified and order created successfully', order });

  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ error: 'Internal server error during order creation' });
  }
});


/* ==========================================================================
   ADMIN PORTALS ENDPOINTS (Admin only)
   ========================================================================== */

// GET /api/admin/services
app.get('/api/admin/services', requireAdmin, async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.serviceBooking.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ bookings });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/services/:id
app.put('/api/admin/services/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body; // "SUBMITTED" | "IN_PROGRESS" | "COMPLETED"

    const booking = await prisma.serviceBooking.update({
      where: { id },
      data: { status }
    });

    if (booking.userId) {
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          title: `Repair Status Update`,
          message: `Your service booking for ${booking.deviceType} is now: ${status}.`,
          type: 'SERVICE'
        }
      });
    }

    console.log(`\n======================================================`);
    console.log(`[WHATSAPP SIMULATOR] To: ${booking.mobileNumber}`);
    console.log(`Message: Sri Pavan Computers - Repair Update: Your booking #${booking.id.slice(0,8).toUpperCase()} is now: ${status}!`);
    console.log(`======================================================\n`);

    return res.json({ message: 'Booking status updated successfully', booking });
  } catch (error) {
    console.error('Update booking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/quotes
app.get('/api/admin/quotes', requireAdmin, async (req: Request, res: Response) => {
  try {
    const quotes = await prisma.quoteRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ quotes });
  } catch (error) {
    console.error('Fetch quotes error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/quotes/:id
app.put('/api/admin/quotes/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { customPricing, status } = req.body;

    const quote = await prisma.quoteRequest.update({
      where: { id },
      data: {
        customPricing: customPricing !== undefined ? parseFloat(customPricing) : undefined,
        status: status || undefined
      }
    });

    if (quote.userId) {
      await prisma.notification.create({
        data: {
          userId: quote.userId,
          title: `Quote Answered`,
          message: `Your custom quote request has been answered. Custom price: Rs. ${quote.customPricing}.`,
          type: 'SYSTEM'
        }
      });
    }

    return res.json({ message: 'Quote updated successfully', quote });
  } catch (error) {
    console.error('Update quote error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/bulk-orders
app.get('/api/admin/bulk-orders', requireAdmin, async (req: Request, res: Response) => {
  try {
    const bulkOrders = await prisma.bulkOrder.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ bulkOrders });
  } catch (error) {
    console.error('Fetch bulk orders error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/coupons
app.post('/api/admin/coupons', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiresAt } = req.body;

    if (!code || !discountType || !discountValue || !expiresAt) {
      return res.status(400).json({ error: 'Required coupon details missing' });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return res.status(400).json({ error: `Coupon code "${cleanCode}" already exists` });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        expiresAt: new Date(expiresAt)
      }
    });

    return res.json({ message: 'Coupon created successfully', coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/coupons
app.get('/api/admin/coupons', requireAdmin, async (req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ coupons });
  } catch (error) {
    console.error('Fetch coupons error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/coupons/:id
app.delete('/api/admin/coupons/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.coupon.delete({ where: { id } });
    return res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/categories
app.get('/api/admin/categories', requireAdmin, async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json({ categories });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/categories
app.post('/api/admin/categories', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, slug, image } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Category name and slug are required' });
    }

    const cleanSlug = slug.toLowerCase().trim();
    const existing = await prisma.category.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return res.status(400).json({ error: `Slug "${cleanSlug}" is already taken` });
    }

    const category = await prisma.category.create({
      data: { name: name.trim(), slug: cleanSlug, image }
    });
    return res.json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/categories/:id
app.put('/api/admin/categories/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, slug, image } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (slug && slug !== existing.slug) {
      const slugCheck = await prisma.category.findUnique({ where: { slug } });
      if (slugCheck) {
        return res.status(400).json({ error: `Slug "${slug}" already exists` });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug, image }
    });
    return res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/categories/:id
app.delete('/api/admin/categories/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.category.delete({ where: { id } });
    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==========================================================================
   SITEMAP & ROBOTS.TXT
   ========================================================================== */

// GET /sitemap.xml
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({ where: { status: 'ACTIVE' }, select: { id: true, updatedAt: true } });
    const categories = await prisma.category.findMany({ select: { slug: true, updatedAt: true } });

    res.header('Content-Type', 'application/xml');
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Add static pages
    xml += `  <url>\n    <loc>http://localhost:4200/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>http://localhost:4200/products</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>http://localhost:4200/pc-builder</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>http://localhost:4200/services/book</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;

    // Add categories
    for (const cat of categories) {
      xml += `  <url>\n    <loc>http://localhost:4200/products?category=${cat.slug}</loc>\n    <lastmod>${cat.updatedAt.toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    // Add products
    for (const prod of products) {
      xml += `  <url>\n    <loc>http://localhost:4200/products/${prod.id}</loc>\n    <lastmod>${prod.updatedAt.toISOString().split('T')[0]}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;
    return res.send(xml);
  } catch (error) {
    return res.status(500).send('Error generating sitemap');
  }
});


/* ==========================================================================
   ADMIN ANALYTICS (Admin only)
   ========================================================================== */

app.get('/api/admin/analytics', requireAdmin, async (req: Request, res: Response) => {
  try {
    const ordersCount = await prisma.order.count();
    const productsCount = await prisma.product.count();
    const customersCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const serviceRequestsCount = await prisma.serviceBooking.count();

    const orders = await prisma.order.findMany({
      where: { NOT: { status: 'CANCELLED' } }
    });

    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lte: 5 } },
      include: { category: true, brand: true }
    });

    const orderItems = await prisma.orderItem.findMany({
      include: { product: { include: { category: true } } }
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

    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true, email: true } } }
    });

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
          createdAt: { gte: startOfDay, lte: endOfDay },
          NOT: { status: 'CANCELLED' }
        }
      });

      const revenue = dailyOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      salesTrend.push({ date: dateString, revenue, orders: dailyOrders.length });
    }

    return res.json({
      aggregates: { totalSales, ordersCount, productsCount, customersCount, serviceRequestsCount },
      lowStockProducts,
      categorySales,
      recentOrders,
      salesTrend
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /api/health - Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'UP', database: 'CONNECTED', timestamp: new Date() });
  } catch (error: any) {
    return res.status(500).json({ status: 'DOWN', database: 'DISCONNECTED', error: error.message || error });
  }
});

// Mount Modular ERP & PC Builder Routers
app.use('/api/admin', authenticate, vendorRouter);
app.use('/api/admin', authenticate, expenseRouter);
app.use('/api', optionalAuthenticate, warrantyRouter);
app.use('/api/admin', authenticate, amcRouter);
app.use('/api', optionalAuthenticate, pcBuilderRouter);

// GET /api/admin/audit-logs - Fetch latest audit logs
app.get('/api/admin/audit-logs', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return res.json({ logs });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/notifications/whatsapp-logs - Fetch latest WhatsApp logs
app.get('/api/admin/notifications/whatsapp-logs', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const logs = await prisma.notificationLog.findMany({
      where: { channel: 'WHATSAPP' },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return res.json({ logs });
  } catch (error) {
    console.error('Fetch whatsapp logs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[Express Server] API running on http://localhost:${PORT}`);
});
