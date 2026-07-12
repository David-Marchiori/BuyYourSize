(function () {
  console.log("Buy by Size - Widget atualizado");

  const config = window.BuyBySizeConfig || {};
  const productId = config.productId;
  const productImage = config.productImage || "";
  const targetSelector = config.targetElement || ".js-addtocart";
  const API_BASE_URL =
    config.API_BASE_URL || "https://buy-by-size-api.fly.dev/api";

  if (!productId) {
    console.warn("Buy by Size: ID faltando.");
    return;
  }

  // Espelha o FIELD_CONFIG_BY_TYPE do backend (src/utils/rules.js).
  // Duplicado aqui porque este arquivo é um asset público estático.
  const TYPE_CONFIG = {
    parte_cima: { essenciais: ["busto", "cintura"], opcionais: ["altura", "peso"] },
    parte_baixo: { essenciais: ["cintura"], opcionais: ["quadril", "altura"] },
    vestido: { essenciais: ["busto", "quadril"], opcionais: ["cintura", "altura", "peso"] },
  };

  const FIELD_LABELS = {
    altura: { label: "Altura", unit: "cm", placeholder: "175", min: 140, max: 210, step: 1, default: 170 },
    peso: { label: "Peso", unit: "kg", placeholder: "65.5", min: 30, max: 150, step: 0.5, default: 65 },
    busto: { label: "Busto", unit: "cm", placeholder: "90", min: 60, max: 140, step: 1, default: 90 },
    cintura: { label: "Cintura", unit: "cm", placeholder: "70", min: 50, max: 130, step: 1, default: 70 },
    quadril: { label: "Quadril", unit: "cm", placeholder: "100", min: 60, max: 150, step: 1, default: 100 },
  };

  const normalizeField = (campo, value) => {
    let num = parseFloat(value);
    if (!Number.isFinite(num)) return undefined;
    if (campo === "altura" && num > 3) num = num / 100;
    return num;
  };

  const state = {
    step: 1,
    type: null,
    data: {},
    touched: {},
    result: null,
    resultPhrases: [],
    confianca: null,
    loading: false,
    error: "",
    showGuide: false,
  };

  const baseHTML = `
        <div class="bbs-modal-overlay" id="bbs-overlay">
            <div class="bbs-modal-card">
                <button class="bbs-close-btn" id="bbs-close">&times;</button>
                <div class="bbs-col-image" id="bbs-product-image"></div>
                <div class="bbs-col-content" id="bbs-content-area"></div>
            </div>
        </div>
    `;

  if (!document.getElementById("bbs-overlay")) {
    document.body.insertAdjacentHTML("beforeend", baseHTML);
  }

  const overlay = document.getElementById("bbs-overlay");
  const contentArea = document.getElementById("bbs-content-area");
  const imageArea = document.getElementById("bbs-product-image");

  if (productImage) {
    imageArea.style.backgroundImage = `url('${productImage}')`;
  }

  const setError = (message) => {
    state.error = message || "";
  };

  function render() {
    if (state.step === 1) {
      if (state.type === "calcado") {
        renderStepShoe();
      } else {
        renderEssentialStep();
      }
    } else if (state.step === 2) {
      renderOptionalStep();
    } else if (state.step === 3) {
      renderLoading();
    } else {
      renderResult();
    }
  }

  function renderEssentialStep() {
    const typeConfig = TYPE_CONFIG[state.type] || TYPE_CONFIG.vestido;

    const fieldsHTML = typeConfig.essenciais
      .map((campo) => {
        const meta = FIELD_LABELS[campo];
        const value = state.data[campo] || "";
        return `
                <div class="bbs-form-group">
                    <label class="bbs-label">${meta.label}</label>
                    <div class="bbs-input-row">
                        <input type="number" step="${meta.step}" id="inp-${campo}" class="bbs-input" value="${value}" placeholder="${meta.placeholder}">
                        <span class="bbs-unit">${meta.unit}</span>
                    </div>
                </div>
            `;
      })
      .join("");

    contentArea.innerHTML = `
            <div class="bbs-anim-enter">
                <div class="bbs-header">
                    <h3 class="bbs-title">Qual é o Meu Tamanho?</h3>
                    <p class="bbs-subtitle">Informe suas medidas essenciais para encontrar o ajuste perfeito.</p>
                </div>

                ${fieldsHTML}

                ${
                  state.error
                    ? `<p class="bbs-error-text">${state.error}</p>`
                    : ""
                }

                <div class="bbs-footer-area">
                    <div class="bbs-dots">
                        <div class="bbs-dot active"></div>
                        <div class="bbs-dot"></div>
                    </div>
                    <button class="bbs-btn-next" id="btn-next-1">Próximo</button>
                </div>
            </div>
        `;

    document.getElementById("btn-next-1").onclick = () => {
      const faltando = [];

      typeConfig.essenciais.forEach((campo) => {
        const val = document.getElementById(`inp-${campo}`).value;
        if (!val) {
          faltando.push(FIELD_LABELS[campo].label);
        } else {
          state.data[campo] = val;
        }
      });

      if (faltando.length) {
        setError(`Preencha: ${faltando.join(", ")}.`);
        render();
        return;
      }

      setError("");
      if (typeConfig.opcionais.length) {
        state.step = 2;
        render();
      } else {
        submitData();
      }
    };
  }

  function renderOptionalStep() {
    const typeConfig = TYPE_CONFIG[state.type] || TYPE_CONFIG.vestido;

    const slidersHTML = typeConfig.opcionais
      .map((campo) => {
        const meta = FIELD_LABELS[campo];
        const current = state.data[campo] !== undefined ? state.data[campo] : meta.default;
        return `
                <div class="bbs-slider-item">
                    <div class="bbs-slider-head">
                        <label class="bbs-label">${meta.label} (${meta.unit})</label>
                        <input type="number" id="num-${campo}" value="${current}" class="bbs-mini-input" step="${meta.step}">
                    </div>
                    <input type="range" id="range-${campo}" min="${meta.min}" max="${meta.max}" step="${meta.step}" value="${current}" class="bbs-range-control">
                </div>
            `;
      })
      .join("");

    contentArea.innerHTML = `
            <div class="bbs-anim-enter">
                <div class="bbs-header">
                    <h3 class="bbs-title">Ajuste Fino (opcional)</h3>
                    <p class="bbs-subtitle">Esses campos são opcionais, mas ajudam a afinar sua recomendação.</p>
                </div>
                <div class="bbs-slider-stack">
                    ${slidersHTML}
                </div>
                <div class="bbs-hint-card">
                    <span>Quanto mais medidas você informar, mais precisa fica a sugestão de tamanho.</span>
                </div>

                ${
                  state.error
                    ? `<p class="bbs-error-text">${state.error}</p>`
                    : ""
                }

                <div class="bbs-footer-area">
                    <div class="bbs-dots">
                        <div class="bbs-dot"></div>
                        <div class="bbs-dot active"></div>
                    </div>
                    <div class="bbs-actions-row">
                        <button class="bbs-btn-next bbs-btn-outline" id="btn-skip">Pular</button>
                        <button class="bbs-btn-next" id="btn-calc">Ver Tamanho</button>
                    </div>
                </div>
            </div>
        `;

    typeConfig.opcionais.forEach((campo) => {
      const rangeEl = document.getElementById(`range-${campo}`);
      const numEl = document.getElementById(`num-${campo}`);

      const markTouched = (val) => {
        state.touched[campo] = true;
        state.data[campo] = val;
      };

      rangeEl.oninput = (e) => {
        numEl.value = e.target.value;
        markTouched(e.target.value);
      };
      numEl.oninput = (e) => {
        rangeEl.value = e.target.value;
        markTouched(e.target.value);
      };
    });

    document.getElementById("btn-skip").onclick = () => {
      typeConfig.opcionais.forEach((campo) => {
        delete state.touched[campo];
        delete state.data[campo];
      });
      submitData();
    };

    document.getElementById("btn-calc").onclick = submitData;
  }

  function renderStepShoe() {
    const minRange = 20;
    const maxRange = 34;
    const currentVal = state.data.pe || 26;

    // Verifica se a variável global productImage existe e não é vazia
    const imgUrl = typeof productImage !== "undefined" ? productImage : "";

    // HTML Estrutural (As classes CSS farão o estilo)
    contentArea.innerHTML = `
        <div class="bbs-anim-enter bbs-clean-wrapper">

            ${
              imgUrl
                ? `<div class="bbs-img-header"><img src="${imgUrl}" alt="Produto"></div>`
                : ""
            }

            <h2 class="bbs-clean-title">Qual é o comprimento do seu pé?</h2>
            <p class="bbs-clean-subtitle">
                Selecione a medida no controle abaixo ou digite o valor exato.
            </p>

            <div class="bbs-input-area">
                <div class="bbs-slider-group">
                    <label class="bbs-input-label">Ajuste os centímetros</label>
                    <input type="range" id="inp-foot-range" class="bbs-range-modern"
                           min="${minRange}" max="${maxRange}" step="0.1" value="${currentVal}">
                </div>

                <div class="bbs-number-box">
                    <input type="number" id="inp-foot-num" class="bbs-input-modern"
                           value="${currentVal}" step="0.1" min="${minRange}" max="${maxRange}">
                    <span style="font-size:0.9rem; font-weight:500; color:#64748b;">cm</span>
                </div>
            </div>

            ${state.error ? `<p class="bbs-error-msg">${state.error}</p>` : ""}

            <div class="bbs-actions-row">
                <button id="btn-guide-shoe" class="bbs-btn bbs-btn-outline">Como medir</button>
                <button id="btn-calc-shoe" class="bbs-btn bbs-btn-primary">PRÓXIMO</button>
            </div>
        </div>

        ${
          state.showGuide
            ? `
            <div class="bbs-guide-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;">
                <div class="bbs-guide-card" style="background:#fff;border-radius:16px;width:100%;max-width:380px;padding:24px;position:relative;box-shadow:0 20px 40px rgba(0,0,0,0.2);">
                    <button id="btn-close-guide" style="position:absolute;top:12px;right:12px;border:none;background:none;font-size:1.8rem;cursor:pointer;color:#94a3b8;line-height:1;">&times;</button>
                    <h3 style="margin-top:0;color:#1f2937;font-size:1.25rem;">Como medir seu pé</h3>
                    <ol style="padding-left:20px;color:#4b5563;line-height:1.6;margin-bottom:24px;">
                        <li style="margin-bottom:8px;">Encoste o calcanhar em uma parede plana.</li>
                        <li style="margin-bottom:8px;">Marque onde termina o seu "dedão" no chão.</li>
                        <li style="margin-bottom:8px;">Meça a distância da parede até a marcação.</li>
                        <li>Repita no outro pé e use o <strong>maior valor</strong>.</li>
                    </ol>
                    <button id="btn-close-guide-action" style="width:100%;padding:14px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;font-weight:700;color:#334155;text-transform:uppercase;font-size:0.9rem;">Entendi</button>
                </div>
            </div>
        `
            : ""
        }
    `;

    // --- Lógica JS (Eventos e Sincronização) ---

    const range = document.getElementById("inp-foot-range");
    const num = document.getElementById("inp-foot-num");

    // Sincroniza Slider <-> Input Numérico
    const syncValue = (val) => {
      let safeVal = parseFloat(val);
      // Não forçamos o clamp no input visual imediatamente para permitir digitação,
      // mas salvamos o valor tratado no state se estiver dentro do range
      if (safeVal > maxRange) safeVal = maxRange;
      if (safeVal < minRange) safeVal = minRange;
      state.data.pe = safeVal;
    };

    range.oninput = (e) => {
      num.value = e.target.value;
      syncValue(e.target.value);
    };

    num.oninput = (e) => {
      range.value = e.target.value;
      syncValue(e.target.value);
    };

    // Abertura do Modal de Guia
    const guideBtn = document.getElementById("btn-guide-shoe");
    if (guideBtn) {
      guideBtn.onclick = () => {
        state.showGuide = true;
        render();
      };
    }

    // Fechamento do Modal de Guia
    if (state.showGuide) {
      const closeActions = [
        document.getElementById("btn-close-guide"),
        document.getElementById("btn-close-guide-action"),
      ];
      closeActions.forEach((btn) => {
        if (btn) {
          btn.onclick = () => {
            state.showGuide = false;
            render();
          };
        }
      });
    }

    // Ação do Botão Próximo (Validação)
    document.getElementById("btn-calc-shoe").onclick = () => {
      state.showGuide = false;
      const val = parseFloat(num.value);

      if (!val || val < minRange || val > maxRange) {
        setError(`Valor inválido. Insira entre ${minRange} e ${maxRange} cm.`);
        render(); // Re-renderiza para mostrar o erro
        return;
      }

      state.data.pe = val;
      setError("");
      submitData();
    };
  }

  function renderLoading() {
    contentArea.innerHTML = `
            <div class="bbs-anim-enter bbs-loading-state">
                <div class="bbs-loader"></div>
                <h3 class="bbs-title">Analisando...</h3>
            </div>
        `;
  }

  function renderResult() {
    const hasResult = !!state.result;
    const size = state.result || "?";

    // Frases de reforço positivo (Padrão caso não venha da API)
    const defaultPhrases = [
      "Alta precisão",
      "Conforto garantido",
      "Medida verificada",
    ];

    // Se a API mandar frases, usamos. Se não, usamos as padrões para manter o layout bonito.
    // Se a API mandar apenas uma, completamos com as padrões.
    let displayPhrases =
      state.resultPhrases && state.resultPhrases.length > 0
        ? state.resultPhrases
        : defaultPhrases;

    // Garante que temos pelo menos 2 frases para o visual ficar legal
    if (displayPhrases.length < 2) {
      displayPhrases = [...displayPhrases, ...defaultPhrases.slice(0, 2)];
    }
    // Limitamos a 3 para não poluir
    displayPhrases = displayPhrases.slice(0, 3);

    let body = "";

    if (hasResult) {
      // Gera o HTML das pílulas verdes
      const pillsHTML = displayPhrases
        .map(
          (phrase) => `
            <div class="bbs-pill-green">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>${phrase}</span>
            </div>
        `
        )
        .join("");

      const confidenceHTML =
        state.type !== "calcado" && state.confianca
          ? `<p class="bbs-confidence-note">${
              state.confianca === "alta"
                ? "✓ Recomendação de alta precisão, baseada em várias medidas."
                : "Recomendação baseada nas medidas essenciais. Informe as opcionais na próxima vez para um resultado ainda mais preciso."
            }</p>`
          : "";

      body = `
            <div class="bbs-result-header">
                <div class="bbs-result-title">Seu tamanho ideal é</div>
                <div class="bbs-big-size">${size}</div>
            </div>

            <div class="bbs-pills-container">
                ${pillsHTML}
            </div>

            ${confidenceHTML}

            <p style="color:#64748b; font-size:0.95rem; margin-bottom:10px;">
                Esta recomendação é baseada nas medidas exatas do seu pé comparadas com este produto.
            </p>
        `;
    } else {
      // Caso de erro
      body = `
            <div class="bbs-result-header">
                <h3 style="color:#1f2937; margin-bottom:8px;">Ops!</h3>
                <p class="bbs-error-box">${
                  state.error || "Não conseguimos calcular o tamanho."
                }</p>
            </div>
        `;
    }

    contentArea.innerHTML = `
        <div class="bbs-anim-enter bbs-result-wrapper">
            ${body}

            <div class="bbs-actions-row">
                <button class="bbs-btn bbs-btn-outline" id="btn-edit">Refazer</button>
                <button class="bbs-btn bbs-btn-primary" id="btn-close-final">Fechar</button>
            </div>
        </div>
    `;

    // Eventos
    const btnEdit = document.getElementById("btn-edit");
    if (btnEdit) {
      btnEdit.onclick = () => {
        state.step = 1; // Ou para onde você quiser voltar
        render();
      };
    }

    const btnClose = document.getElementById("btn-close-final");
    if (btnClose) {
      btnClose.onclick = () => {
        // Fecha o modal removendo a classe do overlay
        if (overlay) overlay.classList.remove("open");
      };
    }
  }

  async function submitData() {
    state.showGuide = false;
    state.loading = true;
    state.step = 3;
    render();

    try {
      const medidas = {};

      if (state.type === "calcado") {
        medidas.pe = normalizeField("pe", state.data.pe) || 0;
      } else {
        const typeConfig = TYPE_CONFIG[state.type] || TYPE_CONFIG.vestido;

        typeConfig.essenciais.forEach((campo) => {
          medidas[campo] = normalizeField(campo, state.data[campo]) || 0;
        });

        typeConfig.opcionais.forEach((campo) => {
          if (state.touched[campo]) {
            medidas[campo] = normalizeField(campo, state.data[campo]);
          }
        });
      }

      const payload = {
        produto_id: productId,
        store_id: config.storeId,
        medidas,
      };

      const res = await fetch(`${API_BASE_URL}/sugestao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        state.result = null;
        state.resultPhrases = [];
        state.confianca = null;
        setError(json.error || "Não foi possível calcular o tamanho.");
      } else if (json.sugestao) {
        state.result = json.sugestao;
        state.confianca = json.confianca || null;
        if (Array.isArray(json.frases) && json.frases.length) {
          state.resultPhrases = json.frases;
        } else if (json.frase) {
          state.resultPhrases = [json.frase];
        } else {
          state.resultPhrases = [];
        }
        setError("");
      } else {
        state.result = null;
        state.resultPhrases = [];
        state.confianca = null;
        setError(json.message || "Sem resultado.");
      }
    } catch (err) {
      console.error(err);
      state.result = null;
      state.resultPhrases = [];
      state.confianca = null;
      setError("Erro de conexão.");
    } finally {
      state.step = 4;
      state.loading = false;
      render();
    }
  }

  function openModal() {
    overlay.classList.add("open");
    state.showGuide = false;
    state.step = 1;
    setError("");
    render();
  }

  function createTriggerButton() {
    const btn = document.createElement("button");
    btn.className = "bbs-trigger-mini"; // Classe definida no CSS acima
    btn.type = "button";

    // Ícone de Fita Métrica (Ruler) - Mais limpo e intuitivo para "Medidas"
    const rulerIcon = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12h20"></path>
            <path d="M2 12l4-4"></path>
            <path d="M6 12l4-4"></path>
            <path d="M10 12l4-4"></path>
            <path d="M14 12l4-4"></path>
            <path d="M18 12l4-4"></path>
            <path d="M22 12l-4-4"></path>
        </svg>
    `;

    btn.innerHTML = `
        ${rulerIcon}
        <span>Descubra seu tamanho</span>
    `;

    btn.onclick = openModal;
    return btn;
  }

  const waitForElement = (selector) => {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      const observer = new MutationObserver(() => {
        const target = document.querySelector(selector);
        if (target) {
          observer.disconnect();
          resolve(target);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  };

  document.getElementById("bbs-close").onclick = () => {
    state.showGuide = false;
    overlay.classList.remove("open");
  };
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      state.showGuide = false;
      overlay.classList.remove("open");
    }
  });

  async function init() {
    const currentStoreId = config.storeId;
    try {
      const res = await fetch(
        `${API_BASE_URL}/widget/check/${productId}?storeId=${currentStoreId}`
      );
      const json = await res.json();
      if (!json.available) return;
      if (json.type) state.type = json.type;

      const targetElement = await waitForElement(targetSelector);
      if (!targetElement) return;

      const inject = () => {
        if (!document.getElementById("bbs-trigger-btn")) {
          const btn = createTriggerButton();
          targetElement.parentNode.insertBefore(btn, targetElement);
        }
      };

      inject();
      new MutationObserver(() => inject()).observe(targetElement.parentNode, {
        childList: true,
        subtree: true,
      });
    } catch (err) {
      console.error(err);
    }
  }

  init();
})();
