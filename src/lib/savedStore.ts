import { useState, useEffect } from 'react';

const SAVED_STORAGE_KEY = 'fn_saved_product_ids';

export function getSavedProductIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function toggleSavedProduct(id: string): boolean {
  const current = getSavedProductIds();
  const exists = current.includes(id);
  let next: string[];
  if (exists) {
    next = current.filter((item) => item !== id);
  } else {
    next = [id, ...current];
  }
  localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('fn_saved_changed'));
  return !exists;
}

export function isProductSaved(id: string): boolean {
  return getSavedProductIds().includes(id);
}

// React hook to listen to save/bookmark changes
export function useSavedProducts() {
  const [savedIds, setSavedIds] = useState<string[]>(getSavedProductIds);

  useEffect(() => {
    const handleUpdate = () => {
      setSavedIds(getSavedProductIds());
    };
    window.addEventListener('fn_saved_changed', handleUpdate);
    return () => window.removeEventListener('fn_saved_changed', handleUpdate);
  }, []);

  return {
    savedIds,
    toggleSave: toggleSavedProduct,
    isSaved: (id: string) => savedIds.includes(id),
  };
}
