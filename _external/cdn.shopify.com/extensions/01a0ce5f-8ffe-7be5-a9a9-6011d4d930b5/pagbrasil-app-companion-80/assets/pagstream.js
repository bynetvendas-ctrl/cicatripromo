// Garante que sempre vai ter uma URL base, independente da configuração da pipeline pra HOM
const pagstreamBaseURL = "https://service.pagbrasil.com/shopify/api";


window.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("pb-pagstream-iframe")) {
        const serviceURL = window.pbEnvironment?.url || pagstreamBaseURL;

        // Retira titulo default shopify da página
        const pageTitle = document.querySelector(".main-page-title") || "";

        if (pageTitle) {
            pageTitle.innerText = "";
        }

        const merchantUrl = window.Shopify.shop;
        const hash = "AS098js89OHS";

        fetch(`${serviceURL}/getsettingspagstream?merchant_url=${merchantUrl}&hash=${btoa(hash)}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.subdomain) {
                    const customerEmail = document.getElementById("pb-customer-email") ? document.getElementById("pb-customer-email").innerText : "";

                    console.log("teste1", window.pagstream ? window.pagstream : "Não tem objeto window pagstream ainda");

                    window.pagstream = {
                        subdomain: data.subdomain,
                        customerEmail: customerEmail
                    };

                    console.log("teste2", window.pagstream);

                    const script = document.createElement("script");
                    script.src = "https://pagstream.com/ps/shopify/js/app.js";
                    script.id = "pb-pagstream";
                    script.type = "text/javascript";

                    document.getElementById("pb-pagstream-iframe").appendChild(script);

                    const link = document.createElement("link");

                    link.rel = "stylesheet";
                    link.href = "https://pagstream.com/ps/shopify/css/app.css";
                    link.id = "pagstream-styles";

                    if (document.getElementsByTagName("head")[0]) {
                        document.getElementsByTagName("head")[0].appendChild(link);
                    }

                    if (document.documentElement) {
                        document.documentElement.style.fontSize = "12px";
                    }
                }
            })
            .catch((error) => {
                // console.log(error)
            });
    }
});
