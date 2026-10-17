import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Plus, Trash2, ShieldCheck, Upload, RefreshCw, X, Camera } from 'lucide-react';
import { Product, Category, AmazonMarketplace } from '../../types';
import { MARKETPLACES } from '../../data/initialData';
import { adminFetchProductById, adminCreateProduct, adminUpdateProduct, adminFetchCategories, adminUploadPhoto } from '../../lib/api';

interface AdminProductFormPageProps {
  productId?: string | null;
  onBack: () => void;
  onSaved: (product: Product) => void;
}

// Preset verified studio references available as secondary option
const STUDIO_PRESETS = [
  { label: 'Ultra-Slim MagSafe Battery', path: '/images/magsafe_power_bank_1791747842268.jpg' },
  { label: '65W GaN Fast Charger', path: '/images/gan_compact_charger_1791747854699.jpg' },
  { label: 'Matte Monitor Screenbar', path: '/images/desk_screenbar_light_1791747866894.jpg' },
  { label: 'Vertical Ergonomic Mouse', path: '/images/ergonomic_vertical_mouse_1791747877658.jpg' },
  { label: 'Magnetic Cable Dock', path: '/images/magnetic_cable_dock_1791747890185.jpg' },
];

export const AdminProductFormPage: React.FC<AdminProductFormPageProps> = ({
  productId,
  onBack,
  onSaved,
}) => {
  const isEditing = Boolean(productId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields - Preserves input state across save failures
  const [permanentNumber, setPermanentNumber] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [marketplaceCode, setMarketplaceCode] = useState<AmazonMarketplace>('US');
  const [status, setStatus] = useState<Product['status']>('draft');
  const [keyPoints, setKeyPoints] = useState<string[]>(['']);
  const [usefulFor, setUsefulFor] = useState<string[]>(['']);
  const [considerations, setConsiderations] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

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
          setImagePath(p.image_path || '');
          setAffiliateUrl(p.affiliate_url || '');
          setMarketplaceCode(p.marketplace_code || 'US');
          setStatus(p.status);
          setKeyPoints(p.key_points && p.key_points.length > 0 ? p.key_points : ['']);
          setUsefulFor(p.useful_for && p.useful_for.length > 0 ? p.useful_for : ['']);
          setConsiderations(p.considerations || '');
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load product details.');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [productId]);

  // Handle Photo File Upload (Android / Desktop)
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side quick size check (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Images must be under 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadSuccessMsg(null);

    try {
      const result = await adminUploadPhoto(file);
      setImagePath(result.url);
      setUploadSuccessMsg(`Photo uploaded: ${result.filename}`);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo. Ensure it is a valid JPEG, PNG, or WEBP.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlChange = (value: string) => {
    setAffiliateUrl(value);
    if (!value.trim()) {
      setUrlValidation({ valid: true, message: '' });
      return;
    }
    const trimmed = value.trim();
    if (!trimmed.startsWith('https://')) {
      setUrlValidation({ valid: false, message: 'URL must start with secure https://' });
      return;
    }
    try {
      const u = new URL(trimmed);
      const isAmazon = u.hostname.includes('amazon') || u.hostname.includes('amzn.to');
      if (!isAmazon) {
        setUrlValidation({ valid: false, message: 'Must be an official Amazon domain (e.g. amazon.com or amzn.to)' });
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
      if (!description.trim()) {
        setError('Detailed recommendation description is required before publishing.');
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
      
      {/* Top Header */}
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
            Add genuine tech gear with high-resolution photography and validated Amazon Special Links.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {uploadSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded flex items-start gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{uploadSuccessMsg}</span>
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
                    {c.name} {c.is_active ? '' : '(Inactive)'}
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

          {/* PHOTO UPLOADING SECTION - Mobile & Android Friendly */}
          <div className="space-y-3 pt-4 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-zinc-900">
                  Product Photo <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-zinc-500">
                  Select a photo from your Android phone or computer (JPEG, PNG, WEBP up to 5MB).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-950 underline"
              >
                {showPresets ? 'Hide presets' : 'Studio presets'}
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelected}
              className="hidden"
            />

            {/* Photo Preview & Action Container */}
            <div className="border-2 border-dashed border-zinc-200 rounded-lg p-4 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
              {imagePath ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative aspect-[4/3] w-36 sm:w-44 bg-zinc-200 rounded-md overflow-hidden shrink-0 border border-zinc-300">
                    <img
                      src={imagePath}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-zinc-900">Active Product Photo</p>
                      <p className="text-[11px] font-mono text-zinc-500 truncate max-w-xs">{imagePath}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="min-h-[44px] px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
                        <span>{isUploading ? 'Uploading...' : 'Replace Photo'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImagePath('')}
                        disabled={isUploading}
                        className="min-h-[44px] px-3 py-2 bg-white border border-zinc-200 text-zinc-700 hover:text-red-600 hover:border-red-200 text-xs font-medium rounded flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="py-8 flex flex-col items-center justify-center text-center cursor-pointer space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-semibold text-zinc-900">
                      Tap here to upload a photo
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Works directly with Android phone camera or gallery · 4:3 ratio recommended
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isUploading}
                    className="min-h-[44px] px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading photo...' : 'Select Photo'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Studio Presets */}
            {showPresets && (
              <div className="p-3 bg-zinc-100/70 border border-zinc-200 rounded-lg space-y-2">
                <span className="text-[11px] font-semibold text-zinc-700 block">
                  Studio Photography Library Presets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {STUDIO_PRESETS.map((preset) => {
                    const isSelected = imagePath === preset.path;
                    return (
                      <button
                        key={preset.path}
                        type="button"
                        onClick={() => {
                          setImagePath(preset.path);
                          setUploadSuccessMsg(null);
                        }}
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
            )}
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
              disabled={submitting || isUploading}
              className="min-h-[40px] px-5 py-2 text-xs font-semibold text-white bg-[#2E5B3E] hover:bg-[#234832] rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs active:scale-[0.99]"
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
