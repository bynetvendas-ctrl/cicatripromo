/**
 * Netlify Serverless Function - Cicatribem Painel Admin & API
 * Roteia chamadas de /api/* e /_serverFn/* para AxxonPay, ProPix, Pushin Pay e Netlify Blobs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let db;
try {
  db = require('./db.js');
} catch (e1) {
  try {
    db = require('../db.js');
  } catch (e2) {
    try {
      db = require(path.join(process.cwd(), 'db.js'));
    } catch (e3) {
      db = {};
    }
  }
}

function getConfig() {
  try {
    const configPath = path.join(process.cwd(), 'store.config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch { }
  try {
    const localPath = path.join(__dirname, 'store.config.json');
    if (fs.existsSync(localPath)) {
      return JSON.parse(fs.readFileSync(localPath, 'utf8'));
    }
  } catch { }
  return {};
}

function getAuthTokenForPassword(pwd) {
  return crypto.createHmac('sha256', 'ldf_admin_key_2026').update(String(pwd)).digest('hex');
}

async function isAuthorized(headers) {
  const authHeader = headers['authorization'] || headers['Authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || headers['x-admin-token'] || '';
  if (!token) return false;
  const currentPass = await db.getAdminPassword();
  const expectedToken = getAuthTokenForPassword(currentPass);
  return token === expectedToken;
}

// ─── Tráfego em Tempo Real (Globo 3D & Sessões ao Vivo) ────────────────────────
const liveTraffic = {
  sessions: {},
  events: [],
  todaySessions: 0,
  date: new Date().toISOString().split('T')[0]
};

const BR_CITIES = [
  { city: 'São Paulo', region: 'SP', lat: -23.5505, lng: -46.6333 },
  { city: 'Rio de Janeiro', region: 'RJ', lat: -22.9068, lng: -43.1729 },
  { city: 'Belo Horizonte', region: 'MG', lat: -19.9167, lng: -43.9345 },
  { city: 'Curitiba', region: 'PR', lat: -25.4284, lng: -49.2733 },
  { city: 'Porto Alegre', region: 'RS', lat: -30.0346, lng: -51.2177 },
  { city: 'Salvador', region: 'BA', lat: -12.9714, lng: -38.5014 },
  { city: 'Brasília', region: 'DF', lat: -15.7975, lng: -47.8919 },
  { city: 'Fortaleza', region: 'CE', lat: -3.7172, lng: -38.5433 },
  { city: 'Recife', region: 'PE', lat: -8.0476, lng: -34.8770 },
  { city: 'Goiânia', region: 'GO', lat: -16.6869, lng: -49.2648 },
  { city: 'Campinas', region: 'SP', lat: -22.9099, lng: -47.0626 }
];

function resolveGeo(headers, ip) {
  try {
    const raw = headers && (headers['x-nf-geo'] || headers['x-geo']);
    if (raw) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed.city || parsed.latitude) {
        return {
          city: parsed.city || 'Brasil',
          region: (parsed.subdivision && parsed.subdivision.code) || '',
          lat: Number(parsed.latitude) || -23.55,
          lng: Number(parsed.longitude) || -46.63
        };
      }
    }
  } catch (e) { }

  let hash = 0;
  const str = String(ip || headers?.['x-forwarded-for'] || headers?.['client-ip'] || 'default_user');
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
  const idx = Math.abs(hash) % BR_CITIES.length;
  return BR_CITIES[idx];
}

function recordLiveTraffic(sessId, data, headers, ip) {
  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];
  if (liveTraffic.date !== todayStr) {
    liveTraffic.date = todayStr;
    liveTraffic.todaySessions = 0;
    liveTraffic.sessions = {};
    liveTraffic.events = [];
  }

  const geo = resolveGeo(headers || {}, ip);
  let session = liveTraffic.sessions[sessId];
  if (!session) {
    session = {
      id: sessId,
      device: data.dev || data.device || 'mobile',
      city: geo.city,
      region: geo.region,
      lat: geo.lat,
      lng: geo.lng,
      page: data.page || data.path || '/',
      source: data.src || data.utmSource || data.source || 'direto',
      firstSeen: now,
      lastSeen: now,
      checkoutOpened: false,
      purchased: false
    };
    liveTraffic.sessions[sessId] = session;
    liveTraffic.todaySessions = (liveTraffic.todaySessions || 0) + 1;
  } else {
    session.lastSeen = now;
    if (data.page || data.path) session.page = data.page || data.path;
    if (data.src || data.utmSource || data.source) session.source = data.src || data.utmSource || data.source;
    if (data.dev || data.device) session.device = data.dev || data.device;
  }

  if (data.type === 'event' || data.stage) {
    const evtName = data.name || data.stage || 'navegacao';
    if (evtName === 'checkout_open' || data.stage === 'dados' || data.stage === 'entrega' || data.stage === 'pagamento') {
      session.checkoutOpened = true;
    }
    if (evtName === 'venda_paga' || data.status === 'pedido_gerado' || data.stage === 'checkout_finalizado') {
      session.purchased = true;
    }

    liveTraffic.events.unshift({
      name: evtName,
      label: data.label || data.product || session.page || '',
      city: session.city,
      region: session.region,
      t: now
    });
    if (liveTraffic.events.length > 50) liveTraffic.events.pop();
  }

  const tenMinAgo = now - 10 * 60 * 1000;
  for (const [k, s] of Object.entries(liveTraffic.sessions)) {
    if (s.lastSeen < tenMinAgo) delete liveTraffic.sessions[k];
  }
}

async function callAxxon(method, apiPath, body) {
  const settings = await db.getStoreSettings();
  const publicKey = settings?.axxon?.publicKey || settings?.propay?.clientId || process.env.AXXON_PUBLIC_KEY || '';
  const secretKey = settings?.axxon?.secretKey || settings?.propay?.clientSecret || process.env.AXXON_SECRET_KEY || '';

  return new Promise((resolve) => {
    if (!publicKey || !secretKey) {
      return resolve({ ok: false, error: 'Credenciais AxxonPay não configuradas' });
    }
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.axxonpay.com.br',
      port: 443,
      path: apiPath,
      method,
      headers: {
        'axxon-gateway-publickey': publicKey,
        'axxon-gateway-secretkey': secretKey
      }
    };
    if (postData) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    if (postData) req.write(postData);
    req.end();
  });
}

async function callProPay(method, endpoint, body) {
  const settings = await db.getStoreSettings();
  const cfg = settings?.propay || getConfig()?.propay || {};
  const { clientId, clientSecret, baseUrl = 'https://api.propixbr.com' } = cfg;

  return new Promise((resolve) => {
    if (!clientId || !clientSecret) {
      return resolve({ ok: false, error: 'Credenciais ProPayBR não configuradas' });
    }

    const payload = body ? JSON.stringify(body) : null;
    const urlObj = new URL(endpoint, baseUrl);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
      }
    };
    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

async function callPushinPay(method, endpoint, body, token) {
  return new Promise((resolve) => {
    if (!token) {
      return resolve({ ok: false, error: 'Token Pushin Pay não configurado' });
    }

    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.pushinpay.com.br',
      port: 443,
      path: endpoint,
      method: method.toUpperCase(),
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    };
    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

function fetchCep(cep) {
  return new Promise((resolve) => {
    const cleanCep = String(cep).replace(/\D/g, '');
    if (cleanCep.length !== 8) return resolve({ ok: false, error: 'CEP inválido' });
    https.get(`https://viacep.com.br/ws/${cleanCep}/json/`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.erro) return resolve({ ok: false, error: 'CEP não encontrado' });
          resolve({ ok: true, street: json.logradouro || '', neighborhood: json.bairro || '', city: json.localidade || '', state: json.uf || '' });
        } catch {
          resolve({ ok: false, error: 'Falha ao consultar CEP' });
        }
      });
    }).on('error', () => resolve({ ok: false, error: 'Erro de conexão' }));
  });
}

exports.handler = async (event) => {
  if (db && typeof db.initNetlifyBlobs === 'function') {
    db.initNetlifyBlobs(event);
  }
  const { path: rawPath, httpMethod, headers } = event;
  let pathname = rawPath || '';

  // Normalizar caminho removendo prefixo /.netlify/functions/api se houver
  pathname = pathname.replace(/^\/\.netlify\/functions\/api/, '');
  if (!pathname.startsWith('/')) pathname = '/' + pathname;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tsr-serverFn, accept, x-admin-token',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  let body = null;
  if (event.body) {
    try {
      body = event.isBase64Encoded ? JSON.parse(Buffer.from(event.body, 'base64').toString('utf8')) : JSON.parse(event.body);
    } catch {
      body = event.body;
    }
  }

  // 1. Webhooks de Pagamento (AxxonPay / ProPay / Pushin Pay)
  if (pathname === '/api/webhook/pushinpay' && (httpMethod === 'POST' || httpMethod === 'GET')) {
    if (httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, service: 'Netlify Pushin Pay Webhook', status: 'online' })
      };
    }

    const txId = body?.id || body?.transaction_id || body?.transactionId || '';
    const status = (body?.status || '').toLowerCase();
    const isPaid = status === 'paid' || status === 'completed' || status === 'pago';

    if (isPaid && txId) {
      try {
        const order = await db.getOrderByTransactionId(txId);
        if (order) {
          await db.updateOrderStatus(order.id, 'paid');
          try {
            await db.sendMetaCapiPurchase(order, txId);
          } catch (capiErr) {
            console.warn('[Netlify PushinPay CAPI] Erro ao enviar Purchase:', capiErr.message);
          }
        }
      } catch (err) {
        console.error('PushinPay Webhook error:', err);
      }
    }
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ received: true }) };
  }

  if ((pathname === '/api/webhook/axxon' || pathname === '/api/webhook/propay' || pathname === '/api/webhook/propix' || pathname === '/api/webhook') && (httpMethod === 'POST' || httpMethod === 'GET')) {
    if (httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, service: 'Netlify AxxonPay / ProPay Webhook', status: 'online' })
      };
    }

    const eventType = body?.event || body?.transactionType || body?.type || body?.transactionState || '';
    const txState = body?.transactionState || body?.transaction?.transactionState || body?.status || body?.data?.status || body?.transaction?.status || '';
    const transactionId = body?.transactionId || body?.transaction?.transactionId || body?.data?.transactionId || body?.data?.id || body?.id || '';

    const upperState = String(txState).toUpperCase();
    const isPaid = eventType === 'DEPOSITO_COMPLETO' ||
      upperState === 'COMPLETO' ||
      upperState === 'PAID' ||
      upperState === 'APPROVED' ||
      upperState === 'COMPLETED' ||
      upperState === 'CONFIRMED';

    if (isPaid && transactionId) {
      try {
        const order = await db.getOrderByTransactionId(transactionId);
        if (order) {
          await db.updateOrderStatus(order.id, 'paid');
          try {
            await db.sendMetaCapiPurchase(order, transactionId);
          } catch (capiErr) {
            console.warn('[Netlify CAPI] Erro ao enviar Purchase:', capiErr.message);
          }
        }
      } catch (err) {
        console.error('Webhook error:', err);
      }
    }
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ received: true }) };
  }

  // 2. Admin Auth
  if (pathname === '/api/admin/login' && httpMethod === 'POST') {
    const password = body?.password || '';
    const currentPass = await db.getAdminPassword();
    if (password && password === currentPass) {
      const token = getAuthTokenForPassword(password);
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, token, message: 'Autenticado com sucesso' }) };
    }
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ ok: false, error: 'Senha incorreta' }) };
  }

  if (pathname === '/api/admin/check-session') {
    const ok = await isAuthorized(headers);
    return { statusCode: ok ? 200 : 401, headers: corsHeaders, body: JSON.stringify({ ok }) };
  }

  if (pathname === '/api/admin/change-password' && httpMethod === 'POST') {
    if (!await isAuthorized(headers)) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ ok: false, error: 'Não autorizado' }) };
    const curr = body?.currentPassword || '';
    const next = body?.newPassword || '';
    const currentPass = await db.getAdminPassword();
    if (curr !== currentPass) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ ok: false, error: 'Senha atual incorreta' }) };
    if (!next || next.length < 3) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ ok: false, error: 'Mínimo 3 caracteres' }) };
    await db.setAdminPassword(next);
    const newToken = getAuthTokenForPassword(next);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, message: 'Senha atualizada!', token: newToken }) };
  }

  if (pathname === '/api/admin/settings') {
    if (!await isAuthorized(headers)) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ ok: false, error: 'Não autorizado' }) };
    if (httpMethod === 'GET') {
      const settings = await db.getStoreSettings();
      const activeGateway = settings.activeGateway || 'axxon';
      const propay = settings.propay || {};
      const pushinpay = settings.pushinpay || {};
      const meta = settings.meta || {};
      const pSecret = propay.clientSecret || '';
      const pushToken = pushinpay.token || '';
      const cToken = meta.capiToken || '';
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          ok: true,
          activeGateway,
          propixClientId: propay.clientId || '',
          propixClientSecretSet: !!pSecret,
          propixClientSecretHint: pSecret ? (pSecret.slice(0, 6) + '…') : '',
          pushinpayTokenSet: !!pushToken,
          pushinpayTokenHint: pushToken ? (pushToken.slice(0, 6) + '…') : '',
          metaPixelId: meta.pixelId || '',
          metaCapiTokenSet: !!cToken,
          metaCapiTokenHint: cToken ? (cToken.slice(0, 6) + '…') : '',
        })
      };
    }
    if (httpMethod === 'POST') {
      const updateData = { propay: {}, pushinpay: {}, meta: {}, axxon: {} };
      if (body?.activeGateway !== undefined) updateData.activeGateway = body.activeGateway === 'pushinpay' ? 'pushinpay' : 'axxon';
      if (body?.pushinpayToken !== undefined && String(body.pushinpayToken).trim()) updateData.pushinpay.token = String(body.pushinpayToken).trim();
      if (body?.propixClientId !== undefined) {
        updateData.propay.clientId = String(body.propixClientId).trim();
        updateData.axxon.publicKey = String(body.propixClientId).trim();
      }
      if (body?.propixClientSecret !== undefined && String(body.propixClientSecret).trim()) {
        updateData.propay.clientSecret = String(body.propixClientSecret).trim();
        updateData.axxon.secretKey = String(body.propixClientSecret).trim();
      }
      if (body?.metaPixelId !== undefined) updateData.meta.pixelId = String(body.metaPixelId).trim();
      if (body?.metaCapiToken !== undefined && String(body.metaCapiToken).trim()) updateData.meta.capiToken = String(body.metaCapiToken).trim();

      const ok = await db.setStoreSettings(updateData);
      if (ok) {
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, message: 'Configurações salvas e sincronizadas na Netlify!' }) };
      } else {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ ok: false, error: 'Erro ao gravar no banco de dados' }) };
      }
    }
  }

  // 2.2 Teste de Integração (Pixel, CAPI e Gateway)
  if (pathname === '/api/admin/pixel-test' && httpMethod === 'POST') {
    if (!await isAuthorized(headers)) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ ok: false, error: 'Não autorizado' }) };
    const testEventCode = (body?.testEventCode || '').trim();
    const result = await db.testMetaAndProPix(testEventCode);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
  }

  // 2.3 Configurações Públicas da Loja (Meta Pixel ID para o frontend)
  if (pathname === '/api/site-settings' && httpMethod === 'GET') {
    const settings = await db.getStoreSettings();
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=60',
      },
      body: JSON.stringify({
        metaPixelId: settings.meta?.pixelId || '',
      })
    };
  }

  // 3. Admin Dados
  if (pathname === '/api/admin/leads') {
    if (!await isAuthorized(headers)) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ ok: false }) };
    const leads = await db.getLeads(100);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(leads) };
  }

  if (pathname === '/api/admin/orders') {
    if (!await isAuthorized(headers)) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ ok: false }) };
    const orders = await db.getOrders(100);

    // Auto-conciliação: verifica pedidos Pix recentes pendentes na AxxonPay / ProPix
    const pendingPix = orders.filter(o => o.status === 'pending' && o.transaction_id && !o.transaction_id.startsWith('CARD-'));
    if (pendingPix.length > 0) {
      await Promise.all(pendingPix.slice(0, 5).map(async (order) => {
        try {
          const checkAxxon = await callAxxon('GET', `/api/v1/payments/${encodeURIComponent(order.transaction_id)}`);
          const axxonStatus = String(checkAxxon.data?.status || checkAxxon.data?.data?.status || '').toUpperCase();
          if (axxonStatus === 'PAID' || axxonStatus === 'APPROVED' || axxonStatus === 'COMPLETED') {
            await db.updateOrderStatus(order.id, 'paid');
            order.status = 'paid';
            try { await db.sendMetaCapiPurchase(order, order.transaction_id); } catch {}
          }
        } catch (e) { }
      }));
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(orders) };
  }

  if (pathname === '/api/admin/metrics') {
    if (!await isAuthorized(headers)) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ ok: false }) };
    const metrics = await db.getMetrics();
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(metrics) };
  }

  if (pathname.startsWith('/api/admin/orders/') && pathname.endsWith('/status')) {
    if (!await isAuthorized(headers)) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ ok: false }) };
    const parts = pathname.split('/');
    const orderId = parts[4];
    if (orderId && body?.status) {
      await db.updateOrderStatus(orderId, body.status);
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
    }
  }

  if (pathname === '/api/admin/clear-data' && httpMethod === 'POST') {
    if (!await isAuthorized(headers)) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ ok: false, error: 'Sessão expirada' }) };
    const password = body?.password || '';
    const currentPass = await db.getAdminPassword();
    if (!password || password !== currentPass) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ ok: false, error: 'Senha incorreta. Não foi possível limpar os dados.' }) };
    }
    const result = await db.clearDashboardData();
    liveTraffic.sessions = {};
    return {
      statusCode: result.ok ? 200 : 500,
      headers: corsHeaders,
      body: JSON.stringify(result.ok ? { ok: true, message: 'Dados do painel limpos com sucesso' } : { ok: false, error: result.error })
    };
  }

  if (pathname === '/api/admin/live') {
    if (!await isAuthorized(headers)) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ ok: false, error: 'Não autorizado' }) };

    const now = Date.now();
    const twoMinAgo = now - 2 * 60 * 1000;
    const activeList = Object.values(liveTraffic.sessions).filter(s => s.lastSeen >= twoMinAgo);

    const sessions = activeList.map(s => ({
      id: s.id,
      device: s.device || 'mobile',
      city: s.city || 'São Paulo',
      region: s.region || 'SP',
      page: s.page || '/',
      source: s.source || 'direto',
      secondsActive: Math.max(1, Math.floor((s.lastSeen - s.firstSeen) / 1000)),
      checkoutOpened: !!s.checkoutOpened,
      purchased: !!s.purchased
    }));

    // Agrupa pontos para o Globo 3D
    const cityMap = {};
    for (const s of activeList) {
      const key = `${s.lat}_${s.lng}`;
      if (!cityMap[key]) {
        cityMap[key] = {
          lat: s.lat,
          lng: s.lng,
          city: s.city,
          region: s.region,
          count: 0,
          active: 0
        };
      }
      cityMap[key].count++;
      cityMap[key].active++;
    }

    const points = Object.values(cityMap);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        online: sessions.length,
        sessions: sessions,
        points: points,
        events: liveTraffic.events.slice(0, 25)
      })
    };
  }

  // Rastreio de Tráfego do Cliente (Client Tracker)
  if (pathname === '/api/track' && (httpMethod === 'POST' || httpMethod === 'OPTIONS')) {
    if (httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers: corsHeaders, body: '' };
    }
    const sessId = body?.s || body?.sessionId || ('s_' + Math.random().toString(36).slice(2, 10));
    const ip = headers?.['x-nf-client-connection-ip'] || headers?.['client-ip'] || headers?.['x-forwarded-for'] || '';
    recordLiveTraffic(sessId, body || {}, headers, ip);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
  }

  // 4. Cart Heartbeat
  if (pathname === '/api/cart-heartbeat' && httpMethod === 'POST') {
    const sessId = body?.sessionId || body?.s || ('s_' + Math.random().toString(36).slice(2, 10));
    const ip = headers?.['x-nf-client-connection-ip'] || headers?.['client-ip'] || headers?.['x-forwarded-for'] || '';
    recordLiveTraffic(sessId, { ...body, type: 'event', name: 'checkout_open', stage: body?.stage }, headers, ip);
    if (body) await db.upsertLead(body);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
  }

  // 5. Store Config Pública
  if (pathname === '/api/store-config') {
    const full = getConfig();
    const { propay, axxon, supabase, adminPassword, ...publicConfig } = full;
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(publicConfig) };
  }

  return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
};

