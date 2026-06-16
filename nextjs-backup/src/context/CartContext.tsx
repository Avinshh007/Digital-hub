// src/context/CartContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  image: string;
  stock: number;
  sku: string;
  gstRate: number;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  stock: number;
}

interface CartContextType {
  cart: CartItem[];
  wishlist: WishlistItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Sync state with localStorage on mount (hydration safe)
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error(e); }
    }
    if (savedWishlist) {
      try { setWishlist(JSON.parse(savedWishlist)); } catch (e) { console.error(e); }
    }
    setIsMounted(true);
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const saveWishlist = (newWishlist: WishlistItem[]) => {
    setWishlist(newWishlist);
    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, item.stock);
      saveCart(cart.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i)));
    } else {
      saveCart([...cart, { ...item, quantity: Math.min(quantity, item.stock) }]);
    }
  };

  const removeFromCart = (id: string) => {
    saveCart(cart.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    saveCart(
      cart.map((i) => {
        if (i.id === id) {
          return { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    saveCart([]);
  };

  const addToWishlist = (item: WishlistItem) => {
    if (!wishlist.some((i) => i.id === item.id)) {
      saveWishlist([...wishlist, item]);
    }
  };

  const removeFromWishlist = (id: string) => {
    saveWishlist(wishlist.filter((i) => i.id !== id));
  };

  const isInWishlist = (id: string) => {
    return wishlist.some((i) => i.id === id);
  };

  const toggleWishlist = (item: WishlistItem) => {
    if (isInWishlist(item.id)) {
      removeFromWishlist(item.id);
    } else {
      addToWishlist(item);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart: isMounted ? cart : [],
        wishlist: isMounted ? wishlist : [],
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
