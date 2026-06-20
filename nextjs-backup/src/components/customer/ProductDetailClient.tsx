// src/components/customer/ProductDetailClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart, ShoppingCart, Star, MessageCircle, ShieldCheck, CheckCircle2, AlertTriangle, Send
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import ProductCard from './ProductCard';

interface ProductDetailClientProps {
  product: any;
  relatedProducts: any[];
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { t } = useLanguage();

  // Images setup
  let imageList: string[] = ['/uploads/hero_banner.jpg'];
  try {
    const parsed = JSON.parse(product.images);
    if (Array.isArray(parsed) && parsed.length > 0) imageList = parsed;
  } catch (e) {
    console.error(e);
  }
  const [activeImage, setActiveImage] = useState(imageList[0]);

  // Specs setup
  let specsObj: { [key: string]: string } = {};
  try {
    specsObj = JSON.parse(product.specs);
  } catch (e) {
    console.error(e);
  }

  // Counter
  const [quantity, setQuantity] = useState(1);
  const outOfStock = product.stock <= 0;

  // Track session for reviews
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewsList, setReviewsList] = useState<any[]>(product.reviews || []);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    // Check user session
    const fetchUser = async () => {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
      }
    };
    fetchUser();

    // Log to recently viewed
    const viewed = localStorage.getItem('recently_viewed');
    let viewedIds: string[] = [];
    if (viewed) {
      try {
        viewedIds = JSON.parse(viewed) as string[];
      } catch (e) { }
    }
    // Remove if already exists and append to beginning
    viewedIds = viewedIds.filter((id) => id !== product.id);
    viewedIds.unshift(product.id);
    localStorage.setItem('recently_viewed', JSON.stringify(viewedIds.slice(0, 10)));
  }, [product.id]);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: imageList[0],
      stock: product.stock,
      sku: product.sku,
      gstRate: product.gstRate,
    }, quantity);
  };

  const handleWishlistToggle = () => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: imageList[0],
      stock: product.stock,
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setReviewError('Review comment cannot be empty.');
      return;
    }
    setReviewError('');
    setSubmittingReview(true);

    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();
      if (res.ok) {
        setReviewsList([data.review, ...reviewsList]);
        setComment('');
        setRating(5);
        setReviewSuccess(true);
        setTimeout(() => setReviewSuccess(false), 5000);
      } else {
        setReviewError(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      console.error(err);
      setReviewError('An error occurred. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isProductInWishlist = isInWishlist(product.id);

  // Prepopulate WhatsApp text
  const waText = `Hello  DIGITAL HUB,%20I%20am%20interested%20in%20buying:%20\n*${product.name}*\n*Price:* ₹${product.price.toLocaleString('en-IN')}\n*SKU:* ${product.sku}\n\nPlease%20confirm%20availability.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

      {/* Product Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Left Side: Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-white dark:bg-slate-950 border border-border-brand rounded-3xl overflow-hidden flex items-center justify-center relative p-6">
            <img
              src={activeImage}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
            {discount > 0 && (
              <span className="absolute top-5 left-5 bg-emerald-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-md">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails Row */}
          {imageList.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto py-1">
              {imageList.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 border rounded-xl overflow-hidden p-1 bg-white shrink-0 transition-all cursor-pointer ${activeImage === img ? 'border-primary-brand shadow-sm scale-95' : 'border-border-brand hover:border-slate-400'
                    }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Information Details */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">

            {/* Breadcrumb Tags */}
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase">
              <span>{product.brand?.name}</span>
              <span>•</span>
              <span>{product.category?.name}</span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
              {product.name}
            </h1>

            {/* Rating Stars Summary */}
            <div className="flex items-center space-x-2 border-b border-border-brand/40 pb-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < Math.round(product.rating) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {product.rating.toFixed(1)} / 5.0 ({reviewsList.length} customer reviews)
              </span>
            </div>

            {/* Prices & Invoice Notice */}
            <div className="space-y-1 bg-slate-100/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-border-brand/20">
              <div className="flex items-baseline space-x-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-sm sm:text-base text-slate-500 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-brand font-semibold">
                Prices are inclusive of Indian GST (18%). B2B tax invoice available upon request.
              </p>
            </div>

            {/* SKU and Stock level */}
            <div className="flex items-center space-x-4 text-sm font-bold">
              <div className="flex items-center space-x-1">
                <span className="text-muted-brand uppercase">SKU:</span>
                <span className="text-slate-800 dark:text-slate-200">{product.sku}</span>
              </div>
              <div>
                {outOfStock ? (
                  <span className="text-rose-500 flex items-center space-x-1">
                    <AlertTriangle size={16} />
                    <span>{t.outOfStock}</span>
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center space-x-1">
                    <CheckCircle2 size={16} />
                    <span>{t.inStock} ({product.stock} units remaining)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {product.description}
            </p>

          </div>

          {/* Action Counters, Add to Cart & Wishlist */}
          {!outOfStock && (
            <div className="space-y-4 border-t border-border-brand/40 pt-6">

              <div className="flex flex-wrap items-center gap-4">

                {/* Quantity adjustments */}
                <div className="flex items-center border border-border-brand rounded-full bg-card px-2.5 py-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 text-slate-500 hover:text-slate-800 font-extrabold text-lg"
                  >
                    -
                  </button>
                  <span className="px-4 font-black text-sm text-slate-800 dark:text-slate-100">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-1 text-slate-500 hover:text-slate-800 font-extrabold text-lg"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart button */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 min-w-[200px] flex items-center justify-center space-x-2 bg-primary-brand hover:bg-primary-brand-hover text-white font-extrabold py-3.5 px-6 rounded-full shadow-lg hover:shadow-primary-brand/20 transition-all cursor-pointer"
                >
                  <ShoppingCart size={20} />
                  <span>{t.addToCart}</span>
                </button>

                {/* Wishlist Heart button */}
                <button
                  onClick={handleWishlistToggle}
                  className={`p-3.5 border rounded-full transition-all cursor-pointer ${isProductInWishlist
                      ? 'border-rose-200 bg-rose-50 text-rose-500'
                      : 'border-border-brand bg-card hover:text-rose-500 text-slate-600 dark:bg-slate-800'
                    }`}
                  title={isProductInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart size={20} fill={isProductInWishlist ? 'currentColor' : 'none'} />
                </button>

              </div>

              {/* WhatsApp Quick Order button */}
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919900990099'}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-full shadow-md transition-all cursor-pointer text-sm w-full"
              >
                <MessageCircle size={18} className="fill-current" />
                <span>Order via WhatsApp ({t.quickOrderWhatsApp})</span>
              </a>

            </div>
          )}

          {/* Guarantees list */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 border-t border-border-brand/40 pt-4">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck size={16} className="text-amber-500" />
              <span>Genuine Warranty</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 size={16} className="text-amber-500" />
              <span> <KAKINADA></KAKINADA> Local Delivery</span>
            </div>
          </div>

        </div>

      </div>

      {/* Specifications & Reviews Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Specs Column (Left 2/3) */}
        <div className="lg:col-span-2 space-y-4 bg-card text-card-foreground border border-border-brand rounded-3xl p-6 sm:p-8 shadow-xs">
          <h3 className="font-extrabold text-lg uppercase tracking-wide border-b border-border-brand/40 pb-3">
            {t.specifications}
          </h3>

          {Object.keys(specsObj).length > 0 ? (
            <div className="border border-border-brand rounded-2xl overflow-hidden divide-y divide-border-brand">
              {Object.entries(specsObj).map(([key, val], idx) => (
                <div key={idx} className={`grid grid-cols-3 text-xs sm:text-sm p-3.5 ${idx % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/40' : 'bg-card'
                  }`}>
                  <span className="font-bold text-slate-500 uppercase">{key}</span>
                  <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200">{val}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No detailed specifications provided.</p>
          )}
        </div>

        {/* Reviews Column (Right 1/3) */}
        <div className="space-y-6">

          {/* Write a Review Block */}
          <div className="bg-card text-card-foreground border border-border-brand rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base uppercase tracking-wide border-b border-border-brand/40 pb-2">
              {t.writeReview}
            </h3>

            {user ? (
              <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs sm:text-sm">

                {/* Select Stars */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Rating Stars</label>
                  <div className="flex space-x-1.5 text-slate-300">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`hover:scale-110 transition-transform cursor-pointer ${star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'
                          }`}
                      >
                        <Star size={22} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Textarea */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Review Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Tell us about the product and service..."
                    className="w-full bg-slate-50 text-slate-900 border border-border-brand rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                {reviewError && <p className="text-rose-500 font-bold text-xs">{reviewError}</p>}
                {reviewSuccess && <p className="text-emerald-500 font-bold text-xs">Review submitted successfully!</p>}

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-primary-brand hover:bg-primary-brand-hover text-white font-bold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-xs uppercase"
                >
                  <Send size={14} />
                  <span>{submittingReview ? 'Submitting...' : t.submitReview}</span>
                </button>

              </form>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-500">Please log in to submit a rating and review.</p>
                <Link href="/login" className="inline-block bg-slate-100 border hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-lg text-xs">
                  Log In
                </Link>
              </div>
            )}
          </div>

          {/* List reviews */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-base uppercase tracking-wide text-slate-800 dark:text-slate-100">
              {t.customerReviews} ({reviewsList.length})
            </h3>

            {reviewsList.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No reviews yet for this product. Be the first to review!</p>
            ) : (
              <div className="space-y-3">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="bg-card text-card-foreground border border-border-brand rounded-2xl p-4 shadow-xs space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800 dark:text-slate-200">{rev.userName}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(rev.createdAt).toLocaleDateString('en-US')}
                      </span>
                    </div>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < rev.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Related Products recommendations */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight border-l-4 border-amber-500 pl-3">
            {t.relatedProducts}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
