// server/images-pool.ts

// Helper function to calculate a stable numeric hash from a string (DJB2-like)
function getDeterministicIndex(str: string, poolLength: number): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash) % poolLength;
}

// Helper to construct fully optimized, responsive, fast-loading Unsplash CDN URLs
function makeUnsplashUrl(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?w=600&auto=format&fit=crop&q=75`;
}

const LAPTOP_IDS = [
  'photo-1588872657578-7efd1f1555ed', 'photo-1593642632823-8f785ba67e45', 'photo-1618424181497-157f25b6ddd5', 'photo-1517336714731-489689fd1ca8', 'photo-1603302576837-37561b2e2302', 'photo-1541807084-5c52b6b3adef', 'photo-1525547719571-a2d4ac8945e2', 'photo-1587614382346-4ec70e388b28', 'photo-1531297484001-80022131f5a1', 'photo-1488590528505-98d2b5aba04b', 'photo-1504868584819-f8e8b4b6d7e3', 'photo-1499951360447-b19be8fe80f5', 'photo-1611186871348-b1ce696e52c9', 'photo-1580522154071-c6ca47a859ad', 'photo-1542744095-291d1f67b221', 'photo-1516321318423-f06f85e504b3', 'photo-1537498425277-c283d32ef9db', 'photo-1530893609608-32a9af3aa95c', 'photo-1625766763788-95dcce9bf5ac', 'photo-1624705002806-5d72df19c3ad', 'photo-1602080858428-57174f9431cf', 'photo-1585776245991-cf89dd7fc73a', 'photo-1504707748692-419802cf939d', 'photo-1548345680-f5475ea5df84', 'photo-1515378791036-0648a3ef77b2', 'photo-1586717791821-3f44a563fa4c', 'photo-1614741118887-7a4ee193a5fa', 'photo-1629654297299-c8506221ca97', 'photo-1616763355548-1b606f439f86', 'photo-1522071820081-009f0129c71c', 'photo-1627856013091-fed6e4e30025', 'photo-1504639725590-34d0984388bd', 'photo-1550751827-4bd374c3f58b', 'photo-1607604276583-eef5d076aa5f', 'photo-1544244015-0df4b3ffc6b0', 'photo-1563986768609-322da13575f3', 'photo-1560253023-3ec5d502959f', 'photo-1551836022-d5d88e9218df', 'photo-1551288049-bebda4e38f71', 'photo-1556761175-5973dc0f32e7'
];

const DESKTOP_IDS = [
  'photo-1547082299-de196ea013d6', 'photo-1527443224154-c4a3942d3acf', 'photo-1587202372775-e229f172b9d7', 'photo-1593640408182-31c70c8268f5', 'photo-1594909122845-11baa439b7bf', 'photo-1572021335469-31706a17aaef', 'photo-1600132806370-bf17e65e942f', 'photo-1548345680-f5475ea5df84', 'photo-1531403009284-440f080d1e12', 'photo-1598257006458-087169a1f08d', 'photo-1618220179428-22790b461013', 'photo-1616440347437-b1c73416efc2', 'photo-1518770660439-4636190af475', 'photo-1555664424-778a1e5e1b48', 'photo-1562976540-1502c2145186', 'photo-1541029071515-84cc54f84dc5', 'photo-1526374965328-7f61d4dc18c5', 'photo-1504639725590-34d0984388bd', 'photo-1531297484001-80022131f5a1', 'photo-1550751827-4bd374c3f58b', 'photo-1607604276583-eef5d076aa5f', 'photo-1544244015-0df4b3ffc6b0', 'photo-1563986768609-322da13575f3', 'photo-1560253023-3ec5d502959f', 'photo-1551836022-d5d88e9218df', 'photo-1551288049-bebda4e38f71', 'photo-1556761175-5973dc0f32e7'
];

const MONITOR_IDS = [
  'photo-1616763355548-1b606f439f86', 'photo-1527443224154-c4a3942d3acf', 'photo-1585776245991-cf89dd7fc73a', 'photo-1547082299-de196ea013d6', 'photo-1542744095-291d1f67b221', 'photo-1594909122845-11baa439b7bf', 'photo-1572021335469-31706a17aaef', 'photo-1600132806370-bf17e65e942f', 'photo-1616763355548-1b606f439f86', 'photo-1527443224154-c4a3942d3acf', 'photo-1585776245991-cf89dd7fc73a', 'photo-1547082299-de196ea013d6', 'photo-1542744095-291d1f67b221', 'photo-1594909122845-11baa439b7bf', 'photo-1572021335469-31706a17aaef', 'photo-1600132806370-bf17e65e942f', 'photo-1616763355548-1b606f439f86', 'photo-1527443224154-c4a3942d3acf', 'photo-1585776245991-cf89dd7fc73a', 'photo-1547082299-de196ea013d6', 'photo-1542744095-291d1f67b221', 'photo-1594909122845-11baa439b7bf'
];

const KEYBOARD_IDS = [
  'photo-1587829741301-dc798b83add3', 'photo-1618384887929-16ec33fab9ef', 'photo-1595225476474-87563907a212', 'photo-1626908013351-800ddd734b8a', 'photo-1560769629-975ec94e6a86', 'photo-1601445638532-3c6f6c3aa1d6', 'photo-1625948515291-69613efd103f', 'photo-1603481588273-2f908a9a7a1b', 'photo-1547119957-637f8679db1e', 'photo-1583863788434-e58a36330cf0', 'photo-1626908013943-df94de54984c', 'photo-1593640408182-31c70c8268f5', 'photo-1572021335469-31706a17aaef', 'photo-1600132806370-bf17e65e942f', 'photo-1587202372775-e229f172b9d7', 'photo-1588872657578-7efd1f1555ed', 'photo-1517336714731-489689fd1ca8', 'photo-1525547719571-a2d4ac8945e2', 'photo-1587614382346-4ec70e388b28', 'photo-1547082299-de196ea013d6', 'photo-1527443224154-c4a3942d3acf', 'photo-1545454675-3531b543be5d'
];

const MOUSE_IDS = [
  'photo-1615663245857-ac93bb7c39e7', 'photo-1613141411244-0e4ac259d217', 'photo-1527864550417-7fd91fc51a46', 'photo-1586210579191-33b45e38fa2c', 'photo-1611078489935-0cb964de46d6', 'photo-1605773527852-c546a8584ea3', 'photo-1607604276583-eef5d076aa5f', 'photo-1603302576837-37561b2e2302', 'photo-1587614382346-4ec70e388b28', 'photo-1542744095-291d1f67b221', 'photo-1516321318423-f06f85e504b3', 'photo-1537498425277-c283d32ef9db', 'photo-1530893609608-32a9af3aa95c', 'photo-1625766763788-95dcce9bf5ac', 'photo-1624705002806-5d72df19c3ad', 'photo-1602080858428-57174f9431cf', 'photo-1545454675-3531b543be5d', 'photo-1505740420928-5e560c06d30e', 'photo-1618220179428-22790b461013', 'photo-1527443224154-c4a3942d3acf', 'photo-1615663245857-ac93bb7c39e7', 'photo-1613141411244-0e4ac259d217'
];

const PRINTER_IDS = [
  'photo-1612815154858-60aa4c59eaa6', 'photo-1586075010923-2dd4570fb338', 'photo-1569562211093-4ed0d0758f12', 'photo-1579783902614-a3fb3927b6a5', 'photo-1612815154858-60aa4c59eaa6', 'photo-1586075010923-2dd4570fb338', 'photo-1569562211093-4ed0d0758f12', 'photo-1579783902614-a3fb3927b6a5', 'photo-1612815154858-60aa4c59eaa6', 'photo-1586075010923-2dd4570fb338', 'photo-1569562211093-4ed0d0758f12', 'photo-1579783902614-a3fb3927b6a5', 'photo-1612815154858-60aa4c59eaa6', 'photo-1586075010923-2dd4570fb338', 'photo-1569562211093-4ed0d0758f12', 'photo-1579783902614-a3fb3927b6a5', 'photo-1612815154858-60aa4c59eaa6', 'photo-1586075010923-2dd4570fb338', 'photo-1569562211093-4ed0d0758f12', 'photo-1579783902614-a3fb3927b6a5', 'photo-1612815154858-60aa4c59eaa6', 'photo-1586075010923-2dd4570fb338'
];

const STORAGE_IDS = [
  'photo-1616588589676-62b3bd4ff6d2', 'photo-1562408590-e32931084e23', 'photo-1563206767-5b18f218e8de', 'photo-1587831990711-23ca6441447b', 'photo-1544197150-b99a580bb7a8', 'photo-1558494949-ef010cbdcc31', 'photo-1616588589676-62b3bd4ff6d2', 'photo-1562408590-e32931084e23', 'photo-1563206767-5b18f218e8de', 'photo-1587831990711-23ca6441447b', 'photo-1544197150-b99a580bb7a8', 'photo-1558494949-ef010cbdcc31', 'photo-1616588589676-62b3bd4ff6d2', 'photo-1562408590-e32931084e23', 'photo-1563206767-5b18f218e8de', 'photo-1587831990711-23ca6441447b', 'photo-1544197150-b99a580bb7a8', 'photo-1558494949-ef010cbdcc31', 'photo-1616588589676-62b3bd4ff6d2', 'photo-1562408590-e32931084e23', 'photo-1563206767-5b18f218e8de', 'photo-1587831990711-23ca6441447b'
];

const NETWORKING_IDS = [
  'photo-1544197150-b99a580bb7a8', 'photo-1594909122845-11baa439b7bf', 'photo-1563770660941-20978e870e26', 'photo-1558494949-ef010cbdcc31', 'photo-1596524430615-b46475ddff6e', 'photo-1520869562399-e772f042f422', 'photo-1551434678-e076c223a692', 'photo-1518770660439-4636190af475', 'photo-1526374965328-7f61d4dc18c5', 'photo-1598257006458-087169a1f08d', 'photo-1587831990711-23ca6441447b', 'photo-1544244015-0df4b3ffc6b0', 'photo-1563986768609-322da13575f3', 'photo-1551288049-bebda4e38f71', 'photo-1556761175-5973dc0f32e7', 'photo-1581092921461-eab62e97a780', 'photo-1581092160607-ee22621dd758', 'photo-1581091226825-a6a2a5aee158', 'photo-1560253023-3ec5d502959f', 'photo-1544197150-b99a580bb7a8', 'photo-1594909122845-11baa439b7bf', 'photo-1563770660941-20978e870e26'
];

const CPU_IDS = [
  'photo-1591799264318-7e6ef8ddb7ea', 'photo-1591488320449-011701bb6704', 'photo-1607604276583-eef5d076aa5f', 'photo-1518770660439-4636190af475', 'photo-1562976540-1502c2145186', 'photo-1555664424-778a1e5e1b48', 'photo-1587202372775-e229f172b9d7', 'photo-1531403009284-440f080d1e12', 'photo-1544197150-b99a580bb7a8', 'photo-1587831990711-23ca6441447b', 'photo-1550751827-4bd374c3f58b', 'photo-1526374965328-7f61d4dc18c5', 'photo-1535378917042-10a22c95931a', 'photo-1581091226825-a6a2a5aee158', 'photo-1581092921461-eab62e97a780', 'photo-1581092160607-ee22621dd758', 'photo-1581092916357-5896ebc48073', 'photo-1591799264318-7e6ef8ddb7ea', 'photo-1591488320449-011701bb6704', 'photo-1607604276583-eef5d076aa5f', 'photo-1518770660439-4636190af475', 'photo-1562976540-1502c2145186'
];

const MOTHERBOARD_IDS = [
  'photo-1562976540-1502c2145186', 'photo-1518770660439-4636190af475', 'photo-1555664424-778a1e5e1b48', 'photo-1587202372775-e229f172b9d7', 'photo-1531403009284-440f080d1e12', 'photo-1544197150-b99a580bb7a8', 'photo-1587831990711-23ca6441447b', 'photo-1550751827-4bd374c3f58b', 'photo-1526374965328-7f61d4dc18c5', 'photo-1535378917042-10a22c95931a', 'photo-1581091226825-a6a2a5aee158', 'photo-1581092921461-eab62e97a780', 'photo-1581092160607-ee22621dd758', 'photo-1581092916357-5896ebc48073', 'photo-1591799264318-7e6ef8ddb7ea', 'photo-1591488320449-011701bb6704', 'photo-1607604276583-eef5d076aa5f', 'photo-1562976540-1502c2145186', 'photo-1518770660439-4636190af475', 'photo-1555664424-778a1e5e1b48', 'photo-1587202372775-e229f172b9d7', 'photo-1531403009284-440f080d1e12'
];

const RAM_IDS = [
  'photo-1541029071515-84cc54f84dc5', 'photo-1562976540-1502c2145186', 'photo-1587831990711-23ca6441447b', 'photo-1535378917042-10a22c95931a', 'photo-1581092921461-eab62e97a780', 'photo-1541029071515-84cc54f84dc5', 'photo-1562976540-1502c2145186', 'photo-1587831990711-23ca6441447b', 'photo-1535378917042-10a22c95931a', 'photo-1581092921461-eab62e97a780', 'photo-1541029071515-84cc54f84dc5', 'photo-1562976540-1502c2145186', 'photo-1587831990711-23ca6441447b', 'photo-1535378917042-10a22c95931a', 'photo-1581092921461-eab62e97a780', 'photo-1541029071515-84cc54f84dc5', 'photo-1562976540-1502c2145186', 'photo-1587831990711-23ca6441447b', 'photo-1535378917042-10a22c95931a', 'photo-1581092921461-eab62e97a780', 'photo-1541029071515-84cc54f84dc5', 'photo-1562976540-1502c2145186'
];

const GPU_IDS = [
  'photo-1591488320449-011701bb6704', 'photo-1591799264318-7e6ef8ddb7ea', 'photo-1607604276583-eef5d076aa5f', 'photo-1518770660439-4636190af475', 'photo-1562976540-1502c2145186', 'photo-1555664424-778a1e5e1b48', 'photo-1587202372775-e229f172b9d7', 'photo-1531403009284-440f080d1e12', 'photo-1544197150-b99a580bb7a8', 'photo-1587831990711-23ca6441447b', 'photo-1550751827-4bd374c3f58b', 'photo-1526374965328-7f61d4dc18c5', 'photo-1535378917042-10a22c95931a', 'photo-1581091226825-a6a2a5aee158', 'photo-1581092921461-eab62e97a780', 'photo-1581092160607-ee22621dd758', 'photo-1581092916357-5896ebc48073', 'photo-1591488320449-011701bb6704', 'photo-1591799264318-7e6ef8ddb7ea', 'photo-1607604276583-eef5d076aa5f', 'photo-1518770660439-4636190af475', 'photo-1562976540-1502c2145186'
];

const PSU_IDS = [
  'photo-1587202372775-e229f172b9d7', 'photo-1555664424-778a1e5e1b48', 'photo-1531403009284-440f080d1e12', 'photo-1544197150-b99a580bb7a8', 'photo-1562976540-1502c2145186', 'photo-1518770660439-4636190af475', 'photo-1587831990711-23ca6441447b', 'photo-1550751827-4bd374c3f58b', 'photo-1526374965328-7f61d4dc18c5', 'photo-1535378917042-10a22c95931a', 'photo-1581091226825-a6a2a5aee158', 'photo-1581092921461-eab62e97a780', 'photo-1581092160607-ee22621dd758', 'photo-1581092916357-5896ebc48073', 'photo-1591799264318-7e6ef8ddb7ea', 'photo-1591488320449-011701bb6704', 'photo-1607604276583-eef5d076aa5f', 'photo-1587202372775-e229f172b9d7', 'photo-1555664424-778a1e5e1b48', 'photo-1531403009284-440f080d1e12', 'photo-1544197150-b99a580bb7a8', 'photo-1562976540-1502c2145186'
];

const CABINET_IDS = [
  'photo-1587202372775-e229f172b9d7', 'photo-1624705002806-5d72df19c3ad', 'photo-1618220179428-22790b461013', 'photo-1616440347437-b1c73416efc2', 'photo-1518770660439-4636190af475', 'photo-1555664424-778a1e5e1b48', 'photo-1562976540-1502c2145186', 'photo-1541029071515-84cc54f84dc5', 'photo-1526374965328-7f61d4dc18c5', 'photo-1504639725590-34d0984388bd', 'photo-1531297484001-80022131f5a1', 'photo-1550751827-4bd374c3f58b', 'photo-1607604276583-eef5d076aa5f', 'photo-1544244015-0df4b3ffc6b0', 'photo-1563986768609-322da13575f3', 'photo-1560253023-3ec5d502959f', 'photo-1551836022-d5d88e9218df', 'photo-1551288049-bebda4e38f71', 'photo-1556761175-5973dc0f32e7', 'photo-1531403009284-440f080d1e12', 'photo-1598257006458-087169a1f08d', 'photo-1587202372775-e229f172b9d7'
];

const ACCESSORIES_IDS = [
  'photo-1505740420928-5e560c06d30e', 'photo-1618220179428-22790b461013', 'photo-1527443224154-c4a3942d3acf', 'photo-1545454675-3531b543be5d', 'photo-1608043152269-423dbba4e7e1', 'photo-1577174881658-0f30ed549adc', 'photo-1546435770-a3e426bf472b', 'photo-1612444530582-fc66183b16f7', 'photo-1583394838336-acd977736f90', 'photo-1556761175-5973dc0f32e7', 'photo-1551836022-d5d88e9218df', 'photo-1551288049-bebda4e38f71', 'photo-1548345680-f5475ea5df84', 'photo-1531403009284-440f080d1e12', 'photo-1598257006458-087169a1f08d', 'photo-1518770660439-4636190af475', 'photo-1555664424-778a1e5e1b48', 'photo-1505740420928-5e560c06d30e', 'photo-1618220179428-22790b461013', 'photo-1527443224154-c4a3942d3acf', 'photo-1545454675-3531b543be5d', 'photo-1608043152269-423dbba4e7e1'
];

const SPEAKER_IDS = [
  'photo-1606220588913-b3aacb4d2f46', 'photo-1590608897129-79da98d15969', 'photo-1511818966892-d7d671e672a2', 'photo-1613040809024-b4ef7ba99bc3', 'photo-1589003077984-894e133dabab', 'photo-1528642474498-1af0c17fd8c3', 'photo-1582233479366-6d38bc390a08', 'photo-1507679799987-c73779587ccf', 'photo-1487215078519-e21cc028cb29', 'photo-1519751138087-5bf79df62d5b', 'photo-1608043152269-423dbba4e7e1', 'photo-1546435770-a3e426bf472b', 'photo-1545454675-3531b543be5d', 'photo-1505740420928-5e560c06d30e', 'photo-1583394838336-acd977736f90', 'photo-1606220588913-b3aacb4d2f46', 'photo-1590608897129-79da98d15969', 'photo-1511818966892-d7d671e672a2', 'photo-1613040809024-b4ef7ba99bc3', 'photo-1589003077984-894e133dabab', 'photo-1528642474498-1af0c17fd8c3', 'photo-1582233479366-6d38bc390a08'
];

const CHARGER_IDS = [
  'photo-1588508065123-287b28e013da', 'photo-1583863788434-e58a36330cf0', 'photo-1592833159155-c62df1b65634', 'photo-1563206767-5b18f218e8de', 'photo-1625766763788-95dcce9bf5ac', 'photo-1612444530582-fc66183b16f7', 'photo-1583394838336-acd977736f90', 'photo-1588508065123-287b28e013da', 'photo-1583863788434-e58a36330cf0', 'photo-1592833159155-c62df1b65634', 'photo-1563206767-5b18f218e8de', 'photo-1625766763788-95dcce9bf5ac', 'photo-1612444530582-fc66183b16f7', 'photo-1583394838336-acd977736f90', 'photo-1588508065123-287b28e013da', 'photo-1583863788434-e58a36330cf0', 'photo-1592833159155-c62df1b65634', 'photo-1563206767-5b18f218e8de', 'photo-1625766763788-95dcce9bf5ac', 'photo-1612444530582-fc66183b16f7', 'photo-1583394838336-acd977736f90', 'photo-1588508065123-287b28e013da'
];

export function getAutoAssignedImage(
  productName: string,
  brandSlug: string,
  categorySlug: string,
  productId: string,
  sku: string
): string {
  const normName = productName.toLowerCase();
  const normCategory = categorySlug.toLowerCase();

  let photoIds: string[] = ACCESSORIES_IDS;

  // 1. Primary category slug routing
  if (normCategory === 'laptops') {
    photoIds = LAPTOP_IDS;
  } else if (normCategory === 'desktops') {
    photoIds = DESKTOP_IDS;
  } else if (normCategory === 'monitors') {
    photoIds = MONITOR_IDS;
  } else if (normCategory === 'printers') {
    photoIds = PRINTER_IDS;
  } else if (normCategory === 'storage') {
    photoIds = STORAGE_IDS;
  } else if (normCategory === 'networking') {
    photoIds = NETWORKING_IDS;
  } else if (normCategory === 'processors') {
    photoIds = CPU_IDS;
  } else if (normCategory === 'motherboards') {
    photoIds = MOTHERBOARD_IDS;
  } else if (normCategory === 'memory') {
    photoIds = RAM_IDS;
  } else if (normCategory === 'graphics-cards') {
    photoIds = GPU_IDS;
  } else if (normCategory === 'power-supplies') {
    photoIds = PSU_IDS;
  } else if (normCategory === 'cabinets') {
    photoIds = CABINET_IDS;
  } else if (normCategory === 'speakers') {
    photoIds = SPEAKER_IDS;
  } else if (normCategory === 'keyboards-mice') {
    if (normName.includes('keyboard')) {
      photoIds = KEYBOARD_IDS;
    } else if (normName.includes('mouse') || normName.includes('mice')) {
      photoIds = MOUSE_IDS;
    } else {
      photoIds = KEYBOARD_IDS;
    }
  } else if (normCategory === 'chargers' || normCategory === 'adapters' || normCategory === 'accessories') {
    if (normName.includes('charger') || normName.includes('adapter') || normName.includes('power bank') || normName.includes('cable') || normName.includes('power adapter')) {
      photoIds = CHARGER_IDS;
    } else {
      photoIds = ACCESSORIES_IDS;
    }
  } 
  // 2. Generic fallback / missing category name-based keyword routing
  else {
    if (normName.includes('motherboard') || normName.includes('intel h610') || normName.includes('b760') || normName.includes('b550') || normName.includes('b650') || normName.includes('tomahawk')) {
      photoIds = MOTHERBOARD_IDS;
    } else if (normName.includes('ryzen') || normName.includes('intel core') || normName.includes('processor') || normName.includes('cpu') || normName.includes('i5-') || normName.includes('i7-') || normName.includes('i9-') || normName.includes('7800x3d') || normName.includes('5600x') || normName.includes('7600x')) {
      photoIds = CPU_IDS;
    } else if (normName.includes('ram') || normName.includes('ddr') || normName.includes('memory') || normName.includes('vengeance') || normName.includes('ripjaws')) {
      photoIds = RAM_IDS;
    } else if (normName.includes('gpu') || normName.includes('nvidia') || normName.includes('radeon') || normName.includes('graphics card') || normName.includes('geforce') || normName.includes('rtx') || normName.includes('gtx')) {
      photoIds = GPU_IDS;
    } else if (normName.includes('psu') || normName.includes('power supply') || normName.includes('cv550') || normName.includes('pf450') || normName.includes('rm750') || normName.includes('rm850e')) {
      photoIds = PSU_IDS;
    } else if (normName.includes('cabinet') || normName.includes('case') || normName.includes('mid tower') || normName.includes('lian li') || normName.includes('ant esports')) {
      photoIds = CABINET_IDS;
    } else if (normName.includes('printer') || normName.includes('laserjet') || normName.includes('inktank') || normName.includes('megatank') || normName.includes('pixma') || normName.includes('epson') || normName.includes('copier')) {
      photoIds = PRINTER_IDS;
    } else if (normName.includes('monitor') || normName.includes('display') || normName.includes('screen') || normName.includes('ultragear') || normName.includes('ultrafine') || normName.includes('144hz') || normName.includes('75hz') || normName.includes('240hz')) {
      photoIds = MONITOR_IDS;
    } else if (normName.includes('speaker') || normName.includes('soundbar') || normName.includes('audio') || normName.includes('multimedia speakers') || normName.includes('bluetooth speaker') || normName.includes('jbl') || normName.includes('sony srs') || normName.includes('zebronics')) {
      photoIds = SPEAKER_IDS;
    } else if (normName.includes('charger') || normName.includes('adapter') || normName.includes('power bank') || normName.includes('cable') || normName.includes('power adapter')) {
      photoIds = CHARGER_IDS;
    } else if (normName.includes('ssd') || normName.includes('hdd') || normName.includes('storage') || normName.includes('hard drive') || normName.includes('external hdd') || normName.includes('flash drive') || normName.includes('pen drive') || normName.includes('crucial p3') || normName.includes('nvme') || normName.includes('seagate') || normName.includes('sandisk')) {
      photoIds = STORAGE_IDS;
    } else if (normName.includes('keyboard')) {
      photoIds = KEYBOARD_IDS;
    } else if (normName.includes('mouse') || normName.includes('mice')) {
      photoIds = MOUSE_IDS;
    } else if (normName.includes('router') || normName.includes('switch') || normName.includes('wifi') || normName.includes('tp-link') || normName.includes('netgear') || normName.includes('ethernet')) {
      photoIds = NETWORKING_IDS;
    } else if (normName.includes('laptop')) {
      photoIds = LAPTOP_IDS;
    } else {
      photoIds = ACCESSORIES_IDS;
    }
  }

  const seedString = `${productId}_${sku}_${productName}`;
  const index = getDeterministicIndex(seedString, photoIds.length);
  const selectedPhotoId = photoIds[index];

  return makeUnsplashUrl(selectedPhotoId);
}
