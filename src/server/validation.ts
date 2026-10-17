import { DatabaseService } from './db';
import { AmazonMarketplace, ProductStatus } from '../types';

export const ALLOWED_MARKETPLACES: AmazonMarketplace[] = [
  'US', 'UK', 'CA', 'DE', 'FR', 'ES', 'IT', 'JP', 'AU'
];

export const ALLOWED_STATUSES: ProductStatus[] = [
  'draft', 'published', 'hidden', 'archived'
];

export const ALLOWED_AMAZON_DOMAINS = [
  'amazon.com',
  'www.amazon.com',
  'amzn.to',
  'amazon.co.uk',
  'www.amazon.co.uk',
  'amazon.ca',
  'www.amazon.ca',
  'amazon.de',
  'www.amazon.de',
  'amazon.fr',
  'www.amazon.fr',
  'amazon.es',
  'www.amazon.es',
  'amazon.it',
  'www.amazon.it',
  'amazon.co.jp',
  'www.amazon.co.jp',
  'amazon.com.au',
  'www.amazon.com.au',
];

export function validateAffiliateUrl(rawUrl: string): { valid: boolean; reason?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, reason: 'Affiliate URL is required.' };
  }
  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith('https://')) {
    return { valid: false, reason: 'Affiliate URL must use secure HTTPS.' };
  }
  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();
    const isAllowed = ALLOWED_AMAZON_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    if (!isAllowed) {
      return { 
        valid: false, 
        reason: `Destination domain "${hostname}" is not an authorized Amazon Associates domain. Must be Amazon or amzn.to.` 
      };
    }
    // Block open redirect patterns and credential injection
    if (parsed.username || parsed.password) {
      return { valid: false, reason: 'URL cannot include authentication credentials.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Malformed affiliate URL structure.' };
  }
}

export interface ProductInputPayload {
  name?: string;
  category_id?: string;
  short_description?: string;
  description?: string;
  key_points?: any;
  useful_for?: any;
  considerations?: string;
  image_path?: string;
  affiliate_url?: string;
  marketplace_code?: any;
  status?: any;
}

export function validateProductPayload(
  payload: ProductInputPayload,
  db: DatabaseService,
  isPublishingIntent: boolean
): { valid: boolean; error?: { code: string; message: string; field?: string } } {
  // 1. Basic Name Check
  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string' || !payload.name.trim()) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Product name cannot be empty.', field: 'name' } };
    }
    if (payload.name.trim().length > 255) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Product name must be under 255 characters.', field: 'name' } };
    }
  }

  // 2. Category Check
  if (payload.category_id !== undefined) {
    if (typeof payload.category_id !== 'string' || !payload.category_id.trim()) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Category reference is required.', field: 'category_id' } };
    }
    const cat = db.getCategoryById(payload.category_id);
    if (!cat) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Selected category does not exist.', field: 'category_id' } };
    }
    if (isPublishingIntent && !cat.is_active) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Cannot publish a product to an inactive category. Activate the category first.', field: 'category_id' } };
    }
  }

  // 3. Short Description Check
  if (payload.short_description !== undefined) {
    if (typeof payload.short_description !== 'string' || !payload.short_description.trim()) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Short description cannot be empty.', field: 'short_description' } };
    }
    if (payload.short_description.trim().length > 500) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Short description must be under 500 characters.', field: 'short_description' } };
    }
  }

  // 4. Status Check
  if (payload.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(payload.status)) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}`, field: 'status' } };
    }
  }

  // 5. Marketplace Code Check
  if (payload.marketplace_code !== undefined) {
    if (!ALLOWED_MARKETPLACES.includes(payload.marketplace_code)) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: `Invalid marketplace. Must be one of: ${ALLOWED_MARKETPLACES.join(', ')}`, field: 'marketplace_code' } };
    }
  }

  // 6. Array Fields: key_points and useful_for
  if (payload.key_points !== undefined) {
    if (!Array.isArray(payload.key_points)) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Key points must be an array of strings.', field: 'key_points' } };
    }
    for (const item of payload.key_points) {
      if (typeof item !== 'string') {
        return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Every key point item must be a string.', field: 'key_points' } };
      }
    }
  }

  if (payload.useful_for !== undefined) {
    if (!Array.isArray(payload.useful_for)) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Useful for scenarios must be an array of strings.', field: 'useful_for' } };
    }
    for (const item of payload.useful_for) {
      if (typeof item !== 'string') {
        return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Every useful_for scenario item must be a string.', field: 'useful_for' } };
      }
    }
  }

  // 7. Image Path Check
  if (payload.image_path !== undefined && payload.image_path) {
    const img = payload.image_path.trim().toLowerCase();
    if (img.startsWith('javascript:') || img.startsWith('vbscript:') || img.startsWith('data:text/html')) {
      return { valid: false, error: { code: 'SECURITY_ERROR', message: 'Invalid image URI protocol.', field: 'image_path' } };
    }
  }

  // 8. Strict Publishing Requirements
  if (isPublishingIntent) {
    if (!payload.name || !payload.name.trim()) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Product name is required before publishing.', field: 'name' } };
    }
    if (!payload.category_id) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Valid category is required before publishing.', field: 'category_id' } };
    }
    if (!payload.short_description || !payload.short_description.trim()) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Short description is required before publishing.', field: 'short_description' } };
    }
    if (!payload.description || !payload.description.trim()) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Detailed recommendation description is required before publishing.', field: 'description' } };
    }
    if (!payload.image_path || !payload.image_path.trim()) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'A verified product photograph is required before publishing.', field: 'image_path' } };
    }
    if (!payload.affiliate_url || !payload.affiliate_url.trim()) {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Amazon affiliate URL is required before publishing.', field: 'affiliate_url' } };
    }

    const urlCheck = validateAffiliateUrl(payload.affiliate_url);
    if (!urlCheck.valid) {
      return { valid: false, error: { code: 'INVALID_AFFILIATE_URL', message: urlCheck.reason || 'Invalid affiliate URL.', field: 'affiliate_url' } };
    }
  }

  return { valid: true };
}
