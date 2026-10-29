export type ProductStatus = 'draft' | 'published' | 'hidden' | 'archived';

export type AmazonMarketplace = 'US' | 'UK' | 'CA' | 'DE' | 'FR' | 'ES' | 'IT' | 'JP' | 'AU';

export interface Product {
  id: string;
  product_number: number; // Permanent unique sequential integer
  slug: string;
  name: string;
  short_description: string;
  description: string;
  key_points: string[];
  useful_for: string[];
  considerations: string;
  category_id: string;
  image_path: string;
  affiliate_url: string;
  marketplace_code: AmazonMarketplace;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  deleted_at: string | null;
  view_count?: number;
  click_count?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductClick {
  id: string;
  product_id: string;
  product_name: string;
  product_number: number;
  clicked_at: string;
  source: 'catalog_card' | 'product_detail' | 'related_products' | 'direct';
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  target_id?: string;
}

export interface MarketplaceConfig {
  code: AmazonMarketplace;
  name: string;
  domain: string;
  defaultTag: string;
}

export type ThemeId =
  | 'helios'
  | 'emerald'
  | 'cyber'
  | 'amber'
  | 'amethyst'
  | 'slate'
  | 'titanium'
  | 'crimson';

export interface SiteSettings {
  logo_name: string;
  tagline: string;
  hero_headline?: string;
  hero_subheadline?: string;
  announcement?: string;
  admin_theme: ThemeId;
  public_theme: ThemeId;
  apply_to_public: boolean;
  updated_at?: string;
}
