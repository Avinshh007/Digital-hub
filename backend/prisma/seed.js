// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Clean Database
  await prisma.homepageConfig.deleteMany().catch(() => {});
  await prisma.review.deleteMany().catch(() => {});
  await prisma.orderItem.deleteMany().catch(() => {});
  await prisma.order.deleteMany().catch(() => {});
  await prisma.product.deleteMany().catch(() => {});
  await prisma.category.deleteMany().catch(() => {});
  await prisma.brand.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});
  await prisma.coupon.deleteMany().catch(() => {});

  console.log('Existing database cleaned.');

  // 2. Create Users
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const customerPasswordHash = bcrypt.hashSync('customer123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@sripavan.com',
      passwordHash: adminPasswordHash,
      name: 'Admin - Sri Pavan Computers',
      role: 'ADMIN',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@sripavan.com',
      passwordHash: customerPasswordHash,
      name: 'Avinash',
      role: 'CUSTOMER',
    },
  });

  console.log('Created Users:', { admin: admin.email, customer: customer.email });

  // 3. Create Categories
  const categoriesData = [
    { name: 'Laptops', slug: 'laptops', image: '/uploads/cat_laptops.jpg' },
    { name: 'Desktop Computers', slug: 'desktops', image: '/uploads/cat_desktops.jpg' },
    { name: 'Computer Accessories', slug: 'accessories', image: '/uploads/cat_accessories.jpg' },
    { name: 'Monitors', slug: 'monitors', image: '/uploads/cat_monitors.jpg' },
    { name: 'Printers', slug: 'printers', image: '/uploads/cat_printers.jpg' },
    { name: 'Keyboards & Mice', slug: 'keyboards-mice', image: '/uploads/cat_keyboards_mice.jpg' },
    { name: 'Speakers', slug: 'speakers', image: '/uploads/cat_speakers.jpg' },
    { name: 'Storage Devices', slug: 'storage', image: '/uploads/cat_storage.jpg' },
    { name: 'Networking Equipment', slug: 'networking', image: '/uploads/cat_networking.jpg' },
    { name: 'Other Electronics', slug: 'other-electronics', image: '/uploads/cat_other_electronics.jpg' },
    // PC Configurator Specific Categories
    { name: 'Processors (CPUs)', slug: 'processors', image: '/uploads/cat_processors.jpg' },
    { name: 'Motherboards', slug: 'motherboards', image: '/uploads/cat_motherboards.jpg' },
    { name: 'RAM (Memory)', slug: 'memory', image: '/uploads/cat_memory.jpg' },
    { name: 'Graphics Cards (GPUs)', slug: 'graphics-cards', image: '/uploads/cat_graphics_cards.jpg' },
    { name: 'Power Supplies (PSUs)', slug: 'power-supplies', image: '/uploads/cat_power_supplies.jpg' },
    { name: 'Cabinets (Cases)', slug: 'cabinets', image: '/uploads/cat_cabinets.jpg' },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    categories[cat.slug] = await prisma.category.create({ data: cat });
  }
  console.log(`Created ${Object.keys(categories).length} categories.`);

  // 4. Create Brands
  const brandsData = [
    { name: 'HP', slug: 'hp', logo: '/uploads/brand_hp.png' },
    { name: 'Dell', slug: 'dell', logo: '/uploads/brand_dell.png' },
    { name: 'Lenovo', slug: 'lenovo', logo: '/uploads/brand_lenovo.png' },
    { name: 'Logitech', slug: 'logitech', logo: '/uploads/brand_logitech.png' },
    { name: 'Samsung', slug: 'samsung', logo: '/uploads/brand_samsung.png' },
    { name: 'Kingston', slug: 'kingston', logo: '/uploads/brand_kingston.png' },
    { name: 'TP-Link', slug: 'tp-link', logo: '/uploads/brand_tp_link.png' },
    { name: 'Intel', slug: 'intel', logo: '/uploads/brand_intel.png' },
    { name: 'AMD', slug: 'amd', logo: '/uploads/brand_amd.png' },
    { name: 'MSI', slug: 'msi', logo: '/uploads/brand_msi.png' },
    { name: 'ASUS', slug: 'asus', logo: '/uploads/brand_asus.png' },
    { name: 'Corsair', slug: 'corsair', logo: '/uploads/brand_corsair.png' },
    { name: 'Sri Pavan Custom', slug: 'sri-pavan-custom', logo: '/uploads/brand_spc.png' },
    { name: 'Acer', slug: 'acer', logo: '/uploads/brand_acer.png' },
    { name: 'Apple', slug: 'apple', logo: '/uploads/brand_apple.png' },
    { name: 'LG', slug: 'lg', logo: '/uploads/brand_lg.png' },
    { name: 'Canon', slug: 'canon', logo: '/uploads/brand_canon.png' },
    { name: 'Sony', slug: 'sony', logo: '/uploads/brand_sony.png' },
    { name: 'Seagate', slug: 'seagate', logo: '/uploads/brand_seagate.png' },
    { name: 'Gigabyte', slug: 'gigabyte', logo: '/uploads/brand_gigabyte.png' },
    { name: 'Zebronics', slug: 'zebronics', logo: '/uploads/brand_zebronics.png' },
    { name: 'JBL', slug: 'jbl', logo: '/uploads/brand_jbl.png' },
    { name: 'SanDisk', slug: 'sandisk', logo: '/uploads/brand_sandisk.png' },
    { name: 'Lian Li', slug: 'lian-li', logo: '/uploads/brand_lian_li.png' },
  ];

  const brands = {};
  for (const br of brandsData) {
    brands[br.slug] = await prisma.brand.create({ data: br });
  }
  console.log(`Created ${Object.keys(brands).length} brands.`);

  // 5. Create Coupons
  const couponsData = [
    {
      code: 'SAVE10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 1000,
      expiresAt: new Date('2028-12-31'),
      isActive: true,
    },
    {
      code: 'WELCOME200',
      discountType: 'FIXED',
      discountValue: 200,
      minOrderValue: 1500,
      expiresAt: new Date('2028-12-31'),
      isActive: true,
    },
  ];

  for (const c of couponsData) {
    await prisma.coupon.create({ data: c });
  }
  console.log('Created Coupons.');

  // 6. Create Products
  const productsData = [
    // Laptops
    {
      name: 'HP 15s Ryzen 5 16GB/512GB SSD',
      description: 'Thin and light laptop with AMD Ryzen 5 processor, 16GB RAM, 512GB PCIe NVMe M.2 SSD, 15.6-inch Full HD display, Windows 11 Home, and Microsoft Office. Perfect for students and working professionals.',
      price: 42990,
      originalPrice: 54990,
      stock: 15,
      sku: 'HP-15S-R5-16G',
      gstRate: 18.0,
      categoryId: categories['laptops'].id,
      brandId: brands['hp'].id,
      images: JSON.stringify(['/uploads/prod_hp_laptop_1.jpg']),
      specs: JSON.stringify({
        Processor: 'AMD Ryzen 5 5500U (up to 4.0 GHz)',
        RAM: '16 GB DDR4-3200 MHz',
        Storage: '512 GB PCIe NVMe M.2 SSD',
        Display: '15.6" diagonal, FHD (1920 x 1080), IPS',
        Graphics: 'AMD Radeon Graphics',
        OS: 'Windows 11 Home',
        Weight: '1.69 kg',
        Warranty: '1 Year Manufacturer Warranty'
      }),
      rating: 4.5,
      ratingCount: 12,
    },
    {
      name: 'Dell Inspiron 3520 Intel Core i3 8GB/512GB SSD',
      description: 'Reliable everyday laptop powered by Intel Core i3 12th Gen processor, 8GB DDR4 RAM, 512GB high-speed SSD, and 15.6" 120Hz display for smooth visual performance.',
      price: 33490,
      originalPrice: 44990,
      stock: 8,
      sku: 'DELL-3520-I3-8G',
      gstRate: 18.0,
      categoryId: categories['laptops'].id,
      brandId: brands['dell'].id,
      images: JSON.stringify(['/uploads/prod_dell_laptop_1.jpg']),
      specs: JSON.stringify({
        Processor: 'Intel Core i3-1215U (up to 4.4 GHz, 6 Cores)',
        RAM: '8 GB DDR4',
        Storage: '512 GB M.2 PCIe NVMe SSD',
        Display: '15.6" FHD (1920x1080) 120Hz Refresh Rate',
        Graphics: 'Intel UHD Graphics',
        OS: 'Windows 11 Home + MS Office 2021',
        Weight: '1.65 kg',
        Warranty: '1 Year Manufacturer Warranty'
      }),
      rating: 4.2,
      ratingCount: 8,
    },
    // Desktops (Prebuilt)
    {
      name: 'Sri Pavan Office Desktop PC (Intel Core i5)',
      description: 'Assembled office desktop computer built for multitasking and high performance. Featuring an Intel Core i5 processor, 16GB RAM, and dual storage (SSD + HDD) for speed and storage.',
      price: 24500,
      originalPrice: 32000,
      stock: 5,
      sku: 'SPC-OFFICE-I5',
      gstRate: 18.0,
      categoryId: categories['desktops'].id,
      brandId: brands['sri-pavan-custom'].id,
      images: JSON.stringify(['/uploads/prod_desktop_office.jpg']),
      specs: JSON.stringify({
        Processor: 'Intel Core i5-10400 (up to 4.3 GHz, 6 Cores)',
        RAM: '16 GB DDR4 3200 MHz',
        Storage: '256 GB SSD + 1 TB WD Blue HDD',
        Motherboard: 'H510M Ultra Motherboard',
        Cabinet: 'Zebronics Office Cabinet with 450W SMPS',
        OS: 'Windows 11 Pro Activated',
        Warranty: '2 Years SPC Store Warranty'
      }),
      rating: 4.8,
      ratingCount: 5,
    },

    // 1. Processors (CPUs)
    {
      name: 'Intel Core i5-12400F Processor',
      description: 'Intel 12th Gen Alder Lake processor without integrated graphics. Socket LGA1700. 6 Cores, 12 Threads, up to 4.4 GHz, 18MB Cache. Perfect value gaming processor.',
      price: 10999,
      originalPrice: 15999,
      stock: 10,
      sku: 'CPU-INT-12400F',
      gstRate: 18.0,
      categoryId: categories['processors'].id,
      brandId: brands['intel'].id,
      images: JSON.stringify(['/uploads/parts_cpu_i5.jpg']),
      specs: JSON.stringify({ Socket: 'LGA1700', Cores: '6 Cores / 12 Threads', BaseClock: '2.5 GHz', MaxClock: '4.4 GHz', TDP: '65W', Cache: '18MB' }),
      rating: 4.8,
      ratingCount: 22,
    },
    {
      name: 'AMD Ryzen 5 5600X Processor',
      description: 'AMD Ryzen 5 5000 Series processor. Socket AM4. 6 Cores, 12 Threads, up to 4.6 GHz, 35MB Cache. Exceptional gaming and creation performance.',
      price: 12499,
      originalPrice: 22999,
      stock: 12,
      sku: 'CPU-AMD-5600X',
      gstRate: 18.0,
      categoryId: categories['processors'].id,
      brandId: brands['amd'].id,
      images: JSON.stringify(['/uploads/parts_cpu_5600x.jpg']),
      specs: JSON.stringify({ Socket: 'AM4', Cores: '6 Cores / 12 Threads', BaseClock: '3.7 GHz', MaxClock: '4.6 GHz', TDP: '65W', Cache: '35MB' }),
      rating: 4.7,
      ratingCount: 18,
    },
    {
      name: 'Intel Core i7-13700K Processor',
      description: 'Intel 13th Gen Raptor Lake unlocked processor with UHD Graphics 770. Socket LGA1700. 16 Cores (8 P-Cores + 8 E-Cores), 24 Threads, up to 5.4 GHz. High-end computing beast.',
      price: 33900,
      originalPrice: 45000,
      stock: 6,
      sku: 'CPU-INT-13700K',
      gstRate: 18.0,
      categoryId: categories['processors'].id,
      brandId: brands['intel'].id,
      images: JSON.stringify(['/uploads/parts_cpu_i7.jpg']),
      specs: JSON.stringify({ Socket: 'LGA1700', Cores: '16 Cores / 24 Threads', BaseClock: '3.4 GHz', MaxClock: '5.4 GHz', TDP: '125W', Cache: '30MB' }),
      rating: 4.9,
      ratingCount: 14,
    },
    {
      name: 'AMD Ryzen 7 7800X3D Processor',
      description: 'AMD Ryzen 7 processor featuring 3D V-Cache technology. Socket AM5. 8 Cores, 16 Threads, up to 5.0 GHz. The absolute best gaming CPU on the market.',
      price: 36999,
      originalPrice: 48999,
      stock: 8,
      sku: 'CPU-AMD-7800X3D',
      gstRate: 18.0,
      categoryId: categories['processors'].id,
      brandId: brands['amd'].id,
      images: JSON.stringify(['/uploads/parts_cpu_7800x3d.jpg']),
      specs: JSON.stringify({ Socket: 'AM5', Cores: '8 Cores / 16 Threads', BaseClock: '4.2 GHz', MaxClock: '5.0 GHz', TDP: '120W', Cache: '104MB' }),
      rating: 4.9,
      ratingCount: 31,
    },

    // 2. Motherboards
    {
      name: 'MSI PRO H610M-E DDR4 Motherboard',
      description: 'Budget-friendly Intel H610 chipset motherboard. Socket LGA1700. Supports 12th/13th Gen Intel Processors. Micro-ATX, PCIe 4.0, dual DDR4 slots, M.2 slot.',
      price: 6199,
      originalPrice: 8500,
      stock: 14,
      sku: 'MB-MSI-H610M',
      gstRate: 18.0,
      categoryId: categories['motherboards'].id,
      brandId: brands['msi'].id,
      images: JSON.stringify(['/uploads/parts_mb_h610.jpg']),
      specs: JSON.stringify({ Socket: 'LGA1700', Chipset: 'Intel H610', FormFactor: 'Micro-ATX', RAMType: 'DDR4 Dual Channel', PCIeSlots: '1 x PCIe 4.0 x16', Storage: '1 x M.2 Gen3 Slot' }),
      rating: 4.3,
      ratingCount: 16,
    },
    {
      name: 'Gigabyte B760M DS3H AX DDR5 Motherboard',
      description: 'Feature-packed Intel B760 chipset motherboard. Socket LGA1700. Micro-ATX, DDR5 support, PCIe 4.0, 2x M.2 slots, built-in Wi-Fi 6E & Bluetooth.',
      price: 11990,
      originalPrice: 16000,
      stock: 9,
      sku: 'MB-GB-B760M',
      gstRate: 18.0,
      categoryId: categories['motherboards'].id,
      brandId: brands['sri-pavan-custom'].id,
      images: JSON.stringify(['/uploads/parts_mb_b760.jpg']),
      specs: JSON.stringify({ Socket: 'LGA1700', Chipset: 'Intel B760', FormFactor: 'Micro-ATX', RAMType: 'DDR5 Quad Channel', PCIeSlots: '1 x PCIe 4.0 x16', Storage: '2 x M.2 Gen4 Slots', Wireless: 'Wi-Fi 6E + BT 5.3' }),
      rating: 4.6,
      ratingCount: 10,
    },
    {
      name: 'ASUS Prime B550M-A WiFi II Motherboard',
      description: 'ASUS Prime series AMD B550 chipset motherboard. Socket AM4. Micro-ATX, dual M.2 slots, PCIe 4.0, WiFi 6, Bluetooth, Aura Sync RGB headers.',
      price: 9499,
      originalPrice: 14000,
      stock: 15,
      sku: 'MB-ASUS-B550M',
      gstRate: 18.0,
      categoryId: categories['motherboards'].id,
      brandId: brands['asus'].id,
      images: JSON.stringify(['/uploads/parts_mb_b550.jpg']),
      specs: JSON.stringify({ Socket: 'AM4', Chipset: 'AMD B550', FormFactor: 'Micro-ATX', RAMType: 'DDR4 Quad Channel', PCIeSlots: '1 x PCIe 4.0 x16', Storage: '2 x M.2 slots (1x Gen4, 1x Gen3)', Wireless: 'Wi-Fi 6 + BT 5.2' }),
      rating: 4.5,
      ratingCount: 20,
    },
    {
      name: 'ASUS ROG Strix B650-A Gaming WiFi DDR5 Motherboard',
      description: 'High-end gaming AMD B650 chipset motherboard. Socket AM5. ATX form factor, premium power delivery, PCIe 5.0 M.2 slot, Wi-Fi 6E, beautiful silver/white aesthetics.',
      price: 19890,
      originalPrice: 26500,
      stock: 5,
      sku: 'MB-ROG-B650A',
      gstRate: 18.0,
      categoryId: categories['motherboards'].id,
      brandId: brands['asus'].id,
      images: JSON.stringify(['/uploads/parts_mb_b650.jpg']),
      specs: JSON.stringify({ Socket: 'AM5', Chipset: 'AMD B650', FormFactor: 'ATX', RAMType: 'DDR5 Quad Channel', PCIeSlots: '1 x PCIe 4.0 x16', Storage: '3 x M.2 slots (1x Gen5, 2x Gen4)', Wireless: 'Wi-Fi 6E + BT 5.2' }),
      rating: 4.8,
      ratingCount: 7,
    },

    // 3. Memory (RAM)
    {
      name: 'Corsair Vengeance LPX 16GB DDR4 3200MHz RAM',
      description: 'High performance overclocking DDR4 desktop RAM with pure aluminum heatspreader for faster heat dissipation. 1x16GB module, C16 latency.',
      price: 3299,
      originalPrice: 5500,
      stock: 35,
      sku: 'RAM-COR-16G-D4',
      gstRate: 18.0,
      categoryId: categories['memory'].id,
      brandId: brands['corsair'].id,
      images: JSON.stringify(['/uploads/parts_ram_d4.jpg']),
      specs: JSON.stringify({ Capacity: '16 GB (1 x 16GB)', Speed: '3200 MHz', Type: 'DDR4', Latency: 'CL16-20-20-38', Heatspreader: 'Anodized Aluminum', Voltage: '1.35V' }),
      rating: 4.6,
      ratingCount: 28,
    },
    {
      name: 'G.Skill Ripjaws S5 16GB DDR5 6000MHz RAM',
      description: 'Next-generation DDR5 memory designed for high-end gaming and desktop PCs. Unlocked speeds, low profile design, matte black heatspreader.',
      price: 4999,
      originalPrice: 7500,
      stock: 20,
      sku: 'RAM-GSK-16G-D5',
      gstRate: 18.0,
      categoryId: categories['memory'].id,
      brandId: brands['sri-pavan-custom'].id,
      images: JSON.stringify(['/uploads/parts_ram_d5.jpg']),
      specs: JSON.stringify({ Capacity: '16 GB (1 x 16GB)', Speed: '6000 MHz', Type: 'DDR5', Latency: 'CL36-36-36-96', Heatspreader: 'Aluminum', Voltage: '1.35V' }),
      rating: 4.7,
      ratingCount: 15,
    },

    // 4. Graphics Cards (GPUs)
    {
      name: 'MSI NVIDIA GeForce GTX 1650 D6 Ventus XS 4GB',
      description: 'Perfect budget entry-level graphics card based on NVIDIA Turing architecture. 4GB GDDR6 128-bit memory. Dual fan cooling, no external power connector needed.',
      price: 11490,
      originalPrice: 16500,
      stock: 12,
      sku: 'GPU-MSI-GTX1650',
      gstRate: 18.0,
      categoryId: categories['graphics-cards'].id,
      brandId: brands['msi'].id,
      images: JSON.stringify(['/uploads/parts_gpu_1650.jpg']),
      specs: JSON.stringify({ CoreClock: 'Boost 1620 MHz', Memory: '4GB GDDR6 (12 Gbps)', Bus: '128-bit', Ports: '1x HDMI 2.0b, 1x DisplayPort 1.4, 1x DVI-D', RecommendedPSU: '300W' }),
      rating: 4.4,
      ratingCount: 25,
    },
    {
      name: 'ASUS Dual GeForce RTX 4060 OC Edition 8GB',
      description: 'Features NVIDIA DLSS3, ultra-efficient Ada Lovelace architecture, and full ray tracing. 8GB GDDR6 memory, dual powerful axial-tech fans.',
      price: 28499,
      originalPrice: 38000,
      stock: 8,
      sku: 'GPU-ASUS-RTX4060',
      gstRate: 18.0,
      categoryId: categories['graphics-cards'].id,
      brandId: brands['asus'].id,
      images: JSON.stringify(['/uploads/parts_gpu_4060.jpg']),
      specs: JSON.stringify({ CoreClock: 'Boost 2535 MHz (OC mode)', Memory: '8GB GDDR6 (17 Gbps)', Bus: '128-bit', Ports: '1x HDMI 2.1a, 3x DisplayPort 1.4a', RecommendedPSU: '550W' }),
      rating: 4.8,
      ratingCount: 17,
    },
    {
      name: 'ZOTAC Gaming GeForce RTX 4070 Super Twin Edge 12GB',
      description: 'Epic graphics card powered by Ada Lovelace architecture. 12GB GDDR6X 192-bit. Incredible performance for 1440p gaming and AI generation.',
      price: 58999,
      originalPrice: 72000,
      stock: 4,
      sku: 'GPU-ZOTAC-4070S',
      gstRate: 18.0,
      categoryId: categories['graphics-cards'].id,
      brandId: brands['sri-pavan-custom'].id,
      images: JSON.stringify(['/uploads/parts_gpu_4070.jpg']),
      specs: JSON.stringify({ CoreClock: 'Boost 2475 MHz', Memory: '12GB GDDR6X (21 Gbps)', Bus: '192-bit', Ports: '1x HDMI 2.1a, 3x DisplayPort 1.4a', RecommendedPSU: '650W' }),
      rating: 4.9,
      ratingCount: 9,
    },

    // 5. Power Supplies (PSUs)
    {
      name: 'Deepcool PF450 450W Power Supply',
      description: 'Reliable entry level 450-watt power supply. 80 Plus Standard efficiency certified. 120mm silent fluid dynamic bearing fan, stealth black cables.',
      price: 2399,
      originalPrice: 3500,
      stock: 18,
      sku: 'PSU-DP-PF450',
      gstRate: 18.0,
      categoryId: categories['power-supplies'].id,
      brandId: brands['sri-pavan-custom'].id,
      images: JSON.stringify(['/uploads/parts_psu_pf450.jpg']),
      specs: JSON.stringify({ Wattage: '450 Watts', Certification: '80 Plus Standard', FanSize: '120mm Silent Fan', Connectors: '1x 24-Pin, 1x EPS 8-Pin, 1x PCIe 6+2 Pin, 6x SATA' }),
      rating: 4.2,
      ratingCount: 11,
    },
    {
      name: 'Corsair CV550 550W 80+ Bronze Power Supply',
      description: 'Corsair CV Series power supplies are perfect for powering your new home or office PC. 80 Plus Bronze certification ensures high efficiency delivery.',
      price: 3999,
      originalPrice: 5200,
      stock: 15,
      sku: 'PSU-COR-CV550',
      gstRate: 18.0,
      categoryId: categories['power-supplies'].id,
      brandId: brands['corsair'].id,
      images: JSON.stringify(['/uploads/parts_psu_cv550.jpg']),
      specs: JSON.stringify({ Wattage: '550 Watts', Certification: '80 Plus Bronze', FanSize: '120mm Thermally Controlled', Connectors: '1x 24-Pin, 1x EPS 8-Pin, 2x PCIe 6+2 Pin, 7x SATA' }),
      rating: 4.5,
      ratingCount: 23,
    },
    {
      name: 'Corsair RM750e 750W 80+ Gold Modular PSU',
      description: 'Fully modular, low-noise power supply. 80 Plus Gold certified. ATX 3.0 & PCIe 5.0 compatible. Supports modern graphics cards like RTX 4070/4080.',
      price: 8990,
      originalPrice: 12500,
      stock: 8,
      sku: 'PSU-COR-RM750E',
      gstRate: 18.0,
      categoryId: categories['power-supplies'].id,
      brandId: brands['corsair'].id,
      images: JSON.stringify(['/uploads/parts_psu_rm750.jpg']),
      specs: JSON.stringify({ Wattage: '750 Watts', Certification: '80 Plus Gold', Modular: 'Fully Modular', Cabling: 'ATX 3.0 & PCIe 5.0 (12VHPWR Cable included)', FanSize: '120mm Rifle Bearing' }),
      rating: 4.8,
      ratingCount: 16,
    },

    // 6. Cabinets (Cases)
    {
      name: 'Ant Esports ICE-100 Mid Tower Cabinet',
      description: 'Affordable mid-tower cabinet with mesh front panel for high airflow. Pre-installed 3x 120mm auto-RGB front fans and 1x 120mm rear black fan. Tempered glass side panel.',
      price: 2990,
      originalPrice: 4200,
      stock: 14,
      sku: 'CAB-AE-ICE100',
      gstRate: 18.0,
      categoryId: categories['cabinets'].id,
      brandId: brands['sri-pavan-custom'].id,
      images: JSON.stringify(['/uploads/parts_cab_ice100.jpg']),
      specs: JSON.stringify({ FormFactor: 'Mid Tower', MotherboardSupport: 'ATX, Micro-ATX, Mini-ITX', SidePanel: 'Tempered Glass', PreinstalledFans: '3 x 120mm RGB (Front), 1 x 120mm (Rear)', DustFilters: 'Magnetic Top Filter' }),
      rating: 4.3,
      ratingCount: 19,
    },
    {
      name: 'MSI MAG Forge 112R ARGB Cabinet',
      description: 'Stunning premium gaming case. Mesh front panel, tempered glass tool-less side panel, pre-installed 4x 120mm ARGB fans with hub, supporting motherboard sync controls.',
      price: 4699,
      originalPrice: 6500,
      stock: 10,
      sku: 'CAB-MSI-FORGE112',
      gstRate: 18.0,
      categoryId: categories['cabinets'].id,
      brandId: brands['msi'].id,
      images: JSON.stringify(['/uploads/parts_cab_msi.jpg']),
      specs: JSON.stringify({ FormFactor: 'Mid Tower', MotherboardSupport: 'ATX, Micro-ATX, Mini-ITX', SidePanel: 'Tempered Glass', PreinstalledFans: '4 x 120mm ARGB Fans included', RGBHub: 'Control Board + Sync Cable' }),
      rating: 4.6,
      ratingCount: 14,
    },

    // 7. Storage
    {
      name: 'Crucial P3 1TB PCIe M.2 NVMe SSD',
      description: 'High speed Solid State Drive delivering loading and boot times that are 6x faster than SATA drives and 22x faster than HDDs.',
      price: 5499,
      originalPrice: 8500,
      stock: 22,
      sku: 'SSD-CRU-P3-1TB',
      gstRate: 18.0,
      categoryId: categories['storage'].id,
      brandId: brands['sri-pavan-custom'].id,
      images: JSON.stringify(['/uploads/parts_ssd_p3.jpg']),
      specs: JSON.stringify({ Capacity: '1 TB', FormFactor: 'M.2 2280', Interface: 'NVMe PCIe Gen 3.0 x4', ReadSpeed: 'Up to 3500 MB/s', WriteSpeed: 'Up to 3000 MB/s', Warranty: '5 Years Warranty' }),
      rating: 4.7,
      ratingCount: 25,
    },

    // 8. Custom PC Assembly & Testing Service (Special Item)
    {
      name: 'Custom PC Assembly & Testing Service',
      description: 'Professional desktop components assembly, neat cable management, BIOS flashing, hardware stress testing, and OS driver installation by certified Sri Pavan Computers technicians.',
      price: 999,
      originalPrice: 2000,
      stock: 999,
      sku: 'SPC-ASSY-SRV',
      gstRate: 18.0,
      categoryId: categories['accessories'].id,
      brandId: brands['sri-pavan-custom'].id,
      images: JSON.stringify(['/uploads/assy_service.jpg']),
      specs: JSON.stringify({ Service: 'Assembled & Tested', Scope: 'Cabinet Assembly, Thermal Pasting, Cable Management, 24-hr Stress Test, BIOS Update', Timeframe: '24-48 Hours' }),
      rating: 5.0,
      ratingCount: 99,
    },

    // Original items remaining
    {
      name: 'Dell 65W Laptop Charger Adapter',
      description: 'Genuine Dell 65-Watt AC Adapter power charger for Dell Inspiron and Vostro series laptops. Features over-voltage and short-circuit protection.',
      price: 1299,
      originalPrice: 2200,
      stock: 20,
      sku: 'DELL-CH-65W',
      gstRate: 18.0,
      categoryId: categories['accessories'].id,
      brandId: brands['dell'].id,
      images: JSON.stringify(['/uploads/prod_dell_charger.jpg']),
      specs: JSON.stringify({ Power: '65 Watts', Output: '19.5V - 3.34A', PinSize: '4.5 mm (Small Pin)', Compatibility: 'Dell Inspiron/Vostro series', Warranty: '1 Year Dell India Warranty' }),
      rating: 4.4,
      ratingCount: 15,
    },
    {
      name: 'Samsung 24-inch IPS Borderless Monitor',
      description: 'Sleek borderless monitor from Samsung with IPS Panel, 75Hz refresh rate, AMD FreeSync, and Eye Saver Mode to prevent eye strain during long working hours.',
      price: 7999,
      originalPrice: 13500,
      stock: 12,
      sku: 'SAM-24-IPS-75',
      gstRate: 18.0,
      categoryId: categories['monitors'].id,
      brandId: brands['samsung'].id,
      images: JSON.stringify(['/uploads/prod_samsung_24.jpg']),
      specs: JSON.stringify({ ScreenSize: '24 Inches (60.4 cm)', Resolution: 'FHD (1920 x 1080)', PanelType: 'IPS Panel', RefreshRate: '75 Hz', Ports: '1 x HDMI, 1 x D-Sub (VGA)', Features: 'AMD FreeSync, Flicker Free, Game Mode', Warranty: '3 Years Samsung India Warranty' }),
      rating: 4.6,
      ratingCount: 19,
    },
    {
      name: 'HP Laserjet M1005 Multifunction Mono Printer',
      description: 'Heavy duty, print-scan-copy monochrome laser printer. Highly economical and popular printer choice for offices, internet cafes, and homes.',
      price: 18499,
      originalPrice: 21500,
      stock: 4,
      sku: 'HP-M1005-LASER',
      gstRate: 18.0,
      categoryId: categories['printers'].id,
      brandId: brands['hp'].id,
      images: JSON.stringify(['/uploads/prod_hp_m1005.jpg']),
      specs: JSON.stringify({ PrinterType: 'Laserjet (Monochrome)', Functions: 'Print, Scan, Copy', Cartridge: 'HP 12A Black Laserjet Toner Cartridge', PrintSpeed: 'Up to 14 ppm', PageSizeSupported: 'A4, A5, B5, C5, DL, Postcards', Warranty: '1 Year HP India Warranty' }),
      rating: 4.9,
      ratingCount: 27,
    },
    {
      name: 'Logitech MK220 Wireless Keyboard and Mouse Combo',
      description: 'Compact wireless combo with long battery life, 2.4 GHz wireless connection, and quiet keys. Ideal for both office work and home desktops.',
      price: 1399,
      originalPrice: 1899,
      stock: 30,
      sku: 'LOGI-MK220-COMBO',
      gstRate: 18.0,
      categoryId: categories['keyboards-mice'].id,
      brandId: brands['logitech'].id,
      images: JSON.stringify(['/uploads/prod_logi_combo.jpg']),
      specs: JSON.stringify({ KeyboardLayout: 'QWERTY Compact', Connectivity: '2.4 GHz USB Wireless Receiver', WirelessRange: '10 meters', BatteryLife: '24 Months (Keyboard), 12 Months (Mouse)', SensorResolution: '1000 DPI (Mouse)', Warranty: '3 Years Logitech India Warranty' }),
      rating: 4.3,
      ratingCount: 41,
    },
    {
      name: 'Kingston A400 480GB SATA III 2.5" Internal SSD',
      description: 'Upgrade your desktop or laptop speed with the Kingston A400 SSD. Delivers incredible boot, loading, and transfer speeds compared to standard mechanical hard drives.',
      price: 2899,
      originalPrice: 4500,
      stock: 25,
      sku: 'KNG-A400-480G',
      gstRate: 18.0,
      categoryId: categories['storage'].id,
      brandId: brands['kingston'].id,
      images: JSON.stringify(['/uploads/prod_kingston_ssd.jpg']),
      specs: JSON.stringify({ Capacity: '480 GB', FormFactor: '2.5 Inch (7mm)', Interface: 'SATA Rev. 3.0 (6Gb/s)', ReadSpeed: 'Up to 500MB/s', WriteSpeed: 'Up to 450MB/s', Warranty: '3 Years Kingston Manufacturer Warranty' }),
      rating: 4.7,
      ratingCount: 38,
    },
    {
      name: 'TP-Link Archer C6 Gigabit Dual Band Wi-Fi Router',
      description: 'AC1200 dual-band router delivering speeds up to 867Mbps at 5GHz and 300Mbps at 2.4GHz. Equips 4 external antennas for whole-home Wi-Fi coverage.',
      price: 2499,
      originalPrice: 3999,
      stock: 14,
      sku: 'TP-ARCHER-C6',
      gstRate: 18.0,
      categoryId: categories['networking'].id,
      brandId: brands['tp-link'].id,
      images: JSON.stringify(['/uploads/prod_tplink_router.jpg']),
      specs: JSON.stringify({ WiFiSpeed: 'AC1200 (867 Mbps + 300 Mbps)', Antennas: '4 External Antennas, 1 Internal Antenna', Ports: '4 x Gigabit LAN Ports, 1 x Gigabit WAN Port', Tech: 'MU-MIMO technology, Beamforming', Warranty: '3 Years TP-Link India Warranty' }),
      rating: 4.4,
      ratingCount: 22,
    },
    // Amazon India Products
    {
      name: 'Acer Aspire Lite AMD Ryzen 5 Hexa Core 5500U (16GB/512GB SSD)',
      description: 'Acer Aspire Lite Premium Thin and Light Laptop. Powered by AMD Ryzen 5 5500U, featuring 16GB dual-channel DDR4 RAM, 512GB NVMe SSD, and 15.6-inch Full HD anti-glare display. Sleek metal cover, Windows 11 Home.',
      price: 37990,
      originalPrice: 52990,
      stock: 25,
      sku: 'AMZ-ACER-ASPLITE-R5',
      gstRate: 18.0,
      categoryId: categories['laptops'].id,
      brandId: brands['acer'].id,
      images: JSON.stringify(['/uploads/prod_acer_aspire.jpg']),
      specs: JSON.stringify({
        Processor: 'AMD Ryzen 5 5500U (up to 4.0 GHz, 6 Cores)',
        RAM: '16 GB DDR4 Dual Channel',
        Storage: '512 GB PCIe NVMe M.2 SSD',
        Display: '15.6" Full HD (1920 x 1080) LED IPS',
        Graphics: 'AMD Radeon Graphics',
        OS: 'Windows 11 Home',
        Weight: '1.59 kg',
        Warranty: '1 Year Acer India Warranty'
      }),
      rating: 4.4,
      ratingCount: 142,
    },
    {
      name: 'Lenovo IdeaPad Slim 3 Intel Core i3 12th Gen (8GB/512GB SSD)',
      description: 'Lenovo IdeaPad Slim 3 15IAU7 everyday thin and light laptop. Featuring 12th Gen Intel Core i3 processor, 8GB DDR4 RAM, 512GB high-speed PCIe Gen4 SSD, and 15.6-inch Full HD display. Includes MS Office 2021.',
      price: 33990,
      originalPrice: 55000,
      stock: 18,
      sku: 'AMZ-LEN-IP3-I3',
      gstRate: 18.0,
      categoryId: categories['laptops'].id,
      brandId: brands['lenovo'].id,
      images: JSON.stringify(['/uploads/prod_lenovo_ideapad.jpg']),
      specs: JSON.stringify({
        Processor: 'Intel Core i3-1215U (up to 4.4 GHz, 6 Cores)',
        RAM: '8 GB DDR4-3200 MHz',
        Storage: '512 GB PCIe 4.0x4 NVMe M.2 SSD',
        Display: '15.6" FHD (1920x1080) IPS 250nits Anti-glare',
        Graphics: 'Intel UHD Graphics',
        OS: 'Windows 11 Home + Office Home & Student 2021',
        Weight: '1.63 kg',
        Warranty: '1 Year Lenovo India Warranty'
      }),
      rating: 4.2,
      ratingCount: 98,
    },
    {
      name: 'Apple MacBook Air Laptop M3 chip (13.6-inch, 8GB/256GB SSD)',
      description: 'The Apple MacBook Air M3 features a supercharged 8-Core CPU and up to 10-Core GPU. Extremely thin and light design, silent fanless architecture, up to 18 hours of battery life, and gorgeous Liquid Retina display.',
      price: 104900,
      originalPrice: 114900,
      stock: 10,
      sku: 'AMZ-APL-MBA-M3',
      gstRate: 18.0,
      categoryId: categories['laptops'].id,
      brandId: brands['apple'].id,
      images: JSON.stringify(['/uploads/prod_apple_macbook.jpg']),
      specs: JSON.stringify({
        Processor: 'Apple M3 Chip (8-Core CPU / 10-Core GPU)',
        RAM: '8 GB Unified Memory',
        Storage: '256 GB PCIe Solid State Drive',
        Display: '13.6" Liquid Retina with True Tone (2560 x 1664)',
        Graphics: 'Apple 10-Core GPU',
        OS: 'macOS Sonoma',
        Weight: '1.24 kg',
        Warranty: '1 Year Apple India Warranty'
      }),
      rating: 4.8,
      ratingCount: 310,
    },
    {
      name: 'ASUS Vivobook 15 Intel Core i5 12th Gen (16GB/512GB SSD)',
      description: 'ASUS Vivobook 15 X1502ZA sleek thin and light laptop. High power Core i5 H-series processor, 16GB dual channel RAM, 512GB PCIe M.2 SSD, 15.6" FHD display, and physical privacy webcam shield.',
      price: 49990,
      originalPrice: 69990,
      stock: 14,
      sku: 'AMZ-ASUS-VV15-I5',
      gstRate: 18.0,
      categoryId: categories['laptops'].id,
      brandId: brands['asus'].id,
      images: JSON.stringify(['/uploads/prod_asus_vivobook.jpg']),
      specs: JSON.stringify({
        Processor: 'Intel Core i5-12500H (up to 4.5 GHz, 12 Cores)',
        RAM: '16 GB DDR4 Dual Channel',
        Storage: '512 GB M.2 NVMe PCIe 3.0 SSD',
        Display: '15.6" FHD (1920 x 1080) 60Hz 16:9 Aspect Ratio',
        Graphics: 'Intel Iris Xe Graphics',
        OS: 'Windows 11 Home + Office H&S 2021',
        Weight: '1.70 kg',
        Warranty: '1 Year ASUS India Warranty'
      }),
      rating: 4.3,
      ratingCount: 65,
    },
    {
      name: 'LG Ultragear Gaming Monitor 24-inch FHD IPS (144Hz, 1ms)',
      description: 'LG Ultragear 24GN650-B gaming monitor. Features Full HD IPS Panel with stunning color accuracy, 144Hz refresh rate, 1ms response time, AMD FreeSync Premium, HDR10, and ergonomic height adjustable stand.',
      price: 12499,
      originalPrice: 18000,
      stock: 15,
      sku: 'AMZ-LG-24GN650',
      gstRate: 18.0,
      categoryId: categories['monitors'].id,
      brandId: brands['lg'].id,
      images: JSON.stringify(['/uploads/prod_lg_ultragear.jpg']),
      specs: JSON.stringify({
        ScreenSize: '24 Inches (60.4 cm)',
        Resolution: 'FHD (1920 x 1080) @ 144Hz',
        PanelType: 'IPS Panel (sRGB 99% Typ.)',
        ResponseTime: '1 ms (GtG at Faster)',
        Ports: '2 x HDMI, 1 x DisplayPort, Headphone Out',
        SyncTech: 'AMD FreeSync Premium, G-Sync Compatible',
        Stand: 'Height, Pivot, Tilt Adjustable',
        Warranty: '3 Years LG India Warranty'
      }),
      rating: 4.6,
      ratingCount: 154,
    },
    {
      name: 'Canon PIXMA MegaTank G3012 WiFi All-in-One Ink Tank Printer',
      description: 'Canon G3012 wireless multi-function color printer. Prints, scans, and copies with high yield ink bottles, low printing cost per page, built-in wireless networking, and mobile printing solutions.',
      price: 13899,
      originalPrice: 17000,
      stock: 10,
      sku: 'AMZ-CAN-G3012',
      gstRate: 18.0,
      categoryId: categories['printers'].id,
      brandId: brands['canon'].id,
      images: JSON.stringify(['/uploads/prod_canon_g3012.jpg']),
      specs: JSON.stringify({
        PrinterType: 'Ink Tank (Color)',
        Functions: 'Print, Scan, Copy',
        Connectivity: 'WiFi, High-Speed USB 2.0, Canon Selphy App',
        PrintSpeed: '8.8 ipm (Black), 5.0 ipm (Color)',
        CostPerPage: '9 Paise (Black), 32 Paise (Color)',
        Warranty: '1 Year or 30,000 pages Canon India Warranty'
      }),
      rating: 4.3,
      ratingCount: 210,
    },
    {
      name: 'Sony SRS-XB100 Wireless Ultra-Portable Speaker',
      description: 'Sony SRS-XB100 compact Bluetooth speaker. Delivers powerful, clear sound with Extra Bass, up to 16 hours battery life, IP67 waterproof & dustproof rating, hands-free call microphone, and eco-friendly design.',
      price: 4490,
      originalPrice: 5990,
      stock: 30,
      sku: 'AMZ-SONY-XB100',
      gstRate: 18.0,
      categoryId: categories['speakers'].id,
      brandId: brands['sony'].id,
      images: JSON.stringify(['/uploads/prod_sony_xb100.jpg']),
      specs: JSON.stringify({
        OutputPower: '5 Watts',
        Connectivity: 'Bluetooth 5.3, Fast Pair, USB-C Charging',
        BatteryLife: 'Up to 16 Hours',
        Protection: 'IP67 Waterproof & Dustproof',
        Features: 'Sound Diffusion Processor, Hands-Free Echo Cancelling Mic',
        Warranty: '1 Year Sony India Warranty'
      }),
      rating: 4.5,
      ratingCount: 88,
    },
    {
      name: 'JBL Flip 6 Portable Waterproof Bluetooth Speaker',
      description: 'JBL Flip 6 wireless portable speaker with powerful 2-way speaker system. Features a racetrack-shaped woofer, separate tweeter, and dual pumping bass radiators. IP67 waterproof/dustproof, up to 12 hours playback.',
      price: 9999,
      originalPrice: 13999,
      stock: 25,
      sku: 'AMZ-JBL-FLIP6',
      gstRate: 18.0,
      categoryId: categories['speakers'].id,
      brandId: brands['jbl'].id,
      images: JSON.stringify(['/uploads/prod_jbl_flip6.jpg']),
      specs: JSON.stringify({
        OutputPower: '30W RMS (20W Woofer + 10W Tweeter)',
        Connectivity: 'Bluetooth 5.1, JBL Portable App',
        BatteryLife: 'Up to 12 Hours',
        Protection: 'IP67 Waterproof & Dustproof',
        Features: 'JBL PartyBoost (Link multiple speakers), Eco-packaging',
        Warranty: '1 Year JBL India Warranty'
      }),
      rating: 4.7,
      ratingCount: 145,
    },
    {
      name: 'Logitech G502 Hero High Performance Wired Gaming Mouse',
      description: 'Logitech G502 Hero premium gaming mouse featuring next-gen HERO 25K optical sensor with zero smoothing/acceleration, 11 programmable buttons, adjustable weights, and LIGHTSYNC customizable RGB lights.',
      price: 4295,
      originalPrice: 9995,
      stock: 40,
      sku: 'AMZ-LOGI-G502',
      gstRate: 18.0,
      categoryId: categories['keyboards-mice'].id,
      brandId: brands['logitech'].id,
      images: JSON.stringify(['/uploads/prod_logi_g502.jpg']),
      specs: JSON.stringify({
        SensorType: 'HERO 25K Optical (100 - 25,600 DPI)',
        Buttons: '11 Programmable Buttons + Hyper-fast Scroll Wheel',
        Cabling: 'Wired USB Braided Cable',
        WeightSystem: 'Adjustable: 5x 3.6g weights included',
        RGB: 'LIGHTSYNC RGB (Motherboard sync)',
        Warranty: '2 Years Logitech India Warranty'
      }),
      rating: 4.6,
      ratingCount: 388,
    },
    {
      name: 'Seagate Expansion 1TB Portable External HDD',
      description: 'Seagate Expansion portable external hard drive. Sleek, compact storage expansion. Drag-and-drop file saving, high speed USB 3.0 connectivity, and instant plug-and-play setup for Windows and macOS.',
      price: 4999,
      originalPrice: 7999,
      stock: 50,
      sku: 'AMZ-SEA-EXP-1TB',
      gstRate: 18.0,
      categoryId: categories['storage'].id,
      brandId: brands['seagate'].id,
      images: JSON.stringify(['/uploads/prod_seagate_1tb.jpg']),
      specs: JSON.stringify({
        Capacity: '1 TB HDD',
        Interface: 'USB 3.0 (Backwards compatible with USB 2.0)',
        Format: 'exFAT (Compatible with Windows & Mac out of box)',
        FormFactor: '2.5 Inch Portable',
        DataRecovery: 'Includes Rescue Data Recovery Services',
        Warranty: '3 Years Seagate India Warranty'
      }),
      rating: 4.4,
      ratingCount: 290,
    },
    {
      name: 'SanDisk Ultra Dual Drive Luxe 128GB Type-C Flash Drive',
      description: 'Premium all-metal 2-in-1 flash drive featuring reversible USB Type-C and traditional Type-A connectors. High-speed USB 3.1 Gen 1 with read speeds up to 150MB/s for fast file transfers between phones, tablets, and PCs.',
      price: 1299,
      originalPrice: 2400,
      stock: 120,
      sku: 'AMZ-SNDK-LUXE-128G',
      gstRate: 18.0,
      categoryId: categories['storage'].id,
      brandId: brands['sandisk'].id,
      images: JSON.stringify(['/uploads/prod_sandisk_128g.jpg']),
      specs: JSON.stringify({
        Capacity: '128 GB',
        Interface: 'USB Type-C & Type-A (USB 3.1 Gen 1)',
        ReadSpeed: 'Up to 150 MB/s',
        Build: 'All-metal swivel housing with keyring loop',
        Warranty: '5 Years SanDisk India Warranty'
      }),
      rating: 4.3,
      ratingCount: 654,
    },
    {
      name: 'TP-Link AC1200 WiFi Range Extender RE300',
      description: 'TP-Link RE300 dual band range extender. Boosts wall-to-wall dual-band WiFi signal up to 1.2Gbps. Creates a seamless OneMesh network with compatible routers, simple setup with smart signal indicator lights.',
      price: 2199,
      originalPrice: 3999,
      stock: 35,
      sku: 'AMZ-TPL-RE300',
      gstRate: 18.0,
      categoryId: categories['networking'].id,
      brandId: brands['tp-link'].id,
      images: JSON.stringify(['/uploads/prod_tplink_re300.jpg']),
      specs: JSON.stringify({
        WiFiSpeed: 'AC1200 (867 Mbps on 5GHz + 300 Mbps on 2.4GHz)',
        Technology: 'OneMesh compatible, Adaptive Path Selection, High Speed Mode',
        Security: 'WPA-PSK / WPA2-PSK',
        Setup: 'Tether App, WPS Button',
        Warranty: '3 Years TP-Link India Warranty'
      }),
      rating: 4.1,
      ratingCount: 112,
    },
    {
      name: 'AMD Ryzen 5 7600X Desktop Processor',
      description: 'AMD Ryzen 5 7000 Series Zen 4 desktop processor. Socket AM5. 6 Cores, 12 Threads, up to 5.3 GHz boost clocks, 38MB Cache. Supports PCIe 5.0 and DDR5 memory. Excellent mid-range gaming CPU.',
      price: 19999,
      originalPrice: 29999,
      stock: 15,
      sku: 'CPU-AMD-7600X',
      gstRate: 18.0,
      categoryId: categories['processors'].id,
      brandId: brands['amd'].id,
      images: JSON.stringify(['/uploads/parts_cpu_7600x.jpg']),
      specs: JSON.stringify({
        Socket: 'AM5',
        Cores: '6 Cores / 12 Threads',
        BaseClock: '4.7 GHz',
        MaxClock: '5.3 GHz',
        TDP: '105W',
        Cache: '38MB (L2 + L3)'
      }),
      rating: 4.8,
      ratingCount: 45,
    },
    {
      name: 'Intel Core i9-14900K Desktop Processor',
      description: 'Intel 14th Gen Raptor Lake Refresh flagship unlocked desktop processor. Socket LGA1700. 24 Cores (8 P-Cores + 16 E-Cores), 32 Threads, up to 6.0 GHz thermal velocity boost. Built for heavy multitasking, gaming, and creator workflows.',
      price: 52999,
      originalPrice: 65000,
      stock: 8,
      sku: 'CPU-INT-14900K',
      gstRate: 18.0,
      categoryId: categories['processors'].id,
      brandId: brands['intel'].id,
      images: JSON.stringify(['/uploads/parts_cpu_14900k.jpg']),
      specs: JSON.stringify({
        Socket: 'LGA1700',
        Cores: '24 Cores / 32 Threads',
        BaseClock: '3.2 GHz',
        MaxClock: '6.0 GHz',
        TDP: '125W (Max Turbo 253W)',
        Cache: '36MB L3 + 32MB L2'
      }),
      rating: 4.9,
      ratingCount: 29,
    },
    {
      name: 'MSI MAG B650 TOMAHAWK WIFI Motherboard',
      description: 'MSI MAG series premium AMD B650 chipset motherboard. Socket AM5. ATX form factor, DDR5 support up to 7600+(OC), Wi-Fi 6E, 2.5G LAN, 3x M.2 slots with Shield Frozr, and 80A Smart Power Stage VRM delivery.',
      price: 22990,
      originalPrice: 30000,
      stock: 12,
      sku: 'MB-MSI-B650-TOMAHAWK',
      gstRate: 18.0,
      categoryId: categories['motherboards'].id,
      brandId: brands['msi'].id,
      images: JSON.stringify(['/uploads/parts_mb_b650_tomahawk.jpg']),
      specs: JSON.stringify({
        Socket: 'AM5',
        Chipset: 'AMD B650',
        FormFactor: 'ATX',
        RAMType: 'DDR5 Quad Channel (Max 192GB)',
        PCIeSlots: '1x PCIe 4.0 x16, 1x PCIe 4.0 x4, 1x PCIe 3.0 x1',
        Storage: '3x M.2 Gen4 Slots, 6x SATA III',
        Wireless: 'Wi-Fi 6E + Bluetooth 5.3, 2.5Gbps LAN'
      }),
      rating: 4.7,
      ratingCount: 34,
    },
    {
      name: 'Gigabyte GeForce RTX 4070 Ti Super Windforce OC 16G',
      description: 'Gigabyte NVIDIA Ada Lovelace architecture RTX 4070 Ti Super graphics card. 16GB GDDR6X 256-bit memory, WINDFORCE cooling system with alternate spinning fans, copper plate GPU touch, and metal backplate.',
      price: 84999,
      originalPrice: 99900,
      stock: 6,
      sku: 'GPU-GB-4070TIS',
      gstRate: 18.0,
      categoryId: categories['graphics-cards'].id,
      brandId: brands['gigabyte'].id,
      images: JSON.stringify(['/uploads/parts_gpu_4070tis.jpg']),
      specs: JSON.stringify({
        CoreClock: 'Boost 2625 MHz (Reference: 2610 MHz)',
        Memory: '16GB GDDR6X (21 Gbps)',
        Bus: '256-bit',
        Ports: '1x HDMI 2.1a, 3x DisplayPort 1.4a',
        RecommendedPSU: '750W (1x 16-pin power connector)'
      }),
      rating: 4.8,
      ratingCount: 18,
    },
    {
      name: 'Corsair RM850e 850W Gold Fully Modular PSU',
      description: 'Corsair RM850e fully modular low-noise power supply. 80 Plus Gold certified efficiency. ATX 3.0 & PCIe 5.0 compliant, supporting modern high-end graphics cards with native 12VHPWR cable. 120mm rifle bearing fan.',
      price: 10499,
      originalPrice: 15000,
      stock: 16,
      sku: 'PSU-COR-RM850E',
      gstRate: 18.0,
      categoryId: categories['power-supplies'].id,
      brandId: brands['corsair'].id,
      images: JSON.stringify(['/uploads/parts_psu_rm850e.jpg']),
      specs: JSON.stringify({
        Wattage: '850 Watts',
        Certification: '80 Plus Gold',
        Modular: 'Fully Modular',
        Standards: 'ATX 3.0 & PCIe 5.0 (12VHPWR Cable included)',
        Fan: '120mm Rifle Bearing, Zero RPM Fan Mode'
      }),
      rating: 4.7,
      ratingCount: 52,
    },
    {
      name: 'Lian Li O11 Dynamic EVO Black Mid Tower Cabinet',
      description: 'Lian Li O11D EVO modular dual-chamber mid-tower chassis. Stunning seamless tempered glass panels (front + side), supporting multi-directional GPU mounting, top/bottom/side radiator mounting, and premium cable management.',
      price: 14990,
      originalPrice: 19000,
      stock: 10,
      sku: 'CAB-LL-O11D-EVO',
      gstRate: 18.0,
      categoryId: categories['cabinets'].id,
      brandId: brands['lian-li'].id,
      images: JSON.stringify(['/uploads/parts_cab_o11d_evo.jpg']),
      specs: JSON.stringify({
        FormFactor: 'Mid Tower / Dual Chamber',
        MotherboardSupport: 'E-ATX, ATX, Micro-ATX, Mini-ITX',
        SidePanel: 'Tempered Glass Front and Side',
        PreinstalledFans: 'None included (Designed for custom fan layouts)',
        RadiatorSupport: 'Up to 360mm (Top, Side, or Bottom)'
      }),
      rating: 4.9,
      ratingCount: 39,
    },
    {
      name: 'Zebronics Zeb-Warrior 2.0 Multimedia Speakers',
      description: 'Zebronics Zeb-Warrior 2.0 USB powered desktop speakers. Designed with breathing RGB LED lights, volume control dial on cable, and dual 5W drivers delivering crisp audio for computers and laptops.',
      price: 699,
      originalPrice: 999,
      stock: 75,
      sku: 'AMZ-ZEB-WARRIOR',
      gstRate: 18.0,
      categoryId: categories['speakers'].id,
      brandId: brands['zebronics'].id,
      images: JSON.stringify(['/uploads/prod_zeb_warrior.jpg']),
      specs: JSON.stringify({
        OutputPower: '10W RMS (5W x 2)',
        Connectivity: 'USB Power + 3.5mm Aux input jack',
        Controls: 'Rotary volume control on cord',
        Lighting: 'Breathing RGB LED lights',
        Warranty: '1 Year Zebronics India Warranty'
      }),
      rating: 4.2,
      ratingCount: 1541,
    }
  ];

  const products = [];
  for (const prodData of productsData) {
    const prod = await prisma.product.create({ data: prodData });
    products.push(prod);
  }
  console.log(`Created ${products.length} products.`);

  // 7. Seed Reviews
  await prisma.review.create({
    data: {
      productId: products[0].id, // HP Laptop
      userId: customer.id,
      userName: customer.name,
      rating: 5,
      comment: 'Excellent laptop! Extremely fast booting and good battery backup. Sri Pavan Computers also helped me set it up and gave a free laptop sleeve. Highly recommended shop!',
    },
  });

  // 8. Create Homepage Configuration
  const heroBanners = [
    {
      imageUrl: '/uploads/hero_banner.jpg',
      title: 'Sri Pavan Computers',
      subtitle: 'Premium Electronics & Computer Repair Store at Best Prices',
      linkUrl: '/products',
    },
    {
      imageUrl: '/uploads/banner_laptops.jpg',
      title: 'Upgrade to High Performance Laptops',
      subtitle: 'Up to 30% OFF on Top Brands like HP, Dell, and Lenovo',
      linkUrl: '/products?category=laptops',
    },
  ];

  const featuredCategories = ['laptops', 'desktops', 'monitors', 'storage'];
  const featuredProducts = [products[0].id, products[2].id, products[3].id, products[13].id]; // Laptop, Desktop, CPU, GPU

  await prisma.homepageConfig.create({
    data: {
      id: 'singleton',
      heroBanners: JSON.stringify(heroBanners),
      featuredCategories: JSON.stringify(featuredCategories),
      featuredProducts: JSON.stringify(featuredProducts),
    },
  });

  console.log('Created Homepage Config.');

  // 9. Ensure all product images exist in public/uploads
  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(__dirname, '../public/uploads');
  const sourceImage = path.join(uploadsDir, 'cat_accessories.jpg');

  if (fs.existsSync(sourceImage)) {
    console.log('Ensuring all product images exist...');
    for (const prod of productsData) {
      try {
        const imageList = JSON.parse(prod.images);
        for (const imgPath of imageList) {
          if (imgPath.startsWith('/uploads/')) {
            const destPath = path.join(__dirname, '../public', imgPath);
            if (!fs.existsSync(destPath)) {
              fs.copyFileSync(sourceImage, destPath);
              console.log(`Created image file: ${imgPath}`);
            }
          }
        }
      } catch (err) {
        console.error(`Failed to handle image for product ${prod.name}:`, err);
      }
    }
  } else {
    console.warn('Source image cat_accessories.jpg not found. Skipping image generation.');
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
