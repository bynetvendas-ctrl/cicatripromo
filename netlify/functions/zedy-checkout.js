const https = require('https');

// Token and Store ID with fallback to env
const ZEDY_API_TOKEN = process.env.ZEDY_API_TOKEN || 'zdy_7f4f63022802472d9f8cbddafbe6f98b09a4c08e66b34a5cbc85eba694f27b75';
const ZEDY_STORE_ID = process.env.ZEDY_STORE_ID || '38809';

// Catalog mapping embedded directly so it works reliably in Netlify serverless bundle
const CATALOG_MAP = {
  "acido-folico-omega-3-iodo-e-vitaminas-cicatribem-60-capsulas": {
    "title": "Multivitamínico com Ácido Fólico",
    "variantId": 264406020
  },
  "agua-micelar-cicatribem-140ml": {
    "title": "Água Micelar para Limpeza e Hidratação",
    "variantId": 264451635
  },
  "baume-sensation-babalu-50g": {
    "title": "Hidratante Baume Sensation Babalu",
    "variantId": 264402703
  },
  "baume-sensation-floral-50g": {
    "title": "Hidratante Baume Sensation Floral",
    "variantId": 264403291
  },
  "baume-sensation-fresh-50g": {
    "title": "Hidratante Baume Sensation Fresh",
    "variantId": 264403340
  },
  "baume-sensation-sensual-50g": {
    "title": "Hidratante Baume Sensation Sensual",
    "variantId": 264403191
  },
  "body-splash-100ml-babalu-cicatribem": {
    "title": "Body Splash Sensation Babalu",
    "variantId": 264451636
  },
  "body-splash-100ml-floral-cicatribem": {
    "title": "Body Splash Sensation Floral",
    "variantId": 264403653
  },
  "body-splash-100ml-fresh-cicatribem": {
    "title": "Body Splash Sensation Fresh",
    "variantId": 264403728
  },
  "body-splash-100ml-sensual-cicatribem": {
    "title": "Body Splash Sensation Sensual",
    "variantId": 264403212
  },
  "clareador-dermico-cicatribem-60g": {
    "title": "Creme Clareador para Rosto, Corpo e Área Íntima",
    "variantId": 264381169
  },
  "esfoliante-corporal-cicatribem-150g": {
    "title": "Esfoliante Corporal - Tratamento para estrias",
    "variantId": 264399745
  },
  "gel-redutor-cicatribem-200g": {
    "title": "Gel Redutor de Medidas, Celulites e Flacidez",
    "variantId": 264438566
  },
  "hidratante-corporal-cicatribem-420g": {
    "title": "Hidratante Corporal Uso Diário",
    "variantId": 264401494
  },
  "hidratante-corporal-sem-perfume-cicatribem-200g": {
    "title": "Hidratante Corporal Sem Perfume",
    "variantId": 264401551
  },
  "kit-clareamento-total-1-firmador-de-brinde": {
    "title": "Kit Clareamento Total + 1 Firmador de Brinde",
    "variantId": 264399149
  },
  "kit-duplinha-1-creme-anti-estrias-1-esfoliante-cicatribem": {
    "title": "Kit Duplinha Regenerador e Esfoliante Corporal",
    "variantId": 264399835
  },
  "kit-duplinha-clareadora": {
    "title": "Kit Duplinha Clareadora para Uniformizar a Pele",
    "variantId": 264400588
  },
  "kit-duplinha-intima": {
    "title": "Kit Duplinha Íntima Clareadora",
    "variantId": 264451637
  },
  "kit-duplinha-sensation-baume-50g-body-splash100ml-babalu-cicatribem": {
    "title": "Kit Duplinha Sensation Babalu",
    "variantId": 264403401
  },
  "kit-duplinha-sensation-baume-50g-body-splash100ml-floral-cicatribem": {
    "title": "Kit Duplinha Sensation Floral",
    "variantId": 264403680
  },
  "kit-duplinha-sensation-baume-50g-body-splash100ml-fresh-cicatribem": {
    "title": "Kit Duplinha Sensation Fresh",
    "variantId": 264403416
  },
  "kit-duplinha-sensation-baume-50g-body-splash100ml-sensual-cicatribem": {
    "title": "Kit Duplinha Sensation Sensual",
    "variantId": 264403363
  },
  "kit-manchas-zero-protetor-solar-mineral-clareador-de-manchas": {
    "title": "Kit Manchas Zero",
    "variantId": 264405622
  },
  "kit-pele-skincare-serum-pdrn-ghk-cu": {
    "title": "Kit Skincare Coreano",
    "variantId": 264399512
  },
  "kit-tudinho": {
    "title": "Kit Tudinho",
    "variantId": 264401647
  },
  "kit-tudo": {
    "title": "Kit Tudo",
    "variantId": 264401271
  },
  "oferta-serum-hialuronico-facial-30ml": {
    "title": "Sérum Hialurônico Hidratante Facial",
    "variantId": 264401476
  },
  "perolas-de-colageno-30g": {
    "title": "Sérum Facial com Colágeno Nanoencapsulado",
    "variantId": 264402675
  },
  "perolas-de-niacinamida-30g": {
    "title": "Sérum Facial com Niacinamida Nanoencapsulada",
    "variantId": 264405702
  },
  "perolas-de-retinol-30g": {
    "title": "Sérum Facial com Retinol Nanoencapsulado",
    "variantId": 264405756
  },
  "perolas-de-vitamina-c-30g": {
    "title": "Sérum Facial com Vitamina C Nanoencapsulada",
    "variantId": 264405669
  },
  "protetor-solar-mineral-fps-50-cicatribem-50ml": {
    "title": "Protetor Solar Mineral Facial FPS 50",
    "variantId": 264404352
  },
  "regenerador-dermico-cicatribem-150g": {
    "title": "Creme Antiestrias Regenerador Dérmico",
    "variantId": 264398977
  },
  "sabonete-facial-cicatribem-200ml": {
    "title": "Sabonete Facial para Limpeza da Pele",
    "variantId": 264403775
  },
  "serum-clareador-intimo-cicatribem-30ml": {
    "title": "Sérum Clareador Íntimo com Exossomos",
    "variantId": 264399010
  },
  "serum-facial-cicatribem-30ml": {
    "title": "Sérum Hialurônico Hidratante Facial",
    "variantId": 264401476
  },
  "serum-facial-ghk-cu-30ml": {
    "title": "Sérum Facial GHK-Cu com Peptídeos de Cobre",
    "variantId": 264399610
  },
  "serum-facial-pdrn-30ml": {
    "title": "Sérum Facial PDRN com Exossomos",
    "variantId": 264399620
  },
  "serum-firmador-intimo-cicatribem-30ml": {
    "title": "Sérum Firmador Íntimo com Colágeno",
    "variantId": 264405464
  },
  "sugar-body-scrub-esfoliante-corporal-de-coco-sensation-400g": {
    "title": "Sugar Body Scrub - Esfoliante Corporal de Coco",
    "variantId": 264402337
  },
  "sugar-body-scrub-esfoliante-corporal-de-maracuja-sensation-400g": {
    "title": "Sugar Body Scrub - Esfoliante Corporal de Maracujá",
    "variantId": 264402103
  },
  "sugar-body-scrub-esfoliante-corporal-de-melancia-sensation-400g": {
    "title": "Sugar Body Scrub - Esfoliante Corporal de Melancia",
    "variantId": 264401931
  },
  "sugar-body-scrub-esfoliante-corporal-de-morango-sensation-400g": {
    "title": "Sugar Body Scrub - Esfoliante Corporal de Morango",
    "variantId": 264402268
  },
  "creme-para-estrias-cicatribem": {
    "title": "Creme Antiestrias Regenerador Dérmico",
    "variantId": 264398977
  },
  "regenerador-dermico": {
    "title": "Creme Antiestrias Regenerador Dérmico",
    "variantId": 264398977
  },
  "kit-duplinha-regenerador-dermico-esfoliante-corporal": {
    "title": "Kit Duplinha Regenerador e Esfoliante Corporal",
    "variantId": 264399835
  },
  "kit-duplinha-intima-clareadora": {
    "title": "Kit Duplinha Íntima Clareadora",
    "variantId": 264451637
  },
  "agua-micelar": {
    "title": "Água Micelar para Limpeza e Hidratação",
    "variantId": 264451635
  },
  "body-splash-babalu": {
    "title": "Body Splash Sensation Babalu",
    "variantId": 264451636
  }
};

