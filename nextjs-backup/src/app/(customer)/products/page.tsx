// src/app/(customer)/products/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ShopClient from '@/components/customer/ShopClient';

export const revalidate = 0; // Disable static compilation caching

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <Loader2 size={36} className="text-amber-500 animate-spin" />
      </div>
    }>
      <ShopClient />
    </Suspense>
  );
}
