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

  const state = {
    step: 1,
    type: "roupa",
    gender: "female",
    data: {
      altura: "",
      peso: "",
      busto: 90,
      cintura: 70,
      quadril: 100,
      pe: "",
    },
    result: null,
    resultPhrases: [],
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
        renderStep1();
      }
    } else if (state.step === 2) {
      renderStep2();
    } else if (state.step === 3) {
      renderLoading();
    } else {
      renderResult();
    }
  }

  function renderStep1() {
    contentArea.innerHTML = `
            <div class="bbs-anim-enter">
                <div class="bbs-header">
                    <h3 class="bbs-title">Qual é o Meu Tamanho?</h3>
                    <p class="bbs-subtitle">Informe seus dados para encontrar o ajuste perfeito.</p>
                </div>

                <div class="bbs-gender-toggle">
                    <button class="bbs-gender-btn ${
                      state.gender === "female" ? "active" : ""
                    }" id="btn-female">Feminino</button>
                    <button class="bbs-gender-btn ${
                      state.gender === "male" ? "active" : ""
                    }" id="btn-male">Masculino</button>
                </div>

                <div class="bbs-form-group">
                    <label class="bbs-label">Altura</label>
                    <div class="bbs-input-row">
                        <input type="number" id="inp-height" class="bbs-input" value="${
                          state.data.altura
                        }" placeholder="175">
                        <span class="bbs-unit">cm</span>
                    </div>
                </div>

                <div class="bbs-form-group">
                    <label class="bbs-label">Peso</label>
                    <div class="bbs-input-row">
                        <input type="number" id="inp-weight" class="bbs-input" value="${
                          state.data.peso
                        }" placeholder="65.5">
                        <span class="bbs-unit">kg</span>
                    </div>
                </div>

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

    document.getElementById("btn-female").onclick = () => {
      state.gender = "female";
      render();
    };
    document.getElementById("btn-male").onclick = () => {
      state.gender = "male";
      render();
    };

    document.getElementById("btn-next-1").onclick = () => {
      const altura = document.getElementById("inp-height").value;
      const peso = document.getElementById("inp-weight").value;

      if (!altura || !peso) {
        setError("Preencha altura e peso.");
        render();
        return;
      }

      state.data.altura = altura;
      state.data.peso = peso;
      setError("");
      state.step = 2;
      render();
    };
  }

  function renderStepShoe() {
    const minRange = 20;
    const maxRange = 34;
    const currentVal = state.data.pe || 26;

    contentArea.innerHTML = `
        ${customStyles}
        
        <div class="bbs-anim-enter bbs-clean-wrapper">
            
            <h2 class="bbs-clean-title">Qual é o comprimento do seu pé?</h2>
            <p class="bbs-clean-subtitle">
                Selecione a medida do seu pé abaixo, seguindo nossa<br>
                orientação sobre como medir a si mesmo.
            </p>

            <div class="bbs-input-area">
                <div class="bbs-slider-group">
                    <label class="bbs-input-label">Comprimento do pé</label>
                    <input type="range" id="inp-foot-range" class="bbs-range-modern" 
                           min="${minRange}" max="${maxRange}" step="0.1" value="${currentVal}">
                </div>

                <div class="bbs-number-box">
                    <input type="number" id="inp-foot-num" class="bbs-input-modern" 
                           value="${currentVal}" step="0.1" min="${minRange}" max="${maxRange}">
                    <span class="bbs-unit-text">cm</span>
                </div>
            </div>

            ${state.error ? `<p class="bbs-error-msg">${state.error}</p>` : ""}

            <button id="btn-guide-shoe" class="btn-guide-pill">Como se medir</button>

            <div class="bbs-footer-action">
                <button id="btn-calc-shoe" class="btn-next-modern">PRÓXIMO</button>
            </div>
        </div>

        ${
          state.showGuide
            ? `
            <div class="bbs-guide-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999;">
                <div class="bbs-guide-card" style="background:#fff;border-radius:12px;width:90%;max-width:400px;padding:24px;position:relative;box-shadow:0 10px 25px rgba(0,0,0,0.2);">
                    <button id="btn-close-guide" style="position:absolute;top:10px;right:10px;border:none;background:none;font-size:1.5rem;cursor:pointer;color:#666;">&times;</button>
                    <h3 style="margin-top:0;color:#1f2937;">Como medir seu pé</h3>
                    <ol style="padding-left:20px;color:#4b5563;line-height:1.6;">
                        <li>Encoste o calcanhar em uma parede.</li>
                        <li>Marque a ponta do dedão no chão.</li>
                        <li>Meça a distância da parede até a marca.</li>
                        <li>Use o maior valor entre os dois pés.</li>
                    </ol>
                    <button id="btn-close-guide-action" style="width:100%;margin-top:15px;padding:10px;background:#f3f4f6;border:none;border-radius:6px;cursor:pointer;font-weight:600;color:#374151;">Entendi</button>
                </div>
            </div>
        `
            : ""
        }
    `;

    // --- Lógica JS (Sincronização e Eventos) ---

    const range = document.getElementById("inp-foot-range");
    const num = document.getElementById("inp-foot-num");

    // Função para manter Slider e Input sincronizados
    const syncValue = (val) => {
      let safeVal = val;
      // Validação visual simples para não quebrar o layout
      if (safeVal > maxRange) safeVal = maxRange;
      if (safeVal < minRange) safeVal = minRange;

      state.data.pe = parseFloat(safeVal);
    };

    range.oninput = (e) => {
      num.value = e.target.value;
      syncValue(e.target.value);
    };

    num.oninput = (e) => {
      range.value = e.target.value;
      syncValue(e.target.value);
    };

    // Botão de Dicas (Como medir)
    const guideBtn = document.getElementById("btn-guide-shoe");
    if (guideBtn) {
      guideBtn.onclick = () => {
        state.showGuide = true;
        render();
      };
    }

    // Fechar Modal de Dicas
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

    // Botão PRÓXIMO
    document.getElementById("btn-calc-shoe").onclick = () => {
      state.showGuide = false;
      const val = parseFloat(num.value);

      if (!val || val < minRange || val > maxRange) {
        setError(
          `Por favor, insira um valor entre ${minRange} e ${maxRange} cm.`
        );
        render();
        return;
      }

      state.data.pe = val;
      setError("");
      submitData(); // Avança para o próximo passo
    };
  }

  function renderStep2() {
    contentArea.innerHTML = `
            <div class="bbs-anim-enter">
                <div class="bbs-header">
                    <h3 class="bbs-title">Ajuste Fino</h3>
                    <p class="bbs-subtitle">Ajuste suas medidas se necessário.</p>
                </div>
                <div class="bbs-slider-stack">
                    ${renderSlider("Busto (cm)", "busto", 60, 130)}
                    ${renderSlider("Cintura (cm)", "cintura", 50, 120)}
                    ${renderSlider("Quadril (cm)", "quadril", 60, 140)}
                </div>
                <div class="bbs-footer-area">
                    <div class="bbs-dots">
                        <div class="bbs-dot"></div>
                        <div class="bbs-dot active"></div>
                    </div>
                    <div class="bbs-actions-row">
                        <button class="bbs-btn-next bbs-btn-outline" id="btn-prev">Voltar</button>
                        <button class="bbs-btn-next" id="btn-calc">Ver Tamanho</button>
                    </div>
                </div>
            </div>
        `;

    ["busto", "cintura", "quadril"].forEach((key) => {
      document.getElementById(`range-${key}`).oninput = (e) => {
        state.data[key] = e.target.value;
        document.getElementById(`num-${key}`).value = e.target.value;
      };
      document.getElementById(`num-${key}`).oninput = (e) => {
        state.data[key] = e.target.value;
        document.getElementById(`range-${key}`).value = e.target.value;
      };
    });

    document.getElementById("btn-prev").onclick = () => {
      state.step = 1;
      render();
    };
    document.getElementById("btn-calc").onclick = submitData;
  }

  function renderSlider(label, key, min, max) {
    return `
            <div class="bbs-slider-item">
                <div class="bbs-slider-head">
                    <label class="bbs-label">${label}</label>
                    <input type="number" id="num-${key}" value="${state.data[key]}" class="bbs-mini-input">
                </div>
                <input type="range" id="range-${key}" min="${min}" max="${max}" value="${state.data[key]}" class="bbs-range-control">
            </div>
        `;
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
    const phrases =
      state.resultPhrases && state.resultPhrases.length
        ? state.resultPhrases
        : [
            state.type === "calcado"
              ? "Ideal para o seu pé"
              : "Medida compatível",
          ];
    const [mainPhrase, ...extraPhrases] = phrases;

    let body = "";

    if (hasResult) {
      const feedbackList = extraPhrases
        .map(
          (text) => `
                <div class="bbs-feedback-card">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#0f172a" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    <span>${text}</span>
                </div>
            `
        )
        .join("");

      body = `
                <div class="bbs-header">
                    <h3 class="bbs-title">Sua recomendação</h3>
                    <p class="bbs-subtitle">Com base nas suas medidas, este é o melhor tamanho.</p>
                </div>
                <div class="bbs-result-grid">
                    <div class="bbs-result-main">
                        <div class="bbs-size-box">
                            ${size}
                            <div class="bbs-check-badge"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#fff"/></svg></div>
                        </div>
                        <p class="bbs-result-label">${
                          mainPhrase || `${size} é a melhor escolha agora.`
                        }</p>
                    </div>
                    ${
                      extraPhrases.length
                        ? `<div class="bbs-feedback-stack">
                        <div class="bbs-subtitle" style="margin-bottom:8px;font-weight:600;color:#0f172a;">Outros feedbacks</div>
                        ${feedbackList}
                    </div>`
                        : ""
                    }
                </div>
            `;
    } else {
      body = `
                <div class="bbs-header">
                    <h3 class="bbs-title">Ops!</h3>
                    <p class="bbs-subtitle">${
                      state.error || "Não encontramos uma sugestão."
                    }</p>
                </div>
            `;
    }

    contentArea.innerHTML = `
            <div class="bbs-anim-enter bbs-result-wrapper">
                ${body}
                <div class="bbs-footer-area bbs-result-footer">
                    <button class="bbs-btn-outline" id="btn-edit">Refazer</button>
                    <button class="bbs-btn-next" id="btn-close-final">Fechar</button>
                </div>
            </div>
        `;

    document.getElementById("btn-edit").onclick = () => {
      state.step = 1;
      render();
    };
    document.getElementById("btn-close-final").onclick = () =>
      overlay.classList.remove("open");
  }

  async function submitData() {
    state.showGuide = false;
    state.loading = true;
    state.step = 3;
    render();

    try {
      let alturaMetros = parseFloat(state.data.altura);
      if (state.type !== "calcado" && alturaMetros > 3) {
        alturaMetros = alturaMetros / 100;
      }

      const payload = {
        produto_id: productId,
        store_id: config.storeId,
        medidas: {
          altura: alturaMetros || 0,
          peso: parseFloat(state.data.peso) || 0,
          busto: parseFloat(state.data.busto) || 0,
          cintura: parseFloat(state.data.cintura) || 0,
          quadril: parseFloat(state.data.quadril) || 0,
          pe: parseFloat(state.data.pe) || 0,
        },
      };

      const res = await fetch(`${API_BASE_URL}/sugestao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.sugestao) {
        state.result = json.sugestao;
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
        setError(json.message || "Sem resultado.");
      }
    } catch (err) {
      console.error(err);
      state.result = null;
      state.resultPhrases = [];
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
    btn.id = "bbs-trigger-btn";
    btn.type = "button";
    btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 128 128" aria-hidden="true"><path d="M112.6 127H15.4c-5.8 0-10.6-3.6-12.4-9.1s.2-11.2 4.9-14.6l63-44.6c3.5-2.5 5.4-6.6 5-10.9-.5-5.6-5.1-10.3-10.7-10.8-6.2-.6-11.7 3.5-13 9.5-.3 1.6-1.9 2.7-3.5 2.3-1.6-.3-2.7-1.9-2.3-3.5 1.9-9 10.2-15.2 19.4-14.3 8.6.8 15.4 7.7 16.1 16.3.6 6.5-2.2 12.6-7.5 16.3l-63 44.6c-3.1 2.2-3.4 5.5-2.6 7.8.8 2.4 2.9 4.9 6.7 4.9h97.1c3.8 0 5.9-2.5 6.7-4.9s.5-5.7-2.6-7.8L74.4 78.4c-1.4-1-1.7-2.8-.7-4.2s2.8-1.7 4.2-.7l42.2 29.9c4.7 3.3 6.6 9 4.9 14.6s-6.7 9-12.4 9z" fill="currentColor"/></svg>
            Achar o Tamanho Certo
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
