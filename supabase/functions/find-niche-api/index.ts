import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !serviceKey) throw new Error("Supabase runtime configuration is missing.");
const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const SESSION_COOKIE = "fn_admin_session";
const SESSION_MS = 4 * 60 * 60 * 1000;
const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type",
  "access-control-allow-credentials": "true",
};
function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...jsonHeaders, ...extra } });
}
function err(code: string, message: string, status = 400) {
  return json({ error: { code, message } }, status);
}
const q = (v: unknown) => typeof v === "string" ? v : "";
function safeEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
async function digest(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function slugify(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "product";
}
function amazonUrl(value: unknown) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" && (url.hostname === "amzn.to" || /(^|\.)amazon\.[a-z.]+$/i.test(url.hostname));
  } catch { return false; }
}
function cookieValue(req: Request, name: string) {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx > -1 && part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}
function sessionToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return cookieValue(req, SESSION_COOKIE);
}
async function logAudit(action: string, details: string, targetId: string | null = null, actor = "owner") {
  try {
    await db.from("audit_logs").insert({ id: crypto.randomUUID(), action, details, target_id: targetId, actor });
  } catch (e) { console.error("audit log failed", String(e)); }
}
async function validSession(req: Request) {
  const token = sessionToken(req);
  if (!token) return false;
  const tokenHash = await digest(token);
  const { data, error } = await db.from("admin_sessions").select("id,expires_at").eq("id", tokenHash).maybeSingle();
  if (error || !data) return false;
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await db.from("admin_sessions").delete().eq("id", tokenHash);
    return false;
  }
  return true;
}
async function adminGuard(req: Request) {
  if (await validSession(req)) return null;
  return err("UNAUTHORIZED", "Your session is missing or expired. Please sign in again.", 401);
}
async function categoryList(activeOnly: boolean) {
  let query = db.from("categories").select("*").order("display_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  const rows = data || [];
  const { data: products } = await db.from("products").select("category_id").is("deleted_at", null);
  const counts = new Map<string, number>();
  for (const p of products || []) counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1);
  return rows.map((c: any) => ({ ...c, product_count: counts.get(c.id) || 0 }));
}
async function productsQuery(params: URLSearchParams) {
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(params.get("limit") || "12", 10) || 12));
  let query = db.from("products").select("*", { count: "exact" }).eq("status", "published").is("deleted_at", null);
  const qText = (params.get("q") || "").trim();
  if (qText) query = query.or("name.ilike.%" + qText.replace(/[,%()]/g, " ") + "%,short_description.ilike.%" + qText.replace(/[,%()]/g, " ") + "%");
  const cat = params.get("category");
  if (cat && cat !== "all") {
    const { data: catRow } = await db.from("categories").select("id").or("id.eq." + cat + ",slug.eq." + cat).maybeSingle();
    if (catRow?.id) query = query.eq("category_id", catRow.id);
    else return { products: [], pagination: { total: 0, page, limit, totalPages: 0, hasMore: false } };
  }
  const sort = params.get("sort") || "newest";
  if (sort === "popular") query = query.order("click_count", { ascending: false }).order("view_count", { ascending: false });
  else if (sort === "name") query = query.order("name", { ascending: true });
  else if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else query = query.order("created_at", { ascending: false });
  query = query.range((page - 1) * limit, page * limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  const total = count || 0;
  return { products: data || [], pagination: { total, page, limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total } };
}
function productPayload(payload: any, partial = false) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "A product object is required.";
  if (!partial && (!q(payload.name).trim() || !q(payload.category_id).trim() || !q(payload.short_description).trim())) return "Product name, category, and short description are required.";
  if (payload.name !== undefined && (!q(payload.name).trim() || q(payload.name).length > 255)) return "Product name must be between 1 and 255 characters.";
  if (payload.affiliate_url && !amazonUrl(payload.affiliate_url)) return "Use a valid HTTPS Amazon affiliate URL.";
  if (payload.status && !["draft", "published", "hidden", "archived"].includes(payload.status)) return "Invalid product status.";
  if (payload.key_points !== undefined && !Array.isArray(payload.key_points)) return "Key points must be a list.";
  if (payload.useful_for !== undefined && !Array.isArray(payload.useful_for)) return "Useful-for items must be a list.";
  return null;
}
async function handle(req: Request) {
  const method = req.method.toUpperCase();
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: jsonHeaders });
  const url = new URL(req.url);
  const originalPath = url.pathname;
  const apiIndex = originalPath.lastIndexOf("/api/");
  let path = apiIndex >= 0 ? originalPath.slice(apiIndex) : originalPath.replace(/^\/functions\/v1\/find-niche-api/, "");
  if (!path.startsWith("/api") && path !== "/") path = "/api" + (path.startsWith("/") ? path : "/" + path);
  if (path === "/" || path === "/api/health") {
    const { data: config } = await db.from("admin_config").select("id").eq("id", "default").maybeSingle();
    return json({ status: "ok", service: "Find Niche API", admin_configured: Boolean(config), timestamp: new Date().toISOString() });
  }

  if (path === "/api/admin/login" && method === "POST") {
    const body = await req.json().catch(() => ({}));
    const passcode = q(body.passcode);
    if (!passcode) return err("INVALID_CREDENTIALS", "Enter your administrator passcode.", 400);
    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const ipHash = await digest("find-niche-login-v1:" + ip);
    const now = Date.now();
    const { data: attempt } = await db.from("login_attempts").select("*").eq("ip_hash", ipHash).maybeSingle();
    if (attempt && new Date(attempt.reset_at).getTime() > now && attempt.attempts >= 5) {
      return err("TOO_MANY_ATTEMPTS", "Too many login attempts. Please wait 15 minutes before trying again.", 429);
    }
    const { data: config, error: configError } = await db.from("admin_config").select("passcode_hash").eq("id", "default").maybeSingle();
    if (configError || !config) return err("AUTH_NOT_CONFIGURED", "Admin authentication is not configured. Contact the site owner.", 503);
    const givenHash = await digest(passcode);
    if (!safeEqual(givenHash, config.passcode_hash)) {
      const attempts = attempt && new Date(attempt.reset_at).getTime() > now ? attempt.attempts + 1 : 1;
      await db.from("login_attempts").upsert({ ip_hash: ipHash, attempts, reset_at: new Date(now + 15 * 60 * 1000).toISOString() });
      await logAudit("admin.login_failed", "Failed sign-in attempt.", null, "guest");
      return err("INVALID_CREDENTIALS", "Incorrect administrator passcode.", 401);
    }
    await db.from("login_attempts").delete().eq("ip_hash", ipHash);
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("");
    const expiresAt = new Date(now + SESSION_MS).toISOString();
    await db.from("admin_sessions").insert({ id: await digest(token), expires_at: expiresAt, ip_hash: ipHash });
    await logAudit("admin.login_success", "Owner signed in successfully.", null, "owner");
    return json({ success: true, token, role: "owner", expires_at: expiresAt }, 200, {
      "set-cookie": SESSION_COOKIE + "=" + encodeURIComponent(token) + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=14400",
    });
  }

  if (path === "/api/admin/session" && method === "GET") return json({ authenticated: await validSession(req), role: "owner" });
  if (path === "/api/admin/logout" && method === "POST") {
    const token = sessionToken(req);
    if (token) await db.from("admin_sessions").delete().eq("id", await digest(token));
    return json({ success: true, message: "Signed out." }, 200, { "set-cookie": SESSION_COOKIE + "=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" });
  }

  const isAdminRoute = path.startsWith("/api/admin/");
  if (isAdminRoute) {
    const denied = await adminGuard(req);
    if (denied) return denied;
  }

  if (path === "/api/settings" && method === "GET") {
    const { data, error } = await db.from("site_settings").select("*").eq("id", "default").maybeSingle();
    if (error) throw error;
    const { id, ...settings } = data || {};
    return json({ settings });
  }
  if (path === "/api/categories" && method === "GET") return json({ categories: await categoryList(true) });
  if (path === "/api/products" && method === "GET") return json(await productsQuery(url.searchParams));

  if (path.startsWith("/api/products/") && method === "GET") {
    const slug = decodeURIComponent(path.slice("/api/products/".length));
    const { data: product, error } = await db.from("products").select("*").eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
    if (error) throw error;
    if (!product) return err("NOT_FOUND", "Product not found.", 404);
    await db.from("products").update({ view_count: (product.view_count || 0) + 1 }).eq("id", product.id);
    return json({ product: { ...product, view_count: (product.view_count || 0) + 1 } });
  }
  if (path === "/api/clicks" && method === "POST") {
    const body = await req.json().catch(() => ({}));
    const productId = q(body.product_id);
    const source = ["catalog_card", "product_detail", "related_products", "direct"].includes(body.source) ? body.source : "catalog_card";
    if (!productId) return err("BAD_REQUEST", "Valid product ID required.", 400);

    // Privacy-preserving rate limit: store only a one-way hash of the client IP.
    const clientIp = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const ipHash = await digest("find-niche-click-v1:" + clientIp);
    const now = Date.now();
    const { data: previousLimit } = await db.from("click_rate_limits").select("*").eq("ip_hash", ipHash).maybeSingle();
    const activeWindow = previousLimit && new Date(previousLimit.reset_at).getTime() > now;
    if (activeWindow && previousLimit.request_count >= 30) {
      return err("TOO_MANY_REQUESTS", "Rate limit exceeded. Please try again shortly.", 429);
    }
    await db.from("click_rate_limits").upsert({
      ip_hash: ipHash,
      request_count: activeWindow ? previousLimit.request_count + 1 : 1,
      reset_at: activeWindow ? previousLimit.reset_at : new Date(now + 60_000).toISOString()
    });

    const { data: product } = await db.from("products").select("id,click_count").eq("id", productId).eq("status", "published").is("deleted_at", null).maybeSingle();
    if (!product) return err("NOT_FOUND", "Product is not available for click tracking.", 404);
    await db.from("product_clicks").insert({ id: crypto.randomUUID(), product_id: productId, source });
    await db.from("products").update({ click_count: (product.click_count || 0) + 1 }).eq("id", productId);
    return json({ success: true });
  }

  if (path === "/api/admin/products" && method === "GET") {
    const { data, error } = await db.from("products").select("*").order("product_number", { ascending: true });
    if (error) throw error;
    return json({ products: data || [] });
  }
  if (path === "/api/admin/products" && method === "POST") {
    const body = await req.json().catch(() => ({}));
    const validation = productPayload(body, false);
    if (validation) return err("VALIDATION_ERROR", validation);
    const { data: cat } = await db.from("categories").select("id").eq("id", body.category_id).maybeSingle();
    if (!cat) return err("VALIDATION_ERROR", "Select a valid category.");
    let slug = slugify(q(body.name));
    const { data: existing } = await db.from("products").select("id").eq("slug", slug).maybeSingle();
    if (existing) slug = slug + "-" + crypto.randomUUID().slice(0, 6);
    const status = body.status || "draft";
    const row: any = {
      id: crypto.randomUUID(), slug, name: q(body.name).trim(), category_id: body.category_id,
      short_description: q(body.short_description).trim(), description: q(body.description),
      key_points: Array.isArray(body.key_points) ? body.key_points : [],
      useful_for: Array.isArray(body.useful_for) ? body.useful_for : [],
      considerations: q(body.considerations), image_path: q(body.image_path), affiliate_url: q(body.affiliate_url),
      marketplace_code: q(body.marketplace_code) || "US", status,
      ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
    };
    const { data, error } = await db.from("products").insert(row).select("*").single();
    if (error) throw error;
    await logAudit("product.created", "Created product #" + data.product_number + ": " + data.name, data.id);
    return json({ product: data }, 201);
  }
  const bySlugAdmin = path.match(/^\/api\/admin\/products\/by-slug\/(.+)$/);
  if (bySlugAdmin && method === "GET") {
    const slug = decodeURIComponent(bySlugAdmin[1]);
    const { data, error } = await db.from("products").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return err("NOT_FOUND", "Product not found.", 404);
    return json({ product: data });
  }
  const productRoute = path.match(/^\/api\/admin\/products\/([^/]+)(?:\/(publish|hide|permanent))?$/);
  if (productRoute) {
    const id = decodeURIComponent(productRoute[1]);
    const action = productRoute[2];
    if (!action && method === "GET") {
      const { data, error } = await db.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return err("NOT_FOUND", "Product not found.", 404);
      return json({ product: data });
    }
    if (!action && method === "PATCH") {
      const body = await req.json().catch(() => ({}));
      const validation = productPayload(body, true);
      if (validation) return err("VALIDATION_ERROR", validation);
      const { data: existing, error: getError } = await db.from("products").select("*").eq("id", id).maybeSingle();
      if (getError) throw getError;
      if (!existing) return err("NOT_FOUND", "Product not found.", 404);
      const changes: any = { ...body, updated_at: new Date().toISOString() };
      delete changes.id; delete changes.product_number; delete changes.created_at;
      if (changes.name) changes.name = q(changes.name).trim();
      if (changes.slug) changes.slug = slugify(q(changes.slug));
      if (changes.category_id) {
        const { data: cat } = await db.from("categories").select("id").eq("id", changes.category_id).maybeSingle();
        if (!cat) return err("VALIDATION_ERROR", "Select a valid category.");
      }
      if (changes.status === "published" && !existing.published_at) changes.published_at = new Date().toISOString();
      const { data, error } = await db.from("products").update(changes).eq("id", id).select("*").single();
      if (error) throw error;
      await logAudit("product.updated", "Updated product #" + data.product_number + ": " + data.name, id);
      return json({ product: data });
    }
    if (action === "publish" && method === "POST") {
      const { data: existing } = await db.from("products").select("*").eq("id", id).maybeSingle();
      if (!existing) return err("NOT_FOUND", "Product not found.", 404);
      if (!existing.name || !existing.category_id || !existing.short_description || !amazonUrl(existing.affiliate_url)) return err("VALIDATION_ERROR", "Add a name, category, short description, and valid Amazon affiliate URL before publishing.");
      const { data, error } = await db.from("products").update({ status: "published", published_at: existing.published_at || new Date().toISOString(), deleted_at: null, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
      if (error) throw error;
      await logAudit("product.published", "Published product #" + data.product_number + ": " + data.name, id);
      return json({ product: data });
    }
    if (action === "hide" && method === "POST") {
      const { data, error } = await db.from("products").update({ status: "hidden", updated_at: new Date().toISOString() }).eq("id", id).select("*").maybeSingle();
      if (error) throw error;
      if (!data) return err("NOT_FOUND", "Product not found.", 404);
      await logAudit("product.hidden", "Hid product #" + data.product_number + ": " + data.name, id);
      return json({ product: data });
    }
    if (action === "permanent" && method === "DELETE") {
      const { data, error } = await db.from("products").delete().eq("id", id).select("id,name,product_number").maybeSingle();
      if (error) throw error;
      if (!data) return err("NOT_FOUND", "Product not found.", 404);
      await logAudit("product.deleted_permanently", "Permanently deleted product #" + data.product_number + ": " + data.name, id);
      return json({ success: true, message: "Product deleted permanently." });
    }
    if (!action && method === "DELETE") {
      const { data, error } = await db.from("products").update({ status: "archived", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select("*").maybeSingle();
      if (error) throw error;
      if (!data) return err("NOT_FOUND", "Product not found.", 404);
      await logAudit("product.archived", "Archived product #" + data.product_number + ": " + data.name, id);
      return json({ success: true, message: "Product archived. Permanent product number reserved." });
    }
  }

  if (path === "/api/admin/uploads" && method === "POST") {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) return err("NO_FILE", "No image file was received.", 400);
    if (file.size > 5 * 1024 * 1024) return err("INVALID_IMAGE", "Image must be smaller than 5 MB.", 400);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return err("INVALID_IMAGE", "Use a JPEG, PNG, or WEBP image.", 400);
    const bucket = "find-niche-images";
    const { data: bucketInfo, error: bucketError } = await db.storage.getBucket(bucket);
    if (bucketError || !bucketInfo) {
      const { error: createError } = await db.storage.createBucket(bucket, { public: true, fileSizeLimit: 5242880, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] });
      if (createError && !String(createError.message || "").toLowerCase().includes("already exists")) throw createError;
    }
    const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const filename = crypto.randomUUID() + "." + ext;
    const { error: uploadError } = await db.storage.from(bucket).upload(filename, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const urlData = db.storage.from(bucket).getPublicUrl(filename);
    await logAudit("image.uploaded", "Uploaded product image: " + filename);
    return json({ url: urlData.data.publicUrl, filename }, 201);
  }
  const uploadDelete = path.match(/^\/api\/admin\/uploads\/(.+)$/);
  if (uploadDelete && method === "DELETE") {
    const filename = decodeURIComponent(uploadDelete[1]).split("/").pop() || "";
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return err("BAD_REQUEST", "Invalid filename.", 400);
    const { error } = await db.storage.from("find-niche-images").remove([filename]);
    if (error) throw error;
    await logAudit("image.deleted", "Removed product image: " + filename);
    return json({ success: true });
  }

  if (path === "/api/admin/categories" && method === "GET") return json({ categories: await categoryList(false) });
  if (path === "/api/admin/categories" && method === "POST") {
    const body = await req.json().catch(() => ({}));
    const name = q(body.name).trim();
    if (!name || name.length > 100) return err("VALIDATION_ERROR", "Category name must be between 1 and 100 characters.");
    const slug = slugify(name);
    const { data, error } = await db.from("categories").insert({ id: crypto.randomUUID(), name, slug, display_order: Number(body.display_order) || 0, is_active: true }).select("*").single();
    if (error?.code === "23505") return err("CONFLICT", "A category with this name already exists.", 409);
    if (error) throw error;
    await logAudit("category.created", "Created category: " + name, data.id);
    return json({ category: data }, 201);
  }
  const categoryRoute = path.match(/^\/api\/admin\/categories\/([^/]+)$/);
  if (categoryRoute && method === "PATCH") {
    const id = decodeURIComponent(categoryRoute[1]);
    const body = await req.json().catch(() => ({}));
    const changes: any = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) { const name = q(body.name).trim(); if (!name || name.length > 100) return err("VALIDATION_ERROR", "Category name must be between 1 and 100 characters."); changes.name = name; changes.slug = slugify(name); }
    if (body.display_order !== undefined) changes.display_order = Number(body.display_order) || 0;
    if (body.is_active !== undefined) changes.is_active = Boolean(body.is_active);
    const { data, error } = await db.from("categories").update(changes).eq("id", id).select("*").maybeSingle();
    if (error?.code === "23505") return err("CONFLICT", "A category with this name already exists.", 409);
    if (error) throw error;
    if (!data) return err("NOT_FOUND", "Category not found.", 404);
    await logAudit("category.updated", "Updated category: " + data.name, id);
    return json({ category: data });
  }

  if (path === "/api/admin/analytics" && method === "GET") {
    const [{ data: products, error: productsError }, { data: clicks, error: clicksError }] = await Promise.all([
      db.from("products").select("id,product_number,name,status,view_count,click_count,deleted_at").is("deleted_at", null),
      db.from("product_clicks").select("id,product_id,source,clicked_at").order("clicked_at", { ascending: false }).limit(1000),
    ]);
    if (productsError) throw productsError;
    if (clicksError) throw clicksError;
    const allProducts = products || [], allClicks = clicks || [];
    const byId = new Map(allProducts.map((p: any) => [p.id, p]));
    const sources: Record<string, number> = {};
    for (const c of allClicks) sources[c.source] = (sources[c.source] || 0) + 1;
    const top_products = [...allProducts].sort((a: any,b: any) => (b.click_count||0)-(a.click_count||0)).slice(0, 12).map((p: any) => ({ id:p.id, number:p.product_number, name:p.name, clicks:p.click_count||0, views:p.view_count||0 }));
    const recent_clicks = allClicks.slice(0, 20).map((c: any) => ({ id:c.id, product_name:(byId.get(c.product_id) as any)?.name || "Removed product", product_number:(byId.get(c.product_id) as any)?.product_number || null, source:c.source, clicked_at:c.clicked_at }));
    return json({ summary: { total_products: allProducts.length, published_products: allProducts.filter((p:any)=>p.status==="published").length, draft_products: allProducts.filter((p:any)=>p.status==="draft").length, total_clicks: allProducts.reduce((sum:number,p:any)=>sum+(p.click_count||0),0) }, top_products, sources, recent_clicks });
  }
  if (path === "/api/admin/audit-logs" && method === "GET") {
    const { data, error } = await db.from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(100);
    if (error) throw error;
    return json({ logs: data || [] });
  }
  if (path === "/api/admin/export" && method === "GET") {
    const [{ data: products, error: e1 }, { data: categories, error: e2 }] = await Promise.all([
      db.from("products").select("*").order("product_number", { ascending: true }),
      db.from("categories").select("*").order("display_order", { ascending: true }),
    ]);
    if (e1) throw e1; if (e2) throw e2;
    return new Response(JSON.stringify({ store: "Find Niche", exported_at: new Date().toISOString(), catalog: { products: products || [], categories: categories || [] } }, null, 2), { headers: { ...jsonHeaders, "content-type": "application/json", "content-disposition": "attachment; filename=find-niche-catalog-export.json" } });
  }
  if (path === "/api/admin/settings" && method === "PATCH") {
    const body = await req.json().catch(() => ({}));
    const allowed = ["logo_name", "tagline", "hero_headline", "hero_subheadline", "announcement", "admin_theme", "public_theme", "apply_to_public"];
    const changes: any = { updated_at: new Date().toISOString() };
    for (const key of allowed) if (body[key] !== undefined) changes[key] = body[key];
    if (changes.logo_name !== undefined && !q(changes.logo_name).trim()) return err("VALIDATION_ERROR", "Logo name cannot be empty.");
    const { data, error } = await db.from("site_settings").update(changes).eq("id", "default").select("*").single();
    if (error) throw error;
    await logAudit("site.settings_updated", "Updated site branding and settings.");
    const { id, ...settings } = data;
    return json({ settings });
  }
  return err("NOT_FOUND", "API route not found.", 404);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "https://find-nich.vercel.app";
  const allowedOrigins = new Set(["https://find-nich.vercel.app", "https://find-nich-reyan9.vercel.app", "https://find-nich-git-main-reyan9.vercel.app"]);
  const headers = { ...jsonHeaders, "access-control-allow-origin": allowedOrigins.has(origin) ? origin : "https://find-nich.vercel.app", "vary": "Origin" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  try {
    const result = await handle(req);
    const outputHeaders = new Headers(result.headers);
    for (const [key, value] of Object.entries(headers)) {
      if (!outputHeaders.has(key)) outputHeaders.set(key, value);
    }
    return new Response(result.body, { status: result.status, statusText: result.statusText, headers: outputHeaders });
  } catch (error) {
    console.error("Find Niche API error:", error);
    return json({ error: { code: "SERVER_ERROR", message: "The request could not be completed. Please try again." } }, 500, { "access-control-allow-origin": headers["access-control-allow-origin"], "vary": "Origin" });
  }
});