function normalizeText(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveVariantId(item) {
  if (!item) return null;
  if (item.variantId && !isNaN(Number(item.variantId)) && Number(item.variantId) > 1000) {
    return Number(item.variantId);
  }
  const cleanHandle = String(item.handle || '')
    .toLowerCase()
    .replace(/\.html.*$/, '')
    .replace(/.*\/products\//, '')
    .trim();

  if (CATALOG_MAP[cleanHandle]) {
    return CATALOG_MAP[cleanHandle].variantId;
  }

  const rawTitle = String(item.title || '').trim().toLowerCase();
  for (const k of Object.keys(CATALOG_MAP)) {
    if (CATALOG_MAP[k].title.toLowerCase() === rawTitle) {
      return CATALOG_MAP[k].variantId;
    }
  }

  // Fuzzy matching fallback
  const nQuery = normalizeText(cleanHandle) + ' ' + normalizeText(item.title);
  let bestId = null;
  let bestScore = 0;
  for (const k of Object.keys(CATALOG_MAP)) {
    const entry = CATALOG_MAP[k];
    const words = normalizeText(entry.title).split(' ').filter(w => w.length > 2);
    let hits = 0;
    words.forEach(w => {
      if (nQuery.includes(w)) hits++;
    });
    const score = hits / (words.length || 1);
    if (score > bestScore && hits >= 1) {
      bestScore = score;
      bestId = entry.variantId;
    }
  }

  // Default fallback: Creme Antiestrias Regenerador Dérmico
  return bestId || 264398977;
}

function callZedyCreateCheckout(payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'app.zedy.com.br',
      port: 443,
      path: '/api/loja/v1/cart/create-checkout',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZEDY_API_TOKEN}`,
        'X-Store-Id': ZEDY_STORE_ID,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(postData);
    req.end();
  });
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const reqBody = event.body ? JSON.parse(event.body) : {};
    const rawItems = Array.isArray(reqBody.items) ? reqBody.items : [];

    // Map each item in cart to a valid Zedy variantId
    const zedyItemsMap = new Map();

    rawItems.forEach(it => {
      const vId = resolveVariantId(it);
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      if (vId) {
        zedyItemsMap.set(vId, (zedyItemsMap.get(vId) || 0) + qty);
      }
    });

    // If cart was empty, fallback to Regenerador Dérmico
    if (zedyItemsMap.size === 0) {
      zedyItemsMap.set(264398977, 1);
    }

    const itemsPayload = Array.from(zedyItemsMap.entries()).map(([variantId, quantity]) => ({
      variantId,
      quantity
    }));

    const zedyResponse = await callZedyCreateCheckout({ items: itemsPayload });

    if (zedyResponse.statusCode === 200 && zedyResponse.data && zedyResponse.data.checkoutUrl) {
      let checkoutUrl = zedyResponse.data.checkoutUrl;

      // Append tracking parameters (UTMs, SRC, FBCLID, etc.) if provided
      const tracking = reqBody.tracking || reqBody.utm || {};
      const urlObj = new URL(checkoutUrl);
      Object.keys(tracking).forEach(k => {
        if (tracking[k] && typeof tracking[k] === 'string' && tracking[k].trim() !== '') {
          urlObj.searchParams.set(k, tracking[k].trim());
        }
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          checkoutUrl: urlObj.toString()
        })
      };
    } else {
      console.error('Zedy API Error:', zedyResponse);
      return {
        statusCode: zedyResponse.statusCode || 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Erro ao gerar checkout na Zedy',
          details: zedyResponse.data || zedyResponse.raw
        })
      };
    }
  } catch (err) {
    console.error('Zedy Function Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
