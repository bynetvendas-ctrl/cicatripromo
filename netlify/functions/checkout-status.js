const https = require('https');
const path = require('path');

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
      db = null;
    }
  }
}

function callAxxonApi(method, apiPath, publicKey, secretKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.axxonpay.com.br',
      port: 443,
      path: apiPath,
      method: method,
      headers: {
        'axxon-gateway-publickey': publicKey,
        'axxon-gateway-secretkey': secretKey
      }
    };
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
    req.end();
  });
}

function callPushinPayApi(method, endpoint, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.pushinpay.com.br',
      port: 443,
      path: endpoint,
      method: method.toUpperCase(),
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
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
    req.end();
  });
}

exports.handler = async (event, context) => {
  if (db && typeof db.initNetlifyBlobs === 'function') {
    db.initNetlifyBlobs(event);
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, axxon-gateway-publickey, axxon-gateway-secretkey',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Get paymentId from query parameters or path
  let paymentId = (event.queryStringParameters && event.queryStringParameters.id) || '';
  if (!paymentId && event.path) {
    const parts = event.path.split('/');
    paymentId = parts[parts.length - 1];
  }

  if (!paymentId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing payment ID' })
    };
  }

  let settings = {};
  if (db && typeof db.getStoreSettings === 'function') {
    try {
      settings = await db.getStoreSettings();
    } catch (e) {}
  }

  const activeGateway = settings.activeGateway || 'axxon';
  const axxonPublicKey = settings.axxon?.publicKey || settings.propay?.clientId || process.env.AXXON_PUBLIC_KEY || '';
  const axxonSecretKey = settings.axxon?.secretKey || settings.propay?.clientSecret || process.env.AXXON_SECRET_KEY || '';
  const pushinToken = settings.pushinpay?.token || process.env.PUSHINPAY_TOKEN || '';

  if (activeGateway === 'pushinpay' && pushinToken && !paymentId.startsWith('CB-')) {
    try {
      const check = await callPushinPayApi('GET', `/api/transactions/${encodeURIComponent(paymentId)}`, pushinToken);
      const st = String(check.data?.status || '').toLowerCase();
      const isPaid = st === 'paid' || st === 'completed' || st === 'pago';
      if (isPaid && db && typeof db.updateOrderStatus === 'function') {
        const order = await db.getOrderByTransactionId(paymentId);
        if (order) {
          await db.updateOrderStatus(order.id, 'paid');
          try { await db.sendMetaCapiPurchase(order, paymentId); } catch (e) {}
        }
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          data: {
            id: paymentId,
            status: isPaid ? 'PAID' : 'PENDING'
          }
        })
      };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  if (!axxonPublicKey || !axxonSecretKey || paymentId.startsWith('CB-')) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: {
          id: paymentId,
          status: 'PENDING'
        }
      })
    };
  }

  try {
    const response = await callAxxonApi('GET', `/api/v1/payments/${encodeURIComponent(paymentId)}`, axxonPublicKey, axxonSecretKey);
    const respData = response.data || {};
    const statusStr = String(respData.status || (respData.data ? respData.data.status : '')).toUpperCase();

    if ((statusStr === 'PAID' || statusStr === 'APPROVED' || statusStr === 'COMPLETED') && db && typeof db.updateOrderStatus === 'function') {
      try {
        const order = await db.getOrderByTransactionId(paymentId);
        if (order && order.status !== 'paid') {
          await db.updateOrderStatus(order.id, 'paid');
          try { await db.sendMetaCapiPurchase(order, paymentId); } catch (e) {}
        }
      } catch (e) {}
    }

    return {
      statusCode: response.statusCode || 200,
      headers,
      body: JSON.stringify(respData || response.raw)
    };
  } catch (err) {
    console.error('Status function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
