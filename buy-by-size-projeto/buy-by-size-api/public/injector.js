/**
 * BuyBySiza - INJECTOR.JS (Versão com Retry de Imagem)
 * Carregado via tag <script async data-store-id="..."></script>
 */
(function () {
    // ⚠️ Configure o domínio de PRODUÇÃO
    const API_BASE_URL = 'https://buy-by-size-api.fly.dev/api';
    const WIDGET_SCRIPT_URL = 'https://buy-by-size-api.fly.dev/public/widget.js';
    const WIDGET_CSS_URL = 'https://buy-by-size-api.fly.dev/public/widget.css';

    // ⚠️ IMPORTANTE: Use um seletor estável, não use os com final estranho (__xyz)
    const TARGET_ELEMENT_SELECTOR = '.styles_addToCartWrapper__1pibr';

    // --- FUNÇÃO AUXILIAR: Tenta achar a imagem com persistência ---
    async function findImageUrlWithRetry(maxAttempts = 10) {
        const imageSelectors = [
            '.product-image-container img[src]',      // Prioridade 1: Imagem principal já carregada
            '.swiper-slide-active img[src]',          // Prioridade 2: Slide ativo
            'img[data-store="product-image"]',        // Genérico Nuvemshop
            '.js-product-image-container img'         // Fallback antigo
        ];

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            let imageElement = null;

            // Tenta os seletores
            for (const selector of imageSelectors) {
                imageElement = document.querySelector(selector);
                // Só aceita se o elemento existir E tiver um src ou data-src válido
                if (imageElement && (imageElement.getAttribute('src') || imageElement.getAttribute('data-src'))) {
                    break;
                }
                imageElement = null; // Reseta se achou o elemento mas estava vazio
            }

            if (imageElement) {
                let url = imageElement.getAttribute('src') || imageElement.getAttribute('data-src') || imageElement.currentSrc;
                if (url && !url.includes('data:image')) { // Ignora placeholders base64
                    return url.split('?')[0]; // Sucesso! Retorna a URL limpa
                }
            }

            // Se não achou, espera 500ms antes de tentar de novo
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        return null; // Desiste após todas as tentativas
    }
    // -----------------------------------------------------------


    // --- LÓGICA PRINCIPAL ---
    async function initInjector() {
        const currentScript = document.currentScript;
        if (!currentScript) return;

        const storeId = window.BBS_STORE_ID;
        // Se não tiver ID da loja ou não for página de produto (body hydrated), sai.
        if (!storeId || !document.body.classList.contains('hydrated')) return;

        let productId = null;

        try {
            // 1. DETECTAR ID DO PRODUTO
            const productElement = document.querySelector('[data-store^="product-name-"]');
            if (productElement) {
                const dataStoreValue = productElement.getAttribute('data-store');
                const match = dataStoreValue.match(/product-name-(\d+)/);
                if (match && match[1]) productId = match[1];
            }

            if (!productId && !document.body.classList.contains('product-view')) return;
            if (!productId) return console.warn("BuyBySize: ID do produto não encontrado.");

            // 2. DETECTAR IMAGEM (Usando a nova função com espera)
            // O 'await' aqui faz o script pausar até a imagem aparecer ou desistir
            const productImage = await findImageUrlWithRetry();

            // --- CONFIGURAÇÃO E INJEÇÃO ---
            window.BuyBySizeConfig = {
                API_BASE_URL: API_BASE_URL,
                productId: productId,
                targetElement: TARGET_ELEMENT_SELECTOR,
                storeId: storeId,
                productImage: productImage || '' // Envia string vazia se não achou
            };

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = WIDGET_CSS_URL;
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = WIDGET_SCRIPT_URL;
            script.defer = true;
            document.body.appendChild(script);

        } catch (e) {
            console.error("BuyBySize Injector Error", e);
        }
    }

    // Inicia o processo
    initInjector();
})();