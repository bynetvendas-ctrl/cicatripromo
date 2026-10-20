// Cicatribem Reactive Minicart Controller & Store Interactivity
(function () {
  'use strict';

  function fmtBRL(cents) {
    return 'R$ ' + (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  let storeCatalog = [];
  let storeCatalogMap = {};

  function loadStoreCatalog() {
    try {
      fetch('/search/products.json')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            storeCatalog = data;
            data.forEach(p => {
              if (p.handle) {
                storeCatalogMap[p.handle.toLowerCase().replace(/\.html.*$/, '')] = p;
              }
              if (p.title) {
                storeCatalogMap[p.title.trim().toLowerCase()] = p;
              }
            });
          }
        })
        .catch(() => {});
    } catch (e) {}
  }
  loadStoreCatalog();

  function getProductFromCatalog(handle, title) {
    if (handle) {
      const cleanH = String(handle).toLowerCase().replace(/\.html.*$/, '').replace(/.*\/products\//, '').trim();
      if (storeCatalogMap[cleanH]) return storeCatalogMap[cleanH];
    }
    if (title) {
      const cleanT = String(title).trim().toLowerCase();
      if (storeCatalogMap[cleanT]) return storeCatalogMap[cleanT];
    }
    return null;
  }

  function normalizeImageUrl(url, handle) {
    if (!url || typeof url !== 'string' || url.trim() === '' || url.trim() === '/') {
      if (handle) {
        const p = getProductFromCatalog(handle);
        if (p && p.featured_image) return p.featured_image;
      }
      return '/cdn/shop/files/Serum-Hidratante---1-Unid.v_1771004172_width_180.jpg';
    }
    var u = url.trim();

    // Prevent turning data: URIs into broken relative paths like /data:image/...
    if (u.startsWith('data:')) {
      if (handle) {
        const p = getProductFromCatalog(handle);
        if (p && p.featured_image) return p.featured_image;
      }
      return '/cdn/shop/files/Serum-Hidratante---1-Unid.v_1771004172_width_180.jpg';
    }

    try {
      if (u.startsWith('http://') || u.startsWith('https://')) {
        var parsed = new URL(u);
        u = parsed.pathname;
      }
    } catch(e) {}
    u = u.replace(/^(\.\.\/)+/, '').replace(/^(\.\/)+/, '');
    if (u.startsWith('cdn/')) u = '/' + u;
    if (!u.startsWith('/') && !u.startsWith('http')) u = '/' + u;
    if (u.toLowerCase().includes('designsemnome') || u.toLowerCase().includes('design_sem_nome') || u === '/' || u === '') {
      if (handle) {
        const p = getProductFromCatalog(handle);
        if (p && p.featured_image) return p.featured_image;
      }
      return '/cdn/shop/files/Serum-Hidratante---1-Unid.v_1771004172_width_180.jpg';
    }
    return u;
  }

  const STORAGE_KEY = 'cicatribem_cart_items_v2';
  const EMPTY_FLAG_KEY = 'cicatribem_cart_empty';

  class CicatribemMinicartController {
    constructor() {
      this.pendingPurchase = null;
      this.currentUpsellIndex = 0;
      this.upsellProducts = [
        {
          id: 'serum-ghk-cu-upsell',
          handle: 'serum-facial-ghk-cu-30ml',
          title: 'Sérum Facial GHK-Cu com Peptídeos de Cobre',
          variant: '',
          image: '/cdn/shop/files/4321c41162468c99456a0f6e2c270884.v_1788955890_width_1080.jpg',
          originalPrice: 'R$ 129,90',
          priceFormatted: 'R$ 103,92',
          discountLabel: '20% OFF',
          discountPercent: 20,
          unitPriceCents: 10392
        },
        {
          id: 'esfoliante-corporal-upsell',
          handle: 'esfoliante-corporal-cicatribem-150g',
          title: 'Esfoliante Corporal - Tratamento para estrias',
          variant: '',
          image: '/cdn/shop/files/Esfoliante---1-Unid.v_1771003381_width_600.jpg',
          originalPrice: 'R$ 119,90',
          priceFormatted: 'R$ 79,90',
          discountLabel: '33% OFF',
          discountPercent: 33,
          unitPriceCents: 7990
        },
        {
          id: 'clareador-dermico-upsell',
          handle: 'clareador-dermico-cicatribem-60g',
          title: 'Creme Clareador Dérmico Rosto e Corpo',
          variant: '',
          image: '/cdn/shop/files/Clareador---1-Unid---Com-Selo_jpg.v_1781026546_width_600.jpg',
          originalPrice: 'R$ 139,90',
          priceFormatted: 'R$ 97,90',
          discountLabel: '30% OFF',
          discountPercent: 30,
          unitPriceCents: 9790
        }
      ];
      this.init();
    }

    slideUpsell(delta) {
      if (!this.upsellProducts || this.upsellProducts.length <= 1) return;
      const total = this.upsellProducts.length;
      this.currentUpsellIndex = (this.currentUpsellIndex + delta + total) % total;
      this.updateUpsellTrack();
    }

    goToUpsell(index) {
      if (!this.upsellProducts || index < 0 || index >= this.upsellProducts.length) return;
      this.currentUpsellIndex = index;
      this.updateUpsellTrack();
    }

    updateUpsellTrack() {
      if (!this.cartDrawer) return;
      const track = this.cartDrawer.querySelector('.upsell-slider-track');
      if (track) {
        track.style.transform = `translateX(-${this.currentUpsellIndex * 100}%)`;
      }
      const dots = this.cartDrawer.querySelectorAll('.btn-upsell-dot');
      dots.forEach((dot, idx) => {
        if (idx === this.currentUpsellIndex) {
          dot.style.width = '18px';
          dot.style.background = '#111';
        } else {
          dot.style.width = '8px';
          dot.style.background = '#ccc';
        }
      });
    }

    init() {
      const start = () => {
        if (!document.getElementById('zedy-cart-spin-style')) {
          const st = document.createElement('style');
          st.id = 'zedy-cart-spin-style';
          st.textContent = '@keyframes zedyCartSpin { to { transform: rotate(360deg); } }';
          document.head.appendChild(st);
        }
        // Gateway ativo: 'axxon' (checkout transparente na loja) ou 'zedy' (checkout oficial externo)
        window.CICATRIBEM_CHECKOUT_GATEWAY = window.CICATRIBEM_CHECKOUT_GATEWAY || 'axxon';
        this.getTrackingParams();
        this.cartDrawer = document.getElementById('minicart_wrapper');
        this.initEventListeners();
        this.initOutsideClickClose();
        this.initPagination();
        this.initNewsletter();
        this.initSearch();
        if (this.cartDrawer) {
          this.render();
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
      } else {
        start();
      }
    }

    getItems() {
      if (sessionStorage.getItem(EMPTY_FLAG_KEY) === 'true') {
        return [];
      }
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            let changed = false;
            parsed.forEach(it => {
              const norm = normalizeImageUrl(it.image, it.handle);
              if (it.image !== norm) {
                it.image = norm;
                changed = true;
              }
              if (!it.unitPriceCents && it.price) {
                it.unitPriceCents = it.price;
                changed = true;
              }
              if (!it.unitPriceCents || it.unitPriceCents < 1000) {
                const catP = getProductFromCatalog(it.handle, it.title);
                if (catP && catP.price) {
                  it.unitPriceCents = catP.price;
                  changed = true;
                }
              }
            });
            if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            return parsed;
          }
        }
      } catch (e) {}
      return [];
    }

    saveItems(items) {
      if (!items || items.length === 0) {
        sessionStorage.setItem(EMPTY_FLAG_KEY, 'true');
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      } else {
        sessionStorage.removeItem(EMPTY_FLAG_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
      this.render();
    }

    addItem(newItem) {
      sessionStorage.removeItem(EMPTY_FLAG_KEY);
      if (!newItem.unitPriceCents && newItem.price) {
        newItem.unitPriceCents = newItem.price;
      }
      if (!newItem.unitPriceCents || newItem.unitPriceCents < 1000) {
        const catP = getProductFromCatalog(newItem.handle, newItem.title);
        if (catP && catP.price) {
          newItem.unitPriceCents = catP.price;
        } else if (!newItem.unitPriceCents) {
          newItem.unitPriceCents = 11990;
        }
      }
      if (!newItem.id) {
        newItem.id = (newItem.handle || 'item') + '-card';
      }
      newItem.image = normalizeImageUrl(newItem.image, newItem.handle);
      const items = this.getItems();
      const existing = items.find(
        it => it.id === newItem.id || (it.handle === newItem.handle && it.variant === newItem.variant)
      );
      if (existing) {
        existing.quantity += newItem.quantity || 1;
        if (newItem.discountPercent !== undefined) existing.discountPercent = newItem.discountPercent;
        if (newItem.discountLabel !== undefined) existing.discountLabel = newItem.discountLabel;
      } else {
        items.push(newItem);
      }
      this.saveItems(items);
      this.openCart();
    }

    updateQuantity(id, delta) {
      const items = this.getItems();
      const it = items.find(i => i.id === id);
      if (!it) return;

      it.quantity += delta;
      if (it.quantity <= 0) {
        this.removeItem(id);
        return;
      }

      if (it.handle === 'clareador-dermico-cicatribem-60g') {
        if (it.quantity === 1) {
          it.discountPercent = 0;
          it.discountLabel = '';
        } else if (it.quantity === 2) {
          it.discountPercent = 5;
          it.discountLabel = '5% OFF - 2 UNIDADES';
        } else if (it.quantity === 3) {
          it.discountPercent = 10;
          it.discountLabel = '10% OFF - 3 UNIDADES';
        } else if (it.quantity >= 4) {
          it.discountPercent = 15;
          it.discountLabel = '15% OFF - 4 UNIDADES';
        }
      }

      this.saveItems(items);
    }

    removeItem(id) {
      if (!this.cartDrawer) return;
      let itemEl = id ? this.cartDrawer.querySelector(`[data-item-id="${id}"]`) : null;
      if (!itemEl && id) {
        itemEl = document.getElementById(id);
      }
      if (!itemEl) {
        itemEl = this.cartDrawer.querySelector('.cart-item');
      }

      if (itemEl) {
        itemEl.style.transition = 'all 0.3s ease';
        itemEl.style.opacity = '0';
        itemEl.style.transform = 'translateX(40px)';
      }

      setTimeout(() => {
        if (itemEl && itemEl.parentNode) {
          itemEl.remove();
        }
        let items = this.getItems();
        if (id) {
          items = items.filter(i => i.id !== id && i.handle !== id && !id.includes(i.handle));
        } else {
          items = [];
        }
        const remaining = this.cartDrawer.querySelectorAll('.cart-item');
        if (remaining.length === 0) {
          items = [];
        }
        this.saveItems(items);
      }, 250);
    }

    getTrackingParams() {
      const tracking = {};
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'src', 'sck', 'fbclid', 'gclid', 'ttclid'];
        keys.forEach(k => {
          const val = searchParams.get(k);
          if (val) tracking[k] = val;
        });

        const stored = sessionStorage.getItem('cicatribem_tracking_params') || localStorage.getItem('cicatribem_tracking_params');
        if (stored) {
          const parsed = JSON.parse(stored);
          Object.keys(parsed).forEach(k => {
            if (!tracking[k] && parsed[k]) tracking[k] = parsed[k];
          });
        }

        if (Object.keys(tracking).length > 0) {
          sessionStorage.setItem('cicatribem_tracking_params', JSON.stringify(tracking));
          localStorage.setItem('cicatribem_tracking_params', JSON.stringify(tracking));
        }
      } catch (e) {}
      return tracking;
    }

    async proceedToZedyCheckout(triggerBtn) {
      const items = this.getItems();
      if (!items || items.length === 0) {
        window.location.href = '/collections/todos-os-produtos.html';
        return;
      }

      let originalHtml = '';
      if (triggerBtn) {
        originalHtml = triggerBtn.innerHTML;
        triggerBtn.style.pointerEvents = 'none';
        triggerBtn.style.opacity = '0.9';
        triggerBtn.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;">
            <span style="display:inline-block;width:16px;height:16px;border:2px solid #ffffff;border-top-color:transparent;border-radius:50%;animation:zedyCartSpin 0.8s linear infinite;"></span>
            <span>Iniciando checkout seguro...</span>
          </div>
        `;
      }

      const tracking = this.getTrackingParams();

      try {
        const response = await fetch('/api/zedy/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, tracking })
        });

        const data = await response.json();
        if (data && data.success && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
      } catch (err) {
        console.error('Falha ao conectar com Zedy:', err);
      }

      if (triggerBtn && originalHtml) {
        triggerBtn.innerHTML = originalHtml;
        triggerBtn.style.pointerEvents = '';
        triggerBtn.style.opacity = '';
      }
      window.location.href = '/checkout';
    }

    proceedToCheckout(triggerBtn) {
      if (window.CICATRIBEM_CHECKOUT_GATEWAY === 'zedy') {
        this.proceedToZedyCheckout(triggerBtn);
      } else {
        window.location.href = '/checkout';
      }
    }

    openCart() {
      if (!this.cartDrawer) {
        this.proceedToCheckout();
        return;
      }
      this.render();
      const cn = document.querySelector('cart-notification#minicart_wrapper, cart-notification');
      if (cn && typeof cn.open === 'function') {
        cn.open();
      }
      const w = this.cartDrawer.querySelector('.minicart__wrapper') || this.cartDrawer;
      w.classList.add('open');
      this.cartDrawer.classList.add('open');
      document.documentElement.classList.add('open-drawer', 'open-minicart');
    }

    closeCart() {
      if (!this.cartDrawer) return;
      const cn = document.querySelector('cart-notification#minicart_wrapper, cart-notification');
      if (cn && typeof cn.close === 'function') {
        cn.close();
      }
      const w = this.cartDrawer.querySelector('.minicart__wrapper') || this.cartDrawer;
      w.classList.remove('open');
      this.cartDrawer.classList.remove('open');
      document.documentElement.classList.remove('open-drawer', 'open-minicart');
    }

    openUpsellModal(modal) {
      if (!modal) return;
      modal.hidden = false;
      modal.style.display = 'flex';
      document.documentElement.style.overflow = 'hidden';

      const timerEl = modal.querySelector('.upcjc__timer');
      if (timerEl && !modal.dataset.timerRunning) {
        modal.dataset.timerRunning = 'true';
        let left = parseInt(modal.getAttribute('data-timer'), 10) || 300;
        const tick = () => {
          if (modal.hidden || modal.style.display === 'none') return;
          const m = Math.floor(left / 60);
          const s = left % 60;
          timerEl.textContent = (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
          if (left-- > 0) {
            setTimeout(tick, 1000);
          }
        };
        tick();
      }

      const vid = modal.querySelector('video');
      if (vid) {
        const src = vid.querySelector('source');
        if (src && src.dataset.src && !src.src) {
          src.src = src.dataset.src;
          vid.load();
        }
        vid.play && vid.play().catch(function(){});
      }
    }

    closeUpsellModal(modal) {
      if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
        modal.dataset.decidiu = '1';
      }
      document.querySelectorAll('.upcjc, [data-upcjc], [data-upcjh]').forEach(m => {
        m.hidden = true;
        m.style.display = 'none';
        m.dataset.decidiu = '1';
      });
      document.documentElement.style.overflow = '';
      document.querySelectorAll('.tc-cta, .satc__btn, .product_submit_button, .vc__comprar').forEach(b => {
        b.disabled = false;
      });
    }

    handleCardPurchase(card, buyBtn) {
      if (!card && buyBtn) {
        card = buyBtn.closest('.vc__card, .product-item, .product-card, .loadmore-item');
      }
      if (!card && !buyBtn) return;

      // 1. Determine Handle
      let handle = '';
      if (buyBtn && (buyBtn.dataset.id || buyBtn.dataset.handle)) {
        handle = buyBtn.dataset.id || buyBtn.dataset.handle;
      }
      if (!handle && card) {
        const linkEl = card.querySelector('a.vc__foto, a.vc__titulo, a.istoria-card__media, a.istoria-card__title, a[href*="/products/"]');
        const href = linkEl ? linkEl.getAttribute('href') : '';
        const m = (href || '').match(/\/products\/([^/?#]+)/);
        if (m) handle = m[1].replace('.html', '');
      }

      // 2. Determine Title
      let title = '';
      if (buyBtn && buyBtn.dataset.title) {
        title = buyBtn.dataset.title.trim();
      }
      if (!title && card) {
        const titleEl = card.querySelector('.vc__titulo, .istoria-card__title, .product-item__title, h3, h4');
        if (titleEl) title = titleEl.textContent.trim();
      }

      // 3. Match from store catalog if available
      const catProduct = getProductFromCatalog(handle, title);
      if (catProduct) {
        if (!handle) handle = catProduct.handle;
        if (!title) title = catProduct.title;
      }
      if (!handle) handle = 'produto-cicatribem';
      if (!title) title = 'Produto Cicatribem';

      // 4. Determine Price in Cents (NEVER use installment amount like 25,90!)
      let priceCents = 0;
      if (buyBtn && buyBtn.dataset.price) {
        const pVal = parseInt(buyBtn.dataset.price, 10);
        if (!isNaN(pVal) && pVal > 0) priceCents = pVal;
      }
      if (!priceCents && catProduct && catProduct.price) {
        priceCents = catProduct.price;
      }
      if (!priceCents && card) {
        // Look specifically for full price selectors ONLY, NEVER .vc__precos or .vc__parcelado
        const fullPriceEl = card.querySelector('.vc__cheio-val, .card-product-price .price, .price-regular .price, [data-ph-preco], s');
        if (fullPriceEl) {
          const m = fullPriceEl.textContent.match(/R\$\s*([\d.]+),(\d{2})/);
          if (m) priceCents = parseInt(m[1].replace(/\./g, '') + m[2], 10);
        }
        if (!priceCents) {
          const pixEl = card.querySelector('.vc__pix');
          if (pixEl) {
            const m = pixEl.textContent.match(/R\$\s*([\d.]+),(\d{2})/);
            if (m) {
              const pixCents = parseInt(m[1].replace(/\./g, '') + m[2], 10);
              priceCents = Math.round(pixCents / 0.97);
            }
          }
        }
      }
      if (!priceCents || priceCents < 1000) {
        priceCents = catProduct ? catProduct.price : 11990;
      }

      // 5. Determine Image (clean path, NEVER broken data: URI)
      let rawImage = '';
      if (catProduct && catProduct.featured_image) {
        rawImage = catProduct.featured_image;
      } else if (buyBtn && buyBtn.dataset.image) {
        rawImage = buyBtn.dataset.image;
      } else if (card) {
        const imgEl = card.querySelector('.vc__foto img, .istoria-card__media img, .product-item img, img');
        if (imgEl) {
          const s = imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || imgEl.src;
          if (s && !s.startsWith('data:')) rawImage = s;
        }
      }
      const finalImage = normalizeImageUrl(rawImage, handle);

      this.addItem({
        id: handle + '-card',
        handle: handle,
        title: title,
        variant: 'Padrão',
        image: finalImage,
        unitPriceCents: priceCents,
        quantity: 1,
        discountPercent: 0,
        discountLabel: ''
      });
    }

    handleBundlePurchase() {
      const checkedOffer = document.querySelector('.tc-offer__input:checked');
      const offerContainer = checkedOffer ? checkedOffer.closest('.tc-offer') : document.querySelector('.tc-offer[data-qty="2"]');

      let qty = 2;
      let finalCents = 22381;
      let baseCents = 23980;
      let discPct = 5;
      let discLabel = '5% OFF - 2 UNIDADES';

      if (offerContainer) {
        qty = parseInt(offerContainer.dataset.qty, 10) || 2;
        finalCents = parseInt(offerContainer.dataset.finalCents, 10) || 22381;
        baseCents = parseInt(offerContainer.dataset.baseCents, 10) || (qty * 11990);
        discPct = parseFloat(offerContainer.dataset.disc || '0');
        if (qty === 2) discLabel = '5% OFF - 2 UNIDADES';
        else if (qty === 3) discLabel = '10% OFF - 3 UNIDADES';
        else if (qty >= 4) discLabel = '15% OFF - 4 UNIDADES';
        else discLabel = '';
      }

      let fragrance = 'Fragrância: Baunilha';
      const checkedSwatch = document.querySelector('.tc-swatches input[type="radio"]:checked');
      if (checkedSwatch) {
        const swatchLabel = checkedSwatch.closest('label')?.textContent.trim() || checkedSwatch.value;
        if (swatchLabel) fragrance = 'Fragrância: ' + swatchLabel;
      } else {
        const anySwatch = document.querySelector('.tc-swatch.is-chosen, .tc-swatch.is-selected');
        if (anySwatch) {
          fragrance = 'Fragrância: ' + anySwatch.textContent.trim();
        } else {
          fragrance = 'Padrão';
        }
      }

      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const rawHandle = pathParts.pop() || '';
      const handle = rawHandle.replace('.html', '') || 'clareador-dermico-cicatribem-60g';

      const titleEl = document.querySelector('h1.product__title, .product-title, h1');
      const title = titleEl ? titleEl.textContent.trim() : 'Creme Clareador para Rosto, Corpo e Área Íntima';

      const imgEl = document.querySelector('.product__media img, .product-gallery img, .bls-image-js img, [data-media-id] img');
      const rawImage = imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || imgEl.src) : '/cdn/shop/files/Clareador---1-Unid---Com-Selo_jpg.v_1781026546_width_96.jpg';

      this.addItem({
        id: handle + '-bundle-' + qty,
        handle: handle,
        title: title,
        variant: fragrance,
        image: normalizeImageUrl(rawImage),
        unitPriceCents: Math.round(baseCents / qty) || 11990,
        quantity: qty,
        discountPercent: discPct,
        discountLabel: discLabel
      });
    }

    handleStandardPurchase(btn) {
      const card = btn ? btn.closest('.vc__card, .product-item, .product-card, .loadmore-item') : null;
      if (card) {
        return this.handleCardPurchase(card, btn);
      }
      if (btn && (btn.dataset.id || btn.dataset.handle)) {
        return this.handleCardPurchase(null, btn);
      }

      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const rawHandle = pathParts.pop() || '';
      const handle = rawHandle.replace('.html', '') || 'produto-cicatribem';

      const catProduct = getProductFromCatalog(handle);

      const titleEl = document.querySelector('h1.product__title, .product-title, h1');
      const title = titleEl ? titleEl.textContent.trim() : (catProduct ? catProduct.title : 'Produto Cicatribem');

      let rawImage = '';
      if (catProduct && catProduct.featured_image) {
        rawImage = catProduct.featured_image;
      } else {
        const imgEl = document.querySelector('.product__media img, .product-gallery img, .bls-image-js img');
        rawImage = imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || imgEl.src) : '/cdn/shop/files/Serum-Hidratante---1-Unid.v_1771004172_width_180.jpg';
      }

      const qtyInput = document.querySelector('input[name="quantity"]');
      const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;

      let priceCents = 0;
      const priceEl = document.querySelector('.price__regular .price-item, .price-item--regular, .product-price, [data-ph-preco]');
      if (priceEl) {
        const text = priceEl.textContent;
        const m = text.match(/R\$\s*([\d.]+),(\d{2})/);
        if (m) {
          priceCents = parseInt(m[1].replace(/\./g, '') + m[2], 10);
        } else {
          const val = parseFloat(priceEl.textContent.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          if (val > 0) priceCents = Math.round(val * 100);
        }
      }
      if (!priceCents || priceCents < 1000) {
        priceCents = catProduct ? catProduct.price : 11990;
      }

      this.addItem({
        id: handle + '-' + Date.now(),
        handle: handle,
        title: title,
        variant: 'Padrão',
        image: normalizeImageUrl(rawImage, handle),
        unitPriceCents: priceCents,
        quantity: qty,
        discountPercent: 0,
        discountLabel: ''
      });
    }

    initOutsideClickClose() {
      document.addEventListener('click', event => {
        if (!document.documentElement.classList.contains('open-minicart')) return;
        if (
          event.target.closest('#minicart_wrapper') ||
          event.target.closest('a#cart-icon-bubble, .minicart__action, [href$="/cart"]') ||
          event.target.closest('[data-upcjc], [data-upcjh], .upcjc')
        ) {
          return;
        }
        this.closeCart();
      });
    }

    initEventListeners() {
      // 0. Capturing listener on window for all CTA, Buy buttons and Upsell Modals
      window.addEventListener('click', event => {
        // A. Upsell Modal "Não quero, seguir sem" (.upcjc__no)
        const upcjcNo = event.target.closest('.upcjc__no');
        if (upcjcNo) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          const modal = upcjcNo.closest('.upcjc, [data-upcjc], [data-upcjh]') || document.querySelector('.upcjc:not([hidden]), [data-upcjc], [data-upcjh]');
          this.closeUpsellModal(modal);
          if (typeof this.pendingPurchase === 'function') {
            const act = this.pendingPurchase;
            this.pendingPurchase = null;
            act();
          } else if (document.querySelector('.tc-bundle, .tc-content')) {
            this.handleBundlePurchase();
          } else {
            this.handleStandardPurchase();
          }
          this.openCart();
          return;
        }

        // B. Upsell Modal "SIM! QUERO" (.upcjc__yes)
        const upcjcYes = event.target.closest('.upcjc__yes');
        if (upcjcYes) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          const modal = upcjcYes.closest('.upcjc, [data-upcjc], [data-upcjh]') || document.querySelector('.upcjc:not([hidden]), [data-upcjc], [data-upcjh]');

          let promoCents = 4990;
          let promoTitle = 'Oferta Especial';
          let promoVariant = 'Oferta Exclusiva';
          let promoImg = '/cdn/shop/files/Serum-Hidratante---1-Unid.v_1771004172_width_180.jpg';
          let promoSlug = 'oferta-exclusiva';

          if (modal) {
            const precoB = modal.querySelector('.upcjc__preco b');
            const priceSource = (precoB ? precoB.textContent : '') + ' ' + upcjcYes.textContent;
            const priceMatch = priceSource.match(/R\$\s*([\d.]+),(\d{2})/);
            if (priceMatch) {
              promoCents = parseInt(priceMatch[1].replace(/\./g, '') + priceMatch[2], 10);
            }

            const titleEl = modal.querySelector('.upcjc__nome, .upcjc__otxt strong');
            if (titleEl) promoTitle = titleEl.textContent.trim();

            const subEl = modal.querySelector('.upcjc__sub, .upcjc__dura');
            if (subEl) promoVariant = subEl.textContent.trim();

            const imgEl = modal.querySelector('.upcjc__foto');
            if (imgEl) promoImg = normalizeImageUrl(imgEl.getAttribute('src') || imgEl.src);

            promoSlug = modal.getAttribute('data-slug') || 'oferta-exclusiva';
          }

          this.addItem({
            id: promoSlug + '-promo',
            handle: promoSlug,
            title: promoTitle,
            variant: promoVariant,
            image: promoImg,
            unitPriceCents: promoCents,
            quantity: 1,
            discountPercent: 0,
            discountLabel: ''
          });

          this.closeUpsellModal(modal);

          if (typeof this.pendingPurchase === 'function') {
            const act = this.pendingPurchase;
            this.pendingPurchase = null;
            act();
          } else if (document.querySelector('.tc-bundle, .tc-content')) {
            this.handleBundlePurchase();
          } else {
            this.handleStandardPurchase();
          }
          this.openCart();
          return;
        }

        // C. Upsell Modal Close "X" or outer click (.upcjc__x)
        const upcjcClose = event.target.closest('.upcjc__x');
        if (upcjcClose || (event.target.classList && event.target.classList.contains('upcjc'))) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          const modal = upcjcClose ? upcjcClose.closest('.upcjc, [data-upcjc], [data-upcjh]') : event.target;
          this.closeUpsellModal(modal);
          this.pendingPurchase = null;
          return;
        }

        // D. Finalize Checkout Buttons (Drawer, Cart Page, or Buy Buttons)
        const finalizeBtn = event.target.closest('.btn-finalizar-compra, a[href="/checkout"], a[href="/checkout/"], a[href*="checkout.html"], .btn-checkout-proceed, .cart__checkout-button, [name="checkout"], #checkout, .checkout-btn, .btn-checkout');
        if (finalizeBtn) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          this.proceedToCheckout(finalizeBtn);
          return;
        }

        // E. Buy Buttons (Cards, Bundle CTA, Standard Add)
        const buyBtn = event.target.closest('.tc-cta, .satc__btn, .product_submit_button, [name="add"], .vc__comprar, .istoria-add-to-cart, .btn-checkout-now, .js-addtocart');
        if (buyBtn && !buyBtn.closest('#minicart_wrapper')) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          const card = buyBtn.closest('.vc__card, .product-item, .product-card, .loadmore-item');
          let modal = null;

          if (card) {
            const link = card.querySelector('a.vc__foto, a.vc__titulo, a.istoria-card__media, a.istoria-card__title, a[href*="/products/"]');
            const href = link ? link.getAttribute('href') : '';
            const handleMatch = href.match(/\/products\/([^/?#]+)/);
            const handle = handleMatch ? handleMatch[1].replace('.html', '') : (buyBtn.dataset.id || '');
            if (handle) {
              modal = document.querySelector(`[data-upcjh][data-alvo="${handle}"]`);
            }
          } else {
            modal = document.querySelector('[data-upcjc]');
          }

          let purchaseAction = null;
          if (card || buyBtn.dataset.id || buyBtn.dataset.handle) {
            purchaseAction = () => this.handleCardPurchase(card, buyBtn);
          } else if (buyBtn.closest('.tc-bundle, .tc-content') || document.querySelector('.tc-bundle')) {
            purchaseAction = () => this.handleBundlePurchase();
          } else {
            purchaseAction = () => this.handleStandardPurchase(buyBtn);
          }

          if (modal && modal.dataset.decidiu !== '1') {
            this.pendingPurchase = purchaseAction;
            this.openUpsellModal(modal);
            return;
          }

          purchaseAction();
          this.openCart();
          return;
        }

        // E. Header cart icon click
        const cartIcon = event.target.closest('a#cart-icon-bubble, .minicart__action, [href$="/cart"], .js-open-cart');
        if (cartIcon && !cartIcon.closest('#minicart_wrapper')) {
          event.preventDefault();
          this.openCart();
          return;
        }
      }, true);

      // Drawer Interactions (Quantity, Remove, Close, Upsell)
      if (this.cartDrawer) {
        this.cartDrawer.addEventListener('click', event => {
          const minusBtn = event.target.closest('.quantity__button[name="minus"]');
          if (minusBtn) {
            event.preventDefault();
            event.stopPropagation();
            const itemEl = minusBtn.closest('[data-item-id]');
            if (itemEl) this.updateQuantity(itemEl.dataset.itemId, -1);
            return;
          }

          const plusBtn = event.target.closest('.quantity__button[name="plus"]');
          if (plusBtn) {
            event.preventDefault();
            event.stopPropagation();
            const itemEl = plusBtn.closest('[data-item-id]');
            if (itemEl) this.updateQuantity(itemEl.dataset.itemId, 1);
            return;
          }

          const removeBtn = event.target.closest('[data-action="remove"], cart-remove-button, .minicart__item-remove, .cart-remove, a[href*="/cart/change"]');
          if (removeBtn) {
            event.preventDefault();
            event.stopPropagation();
            const itemEl = removeBtn.closest('[data-item-id]') || removeBtn.closest('.cart-item');
            const id = itemEl ? (itemEl.dataset.itemId || itemEl.id) : null;
            this.removeItem(id);
            return;
          }

          const closeBtn = event.target.closest('.close-cart, .close-cart-button, .minicart-header__close');
          if (closeBtn) {
            event.preventDefault();
            this.closeCart();
            return;
          }

          const prevUpsellBtn = event.target.closest('.btn-upsell-prev');
          if (prevUpsellBtn) {
            event.preventDefault();
            event.stopPropagation();
            this.slideUpsell(-1);
            return;
          }

          const nextUpsellBtn = event.target.closest('.btn-upsell-next');
          if (nextUpsellBtn) {
            event.preventDefault();
            event.stopPropagation();
            this.slideUpsell(1);
            return;
          }

          const dotUpsellBtn = event.target.closest('.btn-upsell-dot');
          if (dotUpsellBtn) {
            event.preventDefault();
            event.stopPropagation();
            const idx = parseInt(dotUpsellBtn.dataset.index, 10);
            if (!isNaN(idx)) this.goToUpsell(idx);
            return;
          }

          const upsellBtn = event.target.closest('.btn-add-upsell');
          if (upsellBtn) {
            event.preventDefault();
            event.stopPropagation();
            const idx = parseInt(upsellBtn.dataset.productIndex, 10);
            const prod = this.upsellProducts[isNaN(idx) ? this.currentUpsellIndex : idx] || this.upsellProducts[0];
            if (prod) {
              this.addItem({
                id: prod.id,
                handle: prod.handle,
                title: prod.title,
                variant: prod.variant || '',
                image: prod.image,
                unitPriceCents: prod.unitPriceCents,
                quantity: 1,
                discountPercent: prod.discountPercent || 0,
                discountLabel: prod.discountLabel || ''
              });
            }
            return;
          }
        });

        // Swipe gesture on upsell slider for mobile & tablet
        let touchStartX = 0;
        let touchStartY = 0;
        this.cartDrawer.addEventListener('touchstart', e => {
          const wrapper = e.target.closest('.upsell-slider-wrapper');
          if (wrapper && e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
          }
        }, { passive: true });

        this.cartDrawer.addEventListener('touchend', e => {
          const wrapper = e.target.closest('.upsell-slider-wrapper');
          if (wrapper && e.changedTouches.length === 1) {
            const diffX = e.changedTouches[0].clientX - touchStartX;
            const diffY = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
              if (diffX < 0) {
                this.slideUpsell(1);
              } else {
                this.slideUpsell(-1);
              }
            }
          }
        }, { passive: true });

        this.cartDrawer.addEventListener('submit', event => {
          const couponForm = event.target.closest('.coupon-form');
          if (couponForm) {
            event.preventDefault();
            const input = couponForm.querySelector('input[name="discount"]');
            const btn = couponForm.querySelector('button');
            const feedback = couponForm.parentElement.querySelector('.coupon-feedback');
            if (btn) btn.textContent = 'Aplicando...';
            setTimeout(() => {
              if (btn) btn.textContent = 'Aplicar';
              if (feedback) {
                feedback.style.display = 'block';
                feedback.style.color = '#2e7d32';
                feedback.textContent = 'Cupom de desconto aplicado!';
              }
              if (input) input.value = '';
            }, 400);
          }
        });
      }
    }

    initPagination() {
      const grid = document.getElementById('product-grid');
      const nav = document.querySelector('nav.pagination, .pagination-wrapper');
      if (!grid || !nav) return;

      const items = Array.from(grid.querySelectorAll('.grid__item, [class*="grid__item"]'));
      if (items.length <= 12) return;

      const pageSize = 12;
      const totalPages = Math.ceil(items.length / pageSize);

      items.forEach((it, idx) => {
        const page = Math.floor(idx / pageSize) + 1;
        it.dataset.page = String(page);
      });

      const goToPage = (targetPage, shouldScroll = true) => {
        targetPage = Math.max(1, Math.min(totalPages, targetPage));

        items.forEach(it => {
          if (it.dataset.page === String(targetPage)) {
            it.style.display = '';
          } else {
            it.style.display = 'none';
          }
        });

        const page1Btn = nav.querySelector('[aria-label="Página 1"]');
        const page2Btn = nav.querySelector('[aria-label="Página 2"]');
        const nextBtn = nav.querySelector('[aria-label="Próximo"]');

        let prevLi = nav.querySelector('li.pagination__item--prev-arrow');
        if (!prevLi) {
          prevLi = document.createElement('li');
          prevLi.className = 'pagination__item--prev-arrow';
          prevLi.innerHTML = `
            <a href="javascript:void(0)" class="px-15 pagination__item rounded-50 lh-1 btn-hover no-underline w-44 h-44 border inline-flex align-center justify-content-center remove-underline pagination__item-arrow link motion-reduce" aria-label="Anterior" style="cursor: pointer;">
              <svg width="5" height="10" fill="none" style="transform: rotate(180deg);">
                <use href="#icon-next"></use>
              </svg>
            </a>
          `;
          const ul = nav.querySelector('ul.pagination__list');
          if (ul && ul.firstChild) {
            ul.insertBefore(prevLi, ul.firstChild);
          }
        }

        const prevBtn = prevLi.querySelector('a');

        if (page1Btn) {
          if (targetPage === 1) {
            page1Btn.className = 'pagination__item rounded-50 lh-1 btn-hover no-underline w-full h-44 border inline-flex align-center justify-content-center remove-underline pagination__item--current light';
            page1Btn.setAttribute('aria-current', 'page');
            page1Btn.setAttribute('aria-disabled', 'true');
            page1Btn.removeAttribute('href');
            page1Btn.style.cursor = 'default';
          } else {
            page1Btn.className = 'pagination__item rounded-50 lh-1 btn-hover no-underline w-full h-44 border inline-flex align-center justify-content-center remove-underline link';
            page1Btn.removeAttribute('aria-current');
            page1Btn.removeAttribute('aria-disabled');
            page1Btn.href = 'javascript:void(0)';
            page1Btn.style.cursor = 'pointer';
          }
        }

        if (page2Btn) {
          if (targetPage === 2) {
            page2Btn.className = 'pagination__item rounded-50 lh-1 btn-hover no-underline w-full h-44 border inline-flex align-center justify-content-center remove-underline pagination__item--current light';
            page2Btn.setAttribute('aria-current', 'page');
            page2Btn.setAttribute('aria-disabled', 'true');
            page2Btn.removeAttribute('href');
            page2Btn.style.cursor = 'default';
          } else {
            page2Btn.className = 'pagination__item rounded-50 lh-1 btn-hover no-underline w-full h-44 border inline-flex align-center justify-content-center remove-underline link';
            page2Btn.removeAttribute('aria-current');
            page2Btn.removeAttribute('aria-disabled');
            page2Btn.href = 'javascript:void(0)';
            page2Btn.style.cursor = 'pointer';
          }
        }

        if (nextBtn) {
          if (targetPage >= totalPages) {
            nextBtn.style.opacity = '0.3';
            nextBtn.style.pointerEvents = 'none';
            nextBtn.style.cursor = 'default';
          } else {
            nextBtn.style.opacity = '1';
            nextBtn.style.pointerEvents = 'auto';
            nextBtn.style.cursor = 'pointer';
            nextBtn.href = 'javascript:void(0)';
          }
        }

        if (prevBtn) {
          if (targetPage <= 1) {
            prevBtn.parentElement.style.display = 'none';
          } else {
            prevBtn.parentElement.style.display = 'inline-block';
            prevBtn.style.opacity = '1';
            prevBtn.style.pointerEvents = 'auto';
            prevBtn.style.cursor = 'pointer';
          }
        }

        try {
          const currentUrl = new URL(window.location.href);
          if (targetPage === 1) {
            currentUrl.searchParams.delete('page');
          } else {
            currentUrl.searchParams.set('page', targetPage);
          }
          window.history.pushState({ page: targetPage }, '', currentUrl.toString());
        } catch (e) {}

        if (shouldScroll) {
          const rect = grid.getBoundingClientRect();
          const targetY = rect.top + window.pageYOffset - 120;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
        }
      };

      nav.addEventListener('click', e => {
        const item1 = e.target.closest('[aria-label="Página 1"]');
        if (item1) {
          e.preventDefault();
          e.stopPropagation();
          goToPage(1);
          return;
        }
        const item2 = e.target.closest('[aria-label="Página 2"]');
        if (item2) {
          e.preventDefault();
          e.stopPropagation();
          goToPage(2);
          return;
        }
        const next = e.target.closest('[aria-label="Próximo"]');
        if (next) {
          e.preventDefault();
          e.stopPropagation();
          goToPage(2);
          return;
        }
        const prev = e.target.closest('[aria-label="Anterior"]');
        if (prev) {
          e.preventDefault();
          e.stopPropagation();
          goToPage(1);
          return;
        }
      });

      const urlParams = new URLSearchParams(window.location.search);
      const initialPage = parseInt(urlParams.get('page'), 10) === 2 ? 2 : 1;
      goToPage(initialPage, false);

      window.addEventListener('popstate', e => {
        const statePage = (e.state && e.state.page) || 1;
        goToPage(statePage, false);
      });
    }

    render() {
      if (!this.cartDrawer) return;
      const items = this.getItems();
      let totalQty = 0;
      let subtotalBaseCents = 0;
      let totalDiscountCents = 0;

      items.forEach(it => {
        totalQty += it.quantity;
        const baseItemTotal = it.quantity * it.unitPriceCents;
        subtotalBaseCents += baseItemTotal;
        if (it.discountPercent > 0) {
          totalDiscountCents += Math.round(baseItemTotal * (it.discountPercent / 100));
        }
      });

      const finalTotalCents = Math.max(0, subtotalBaseCents - totalDiscountCents);

      document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = el.classList.contains('cart-count-drawer')
          ? `(${totalQty})`
          : totalQty > 100
          ? '~'
          : String(totalQty);
      });

      if (items.length === 0) {
        this.renderEmptyState();
      } else {
        this.renderFilledState(items, totalQty, subtotalBaseCents, totalDiscountCents, finalTotalCents);
      }
    }

    renderEmptyState() {
      if (!this.cartDrawer) return;
      const footer = this.cartDrawer.querySelector('.cart-footer');
      if (footer) footer.style.display = 'none';

      const tracker = this.cartDrawer.querySelector('.minicart-discount-tracker');
      if (tracker) tracker.style.display = 'none';

      const minicartBody = this.cartDrawer.querySelector('.minicart-body');
      if (minicartBody) {
        minicartBody.innerHTML = `
          <div class="cart-empty flex flex-column align-center justify-center text-center" style="padding: 70px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="1.5" style="margin: 0 auto 16px auto; display: block;">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #111;">Seu carrinho está vazio</h4>
            <p style="font-size: 14px; color: #666; margin-bottom: 24px;">Adicione produtos para continuar suas compras.</p>
            <button type="button" class="btn btn-primary minicart-action close-cart pointer" style="background: #1b5cb5; color: #ffffff !important; padding: 12px 28px; border-radius: 50px; font-weight: 700; border: none; cursor: pointer; text-decoration: none;">CONTINUAR COMPRANDO</button>
          </div>
        `;
      }
    }

    renderFilledState(items, totalQty, subtotalBaseCents, totalDiscountCents, finalTotalCents) {
      if (!this.cartDrawer) return;
      let bannerMsg = 'Adicione mais <b>1</b> produto para ganhar <b>5%</b> de desconto!';
      let step = 0;

      if (totalQty === 1) {
        bannerMsg = 'Adicione mais <b>1</b> produto para ganhar <b>5%</b> de desconto!';
        step = 0;
      } else if (totalQty === 2) {
        bannerMsg = 'Adicione mais <b>1</b> produto para ganhar <b>10%</b> de desconto!';
        step = 1;
      } else if (totalQty === 3) {
        bannerMsg = 'Adicione mais <b>1</b> produto para ganhar <b>15%</b> de desconto!';
        step = 2;
      } else if (totalQty >= 4) {
        bannerMsg = '🎉 Parabéns! Você atingiu o desconto máximo de <b>15%</b>!';
        step = 3;
      }

      let tracker = this.cartDrawer.querySelector('.minicart-discount-tracker');
      if (!tracker) {
        tracker = document.createElement('div');
        tracker.className = 'minicart-discount-tracker';
        const formEl = this.cartDrawer.querySelector('#minicart-form') || this.cartDrawer.querySelector('.minicart__wrapper');
        const headerEl = this.cartDrawer.querySelector('.minicart__header');
        if (headerEl && headerEl.nextSibling) {
          headerEl.parentNode.insertBefore(tracker, headerEl.nextSibling);
        } else if (formEl) {
          formEl.prepend(tracker);
        }
      }

      tracker.style.display = 'block';
      tracker.innerHTML = `
        <div style="background: #eef8fb; padding: 14px 20px; border-bottom: 1px solid #e2f0f5;">
          <p style="margin: 0 0 10px 0; font-size: 13px; text-align: center; color: #111;">
            ${bannerMsg}
          </p>
          <div style="display: flex; gap: 8px; margin-bottom: 6px;">
            <div style="flex: 1; height: 6px; border-radius: 3px; background: ${step >= 1 ? '#00badb' : '#d2e4ea'};"></div>
            <div style="flex: 1; height: 6px; border-radius: 3px; background: ${step >= 2 ? '#00badb' : '#d2e4ea'};"></div>
            <div style="flex: 1; height: 6px; border-radius: 3px; background: ${step >= 3 ? '#00badb' : '#d2e4ea'};"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #666; font-weight: 500;">
            <span>Desconto</span>
            <span>Desconto</span>
            <span>Desconto</span>
          </div>
        </div>
      `;

      const minicartBody = this.cartDrawer.querySelector('.minicart-body');
      if (minicartBody) {
        const itemsHtml = items.map(it => `
          <div class="cart-item flex mb-20 pb-20 gap-15 border-bottom-dashed" data-item-id="${it.id}" style="display: flex; gap: 15px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px dashed #e5e5e5; position: relative;">
            <div class="minicart__product__image" style="width: 80px; height: 80px; flex-shrink: 0; border-radius: 14px; overflow: hidden; background: #f9f9f9; border: 1px solid #f0f0f0;">
              <img src="${it.image}" alt="${it.title}" onerror="this.onerror=null;this.src='/cdn/shop/files/Serum-Hidratante---1-Unid.v_1771004172_width_180.jpg'" style="width: 100%; height: 100%; object-fit: cover; display: block;">
            </div>
            <div class="minicart__product-info" style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                <div>
                  <h4 style="font-size: 13.5px; font-weight: 600; line-height: 1.3; color: #111; margin: 0;">${it.title}</h4>
                  ${it.variant ? `<div style="font-size: 12.5px; color: #666; margin-top: 4px;">${it.variant}</div>` : ''}
                </div>
                <button type="button" class="minicart__item-remove pointer" data-action="remove" title="Excluir item" style="background: none; border: none; cursor: pointer; color: #222; padding: 2px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px;">
                <div style="display: inline-flex; align-items: center; border: 1px solid #dcdcdc; border-radius: 50px; padding: 2px 8px; background: #fff;">
                  <button type="button" class="quantity__button" name="minus" style="border: none; background: none; font-size: 16px; cursor: pointer; padding: 0 6px; line-height: 1;">−</button>
                  <span style="min-width: 20px; text-align: center; font-size: 14px; font-weight: 600;">${it.quantity}</span>
                  <button type="button" class="quantity__button" name="plus" style="border: none; background: none; font-size: 16px; cursor: pointer; padding: 0 6px; line-height: 1;">+</button>
                </div>
                <div style="font-size: 14.5px; font-weight: 700; color: #111;">
                  ${fmtBRL(it.quantity * it.unitPriceCents)}
                </div>
              </div>
            </div>
          </div>
        `).join('');

        const slidesHtml = this.upsellProducts.map((prod, idx) => `
          <div class="upsell-slide" style="min-width: 100%; width: 100%; flex-shrink: 0; box-sizing: border-box;">
            <div style="background: #fff; border-radius: 14px; padding: 10px 12px; display: flex; align-items: center; gap: 12px; border: 1px solid #e5f1f6; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <img src="${prod.image}" alt="${prod.title}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 10px; background: #fafafa; flex-shrink: 0;">
              <div style="flex: 1; min-width: 0;">
                <h5 style="font-size: 12.5px; font-weight: 600; margin: 0 0 4px 0; color: #111; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${prod.title}">${prod.title}</h5>
                <div style="display: flex; align-items: center; gap: 6px; font-size: 12.5px; flex-wrap: wrap;">
                  <span style="color: #999; text-decoration: line-through; font-size: 11.5px;">${prod.originalPrice}</span>
                  <span style="font-weight: 700; color: #111;">${prod.priceFormatted}</span>
                  <span style="color: #2e7d32; font-weight: 700; font-size: 11px;">${prod.discountLabel}</span>
                </div>
              </div>
              <button type="button" class="btn-add-upsell" data-product-index="${idx}" title="Adicionar" style="width: 36px; height: 36px; border-radius: 50%; background: #3c7d1e; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; padding: 0; flex-shrink: 0; transition: transform 0.15s, background 0.15s;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                  <line x1="12" y1="12" x2="12" y2="18"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
              </button>
            </div>
          </div>
        `).join('');

        const dotsHtml = this.upsellProducts.map((_, idx) => `
          <button type="button" class="btn-upsell-dot" data-index="${idx}" aria-label="Item ${idx + 1}" style="border: none; padding: 0; width: ${idx === this.currentUpsellIndex ? '18px' : '8px'}; height: 3.5px; background: ${idx === this.currentUpsellIndex ? '#111' : '#ccc'}; border-radius: 2px; cursor: pointer; transition: all 0.25s; outline: none;"></button>
        `).join('');

        const upsellHtml = `
          <div class="cart-recommend" style="background: #eef8fb; border-radius: 16px; padding: 14px; margin-top: 10px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h4 style="font-size: 14px; font-weight: 700; color: #111; margin: 0;">Complete seu pedido</h4>
              <div style="display: flex; gap: 6px; font-size: 15px; color: #555; align-items: center;">
                <button type="button" class="btn-upsell-prev" aria-label="Anterior" title="Anterior" style="background: none; border: none; font-size: 16px; color: #555; cursor: pointer; padding: 2px 6px; line-height: 1; user-select: none; border-radius: 4px;">‹</button>
                <button type="button" class="btn-upsell-next" aria-label="Próximo" title="Próximo" style="background: none; border: none; font-size: 16px; color: #555; cursor: pointer; padding: 2px 6px; line-height: 1; user-select: none; border-radius: 4px;">›</button>
              </div>
            </div>
            <div class="upsell-slider-wrapper" style="overflow: hidden; width: 100%; border-radius: 14px; touch-action: pan-y;">
              <div class="upsell-slider-track" style="display: flex; transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1); width: 100%; transform: translateX(-${this.currentUpsellIndex * 100}%);">
                ${slidesHtml}
              </div>
            </div>
            <div style="display: flex; justify-content: center; gap: 5px; margin-top: 8px;">
              ${dotsHtml}
            </div>
          </div>
        `;

        minicartBody.innerHTML = `
          <div class="items" style="padding: 10px 0;">
            ${itemsHtml}
          </div>
          ${upsellHtml}
        `;
      }

      let footer = this.cartDrawer.querySelector('.cart-footer');
      if (footer) {
        footer.style.display = 'block';

        const mainItem = items.find(it => it.discountPercent > 0);
        const discountTagHtml = mainItem ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 13px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #444;">Desconto</span>
              <span style="background: #e0e0e0; color: #333; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                🏷️ ${mainItem.discountLabel || (mainItem.discountPercent + '% OFF')}
              </span>
            </div>
            <span style="color: #111; font-weight: 600;">- ${fmtBRL(totalDiscountCents)}</span>
          </div>
        ` : '';

        footer.innerHTML = `
          <div style="padding: 15px 20px; border-top: 1px solid #eee; background: #fff;">
            <form class="coupon-form" style="display: flex; gap: 8px; margin-bottom: 16px;">
              <input type="text" name="discount" placeholder="Código de desconto" style="flex: 1; padding: 10px 14px; border: 1px solid #ccc; border-radius: 30px; font-size: 13px; outline: none;">
              <button type="submit" style="background: #739f60; color: #fff; font-weight: 600; border: none; padding: 10px 22px; border-radius: 30px; cursor: pointer; font-size: 13px;">Aplicar</button>
            </form>
            <p class="coupon-feedback" style="display: none; font-size: 12px; margin: -10px 0 12px 14px;"></p>

            ${discountTagHtml}

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 13px; color: #444;">
              <div>
                <span style="font-weight: 600;">Frete Fixo</span>
                <div style="font-size: 11px; color: #666; margin-top: 1px;">Entrega em até 5 dias úteis</div>
              </div>
              <span style="color: #2e7d32; font-weight: 700; font-size: 13px;">GRÁTIS</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; font-size: 16px;">
              <span style="font-weight: 800; color: #111;">Total</span>
              <span style="font-weight: 800; color: #111; font-size: 18px;">${fmtBRL(finalTotalCents)}</span>
            </div>

            <a href="/checkout" class="btn-finalizar-compra" style="display: block; width: 100%; text-align: center; background: #347d10; color: #ffffff !important; font-weight: 700; font-size: 15px; padding: 14px 20px; border-radius: 50px; text-decoration: none; box-shadow: 0 4px 12px rgba(52,125,16,0.3); transition: background 0.2s;">
              Finalizar compra
            </a>

            <div style="text-align: center; margin-top: 14px;">
              <button type="button" class="close-cart pointer" style="background: none; border: none; color: #347d10; font-weight: 600; font-size: 13px; text-decoration: underline; cursor: pointer;">
                Continuar comprando
              </button>
            </div>
          </div>
        `;
      }
    }

    initNewsletter() {
      document.addEventListener('submit', event => {
        const form = event.target.closest('.cfn__nl-form');
        if (!form) return;
        event.preventDefault();
        event.stopPropagation();
        const btn = form.querySelector('.cfn__nl-btn');
        const input = form.querySelector('input[type="email"]');
        if (btn) {
          btn.textContent = 'Inscrito com sucesso! ✓';
          btn.style.background = '#2e7d32';
        }
        if (input) input.value = '';
        setTimeout(() => {
          if (btn) {
            btn.innerHTML = 'Inscrever <svg width="14" height="14"><use href="#icon-arrow"></use></svg>';
            btn.style.background = '';
          }
        }, 3500);
      });
    }

    initSearch() {
      // 1. If on search page, activate search page engine
      if (window.location.pathname.includes('/search')) {
        const urlParams = new URLSearchParams(window.location.search);
        let q = (urlParams.get('q') || '').trim();

        const searchInput = document.getElementById('Search-In-Page') || document.querySelector('.search__input');
        if (searchInput && q) {
          searchInput.value = q;
        }

        const breadcrumbText = document.getElementById('search-breadcrumb-text') || document.querySelector('.breadcrumbs .heading-color');
        const toolbarAmount = document.getElementById('toolbar-amount');
        const loadmoreAmount = document.querySelector('.loadmore-amount');
        const loadmorePercent = document.querySelector('.load-more-percent');
        const productGrid = document.getElementById('product-grid');
        const sortLabel = document.getElementById('sort-selected-label') || document.querySelector('.toolbar-sorter .select-selected .heading-color');

        let allProducts = [];
        let activeCategory = null;
        let minPrice = 0;
        let maxPrice = 60000; // in cents
        let currentSort = 'relevance';

        function getCategory(p) {
          const t = ((p.title || '') + ' ' + (p.handle || '')).toLowerCase();
          if (t.includes('kit') || t.includes('duplinha') || t.includes('tudinho') || t.includes('tudo')) return 'Kits e Conjuntos';
          if (t.includes('sensation') || t.includes('splash') || t.includes('baume') || t.includes('scrub')) return 'Linha Sensation & Perfumaria';
          if (t.includes('clareador') || t.includes('clareamento') || t.includes('manchas')) return 'Linha Clareadora & Manchas';
          if (t.includes('estrias') || t.includes('regenerador') || t.includes('firmador') || t.includes('redutor')) return 'Antiestrias & Firmeza';
          if (t.includes('serum') || t.includes('perolas') || t.includes('facial') || t.includes('micelar') || t.includes('solar')) return 'Skincare & Séruns Faciais';
          if (t.includes('hidratante') || t.includes('esfoliante') || t.includes('corporal')) return 'Cuidados Corporais';
          return 'Cuidados Pessoais';
        }

        function getBadge(p) {
          const t = (p.title || '').toLowerCase();
          if (t.includes('kit') || t.includes('duplinha')) return 'Kits Exclusivos';
          if (t.includes('sensation') || t.includes('splash')) return 'Perfume e hidratação';
          if (t.includes('clareador') || t.includes('manchas')) return 'Mais Vendido';
          if (t.includes('regenerador') || t.includes('estrias')) return 'Fórmula Avançada';
          return 'Destaque';
        }

        function renderCard(p) {
          const priceReais = (p.price || 0) / 100;
          const parcelaVal = (priceReais * 1.118 / 12).toFixed(2).replace('.', ',');
          const pixVal = (priceReais * 0.97).toFixed(2).replace('.', ',');
          const compareVal = (priceReais / 0.90).toFixed(2).replace('.', ',');
          const priceFormatted = fmtBRL(p.price);
          const badge = getBadge(p);

          return `
            <div class="grid__item loadmore-item">
              <div class="vc__card">
                <a class="vc__foto" href="${p.url}" tabindex="-1">
                  <span class="vc__selos"><span class="vc__selo vc__selo--custom" style="color: #ffffff; background: #f07900;">${badge}</span></span>
                  <img src="${p.featured_image}" alt="${p.title}" loading="lazy" width="300" height="300" onerror="this.onerror=null;this.src='/cdn/shop/files/Serum-Hidratante---1-Unid.v_1771004172_width_180.jpg'">
                </a>
                <div class="vc__info">
                  <div class="vc__rating" aria-hidden="true" style="margin-bottom: 6px;">
                    <span class="vc__estrelas" style="color: #f59e0b; font-size: 13px;">★★★★★</span>
                    <span class="vc__nota" style="font-size: 12px; font-weight: 600; color: #666; margin-left: 4px;">4.9</span>
                  </div>
                  <a class="vc__titulo" href="${p.url}">${p.title}</a>
                  <div class="vc__precos">
                    <div class="vc__parcelado">12x de <strong>R$ ${parcelaVal}</strong></div>
                    <div class="vc__pix">R$ ${pixVal} <span>à vista no PIX</span><em>3% OFF</em></div>
                    <div class="vc__cheio">
                      ou <span class="vc__cheio-val">${priceFormatted}</span> <s>R$ ${compareVal}</s><i>−10%</i>
                    </div>
                  </div>
                  <div class="vc__acoes">
                    <a class="vc__saiba" href="${p.url}">SAIBA MAIS</a>
                    <button type="button" class="vc__comprar istoria-add-to-cart" data-id="${p.handle}" data-title="${p.title}" data-price="${p.price}" data-image="${p.featured_image}" aria-label="Adicionar ${p.title} ao carrinho">
                      <span class="istoria-btn-text">COMPRAR</span>
                      <span class="istoria-btn-dots" aria-hidden="true"><span></span><span></span><span></span></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }

        function updateUI() {
          if (!productGrid) return;

          let filtered = [...allProducts];

          // 1. Text Query Filter
          if (q) {
            const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
            filtered = filtered.filter(p => {
              const fullText = ((p.title || '') + ' ' + (p.handle || '') + ' ' + getCategory(p)).toLowerCase();
              return terms.every(t => fullText.includes(t));
            });
          }

          // 2. Category Filter
          if (activeCategory) {
            filtered = filtered.filter(p => getCategory(p) === activeCategory);
          }

          // 3. Price Filter
          filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);

          // 4. Sorting
          if (currentSort === 'price-ascending') {
            filtered.sort((a, b) => a.price - b.price);
          } else if (currentSort === 'price-descending') {
            filtered.sort((a, b) => b.price - a.price);
          } else if (currentSort === 'title-ascending') {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
          } else if (currentSort === 'title-descending') {
            filtered.sort((a, b) => b.title.localeCompare(a.title));
          } else if (currentSort === 'best-selling') {
            filtered.sort((a, b) => {
              const aIsKit = a.title.toLowerCase().startsWith('kit');
              const bIsKit = b.title.toLowerCase().startsWith('kit');
              if (aIsKit && !bIsKit) return -1;
              if (!aIsKit && bIsKit) return 1;
              return 0;
            });
          }

          // Update texts
          const count = filtered.length;
          const queryLabel = q ? ` para "${q}"` : '';
          if (breadcrumbText) {
            breadcrumbText.textContent = `Pesquisa: ${count} resultados encontrados${queryLabel}`;
          }
          if (toolbarAmount) {
            toolbarAmount.textContent = `${count} resultados`;
          }
          if (loadmoreAmount) {
            loadmoreAmount.textContent = `Você visualizou ${count} de ${count} resultados`;
          }
          if (loadmorePercent) {
            loadmorePercent.style.width = '100%';
          }

          // Render Grid
          if (count === 0) {
            productGrid.innerHTML = `
              <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <h3 style="font-size: 20px; font-weight: 700; color: #111; margin-bottom: 8px;">Nenhum produto encontrado${queryLabel}</h3>
                <p style="color: #666; margin-bottom: 24px;">Tente pesquisar por outros termos, remover filtros ou confira nossos mais vendidos.</p>
                <a href="/collections/mais-vendidos.html" class="btn" style="display: inline-block; background: #1b5cb5; color: #fff; padding: 12px 28px; border-radius: 50px; font-weight: 700; text-decoration: none;">Ver Mais Vendidos</a>
              </div>
            `;
          } else {
            productGrid.innerHTML = filtered.map(renderCard).join('');
          }

          // Bind add-to-cart clicks
          productGrid.querySelectorAll('.istoria-add-to-cart').forEach(btn => {
            btn.addEventListener('click', e => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              const card = btn.closest('.vc__card, .product-item, .product-card, .loadmore-item');
              this.handleCardPurchase(card, btn);
              this.openCart();
            });
          });
        }

        // Fetch products catalog
        fetch('/search/products.json')
          .then(r => r.json())
          .then(catalog => {
            allProducts = catalog;

            // Setup categories sidebar list dynamically
            const categoryList = document.querySelector('#CollectionSidebar .items');
            if (categoryList) {
              const catCounts = {};
              allProducts.forEach(p => {
                const c = getCategory(p);
                catCounts[c] = (catCounts[c] || 0) + 1;
              });

              const catEntries = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
              categoryList.innerHTML = catEntries.map(([catName, cnt]) => `
                <li class="item mb-10 last-0" data-cat="${catName}" style="cursor: pointer;">
                  <div class="link-filter pointer inline-flex lh-normal gap-10 hover-heading-color transition" style="align-items: center;">
                    <span class="checkbox border rounded-2 bg-white inline-flex content-center transition relative" style="width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #ccc; border-radius: 3px;">
                      <svg width="10" height="7" fill="none" class="cat-check-svg" style="display: none;">
                        <path fill="#1b5cb5" d="M8.645.645a.503.503 0 0 1 .351-.141.496.496 0 0 1 .504.504c0 .133-.05.246-.152.34L3.852 6.855a.477.477 0 0 1-.352.141.477.477 0 0 1-.352-.14L.652 4.347a.446.446 0 0 1-.152-.34c0-.14.05-.262.152-.363a.463.463 0 0 1 .34-.141c.14 0 .262.047.363.14L3.5 5.79 8.645.645Z"></path>
                      </svg>
                    </span>
                    <span>${catName}</span>
                    <span class="count text-muted" style="color: #888; font-size: 13px;">(${cnt})</span>
                  </div>
                </li>
              `).join('');

              categoryList.querySelectorAll('li[data-cat]').forEach(li => {
                li.addEventListener('click', e => {
                  e.preventDefault();
                  const cat = li.getAttribute('data-cat');
                  const checkSvg = li.querySelector('.cat-check-svg');
                  if (activeCategory === cat) {
                    activeCategory = null;
                    li.classList.remove('current-filter');
                    if (checkSvg) checkSvg.style.display = 'none';
                  } else {
                    categoryList.querySelectorAll('li').forEach(other => {
                      other.classList.remove('current-filter');
                      const s = other.querySelector('.cat-check-svg');
                      if (s) s.style.display = 'none';
                    });
                    activeCategory = cat;
                    li.classList.add('current-filter');
                    if (checkSvg) {
                      checkSvg.style.display = 'block';
                    }
                  }
                  updateUI();
                });
              });
            }

            // Setup Price Sliders
            const minSlider = document.getElementById('range-slider-min');
            const maxSlider = document.getElementById('range-slider-max');
            const minInput = document.querySelector('.min-price-range');
            const maxInput = document.querySelector('.max-price-range');
            const minLabel = document.querySelector('.price-lable .min');
            const maxLabel = document.querySelector('.price-lable .max');
            const dropRange = document.querySelector('.drop-range');

            function syncPrice() {
              if (minSlider && maxSlider) {
                let vMin = parseFloat(minSlider.value) || 0;
                let vMax = parseFloat(maxSlider.value) || 527.60;
                if (vMin > vMax) { const tmp = vMin; vMin = vMax; vMax = tmp; }
                minPrice = Math.round(vMin * 100);
                maxPrice = Math.round(vMax * 100);

                if (minInput) minInput.value = vMin.toFixed(2).replace('.', ',');
                if (maxInput) maxInput.value = vMax.toFixed(2).replace('.', ',');
                if (minLabel) minLabel.textContent = `R$ ${vMin.toFixed(2).replace('.', ',')}`;
                if (maxLabel) maxLabel.textContent = `R$ ${vMax.toFixed(2).replace('.', ',')}`;

                if (dropRange) {
                  const p1 = (vMin / 527.60 * 100).toFixed(1);
                  const p2 = (vMax / 527.60 * 100).toFixed(1);
                  dropRange.style.setProperty('--range-from', `${p1}%`);
                  dropRange.style.setProperty('--range-to', `${p2}%`);
                }
              }
              updateUI();
            }

            if (minSlider) minSlider.addEventListener('input', syncPrice);
            if (maxSlider) maxSlider.addEventListener('input', syncPrice);
            if (minInput) minInput.addEventListener('change', e => {
              const val = parseFloat(e.target.value.replace(',', '.')) || 0;
              if (minSlider) minSlider.value = val;
              syncPrice();
            });
            if (maxInput) maxInput.addEventListener('change', e => {
              const val = parseFloat(e.target.value.replace(',', '.')) || 527.60;
              if (maxSlider) maxSlider.value = val;
              syncPrice();
            });

            // Initial render
            updateUI();
          })
          .catch(() => {});

        // Setup Sorter
        const sorterContainer = document.querySelector('.select-custom');
        const sorterBtn = document.querySelector('select-sorter');
        if (sorterBtn && sorterContainer) {
          sorterBtn.addEventListener('click', e => {
            e.stopPropagation();
            sorterContainer.classList.toggle('active');
          });

          document.addEventListener('click', e => {
            if (!sorterContainer.contains(e.target)) {
              sorterContainer.classList.remove('active');
            }
          });

          const sortItems = sorterContainer.querySelectorAll('filter-sort');
          sortItems.forEach(item => {
            item.addEventListener('click', e => {
              e.preventDefault();
              currentSort = item.getAttribute('value');
              sortItems.forEach(i => i.removeAttribute('selected'));
              item.setAttribute('selected', 'selected');
              if (sortLabel) {
                sortLabel.textContent = item.textContent.trim();
              }
              sorterContainer.classList.remove('active');
              updateUI();
            });
          });
        }

        // Setup Collapsible Accordions in Sidebar
        document.querySelectorAll('collapsible-block').forEach(block => {
          const heading = block.querySelector('.collapsible-heading');
          if (heading) {
            heading.addEventListener('click', e => {
              e.preventDefault();
              block.classList.toggle('active');
            });
          }
        });

        // Setup Mobile Filter Drawer
        const btnFilter = document.querySelector('.btn-filter');
        const closeFilter = document.querySelector('close-filter');
        const applyBtn = document.querySelector('facet-apply-canvas');
        const sidebar = document.getElementById('CollectionSidebar');

        if (btnFilter && sidebar) {
          btnFilter.addEventListener('click', e => {
            e.preventDefault();
            sidebar.classList.toggle('open');
            document.documentElement.classList.toggle('open-drawer');
            document.documentElement.classList.toggle('open-sidebar');
          });
        }
        function closeDrawer() {
          if (sidebar) sidebar.classList.remove('open');
          document.documentElement.classList.remove('open-drawer', 'open-sidebar');
          if (btnFilter) btnFilter.classList.remove('open');
        }
        if (closeFilter) closeFilter.addEventListener('click', closeDrawer);
        if (applyBtn) applyBtn.addEventListener('click', closeDrawer);

        // Setup "Limpar tudo"
        const clearAll = document.querySelector('facet-clear-all');
        if (clearAll) {
          clearAll.addEventListener('click', e => {
            e.preventDefault();
            activeCategory = null;
            document.querySelectorAll('#CollectionSidebar .items li').forEach(li => {
              li.classList.remove('current-filter');
              const s = li.querySelector('.cat-check-svg');
              if (s) s.style.display = 'none';
            });
            minPrice = 0;
            maxPrice = 52760;
            const minSlider = document.getElementById('range-slider-min');
            const maxSlider = document.getElementById('range-slider-max');
            const minInput = document.querySelector('.min-price-range');
            const maxInput = document.querySelector('.max-price-range');
            const minLabel = document.querySelector('.price-lable .min');
            const maxLabel = document.querySelector('.price-lable .max');
            const dropRange = document.querySelector('.drop-range');
            if (minSlider) minSlider.value = 0;
            if (maxSlider) maxSlider.value = 527.60;
            if (minInput) minInput.value = '0,00';
            if (maxInput) maxInput.value = '527,60';
            if (minLabel) minLabel.textContent = 'R$ 0,00';
            if (maxLabel) maxLabel.textContent = 'R$ 527,60';
            if (dropRange) {
              dropRange.style.setProperty('--range-from', '0%');
              dropRange.style.setProperty('--range-to', '100%');
            }
            updateUI();
            closeDrawer();
          });
        }

        // Setup Form Search
        const form = document.querySelector('.search-modal__form') || document.querySelector('form[role="search"]');
        if (form) {
          form.addEventListener('submit', e => {
            const input = form.querySelector('input[name="q"]');
            if (input) {
              q = input.value.trim();
              const newUrl = `/search.html?q=${encodeURIComponent(q)}`;
              window.history.pushState({ q }, '', newUrl);
              e.preventDefault();
              updateUI();
            }
          });
        }
      }

      // 2. Intercept predictive search
      const searchInputs = document.querySelectorAll('[data-cb-search-input], .cb-drawer__busca input[type="search"], .search__input');
      searchInputs.forEach(inp => {
        inp.addEventListener('input', e => {
          const val = (e.target.value || '').trim().toLowerCase();
          if (val.length < 2) return;
          fetch('/search/products.json')
            .then(r => r.json())
            .then(catalog => {
              const hits = catalog.filter(p => p.title.toLowerCase().includes(val) || p.handle.toLowerCase().includes(val)).slice(0, 6);
              const resultsContainer = document.querySelector('[data-cb-search-results]');
              if (resultsContainer && hits.length) {
                resultsContainer.innerHTML = `
                  <p class="cb-search-label" style="font-weight: 700; font-size: 13px; margin: 8px 0; color: #111;">Resultados da busca</p>
                  <ul class="cb-search-hits" style="list-style: none; padding: 0; margin: 0;">
                    ${hits.map(h => `
                      <li style="margin-bottom: 8px;">
                        <a class="cb-search-hit" href="${h.url}" style="display: flex; align-items: center; gap: 10px; text-decoration: none; padding: 6px; border-radius: 8px; background: #f9f9f9;">
                          <img src="${h.featured_image}" width="44" height="44" style="border-radius: 6px; object-fit: cover;">
                          <div>
                            <div style="font-size: 12.5px; font-weight: 600; color: #111;">${h.title}</div>
                            <div style="font-size: 12px; color: #2e7d32; font-weight: 700;">${fmtBRL(h.price)}</div>
                          </div>
                        </a>
                      </li>
                    `).join('')}
                  </ul>
                `;
              }
            })
            .catch(() => {});
        });
      });
    }
  }

  window.cicatribemMinicart = new CicatribemMinicartController();
})();
