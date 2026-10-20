const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load .env environment variables safely
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const idx = line.indexOf('=');
      if (idx !== -1) {
        const k = line.substring(0, idx).trim();
        const v = line.substring(idx + 1).trim();
        process.env[k] = v;
      }
    }
  });
}

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname);

function callAxxonApi(method, apiPath, payload) {
  return new Promise((resolve, reject) => {
    const postData = payload ? JSON.stringify(payload) : null;
    const options = {
      hostname: 'api.axxonpay.com.br',
      port: 443,
      path: apiPath,
      method: method,
      headers: {
        'axxon-gateway-publickey': process.env.AXXON_PUBLIC_KEY || '',
        'axxon-gateway-secretkey': process.env.AXXON_SECRET_KEY || ''
      }
    };
    if (postData) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ statusCode: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', err => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

// Dynamic Cart Mock State
let serverCart = {
  token: 'mock-cart-token',
  note: null,
  attributes: {},
  original_total_price: 0,
  total_price: 0,
  total_discount: 0,
  total_weight: 0.0,
  item_count: 0,
  items: [],
  sections: {
    minicart: '',
    'main-cart-items': ''
  }
};

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, axxon-gateway-publickey, axxon-gateway-secretkey');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Normalize path without trailing slash for route matching
  const cleanPath = (pathname.length > 1 && pathname.endsWith('/'))
    ? pathname.replace(/\/+$/, '')
    : pathname;

  // Route /admin to admin.html
  if (cleanPath === '/admin') {
    const adminPath = path.join(ROOT, 'admin.html');
    if (fs.existsSync(adminPath)) {
      return serveFile(adminPath, res, req);
    }
  }

  // Route /checkout to checkout.html
  if (cleanPath === '/checkout') {
    const checkoutPath = path.join(ROOT, 'checkout.html');
    if (fs.existsSync(checkoutPath)) {
      return serveFile(checkoutPath, res, req);
    }
  }

  // Route /collections to /collections/todos-os-produtos.html (matching netlify.toml)
  if (cleanPath === '/collections') {
    res.writeHead(301, { 'Location': '/collections/todos-os-produtos.html' });
    res.end();
    return;
  }

  // Route /products to /collections/todos-os-produtos.html (matching netlify.toml)
  if (cleanPath === '/products') {
    res.writeHead(301, { 'Location': '/collections/todos-os-produtos.html' });
    res.end();
    return;
  }

  // Route /cart to cart.html
  if (cleanPath === '/cart') {
    const cartPath = path.join(ROOT, 'cart.html');
    if (fs.existsSync(cartPath)) {
      return serveFile(cartPath, res, req);
    }
  }

  // Route /search to search.html
  if (cleanPath === '/search') {
    const searchPath = path.join(ROOT, 'search.html');
    if (fs.existsSync(searchPath)) {
      return serveFile(searchPath, res, req);
    }
  }

  // --- Zedy Official Checkout API Endpoint ---
  if ((pathname === '/api/zedy/create-checkout' || pathname === '/.netlify/functions/zedy-checkout') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const zedyHandler = require('./netlify/functions/zedy-checkout.js');
        const event = { httpMethod: 'POST', body };
        const result = await zedyHandler.handler(event, {});
        res.writeHead(result.statusCode, result.headers);
        res.end(result.body);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- AxxonPay Transparent Checkout API Endpoints (integrated with Netlify Blobs / Admin Panel) ---
  if ((pathname === '/api/checkout/process' || pathname === '/.netlify/functions/checkout-process') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const checkoutHandler = require('./netlify/functions/checkout-process.js');
        const event = { httpMethod: 'POST', path: pathname, headers: req.headers, body };
        const result = await checkoutHandler.handler(event, {});
        res.writeHead(result.statusCode || 200, result.headers || { 'Content-Type': 'application/json' });
        res.end(result.body);
      } catch (err) {
        console.error('Checkout error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Erro interno ao processar pagamento.',
          error: err.message
        }));
      }
    });
    return;
  }

  if ((pathname.startsWith('/api/checkout/status/') || pathname.startsWith('/.netlify/functions/checkout-status')) && req.method === 'GET') {
    const paymentId = pathname.startsWith('/api/checkout/status/')
      ? pathname.replace('/api/checkout/status/', '').trim()
      : (parsedUrl.query ? new URLSearchParams(parsedUrl.query).get('id') : '');
    try {
      const statusHandler = require('./netlify/functions/checkout-status.js');
      const event = {
        httpMethod: 'GET',
        path: pathname,
        headers: req.headers,
        queryStringParameters: { id: paymentId }
      };
      const result = await statusHandler.handler(event, {});
      res.writeHead(result.statusCode || 200, result.headers || { 'Content-Type': 'application/json' });
      res.end(result.body);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // --- Painel Admin & API Routes (/api/* and /_serverFn/*) ---
  if (pathname.startsWith('/api/') || pathname.startsWith('/_serverFn/') || pathname.startsWith('/.netlify/functions/api')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const apiHandler = require('./netlify/functions/api.js');
        const event = {
          httpMethod: req.method,
          path: pathname,
          headers: req.headers,
          body: body || null
        };
        const result = await apiHandler.handler(event, {});
        res.writeHead(result.statusCode || 200, result.headers || { 'Content-Type': 'application/json' });
        res.end(result.body);
      } catch (err) {
        console.error('Admin API error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Handle Shopify cart / account / forms mock endpoints
  if (req.method === 'POST') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    if (pathname.includes('/cart/add') || pathname.includes('/cart/change') || pathname.includes('/cart/update') || pathname.includes('/cart/clear')) {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed && parsed.attributes) serverCart.attributes = parsed.attributes;
          if (pathname.includes('/cart/clear')) {
            serverCart.item_count = 0;
            serverCart.items = [];
            serverCart.total_price = 0;
            serverCart.original_total_price = 0;
            serverCart.total_discount = 0;
          } else if (pathname.includes('/cart/add')) {
            let addQty = 2;
            if (parsed && parsed.items && Array.isArray(parsed.items)) {
              addQty = parsed.items.reduce((s, it) => s + (parseInt(it.quantity, 10) || 1), 0);
            } else if (parsed && parsed.quantity) {
              addQty = parseInt(parsed.quantity, 10) || 1;
            }
            serverCart.item_count = Math.max(serverCart.item_count, addQty);
            serverCart.total_price = 22381;
            serverCart.original_total_price = 23980;
            serverCart.total_discount = 1599;
          }
        } catch(e) {}

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(serverCart));
      });
      return;
    }
    if (pathname.includes('/contact')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<div style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Mensagem enviada com sucesso!</h2><p>Obrigado pelo contato.</p><a href="/" style="color:#00badb;">Voltar para o início</a></div>');
      return;
    }
    if (pathname.startsWith('/apps/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, status: 'success', options: {} }));
      return;
    }
  }

  // Handle Shopify cloud background prefetchers & module loaders gracefully
  if (pathname.includes('/checkout-web/assets/') || pathname.includes('/shop-js/modules/') || pathname.includes('/forms-2610/')) {
    res.writeHead(200, { 'Content-Type': pathname.endsWith('.css') ? 'text/css' : 'application/javascript' });
    res.end(pathname.endsWith('.css') ? '/* empty */' : 'export default {};');
    return;
  }

  if (pathname.startsWith('/apps/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, status: 'success', options: {} }));
    return;
  }

  if (pathname === '/cart.js' || pathname === '/cart/change' || pathname === '/cart/change.js') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(serverCart));
    return;
  }

  // Handle Shopify Section Rendering API (e.g. /?sections=minicart)
  if (parsedUrl.query && (parsedUrl.query.includes('sections=') || parsedUrl.query.includes('section_id='))) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      minicart: '<div id="minicart-form"></div>'
    }));
    return;
  }

  // Handle motion.min.js relative imports or direct requests
  if (pathname.endsWith('/motion.min.js') || pathname === '/motion.min.js') {
    const motionPath = path.join(ROOT, 'cdn', 'shop', 't', '79', 'assets', 'motion.min.js');
    if (fs.existsSync(motionPath)) {
      return serveFile(motionPath, res, req);
    }
  }

  // Handle Account / Login / Register / Redirect routes
  if (pathname === '/account' || pathname === '/account/login' || pathname === '/account/register' || pathname.startsWith('/customer_authentication')) {
    const contactPath = path.join(ROOT, 'pages', 'contact.html');
    if (fs.existsSync(contactPath)) {
      return serveFile(contactPath, res, req);
    }
  }

  // Safe path resolution
  let filePath = path.join(ROOT, pathname);

  // Security check: ensure filePath is inside ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Loox reviews widget handler
  if (pathname.startsWith('/widget/') || pathname.startsWith('/loox-reviews')) {
    if (pathname.includes('/rating-icon.svg')) {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      res.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#f4c430" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>');
      return;
    }
    if (pathname.includes('/rating') || pathname.includes('/ratings')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ rating: 4.9, count: 831 }));
      return;
    }
    const widgetPath = path.join(ROOT, 'cdn', 'loox', 'widget.html');
    if (fs.existsSync(widgetPath)) {
      return serveFile(widgetPath, res, req);
    }
  }

  // 1. Try exact file
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(filePath, res, req);
  }

  // 1b. Try Shopify versioned file (e.g. name.v_123.ext or name.*.ext)
  const fileExt = path.extname(filePath);
  const fileDir = path.dirname(filePath);
  const fileBase = path.basename(filePath, fileExt);

  if (fileExt && fs.existsSync(fileDir)) {
    const vParam = parsedUrl.query ? new URLSearchParams(parsedUrl.query).get('v') : null;
    if (vParam) {
      const versionedPath = path.join(fileDir, `${fileBase}.v_${vParam}${fileExt}`);
      if (fs.existsSync(versionedPath) && fs.statSync(versionedPath).isFile()) {
        return serveFile(versionedPath, res, req);
      }
    }
    try {
      const dirEntries = fs.readdirSync(fileDir);
      const match = dirEntries.find(f => (f.startsWith(fileBase + '.v_') || f.startsWith(fileBase)) && f.endsWith(fileExt));
      if (match) {
        const candidatePath = path.join(fileDir, match);
        if (fs.statSync(candidatePath).isFile()) {
          return serveFile(candidatePath, res, req);
        }
      }
    } catch(e) {}
  }

  // 2. Try with .html extension (e.g. /products/foo or /collections/mais-vendidos/ -> .html)
  const candidatePath = filePath.replace(/[\\\/]+$/, '');
  if (!path.extname(candidatePath)) {
    const htmlPath = candidatePath + '.html';
    if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
      return serveFile(htmlPath, res, req);
    }
  }

  // 3. Try directory index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
      return serveFile(indexPath, res, req);
    }
    // Fallback for /collections directory
    if (cleanPath.startsWith('/collections')) {
      const todosPath = path.join(ROOT, 'collections', 'todos-os-produtos.html');
      if (fs.existsSync(todosPath)) {
        return serveFile(todosPath, res, req);
      }
    }
  }

  // 4. 404 Not Found
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<h1>404 Not Found</h1><p>O arquivo <code>${pathname}</code> não foi encontrado.</p><p><a href="/">Voltar para o início</a></p>`);
});

function serveFile(filePath, res, req) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const stat = fs.statSync(filePath);
  const total = stat.size;

  if (req && req.headers && req.headers.range) {
    const range = req.headers.range;
    const parts = range.replace(/bytes=/, '').split('-');
    const partialstart = parts[0];
    const partialend = parts[1];

    const start = parseInt(partialstart, 10);
    const end = partialend ? parseInt(partialend, 10) : total - 1;
    const chunksize = (end - start) + 1;

    res.writeHead(206, {
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath, { start: start, end: end });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': total,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
