(function() {
    'use strict';

    const extraInfoBaseURL = "https://service.pagbrasil.com/shopify/api";
    const CACHE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutos em milissegundos

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

    window.addEventListener("load", async () => {
        const forms = document.querySelectorAll('form[action*="/add"]');
        
        if (!forms || forms.length === 0) {
            return;
        }

        const serviceURL = window.pbEnvironment?.url || extraInfoBaseURL;
        const shopDomainParam = Shopify?.shop ? Shopify.shop : "";

        try {
            const userAgent = navigator.userAgent;

            addInputsToForms(forms, userAgent);
        } catch (e) {
            // console.error("Erro ao processar informações extras", e.message);
        }
    });

    /**
     * Adiciona os inputs de user agent aos formulários
     * @param {NodeList} forms - Lista de formulários
     * @param {string} userAgent - User agent do comprador
     */
    function addInputsToForms(forms, userAgent) {
        forms.forEach((form) => {
            const userAgentInput = `<input type='hidden' style='display: none' id="user_agent" name='properties[_user_agent]' value='${userAgent}' />`;
            
            form.insertAdjacentHTML("beforeend", userAgentInput);
        });
    }
})();
