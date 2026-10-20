/**
 * Gerencia PagShield (Konduto) e informações extras (User Agent e IP)
 */
(function () {
    'use strict';

    const BASE_URL = "https://service.pagbrasil.com/shopify/api";
    const CACHE_EXPIRATION_TIME_WEBPIXEL = 10 * 60 * 1000; // 10 minutos em milissegundos
    const CACHE_EXPIRATION_TIME_PUBLIC_KEY = 30 * 60 * 1000; // 30 minutos em milissegundos
    
    // Cache de formulários para evitar duplicação
    let cachedForms = null;
    let formsCached = false;

    /**
     * Salva um valor no sessionStorage com timestamp de expiração
     * @param {string} key - Chave do sessionStorage
     * @param {string} value - Valor a ser armazenado
     */
    function setSessionWithExpiration(key, value) {
        const item = {
            value: value,
            timestamp: Date.now()
        };
        sessionStorage.setItem(key, JSON.stringify(item));
    }

    /**
     * Obtém um valor do sessionStorage verificando se ainda é válido
     * @param {string} key - Chave do sessionStorage
     * @param {number} expirationTime - Tempo de expiração em milissegundos
     * @returns {string|null} Valor armazenado ou null se expirado/inexistente
     */
    function getSessionWithExpiration(key, expirationTime) {
        const itemStr = sessionStorage.getItem(key);
        
        if (!itemStr) {
            return null;
        }

        try {
            const item = JSON.parse(itemStr);
            const now = Date.now();

            if (now - item.timestamp > expirationTime) {
                sessionStorage.removeItem(key);
                return null;
            }

            return item.value;
        } catch (e) {
            sessionStorage.removeItem(key);
            return null;
        }
    }

    /**
     * Retorna a URL do serviço
     */
    function getServiceURL() {
        return window.pbEnvironment?.url || BASE_URL;
    }

    /**
     * Retorna o shop/merchant da Shopify
     */
    function getShopDomain() {
        return window.Shopify?.shop || "";
    }

    /**
     * Retorna todos os formulários de adicionar ao carrinho
     * @param {boolean} forceRefresh - Força a busca dos formulários novamente
     */
    function getCartForms(forceRefresh = false) {
        if (!formsCached || forceRefresh) {
            cachedForms = document.querySelectorAll('form[action*="/add"]');
            formsCached = true;
        }
        return cachedForms;
    }

    /**
     * Cria um input hidden
     * @param {string} id - ID do input
     * @param {string} name - Nome do input
     * @param {string} value - Valor do input
     * @returns {HTMLInputElement}
     */
    function createHiddenInput(id, name, value) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.id = id;
        input.name = name;
        input.value = value;
        input.style.display = "none";
        return input;
    }

    /**
     * Adiciona múltiplos inputs aos formulários de uma vez
     */
    function addMultipleInputsToForms(inputs) {
        if (!inputs || inputs.length === 0) {
            return;
        }

        const forms = getCartForms();

        forms.forEach((form) => {
            if (!form) {
                return;
            }

            const fragment = document.createDocumentFragment();

            inputs.forEach(({ id, name, value }) => {
                const existingInput = form.querySelector(`#${id}`);
                if (existingInput) {
                    existingInput.value = value;
                    return;
                }

                fragment.appendChild(createHiddenInput(id, name, value));
            });

            form.appendChild(fragment);
        });
    }

    /**
     * Obtém o visitor ID da Konduto.
     */
    function getKondutoVisitorId() {
        if (typeof window.getKondutoID !== "function") {
            return "";
        }

        const visitorId = window.getKondutoID();

        if (typeof visitorId !== "string" || visitorId === "") {
            return "";
        }

        return visitorId;
    }


    /**
     * Carrega o script da Konduto e inicializa com a chave pública.
     * @param {string} publicKey
     * @returns {Promise<string>}
     */
    function handlePagShieldCreate(publicKey) {
        return new Promise((resolve) => {
            if (!publicKey) {
                resolve("");
                return;
            }

            const __kdt = [{
                public_key: publicKey,
            }];

            window.__kdt = __kdt;

            const kondutoScript = document.createElement("script");
            kondutoScript.id = "kdtjs";
            kondutoScript.type = "text/javascript";
            kondutoScript.async = false;
            kondutoScript.src = "https://i.k-analytix.com/k.js";

            kondutoScript.addEventListener("load", () => {
                const visitorId = getKondutoVisitorId();
                resolve(visitorId);
            });

            kondutoScript.addEventListener("error", () => {
                resolve("");
            });

            document.body.insertBefore(kondutoScript, document.body.lastChild);
        });
    }

    /**
     * Inicializa o PagShield (Konduto) e retorna o visitor ID
     */
    async function initPagShield() {
        const serviceURL = getServiceURL();
        const merchantUrl = getShopDomain();

        if (!merchantUrl) {
            return "";
        }

        // Caso já exista script da Konduto, não é necessário carregar novamente
        if (window.__kdt !== undefined && typeof window.__kdt === "object" && document.getElementById("kdtjs")) {
            return getKondutoVisitorId();
        }

        let publicKey = getSessionWithExpiration("pb_pk_getupub", CACHE_EXPIRATION_TIME_PUBLIC_KEY);
        
        if (!publicKey) {
            try {
                const response = await fetch(`${serviceURL}/getPub?merchant=${merchantUrl}`);
                const data = await response.json();
                publicKey = data.pubkey || "";

                setSessionWithExpiration("pb_pk_getupub", publicKey);
            } catch (error) {
                return "";
            }
        }

        return await handlePagShieldCreate(publicKey);
    }

    /**
     * Obtém o IP do cliente e retorna o IP
     * @returns {Promise<string>}
     */
    async function fetchCustomerIp() {
        const serviceURL = getServiceURL();
        const webpixel = getSessionWithExpiration("pagbrasil_webpixel", CACHE_EXPIRATION_TIME_WEBPIXEL);

        if (webpixel) {
            return webpixel;
        }

        const shopDomain = getShopDomain();

        try {
            const response = await fetch(`${serviceURL}/webpixel?domain=${shopDomain}`);
            const data = await response.json();
            const customerIp = data.text ?? "";
            
            setSessionWithExpiration("pagbrasil_webpixel", customerIp);
            return customerIp;
        } catch (error) {
            return "";
        }
    }

    /**
     * Orquestra a busca de todos os dados e adiciona os inputs aos formulários
     */
    async function initializeApp() {
        try {
            const [visitorId, customerIp] = await Promise.all([
                initPagShield(),   // GET ID da Konduto
                fetchCustomerIp()  // GET IP do cliente
            ]);

            const userAgent = navigator.userAgent;

            const inputs = [];

            if (userAgent) {
                inputs.push({
                    id: "user_agent",
                    name: "properties[_user_agent]",
                    value: userAgent
                });
            }

            if (customerIp) {
                inputs.push({
                    id: "pb_web_pixel",
                    name: "properties[_pb_web_pixel]",
                    value: customerIp
                });
            }

            if (visitorId) {
                inputs.push({
                    id: "pb_visitor_id",
                    name: "properties[_pb_visitor_id]",
                    value: visitorId
                });
            }

            if (inputs.length > 0) {
                addMultipleInputsToForms(inputs);
            }

        } catch (e) {
            // console.error("Erro ao inicializar app PagBrasil", e.message);
        }
    }

    window.addEventListener("load", () => {
        const mithRegex = /mithoficial|mith-suplementos|pb-automation3/;

        const merchantUrl = getShopDomain();

        // Script de validação: só executa se o merchant URL for válido
        if (!mithRegex.test(merchantUrl)) {
            return;
        }

        initializeApp();
    });

})();