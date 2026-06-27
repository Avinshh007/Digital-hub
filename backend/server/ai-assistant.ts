import { Router, Request, Response } from 'express';
import { prisma } from './db';

export const aiAssistantRouter = Router();

// Store Knowledge Base
const STORE_INFO = {
  timings: " DIGITAL HUB is open Monday to Saturday from 09:30 AM to 9:45 PM. We are closed on Sundays.",
  location: "We are located at Main Road, Kakinada, Andhra Pradesh, India. You can visit us for in-store purchases and expert computer diagnostics/repair.",
  contact: "You can reach us by phone at +91 98482 57578, or chat with us directly via our WhatsApp widget.",
  services: "We offer professional computer sales, custom gaming/office PC building, hardware repair, software troubleshooting, OS installation, and laptop cleaning services.",
  warranty: "All brand-new products carry official manufacturer warranty (usually 1-5 years depending on the brand). We also offer Extended Warranty and Annual Maintenance Contracts (AMC) for businesses.",
  installation: "Yes, we provide home and office installation services for desktops, printers, and networking equipment in the Kakinada region."
};

// Hardware Knowledge Base
const HARDWARE_KNOWLEDGE = {
  ssd_vs_hdd: "SSD (Solid State Drive) is much faster, more durable, and consumes less power than a traditional HDD (Hard Disk Drive). HDDs are cheaper for storing large amounts of data, but we recommend an SSD for your operating system and software to ensure fast performance. For modern systems, a NVMe M.2 SSD is the standard choice.",
  ram_size: "For basic tasks (web browsing, office documents), 8GB of RAM is sufficient. For multitasking, software development, or casual gaming, 16GB is highly recommended. For heavy programming, video editing, or 4K gaming, 32GB or more is ideal.",
  cpu_choice: "Intel Core processors and AMD Ryzen processors are both excellent. Ryzen is generally preferred for productivity and multi-threaded tasks (like rendering and video editing) and offers great power efficiency. Intel processors are great for gaming and single-core tasks. For programming, either a Core i5/Ryzen 5 or Core i7/Ryzen 7 is recommended.",
  motherboard: "A motherboard connects all components. Key factors to choose one are compatibility with your CPU socket (e.g., LGA1700 for Intel 12th-14th gen, AM4/AM5 for AMD Ryzen) and form factor (ATX, Micro-ATX, Mini-ITX).",
  gpu: "A GPU (Graphics Card) handles rendering. NVIDIA GeForce cards (like RTX series) support DLSS and ray tracing, making them great for gaming and AI workloads. AMD Radeon cards offer excellent raw gaming performance per rupee.",
  storage: "NVMe SSDs connect via PCIe slots and are 5-10x faster than SATA SSDs. If you have budget constraints, a small NVMe SSD for system files paired with a larger HDD for backup data is a common setup."
};

// Help text
const DEFAULT_HELP = "Hello! I am your  DIGITAL HUBSales Assistant. I can help you with:\n" +
  "1. Finding products (e.g., 'Suggest a laptop under ₹50,000' or 'Coding laptop')\n" +
  "2. Technical advice (e.g., 'What's the difference between SSD and HDD?' or 'How much RAM do I need?')\n" +
  "3. Store info (e.g., 'What are your timings?' or 'Do you offer installation?')\n" +
  "4. Inventory checks (e.g., 'Do you have HP laptops in stock?')";

