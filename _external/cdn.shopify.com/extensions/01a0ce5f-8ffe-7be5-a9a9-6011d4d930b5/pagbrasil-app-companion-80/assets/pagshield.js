(function () {
    "use strict";
    const pagshieldBaseURL = "https://service.pagbrasil.com/shopify/api";
    const CACHE_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutos em milissegundos

    /**
     * Salva um valor no sessionStorage com timestamp de expiração
     * @param {string} key - Chave do sessionStorage
     * @param {string} value - Valor a ser armazenado
     */
    function setSessionWithExpiration(key, value) {
        const item = {
            value: value,
            timestamp: Date.now(),
        };
        sessionStorage.setItem(key, JSON.stringify(item));
    }

    /**
     * Obtém um valor do sessionStorage verificando se ainda é válido
     * @param {string} key - Chave do sessionStorage
     * @returns {string|null} Valor armazenado ou null se expirado/inexistente
     */
    function getSessionWithExpiration(key) {
        const itemStr = sessionStorage.getItem(key);

        if (!itemStr) {
            return null;
        }

        try {
            const item = JSON.parse(itemStr);
            const now = Date.now();

            if (now - item.timestamp > CACHE_EXPIRATION_TIME) {
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
     * Busca a public key no mapa estático (merchantPubKeys.json) publicado com a extensão
     * @param {string} merchantUrl - Domínio da loja (window.Shopify.shop)
     * @returns {Promise<string|null>} Public key encontrada ou null
     */
    async function getPublicKeyFromStaticMap(merchantUrl) {
        const mapUrl = window.pbMerchantPubKeysUrl;

        if (!mapUrl) {
            return null;
        }

        try {
            const response = await fetch(mapUrl);
            const map = await response.json();

            return map[merchantUrl] || null;
        } catch (e) {
            return null;
        }
    }

    window.addEventListener("load", async () => {
        const serviceURL = window.pbEnvironment?.url || pagshieldBaseURL;

        const merchantUrl = window.Shopify.shop;

        if (!merchantUrl) {
            return;
        }

        // caso já exista script da konduto, não é necessário carregar novamente, portanto, apenas seta o input de visitor id
        if (window.__kdt !== undefined && typeof window.__kdt === "object" && document.getElementById("kdtjs")) {
            // console.log("PagShield already loaded");
            handleVisitorId();
            return;
        }

        let publicKey = getSessionWithExpiration("pb_pk_getupub");

        if (!publicKey) {
            publicKey = await getPublicKeyFromStaticMap(merchantUrl);

            console.log("aqui public key static map: ", publicKey);
        }

        if (!publicKey) {
            try {
                const response = await fetch(`${serviceURL}/getPub?merchant=${merchantUrl}`);
                const data = await response.json();
                publicKey = data.pubkey || "";
            } catch (error) {
                // console.log(error)
            }
        }

        if (publicKey) {
            setSessionWithExpiration("pb_pk_getupub", publicKey);
        }

        try {
            handlePagShieldCreate(publicKey);
        } catch (e) {
            // console.error("Error on handleKondutoVisitorId: " + e.message);
        }
    });

    /**
     * Cria input invisível de visitor id e seta seu valor conforme o valor recebido como parâmetro na função
     * @param {string} visitorId - Id do visitante gerado pela Konduto
     * @param {any} formElement - Elemento HTML do formulario
     */
    function createAndSetVisitorIdInput(visitorId) {
        const forms = document.querySelectorAll('form[action*="/add"]');

        forms.forEach((form) => {
            if (!form) {
                return;
            }

            const visitorIdInput = `<input type='hidden' style='display: none' id="pb_visitor_id" name='properties[_pb_visitor_id]' value='${visitorId}' />`;

            form.insertAdjacentHTML("beforeend", visitorIdInput);
        });
    }

    function handleVisitorId() {
        if (typeof window.getKondutoID !== "function") {
            return;
        }

        let visitorId = window.getKondutoID();

        if (typeof visitorId !== "string" || visitorId === "") {
            return;
        }

        // caso exista visitorId, cria input e seta seu valor
        createAndSetVisitorIdInput(visitorId);
    }

    /**
     * Carrega o script da Konduto, gera input de visitor id e seta seu valor
     * @param publicKey - Chave pública do merchant
     */
    function handlePagShieldCreate(publicKey) {
        if (!publicKey) {
            // console.error("Public key not found");
            return;
        }

        var __kdt = [];

        __kdt.push({
            public_key: publicKey,
        });

        window.__kdt = __kdt;

        let kondutoScript = document.createElement("script");

        kondutoScript.id = "kdtjs";
        kondutoScript.type = "text/javascript";
        kondutoScript.async = false;
        kondutoScript.src = "https://i.k-analytix.com/k.js";

        kondutoScript.addEventListener("load", () => {
            handleVisitorId();
        });

        document.body.insertBefore(kondutoScript, document.body.lastChild);
    }
})();
