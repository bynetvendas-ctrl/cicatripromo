/**
 * Cicatribem Official Product Lightbox & Zoom Controller
 */
(function() {
  'use strict';

  // Inject Lightbox styles
  function injectStyles() {
    if (document.getElementById('cb-lightbox-styles')) return;
    const style = document.createElement('style');
    style.id = 'cb-lightbox-styles';
    style.textContent = `
      .media-gallery__image, .zoom_light_box {
        cursor: zoom-in !important;
      }
      .cb-pswp-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.92);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.25s ease, visibility 0.25s ease;
        user-select: none;
        -webkit-user-select: none;
      }
      .cb-pswp-overlay.is-open {
        opacity: 1;
        visibility: visible;
      }
      .cb-pswp-container {
        position: relative;
        max-width: 90vw;
        max-height: 88vh;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: scale(0.94);
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .cb-pswp-overlay.is-open .cb-pswp-container {
        transform: scale(1);
      }
      .cb-pswp-img {
        max-width: 90vw;
        max-height: 86vh;
        object-fit: contain;
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
        cursor: zoom-out;
        background: #ffffff;
        transition: opacity 0.2s ease;
      }
      /* Close Button (X) */
      .cb-pswp-close {
        position: fixed;
        top: 20px;
        right: 24px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 1000001;
      }
      .cb-pswp-close:hover {
        background: rgba(255, 255, 255, 0.35);
        transform: scale(1.08);
      }
      .cb-pswp-close svg {
        width: 20px;
        height: 20px;
        stroke: #ffffff;
        stroke-width: 2.5;
      }
      /* Nav Arrows */
      .cb-pswp-nav {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.15);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.25);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 1000001;
      }
      .cb-pswp-nav:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-50%) scale(1.08);
      }
      .cb-pswp-prev { left: 24px; }
      .cb-pswp-next { right: 24px; }
      .cb-pswp-nav svg {
        width: 22px;
        height: 22px;
        stroke: #ffffff;
        stroke-width: 2.5;
      }
      /* Bottom Counter */
      .cb-pswp-counter {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.6);
        color: #ffffff;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 1px;
        z-index: 1000001;
        backdrop-filter: blur(4px);
      }
      @media (max-width: 768px) {
        .cb-pswp-prev { left: 10px; width: 40px; height: 40px; }
        .cb-pswp-next { right: 10px; width: 40px; height: 40px; }
        .cb-pswp-close { top: 14px; right: 16px; width: 40px; height: 40px; }
      }
    `;
    document.head.appendChild(style);
  }

  // Lightbox Singleton Controller
  class ProductLightboxController {
    constructor() {
      this.currentIndex = 0;
      this.items = [];
      this.overlay = null;
      this.imgEl = null;
      this.counterEl = null;
      this.prevBtn = null;
      this.nextBtn = null;
      this.isOpen = false;
      this.initDom();
      this.bindEvents();
    }

    initDom() {
      injectStyles();
      if (document.getElementById('cb-product-lightbox')) {
        this.overlay = document.getElementById('cb-product-lightbox');
        this.imgEl = this.overlay.querySelector('.cb-pswp-img');
        this.counterEl = this.overlay.querySelector('.cb-pswp-counter');
        this.prevBtn = this.overlay.querySelector('.cb-pswp-prev');
        this.nextBtn = this.overlay.querySelector('.cb-pswp-next');
        return;
      }

      const overlay = document.createElement('div');
      overlay.id = 'cb-product-lightbox';
      overlay.className = 'cb-pswp-overlay';
      overlay.innerHTML = `
        <button type="button" class="cb-pswp-close" aria-label="Fechar (Esc)">
          <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <button type="button" class="cb-pswp-nav cb-pswp-prev" aria-label="Anterior">
          <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button type="button" class="cb-pswp-nav cb-pswp-next" aria-label="Próximo">
          <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <div class="cb-pswp-container">
          <img src="" alt="Imagem do produto ampliada" class="cb-pswp-img">
        </div>
        <div class="cb-pswp-counter">1 / 1</div>
      `;

      document.body.appendChild(overlay);
      this.overlay = overlay;
      this.imgEl = overlay.querySelector('.cb-pswp-img');
      this.counterEl = overlay.querySelector('.cb-pswp-counter');
      this.prevBtn = overlay.querySelector('.cb-pswp-prev');
      this.nextBtn = overlay.querySelector('.cb-pswp-next');
    }

    bindEvents() {
      // Close on X button
      this.overlay.querySelector('.cb-pswp-close').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      });

      // Close when clicking outside image (on the backdrop)
      this.overlay.addEventListener('click', (e) => {
        if (!e.target.closest('.cb-pswp-img') && !e.target.closest('.cb-pswp-nav')) {
          this.close();
        }
      });

      // Prev / Next
      this.prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.prev();
      });
      this.nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.next();
      });

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (!this.isOpen) return;
        if (e.key === 'Escape') this.close();
        if (e.key === 'ArrowLeft') this.prev();
        if (e.key === 'ArrowRight') this.next();
      });
    }

    open(items, index = 0) {
      if (!items || items.length === 0) return;
      this.items = items;
      this.currentIndex = Math.max(0, Math.min(index, items.length - 1));
      this.updateView();
      this.overlay.classList.add('is-open');
      this.isOpen = true;
      document.body.style.overflow = 'hidden';
    }

    close() {
      this.overlay.classList.remove('is-open');
      this.isOpen = false;
      document.body.style.overflow = '';
    }

    prev() {
      if (this.items.length <= 1) return;
      this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
      this.updateView();
    }

    next() {
      if (this.items.length <= 1) return;
      this.currentIndex = (this.currentIndex + 1) % this.items.length;
      this.updateView();
    }

    updateView() {
      const current = this.items[this.currentIndex];
      if (!current) return;
      this.imgEl.src = current.src;
      this.counterEl.textContent = `${this.currentIndex + 1} / ${this.items.length}`;
      if (this.items.length <= 1) {
        this.prevBtn.style.display = 'none';
        this.nextBtn.style.display = 'none';
        this.counterEl.style.display = 'none';
      } else {
        this.prevBtn.style.display = 'flex';
        this.nextBtn.style.display = 'flex';
        this.counterEl.style.display = 'block';
      }
    }
  }

  let lightboxInstance = null;
  function getLightbox() {
    if (!lightboxInstance) {
      lightboxInstance = new ProductLightboxController();
    }
    return lightboxInstance;
  }

  // Intercept all image clicks
  function setupGlobalInterceptor() {
    document.addEventListener('click', function(e) {
      if (e.target.closest('.thumbnail-slide, .product__media-thumbnail, .swiper-thumb, .product-thumbnails, .product-gallery__thumbnail')) return;

      const trigger = e.target.closest('a.media-gallery__image, .zoom_light_box, [data-type="open_lightbox"] a, .drift-trigger, [data-pane-container] a');
      if (!trigger) return;

      e.preventDefault();
      e.stopPropagation();

      const gallery = trigger.closest('media-gallery') || trigger.closest('.sec__featured-product') || document;
      const allAnchors = Array.from(gallery.querySelectorAll('a.media-gallery__image, [data-pane-container] a')).filter(a => a.offsetParent !== null || true);

      const seen = new Set();
      const items = [];
      let targetIndex = 0;

      const activeAnchor = trigger.closest('a.media-gallery__image') || trigger.closest('[data-pane-container]');

      allAnchors.forEach(a => {
        const img = a.querySelector('img');
        let src = '';
        if (img) {
          src = img.getAttribute('data-src') || img.currentSrc || img.src;
        }
        if (!src && a.getAttribute('href') && !a.getAttribute('href').endsWith('.html')) {
          src = a.getAttribute('href');
        }
        if (src && !seen.has(src)) {
          seen.add(src);
          items.push({ src: src, element: a });
          if (a === activeAnchor) {
            targetIndex = items.length - 1;
          }
        }
      });

      // Fallback
      if (items.length === 0) {
        const clickedImg = trigger.tagName === 'IMG' ? trigger : trigger.querySelector('img');
        if (clickedImg && clickedImg.src) {
          items.push({ src: clickedImg.src });
        }
      }

      getLightbox().open(items, targetIndex);
    }, true);
  }

  // Custom element stub so <zoom-action> is recognized by the browser
  class ZoomAction extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      // Handled globally
    }
  }
  if (!customElements.get('zoom-action')) {
    customElements.define('zoom-action', ZoomAction);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGlobalInterceptor);
  } else {
    setupGlobalInterceptor();
  }
})();
