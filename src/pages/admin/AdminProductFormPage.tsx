import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Plus, Trash2, ShieldCheck, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Product, Category, AmazonMarketplace } from '../../types';
import { MARKETPLACES } from '../../data/initialData';
import { adminFetchProductById, adminCreateProduct, adminUpdateProduct, adminFetchCategories } from '../../lib/api';

interface AdminProductFormPageProps {
  productId?: string | null; // null for new product
  onBack: () => void;
  onSaved: (product: Product) => void;
}

// Preset verified photo references available for selection
const PHOTO_PRESETS = [
  { label: 'Ultra-Slim MagSafe Battery', path: '/src/assets/images/magsafe_power_bank_1791747842268.jpg' },
  { label: '65W GaN Fast Charger', path: '/src/assets/images/gan_compact_charger_1791747854699.jpg' },
  { label: 'Matte Monitor Screenbar', path: '/src/assets/images/desk_screenbar_light_1791747866894.jpg' },
  { label: 'Vertical Ergonomic Mouse', path: '/src/assets/images/ergonomic_vertical_mouse_1791747877658.jpg' },
  { label: 'Magnetic Cable Dock', path: '/src/assets/images/magnetic_cable_dock_1791747890185.jpg' },
];

export const AdminProductFormPage: React.FC<AdminProductFormPageProps> = ({
  productId,
  onBack,
  onSaved,
}) => {
  const isEditing = Boolean(productId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [permanentNumber, setPermanentNumber] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [imagePath, setImagePath] = useState(PHOTO_PRESETS[0].path);
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [marketplaceCode, setMarketplaceCode] = useState<AmazonMarketplace>('US');
  const [status, setStatus] = useState<Product['status']>('draft');
  const [keyPoints, setKeyPoints] = useState<string[]>(['']);
  const [usefulFor, setUsefulFor] = useState<string[]>(['']);
  const [considerations, setConsiderations] = useState('');

  // Live URL validation state
  const [urlValidation, setUrlValidation] = useState<{ valid: boolean; message: string }>({
    valid: true,
    message: '',
  });

  useEffect(() => {
    adminFetchCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].id);
      }
    });

    if (productId) {
      adminFetchProductById(productId)
        .then((p) => {
          setPermanentNumber(p.product_number);
          setName(p.name);
          setCategoryId(p.category_id);
          setShortDescription(p.short_description);
          setDescription(p.description || '');
          setImagePath(p.image_path || PHOTO_PRESETS[0].path);
          setAffiliateUrl(p.affiliate_url || '');
          setMarketplaceCode(p.marketplace_code || 'US');
          setStatus(p.status);
          setKeyPoints(p.key_points && p.key_points.length > 0 ? p.key_points : ['']);
          setUsefulFor(p.useful_for && p.useful_for.length > 0 ? p.useful_for : ['']);
          setConsiderations(p.considerations || '');
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load product details.');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [productId]);

  // Validate affiliate URL as user types
  const handleUrlChange = (value: string) => {
    setAffiliateUrl(value);
    if (!value.trim()) {
      setUrlValidation({ valid: true, message: '' });
      return;
    }
    const trimmed = value.trim();
    if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
      setUrlValidation({ valid: false, message: 'URL must start with https://' });
      return;
    }
    try {
      const u = new URL(trimmed);
      const isAmazon = u.hostname.includes('amazon') || u.hostname.includes('amzn.to');
      if (!isAmazon) {
        setUrlValidation({ valid: false, message: 'Domain must belong to Amazon (e.g. amazon.com or amzn.to)' });
      } else {
        setUrlValidation({ valid: true, message: 'Valid Amazon destination' });
      }
    } catch {
      setUrlValidation({ valid: false, message: 'Invalid URL syntax' });
    }
  };

  const handleAddKeyPoint = () => setKeyPoints([...keyPoints, '']);
  const handleRemoveKeyPoint = (idx: number) => setKeyPoints(keyPoints.filter((_, i) => i !== idx));
  const handleKeyPointChange = (idx: number, val: string) => {
    const updated = [...keyPoints];
    updated[idx] = val;
    setKeyPoints(updated);
  };

  const handleAddUsefulFor = () => setUsefulFor([...usefulFor, '']);
  const handleRemoveUsefulFor = (idx: number) => setUsefulFor(usefulFor.filter((_, i) => i !== idx));
  const handleUsefulForChange = (idx: number, val: string) => {
    const updated = [...usefulFor];
    updated[idx] = val;
    setUsefulFor(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!categoryId) {
      setError('Category is required.');
      return;
    }
    if (!shortDescription.trim()) {
      setError('Short description is required.');
      return;
    }

    if (status === 'published') {
      if (!imagePath) {
        setError('A product photo is required to publish.');
        return;
      }
      if (!affiliateUrl.trim()) {
        setError('An Amazon affiliate URL is required to publish.');
        return;
      }
      if (!urlValidation.valid) {
        setError('Please fix the affiliate URL before publishing.');
        return;
      }
    }

    setSubmitting(true);

    const payload = {
      name: name.trim(),
      category_id: categoryId,
      short_description: shortDescription.trim(),
      description: description.trim(),
      image_path: imagePath,
      affiliate_url: affiliateUrl.trim(),
      marketplace_code: marketplaceCode,
      status,
      key_points: keyPoints.filter((k) => k.trim()),
      useful_for: usefulFor.filter((u) => u.trim()),
      considerations: considerations.trim(),
    };

    try {
      let saved: Product;
      if (isEditing && productId) {
        saved = await adminUpdateProduct(productId, payload);
      } else {
        saved = await adminCreateProduct(payload);
      }
      onSaved(saved);
    } catch (err: any) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-zinc-400 animate-pulse">
        Loading product form...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products List</span>
        </button>

        <div className="text-xs font-mono text-zinc-500">
          {permanentNumber ? (
            <span className="font-bold text-zinc-900">Permanent Item #{permanentNumber.toString().padStart(3, '0')}</span>
          ) : (
            <span>Next Product # (Auto-assigned)</span>
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-5 sm:p-8 space-y-6 shadow-xs">
        
        <div>
          <h1 className="text-xl font-bold text-zinc-950">
            {isEditing ? `Edit Item #${permanentNumber?.toString().padStart(3, '0')}` : 'Add New Catalog Item'}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Original honest recommendations with validated Amazon Associates destination URLs.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-900">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ultra-Slim Magnetic Wireless Power Bank"
              required
              className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-zinc-200 rounded focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          {/* Category & Marketplace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-900">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full h-10 px-3 text-xs bg-white border border-zinc-200 rounded focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-900">
                Amazon Marketplace
              </label>
              <select
                value={marketplaceCode}
                onChange={(e) => setMarketplaceCode(e.target.value as AmazonMarketplace)}
                className="w-full h-10 px-3 text-xs bg-white border border-zinc-200 rounded focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              >
                {MARKETPLACES.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.name} ({m.domain})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image Selection & Preview */}
          <div className="space-y-3 pt-2 border-t border-zinc-100">
            <label className="block text-xs font-semibold text-zinc-900">
              Product Photo <span className="text-red-500">*</span>
            </label>
            
            {/* Presets Gallery */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-500">Select from studio photography library:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {PHOTO_PRESETS.map((preset) => {
                  const isSelected = imagePath === preset.path;
                  return (
                    <button
                      key={preset.path}
                      type="button"
                      onClick={() => setImagePath(preset.path)}
                      className={`relative aspect-[4/3] rounded border overflow-hidden p-0.5 text-left transition-all ${
                        isSelected
                          ? 'border-zinc-900 ring-2 ring-zinc-900/20'
                          : 'border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.path}
                        alt={preset.label}
                        className="w-full h-full object-cover rounded-xs"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Image Path / URL Input */}
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-500">Or enter custom image path / URL:</span>
              <input
                type="text"
                value={imagePath}
                onChange={(e) => setImagePath(e.target.value)}
                placeholder="/src/assets/images/... or https://..."
                className="w-full h-9 px-3 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Short Description */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-100">
            <label className="block text-xs font-semibold text-zinc-900">
              Short Description (Card Kicker) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={2}
              placeholder="1–2 concise sentences summarizing the utility of this item..."
              required
              className="w-full p-3 text-xs bg-white border border-zinc-200 rounded focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          {/* Long Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-900">
              In-Depth Editorial Recommendation
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Honest review notes explaining why this hardware piece stands out, build quality details, and everyday performance..."
              className="w-full p-3 text-xs bg-white border border-zinc-200 rounded focus:ring-1 focus:ring-zinc-900 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Key Points (Features) */}
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-900">
                Key Features & Specs (Bulleted)
              </label>
              <button
                type="button"
                onClick={handleAddKeyPoint}
                className="text-[11px] font-semibold text-zinc-800 hover:text-zinc-950 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add bullet</span>
              </button>
            </div>
            {keyPoints.map((pt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={pt}
                  onChange={(e) => handleKeyPointChange(i, e.target.value)}
                  placeholder={`Feature ${i + 1}...`}
                  className="flex-1 h-9 px-3 text-xs bg-white border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                {keyPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyPoint(i)}
                    className="p-1.5 text-zinc-400 hover:text-red-600"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* What it is useful for */}
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-900">
                Best For & Ideal Scenarios
              </label>
              <button
                type="button"
                onClick={handleAddUsefulFor}
                className="text-[11px] font-semibold text-zinc-800 hover:text-zinc-950 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add scenario</span>
              </button>
            </div>
            {usefulFor.map((uf, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={uf}
                  onChange={(e) => handleUsefulForChange(i, e.target.value)}
                  placeholder={`Scenario ${i + 1}...`}
                  className="flex-1 h-9 px-3 text-xs bg-white border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                {usefulFor.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveUsefulFor(i)}
                    className="p-1.5 text-zinc-400 hover:text-red-600"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Buying Considerations / Limitations */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-100">
            <label className="block text-xs font-semibold text-zinc-900">
              Buying Considerations & Limitations (Honest Advice)
            </label>
            <textarea
              value={considerations}
              onChange={(e) => setConsiderations(e.target.value)}
              rows={2}
              placeholder="e.g. Requires MagSafe ring case, right-hand only ergonomics, dual charging splits output to 45W..."
              className="w-full p-3 text-xs bg-white border border-zinc-200 rounded focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          {/* Amazon Affiliate URL */}
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-900">
                Full Amazon Affiliate URL <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-zinc-500" />
                Validated Amazon Destination
              </span>
            </div>
            <input
              type="url"
              value={affiliateUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://www.amazon.com/dp/... or https://amzn.to/..."
              className={`w-full h-10 px-3 text-xs font-mono bg-white border rounded focus:outline-none ${
                urlValidation.valid
                  ? 'border-zinc-200 focus:ring-1 focus:ring-zinc-900'
                  : 'border-red-300 bg-red-50/30 text-red-900'
              }`}
            />
            {urlValidation.message && (
              <p
                className={`text-[11px] font-medium ${
                  urlValidation.valid ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {urlValidation.message}
              </p>
            )}
          </div>

          {/* Visibility Status */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-100">
            <label className="block text-xs font-semibold text-zinc-900">
              Visibility Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['draft', 'published', 'hidden'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`min-h-[38px] px-3 py-2 text-xs font-semibold rounded capitalize border transition-all ${
                    status === st
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-200">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[40px] px-5 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
