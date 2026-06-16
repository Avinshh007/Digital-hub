// server/pcbuilder.ts
import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { logAudit } from './audit';

export const pcBuilderRouter = Router();

// Middleware to authenticate user if available, but allow guest saves (optional)
const optionalAuthenticate = (req: Request, res: Response, next: any) => {
  next();
};

// 1. Save PC Configuration
pcBuilderRouter.post('/pc-builder/save', async (req: Request, res: Response) => {
  try {
    const { name, cpuId, motherboardId, ramId, gpuId, storageId, psuId, caseId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required to save build.' });
    }

    const userId = req.user?.id || null;

    const build = await prisma.savedBuild.create({
      data: {
        name,
        userId,
        cpuId: cpuId || null,
        motherboardId: motherboardId || null,
        ramId: ramId || null,
        gpuId: gpuId || null,
        storageId: storageId || null,
        psuId: psuId || null,
        caseId: caseId || null
      }
    });

    if (userId) {
      await logAudit(userId, req.user!.email, 'PC_BUILD_SAVE', build, req.ip);
    }
    return res.json({ message: 'PC configuration saved successfully', build });
  } catch (error) {
    console.error('Save PC build error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Fetch User's Saved PC Configurations
pcBuilderRouter.get('/pc-builder/my-builds', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const builds = await prisma.savedBuild.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(builds);
  } catch (error) {
    console.error('Fetch user builds error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Load PC Configuration by ID
pcBuilderRouter.get('/pc-builder/load/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const build = await prisma.savedBuild.findUnique({
      where: { id }
    });

    if (!build) {
      return res.status(404).json({ error: 'Saved PC build configuration not found' });
    }

    // Retrieve full product specs for each part
    const partIds = [
      build.cpuId,
      build.motherboardId,
      build.ramId,
      build.gpuId,
      build.storageId,
      build.psuId,
      build.caseId
    ].filter(Boolean) as string[];

    const products = await prisma.product.findMany({
      where: { id: { in: partIds } },
      include: { category: true, brand: true }
    });

    return res.json({ build, products });
  } catch (error) {
    console.error('Load PC build error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Fetch Dynamic Bundles (Gaming, Office, Printer Packages)
pcBuilderRouter.get('/bundles', async (req: Request, res: Response) => {
  try {
    const activeProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { category: true, brand: true }
    });

    // Simple matching rules to construct bundles dynamically from current stock
    const findProduct = (categorySlug: string, minPrice = 0) => {
      return activeProducts.find(p => p.category?.slug === categorySlug && p.price >= minPrice && p.stock > 0);
    };

    const bundles = [];

    // Bundle A: Gaming Package
    const gamingCpu = findProduct('processors', 15000);
    const gamingGpu = findProduct('graphics-cards', 20000);
    const gamingMb = findProduct('motherboards', 8000);
    const gamingRam = findProduct('memory', 4000);
    
    if (gamingCpu && gamingGpu && gamingMb) {
      const items = [gamingCpu, gamingGpu, gamingMb];
      if (gamingRam) items.push(gamingRam);
      
      const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
      const discountPrice = Math.round(totalPrice * 0.90); // 10% Bundle Discount

      bundles.push({
        id: 'gaming-bundle',
        name: 'Ultimate Gaming Bundle',
        description: 'High performance CPU, Graphics card, motherboard and memory package with a 10% discount!',
        price: discountPrice,
        originalPrice: totalPrice,
        items
      });
    }

    // Bundle B: Office Starter Bundle
    const officeCpu = findProduct('processors', 5000);
    const officeMb = findProduct('motherboards', 4000);
    const officeRam = findProduct('memory', 2000);
    
    if (officeCpu && officeMb) {
      const items = [officeCpu, officeMb];
      if (officeRam) items.push(officeRam);
      
      const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
      const discountPrice = Math.round(totalPrice * 0.92); // 8% discount

      bundles.push({
        id: 'office-bundle',
        name: 'Office Station Bundle',
        description: 'Complete basic processor, motherboard, and RAM set to power up your office workstation.',
        price: discountPrice,
        originalPrice: totalPrice,
        items
      });
    }

    // Bundle C: Essential Printer Bundle
    const printer = findProduct('printers');
    const paper = findProduct('accessories'); // fallback to accessories
    
    if (printer) {
      const items = [printer];
      if (paper) items.push(paper);
      
      const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
      const discountPrice = Math.round(totalPrice * 0.95); // 5% discount

      bundles.push({
        id: 'printer-bundle',
        name: 'Essential Printing Pack',
        description: 'Heavy duty printer bundled with setup accessories to start printing immediately.',
        price: discountPrice,
        originalPrice: totalPrice,
        items
      });
    }

    return res.json(bundles);
  } catch (error) {
    console.error('Fetch bundles error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
