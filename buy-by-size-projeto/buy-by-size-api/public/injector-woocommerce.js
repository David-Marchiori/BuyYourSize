/**
 * BuyBySize - INJECTOR WOOCOMMERCE
 * Uso: no functions.php (ou plugin de code snippets), no hook wp_footer,
 * gated por is_product(), setar window.BBS_STORE_ID e carregar este script.
 */
(function () {
  // ⚠️ TEMPORÁRIO — apontando pro tunnel local (localtunnel) só para este teste.
  // Antes de ir pra produção, trocar de volta para https://buy-by-size-api.fly.dev
  const API_BASE_URL = "https://cold-shrimps-decide.loca.lt/api";
  const WIDGET_SCRIPT_URL = "https://cold-shrimps-decide.loca.lt/public/widget.js";
  const WIDGET_CSS_URL = "https://cold-shrimps-decide.loca.lt/public/widget.css";

  // Botão nativo de "Adicionar ao carrinho" do WooCommerce (core, presente
  // em praticamente todo tema — remover essa classe quebraria o próprio
  // AJAX add-to-cart do WooCommerce, por isso é um seletor estável).
  const TARGET_ELEMENT_SELECTOR = ".single_add_to_cart_button";

  async function findImageUrlWithRetry(maxAttempts = 10) {
    const imageSelectors = [
      ".woocommerce-product-gallery__image img[src]", // Galeria padrão WooCommerce
      ".woocommerce-product-gallery img[src]",
      "img.wp-post-image[src]", // Imagem destacada do WordPress
    ];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let imageElement = null;

      for (const selector of imageSelectors) {
        imageElement = document.querySelector(selector);
        if (
          imageElement &&
          (imageElement.getAttribute("src") || imageElement.getAttribute("data-src"))
        ) {
          break;
        }
        imageElement = null;
      }

      if (imageElement) {
        const url =
          imageElement.getAttribute("src") ||
          imageElement.getAttribute("data-src") ||
          imageElement.currentSrc;
        if (url && !url.includes("data:image")) {
          return url.split("?")[0];
        }
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    return null;
  }

  // O ID do produto pai vem do campo add-to-cart nativo do WooCommerce:
  // <button name="add-to-cart" value="123"> (produto simples) ou
  // <input type="hidden" name="add-to-cart" value="123"> (produto variável).
  function getProductId() {
    const addToCartField = document.querySelector('[name="add-to-cart"][value]');
    if (addToCartField) {
      const val = addToCartField.getAttribute("value");
      if (val && /^\d+$/.test(val)) return val;
    }

    // Fallback: WordPress sempre adiciona "postid-{ID}" no <body> em páginas singulares.
    const match = document.body.className.match(/postid-(\d+)/);
    return match ? match[1] : null;
  }

  async function initInjector() {
    const storeId = window.BBS_STORE_ID;
    if (!storeId) return;
    if (!document.body.classList.contains("single-product")) return;

    try {
      const productId = getProductId();
      if (!productId) {
        return console.warn("BuyBySize: ID do produto não encontrado.");
      }

      const productImage = await findImageUrlWithRetry();

      window.BuyBySizeConfig = {
        API_BASE_URL: API_BASE_URL,
        productId: productId,
        targetElement: TARGET_ELEMENT_SELECTOR,
        storeId: storeId,
        productImage: productImage || "",
      };

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = WIDGET_CSS_URL;
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = WIDGET_SCRIPT_URL;
      script.defer = true;
      document.body.appendChild(script);
    } catch (e) {
      console.error("BuyBySize Injector Error", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInjector);
  } else {
    initInjector();
  }
})();
