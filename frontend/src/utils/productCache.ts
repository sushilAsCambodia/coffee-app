import { Menu } from '../services/api';

// Module-level cache populated by home.tsx when menus are loaded.
// product/[id].tsx reads from here to avoid refetching.
const cache: Map<string, Menu> = new Map();

export function setProductCache(products: Menu[]): void {
  cache.clear();
  products.forEach(p => cache.set(String(p.id), p));
}

export function getProductById(id: string): Menu | null {
  return cache.get(id) ?? null;
}

export function getAllCachedProducts(): Menu[] {
  return Array.from(cache.values());
}