aiAssistantRouter.post('/ai-assistant/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const norm = message.toLowerCase().trim();

    // 1. GREETING CHECK
    if (norm === 'hi' || norm === 'hello' || norm === 'hey' || norm.includes('who are you')) {
      return res.json({
        text: DEFAULT_HELP,
        type: 'general'
      });
    }

    // 2. STORE ASSISTANT INTENT (PHASE 3)
    if (norm.includes('timing') || norm.includes('open') || norm.includes('close') || norm.includes('hours') || norm.includes('sunday')) {
      return res.json({ text: STORE_INFO.timings, type: 'store' });
    }
    if (norm.includes('location') || norm.includes('where') || norm.includes('address') || norm.includes('kakinada') || norm.includes('shop')) {
      return res.json({ text: STORE_INFO.location, type: 'store' });
    }
    if (norm.includes('contact') || norm.includes('phone') || norm.includes('mobile') || norm.includes('call') || norm.includes('number')) {
      return res.json({ text: STORE_INFO.contact, type: 'store' });
    }
    if (norm.includes('service') || norm.includes('repair') || norm.includes('cleaning') || norm.includes('fix')) {
      return res.json({ text: STORE_INFO.services, type: 'store' });
    }
    if (norm.includes('warranty') || norm.includes('guarantee') || norm.includes('amc') || norm.includes('extended warranty')) {
      return res.json({ text: STORE_INFO.warranty, type: 'store' });
    }
    if (norm.includes('install') || norm.includes('setup') || norm.includes('fitting')) {
      return res.json({ text: STORE_INFO.installation, type: 'store' });
    }

    // 3. PRODUCT KNOWLEDGE ASSISTANT INTENT (PHASE 2)
    if (norm.includes('ssd') && norm.includes('hdd')) {
      return res.json({ text: HARDWARE_KNOWLEDGE.ssd_vs_hdd, type: 'knowledge' });
    }
    if (norm.includes('ram') || norm.includes('memory') || norm.includes('8gb') || norm.includes('16gb') || norm.includes('32gb')) {
      if (norm.includes('enough') || norm.includes('need') || norm.includes('size') || norm.includes('how much')) {
        return res.json({ text: HARDWARE_KNOWLEDGE.ram_size, type: 'knowledge' });
      }
    }
    if (norm.includes('processor') || norm.includes('cpu') || norm.includes('ryzen') || norm.includes('intel') || norm.includes('i5') || norm.includes('i7') || norm.includes('i9')) {
      if (norm.includes('difference') || norm.includes('better') || norm.includes('vs') || norm.includes('programming') || norm.includes('coding')) {
        return res.json({ text: HARDWARE_KNOWLEDGE.cpu_choice, type: 'knowledge' });
      }
    }
    if (norm.includes('motherboard') || norm.includes('socket') || norm.includes('compatibility')) {
      return res.json({ text: HARDWARE_KNOWLEDGE.motherboard, type: 'knowledge' });
    }
    if (norm.includes('gpu') || norm.includes('graphics') || norm.includes('nvidia') || norm.includes('rtx') || norm.includes('radeon')) {
      return res.json({ text: HARDWARE_KNOWLEDGE.gpu, type: 'knowledge' });
    }
    if (norm.includes('nvme') || norm.includes('sata') || norm.includes('harddrive')) {
      return res.json({ text: HARDWARE_KNOWLEDGE.storage, type: 'knowledge' });
    }

    // 4. EXTRACT ENTITIES FOR RECOMMENDATION & STOCK (PHASES 1 & 4)
    // Extract Budget
    let maxBudget: number | null = null;
    const budgetMatch = norm.match(/(?:under|below|less than|within|price of|budget of)\s*(?:rs\.?|inr|₹)?\s*([\d,]+)\s*(k)?/i);
    if (budgetMatch) {
      let valStr = budgetMatch[1].replace(/,/g, '');
      let val = parseInt(valStr, 10);
      if (!isNaN(val)) {
        if (budgetMatch[2]) {
          val = val * 1000;
        }
        maxBudget = val;
      }
    }

    // Extract Category
    let categorySlug: string | null = null;
    let categoryKeyword: string | null = null;
    if (norm.includes('laptop')) {
      categorySlug = 'laptops';
      categoryKeyword = 'laptop';
    } else if (norm.includes('desktop') || norm.includes('pc') || norm.includes('computer') || norm.includes('cabinet') || norm.includes('case')) {
      categorySlug = norm.includes('cabinet') || norm.includes('case') ? 'cabinets' : 'desktops';
      categoryKeyword = categorySlug === 'cabinets' ? 'cabinet' : 'desktop';
    } else if (norm.includes('monitor') || norm.includes('display') || norm.includes('screen')) {
      categorySlug = 'monitors';
      categoryKeyword = 'monitor';
    } else if (norm.includes('printer') || norm.includes('copier')) {
      categorySlug = 'printers';
      categoryKeyword = 'printer';
    } else if (norm.includes('ssd') || norm.includes('hdd') || norm.includes('storage') || norm.includes('hard drive') || norm.includes('nvme')) {
      categorySlug = 'storage';
      categoryKeyword = 'storage';
    } else if (norm.includes('router') || norm.includes('wifi') || norm.includes('network') || norm.includes('switch')) {
      categorySlug = 'networking';
      categoryKeyword = 'networking';
    } else if (norm.includes('cpu') || norm.includes('processor') || norm.includes('ryzen') || norm.includes('intel')) {
      categorySlug = 'processors';
      categoryKeyword = 'processor';
    } else if (norm.includes('motherboard')) {
      categorySlug = 'motherboards';
      categoryKeyword = 'motherboard';
    } else if (norm.includes('ram') || norm.includes('memory') || norm.includes('ddr')) {
      categorySlug = 'memory';
      categoryKeyword = 'RAM';
    } else if (norm.includes('gpu') || norm.includes('graphics card') || norm.includes('nvidia') || norm.includes('rtx') || norm.includes('radeon')) {
      categorySlug = 'graphics-cards';
      categoryKeyword = 'graphics card';
    } else if (norm.includes('speaker') || norm.includes('soundbar') || norm.includes('audio')) {
      categorySlug = 'speakers';
      categoryKeyword = 'speaker';
    } else if (norm.includes('keyboard') || norm.includes('mouse') || norm.includes('mice')) {
      categorySlug = 'keyboards-mice';
      categoryKeyword = 'peripherals';
    } else if (norm.includes('charger') || norm.includes('adapter') || norm.includes('cable') || norm.includes('power bank')) {
      categorySlug = 'chargers';
      categoryKeyword = 'chargers';
    }

    // Extract Brand
    let brandName: string | null = null;
    const brands = ['hp', 'asus', 'samsung', 'logitech', 'dell', 'crucial', 'intel', 'amd', 'lenovo', 'tp-link', 'gigabyte', 'corsair', 'msi', 'acer'];
    for (const b of brands) {
      if (norm.includes(b)) {
        brandName = b;
        break;
      }
    }

    // Build DB filters (Read-Only queries)
    const filters: any = {};
    if (categorySlug) {
      filters.category = { slug: categorySlug };
    }
    if (maxBudget) {
      filters.price = { lte: maxBudget };
    }
    if (brandName) {
      filters.brand = { name: { contains: brandName, } };
    }

    // Check if user is asking specifically about stock/availability (Phase 4)
    const isStockCheck = norm.includes('stock') || norm.includes('available') || norm.includes('have in') || norm.includes('how many');

    // Query Products
    const products = await prisma.product.findMany({
      where: filters,
      include: {
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true } }
      },
      take: 8 // Limit results for readability
    });

    if (products.length > 0) {
      let responseText = '';
      if (isStockCheck) {
        responseText = `Here is the current stock status for matching items${maxBudget ? ` under ₹${maxBudget.toLocaleString('en-IN')}` : ''}:\n`;
        products.forEach(p => {
          const availability = p.stock > 0 ? `In Stock (${p.stock} units available)` : 'Out of Stock';
          responseText += `- **${p.name}**: ${availability} - ₹${p.price.toLocaleString('en-IN')}\n`;
        });
      } else {
        // Recommendations response
        responseText = `Based on your request, here are our top recommendations${maxBudget ? ` under ₹${maxBudget.toLocaleString('en-IN')}` : ''}:\n`;
        products.forEach(p => {
          const stockInfo = p.stock > 0 ? 'Available' : 'Out of Stock (pre-order available)';
          responseText += `- **${p.name}** (₹${p.price.toLocaleString('en-IN')}) - [${stockInfo}]\n`;
        });
        if (norm.includes('coding') || norm.includes('programming')) {
          responseText += `\n*Note: For coding, we suggest laptops with Core i5/Ryzen 5 or above and at least 16GB of RAM for seamless compilation and multitasking.*`;
        } else if (norm.includes('gaming')) {
          responseText += `\n*Note: For gaming, a dedicated graphics card (NVIDIA RTX or AMD Radeon) and a fast SSD are key for high frame rates and load times.*`;
        }
      }

      return res.json({
        text: responseText,
        products: products,
        type: isStockCheck ? 'stock' : 'recommendation'
      });
    } else {
      // Fallback response if no specific products matched the filter
      if (categoryKeyword) {
        return res.json({
          text: `We currently do not have any ${categoryKeyword} products in stock matching those exact requirements (budget/brand). Let me know if you would like me to show all available ${categoryKeyword} options or suggest something else!`,
          type: 'general'
        });
      }
    }

    // General Fallback
    return res.json({
      text: "I couldn't quite find a specific product match for that. Could you describe what you're looking for with more details? (e.g., 'laptop under ₹50,000' or ask me about store timings).",
      type: 'general'
    });

  } catch (error) {
    console.error('AI Assistant chat error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
