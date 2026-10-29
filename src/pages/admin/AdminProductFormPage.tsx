import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  X,
  Camera,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Product, Category, AmazonMarketplace } from '../../types';
import { MARKETPLACES } from '../../data/initialData.ts';
import {
  adminFetchProductById,
  adminCreateProduct,
  adminUpdateProduct,
  adminFetchCategories,
  adminUploadPhoto,
} from '../../lib/api';
import { useSiteSettings } from '../../lib/settingsStore';
import { getTheme } from '../../lib/themes';

interface AdminProductFormPageProps {
  productId?: string | null;
  onBack: () => void;
  onSaved: (product: Product) => void;
}

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
  const { settings } = useSiteSettings();
  const currentTheme = getTheme(settings.admin_theme || 'helios');

  const isEditing = Boolean(productId);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [imagePath, setImagePath] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [marketplaceCode, setMarketplaceCode] = useState<AmazonMarketplace>('US');
  const [status, setStatus] = useState<Product['status']>('published');
  const [keyPoints, setKeyPoints] = useState<string[]>(['']);
  const [usefulFor, setUsefulFor] = useState<string[]>(['']);
  const [considerations, setConsiderations] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

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

  // Handle Photo File Upload (Phone camera / gallery / PC)
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setUploadSuccessMsg(`Photo uploaded successfully!`);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo. Ensure it is a valid JPEG, PNG, or WEBP.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyPointChange = (idx: number, val: string) => {
    const copy = [...keyPoints];
    copy[idx] = val;
    setKeyPoints(copy);
  };

  const addKeyPoint = () => setKeyPoints([...keyPoints, '']);
  const removeKeyPoint = (idx: number) => {
    if (keyPoints.length <= 1) return;
    setKeyPoints(keyPoints.filter((_, i) => i !== idx));
  };

  const handleUsefulForChange = (idx: number, val: string) => {
    const copy = [...usefulFor];
    copy[idx] = val;
    setUsefulFor(copy);
  };

  const addUsefulFor = () => setUsefulFor([...usefulFor, '']);
  const removeUsefulFor = (idx: number) => {
    if (usefulFor.length <= 1) return;
    setUsefulFor(usefulFor.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (!categoryId) {
      setError('Please select a category niche.');
      return;
    }

    if (!shortDescription.trim()) {
      setError('Short summary description is required.');
      return;
    }

    // Default fallback image if user removed photo and wants to publish
    let finalImagePath = imagePath.trim();
    if (!finalImagePath) {
      finalImagePath = '/images/magsafe_power_bank_1791747842268.jpg'; // default verified preset
    }

    setSubmitting(true);

    try {
      const payload: Partial<Product> = {
        name: name.trim(),
        category_id: categoryId,
        short_description: shortDescription.trim(),
        description: description.trim(),
        key_points: keyPoints.map((k) => k.trim()).filter(Boolean),
        useful_for: usefulFor.map((u) => u.trim()).filter(Boolean),
        considerations: considerations.trim(),
        image_path: finalImagePath,
        affiliate_url: affiliateUrl.trim() || 'https://www.amazon.com/?tag=findniche-20',
        marketplace_code: marketplaceCode,
        status,
      };

      let savedProduct: Product;
      if (isEditing && productId) {
        savedProduct = await adminUpdateProduct(productId, payload);
      } else {
        savedProduct = await adminCreateProduct(payload);
      }

      onSaved(savedProduct);
    } catch (err: any) {
      setError(err.message || 'Failed to save product. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-400" />
        <span>Loading product form...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>

        <div className="text-xs font-mono text-zinc-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
          {permanentNumber ? (
            <span className="font-bold text-white">Item #{permanentNumber.toString().padStart(3, '0')}</span>
          ) : (
            <span>Auto-allocated product #</span>
          )}
        </div>
      </div>

      <div className={`${currentTheme.classes.bgCard} border ${currentTheme.classes.borderCard} rounded-2xl p-5 sm:p-8 backdrop-blur-md shadow-xl space-y-6`}>
        
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {isEditing ? `Edit Item #${permanentNumber?.toString().padStart(3, '0')}` : 'Add New Tech Item'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Fill in product details, verified photo, key bullet points, and Amazon Associates link.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-950/70 border border-red-700 text-red-200 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {uploadSuccessMsg && (
          <div className="p-4 bg-emerald-950/70 border border-emerald-700 text-emerald-200 rounded-xl text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="flex-1">{uploadSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Product Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ultra-Slim Magnetic Wireless Power Bank"
              required
              className="w-full h-11 px-4 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Category Niche <span className="text-red-400">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 px-3 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-11 px-3 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="published">Published (Visible in public store)</option>
                <option value="draft">Draft (Private in admin)</option>
                <option value="hidden">Hidden (De-listed)</option>
              </select>
            </div>
          </div>

          {/* Short Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Short Hook Description <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="1-2 sentences summarizing the standout product utility..."
              required
              className="w-full h-11 px-4 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>

          {/* Full Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Detailed Editorial Review
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Why this product is recommended, real daily experience, and build quality observations..."
              className="w-full p-4 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-none"
            />
          </div>

          {/* Photo Management Section (Delete photo, replace photo, upload new) */}
          <div className="space-y-3 p-4 sm:p-5 bg-[#0E101A] border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-white block">
                  Product Photography
                </label>
                <p className="text-[11px] text-zinc-400">
                  Upload directly from your phone camera or select file (JPEG, PNG, WEBP)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelected}
                className="hidden"
              />
            </div>

            {imagePath ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-24 h-24 rounded-xl bg-black overflow-hidden border border-white/10 shrink-0">
                  <img
                    src={imagePath}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <span className="text-xs font-bold text-white block">Current Photo</span>
                    <span className="text-[11px] font-mono text-zinc-400 truncate max-w-xs block">
                      {imagePath}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="min-h-[38px] px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Uploading...' : 'Replace Photo'}</span>
                    </button>

                    {/* Delete Photo Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setImagePath('');
                        setUploadSuccessMsg('Photo removed. You can upload a new photo or save with default placeholder.');
                      }}
                      className="min-h-[38px] px-3.5 py-1.5 bg-red-950/50 hover:bg-red-900/60 text-red-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-red-800/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPresets(!showPresets)}
                      className="min-h-[38px] px-3 py-1.5 text-zinc-400 hover:text-white text-xs transition-colors"
                    >
                      {showPresets ? 'Hide presets' : 'Choose library preset'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="py-8 border-2 border-dashed border-white/20 hover:border-violet-500/50 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors p-4 group"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-violet-400 mb-2 transition-colors">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  Touch here to upload product photo
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Works directly with phone camera & photo library
                </p>
                <button
                  type="button"
                  className="mt-3 px-4 py-2 bg-white/10 group-hover:bg-violet-600 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Browse Image File
                </button>
              </div>
            )}

            {/* Presets Grid */}
            {showPresets && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="text-[11px] font-semibold text-zinc-400 block">
                  Studio Reference Presets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {STUDIO_PRESETS.map((pr) => (
                    <button
                      key={pr.path}
                      type="button"
                      onClick={() => {
                        setImagePath(pr.path);
                        setShowPresets(false);
                      }}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left transition-all text-xs text-zinc-300 flex items-center gap-2"
                    >
                      <img src={pr.path} alt={pr.label} className="w-8 h-8 rounded-lg object-cover" />
                      <span className="truncate text-[10px]">{pr.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Amazon Affiliate Link & Marketplace */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Amazon Affiliate URL (Direct link)
              </label>
              <input
                type="url"
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://www.amazon.com/dp/B0CX23MAG1?tag=findniche-20"
                className="w-full h-11 px-4 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Amazon Region
              </label>
              <select
                value={marketplaceCode}
                onChange={(e) => setMarketplaceCode(e.target.value as any)}
                className="w-full h-11 px-3 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
              >
                {MARKETPLACES.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} — {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Key Bullet Points */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-300">
                Key Highlights / Bullet Points
              </label>
              <button
                type="button"
                onClick={addKeyPoint}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Point</span>
              </button>
            </div>

            {keyPoints.map((kp, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={kp}
                  onChange={(e) => handleKeyPointChange(idx, e.target.value)}
                  placeholder={`Key specification #${idx + 1}...`}
                  className="flex-1 h-10 px-3.5 text-xs sm:text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
                {keyPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeKeyPoint(idx)}
                    className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Useful For Scenarios */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-300">
                Ideal Use Cases ("Useful For")
              </label>
              <button
                type="button"
                onClick={addUsefulFor}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Scenario</span>
              </button>
            </div>

            {usefulFor.map((uf, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={uf}
                  onChange={(e) => handleUsefulForChange(idx, e.target.value)}
                  placeholder={`Best for scenario #${idx + 1}...`}
                  className="flex-1 h-10 px-3.5 text-xs sm:text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
                {usefulFor.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUsefulFor(idx)}
                    className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Trade-offs & Considerations */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Honest Considerations & Trade-offs
            </label>
            <textarea
              value={considerations}
              onChange={(e) => setConsiderations(e.target.value)}
              rows={2}
              placeholder="What to keep in mind (e.g. battery capacity is 5,000mAh, right-handed only)..."
              className="w-full p-3.5 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-none"
            />
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Saves permanently to disk & db.json</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`min-h-[46px] px-8 py-2.5 ${currentTheme.classes.accentBg} ${currentTheme.classes.accentHover} text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg active:scale-95 transition-all`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Product...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Save Product Changes' : 'Publish Product'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
