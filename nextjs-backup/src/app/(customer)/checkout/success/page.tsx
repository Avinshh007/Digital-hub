// src/app/(customer)/checkout/success/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SuccessClient from '@/components/customer/SuccessClient';

export const revalidate = 0; // Disable caching

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <Loader2 size={36} className="text-amber-500 animate-spin" />
      </div>
    }>
      <SuccessClient />
    </Suspense>
  );
}
