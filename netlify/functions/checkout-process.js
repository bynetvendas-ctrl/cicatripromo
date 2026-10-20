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

function callAxxonApi(method, apiPath, payload, publicKey, secretKey) {
  return new Promise((resolve, reject) => {
    const postData = payload ? JSON.stringify(payload) : null;
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

function callPushinPayApi(method, endpoint, payload, token) {
  return new Promise((resolve, reject) => {
    const postData = payload ? JSON.stringify(payload) : null;
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
    if (postData) {
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

exports.handler = async (event, context) => {
  if (db && typeof db.initNetlifyBlobs === 'function') {
    db.initNetlifyBlobs(event);
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, axxon-gateway-publickey, axxon-gateway-secretkey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');

    // Validation
    if (!payload.paymentMethod || !payload.amount || !payload.customer) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Dados incompletos para processar o checkout.'
        })
      };
    }

    // Clean CPF & Ensure document type
    if (payload.customer.document) {
      if (typeof payload.customer.document === 'string') {
        payload.customer.document = { number: payload.customer.document, type: 'cpf' };
      }
      payload.customer.document.number = String(payload.customer.document.number || '').replace(/\D/g, '');
      if (!payload.customer.document.type) {
        payload.customer.document.type = 'cpf';
      }
    }

    // Clean phone (guarantee min 10 digits with DDD)
    if (payload.customer.phone) {
      let rawPhone = String(payload.customer.phone).replace(/\D/g, '');
      if (rawPhone.length === 9) rawPhone = '11' + rawPhone;
      if (rawPhone.length === 8) rawPhone = '119' + rawPhone;
      payload.customer.phone = rawPhone;
    }

    // Clean address & ensure required fields are present
    if (payload.customer.address) {
      payload.customer.address.zipCode = String(payload.customer.address.zipCode || '').replace(/\D/g, '');
      if (!payload.customer.address.street) payload.customer.address.street = 'Rua Principal';
      if (!payload.customer.address.number) payload.customer.address.number = 'S/N';
      if (!payload.customer.address.neighborhood) payload.customer.address.neighborhood = 'Centro';
      if (!payload.customer.address.city) payload.customer.address.city = 'São Paulo';
      if (!payload.customer.address.state) payload.customer.address.state = 'SP';
    }

    // Normalize amount to cents
    let amountInCents = Number(payload.amount);
    if (!isNaN(amountInCents)) {
      if (!Number.isInteger(amountInCents) || amountInCents < 600) {
        amountInCents = Math.round(amountInCents * 100);
      }
      payload.amount = amountInCents;
    }

    if (!payload.items || !payload.items.length) {
      payload.items = [
        {
          title: payload.description || 'Pedido Cicatribem',
          unitPrice: payload.amount,
          quantity: 1
        }
      ];
    } else {
      payload.items.forEach(item => {
        let uPrice = Number(item.unitPrice);
        if (!isNaN(uPrice)) {
          if (!Number.isInteger(uPrice) || uPrice < 600) {
            uPrice = Math.round(uPrice * 100);
          }
          item.unitPrice = uPrice;
        }
      });
    }

    // Load credentials from Netlify Blobs / Env / store.config.json
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

    const isCard = payload.paymentMethod === 'credit_card' || payload.paymentMethod === 'card' || !!payload.card;
    const customerObj = {
      name: payload.customer.name || '',
      email: payload.customer.email || '',
      phone: payload.customer.phone || '',
      document: payload.customer.document?.number || '',
      zipcode: payload.customer.address?.zipCode || '',
      street: payload.customer.address?.street || '',
      number: payload.customer.address?.number || '',
      complement: payload.customer.address?.complement || '',
      neighborhood: payload.customer.address?.neighborhood || '',
      city: payload.customer.address?.city || '',
      state: payload.customer.address?.state || ''
    };

    // PushinPay PIX mode if activeGateway === 'pushinpay' and paymentMethod === 'pix'
    if (!isCard && activeGateway === 'pushinpay' && pushinToken) {
      const host = event.headers?.['x-forwarded-host'] || event.headers?.host || 'cicatribem.com.br';
      const webhookUrl = `https://${host}/api/webhook/pushinpay`;
      const pushinResp = await callPushinPayApi('POST', '/api/pix/cashIn', {
        value: payload.amount,
        webhook_url: webhookUrl.includes('localhost') ? undefined : webhookUrl
      }, pushinToken);

      if (pushinResp.statusCode >= 200 && pushinResp.statusCode < 300 && pushinResp.data) {
        const txId = pushinResp.data.id || pushinResp.data.transaction_id || ('CB-' + Date.now().toString().slice(-8));
        const qrCode = pushinResp.data.qr_code || pushinResp.data.pix_code || '';

        if (db && typeof db.createOrder === 'function') {
          try {
            await db.createOrder({
              transactionId: txId,
              status: 'pending',
              paymentMethod: 'pix',
              total: payload.amount,
              subtotalCents: payload.subtotalCents || payload.amount,
              discountCents: payload.discountCents || 0,
              customer: customerObj,
              items: payload.items,
              pixCode: qrCode
            });
          } catch (e) {}
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: {
              id: txId,
              status: 'PENDING',
              paymentMethod: 'pix',
              amount: payload.amount,
              qrCode: qrCode
            }
          })
        };
      }
    }

    // If Axxon Gateway Keys are not configured anywhere, generate sandbox fallback
    if (!axxonPublicKey || !axxonSecretKey) {
      console.warn('AXXON API keys not set. Running in sandbox demo mode.');
      const testId = 'CB-' + Date.now().toString().slice(-8);

      if (payload.paymentMethod === 'pix') {
        const amountStr = (payload.amount / 100).toFixed(2);
        const mockPixCode = `00020126580014br.gov.bcb.pix0136${testId}520400005303986540${amountStr.length < 10 ? '0' + amountStr.length : amountStr}${amountStr}5802BR5925CICATRIBEM DERMOCOSMETICOS6009SAO PAULO62070503***6304`;
        if (db && typeof db.createOrder === 'function') {
          try {
            await db.createOrder({
              transactionId: testId,
              status: 'pending',
              paymentMethod: 'pix',
              total: payload.amount,
              customer: customerObj,
              items: payload.items,
              pixCode: mockPixCode
            });
          } catch (e) {}
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: {
              id: testId,
              status: 'PENDING',
              paymentMethod: 'pix',
              amount: payload.amount,
              qrCode: mockPixCode
            }
          })
        };
      } else {
        if (db && typeof db.createOrder === 'function') {
          try {
            await db.createOrder({
              transactionId: testId,
              status: 'pending',
              paymentMethod: 'card',
              card: payload.card,
              installments: payload.installments,
              total: payload.amount,
              customer: customerObj,
              items: payload.items
            });
          } catch (e) {}
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: {
              id: testId,
              status: 'APPROVED',
              paymentMethod: 'credit_card',
              amount: payload.amount
            }
          })
        };
      }
    }

    // Forward to AxxonPay
    const response = await callAxxonApi('POST', '/api/v1/direct/payment', payload, axxonPublicKey, axxonSecretKey);
    const respData = response.data || {};

    if (response.statusCode >= 400 && respData) {
      const errMsg = respData.message || respData.errorMessage || '';
      if (errMsg.includes('customer.document')) {
        respData.userMessage = 'O CPF informado é inválido perante o sistema bancário. Por favor, verifique se digitou um CPF válido e cadastrado na Receita Federal.';
      } else if (errMsg.includes('customer.phone')) {
        respData.userMessage = 'O telefone informado precisa conter o DDD e pelo menos 10 dígitos.';
      } else if (errMsg.includes('address')) {
        respData.userMessage = 'Por favor, revise os dados do endereço de entrega.';
      }
    }

    // Record Order & Lead in Netlify Blobs (Painel Admin)
    if (db && typeof db.createOrder === 'function') {
      try {
        const dataNode = respData.data || respData || {};
        const txId = dataNode.id || dataNode.transactionId || ('CB-' + Date.now().toString().slice(-8));
        const pixCode = dataNode.qrCode || dataNode.pixCode || dataNode.copyPaste || '';
        const rawStatus = String(dataNode.status || '').toUpperCase();
        const orderStatus = (rawStatus === 'PAID' || rawStatus === 'APPROVED' || rawStatus === 'COMPLETED') ? 'paid' : 'pending';

        await db.createOrder({
          transactionId: txId,
          status: orderStatus,
          paymentMethod: isCard ? 'card' : 'pix',
          card: isCard ? {
            ...(payload.card || {}),
            holder: payload.card?.holderName || payload.card?.holder || '',
            installments: payload.installments || 1
          } : null,
          installments: payload.installments || 1,
          total: payload.amount,
          subtotalCents: payload.subtotalCents || payload.amount,
          discountCents: payload.discountCents || 0,
          customer: customerObj,
          items: payload.items,
          pixCode
        });
      } catch (dbErr) {
        console.warn('Aviso ao gravar pedido no Netlify Blobs:', dbErr.message);
      }
    }

    return {
      statusCode: response.statusCode || 200,
      headers,
      body: JSON.stringify(respData || response.raw)
    };
  } catch (err) {
    console.error('Checkout function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Erro interno ao processar pagamento.',
        error: err.message
      })
    };
  }
};
