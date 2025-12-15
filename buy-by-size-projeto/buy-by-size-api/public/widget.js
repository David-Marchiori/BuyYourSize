(function () {
    console.log("📏 Buy by Size - Widget Híbrido Iniciado");

    const config = window.BuyBySizeConfig || {};
    const productId = config.productId;
    const productImage = config.productImage || '';

    // Fallback se o injector falhar
    const targetSelector = config.targetElement || '.js-addtocart';

    // URL da API (vem do injector ou usa a default)
    const API_BASE_URL = config.API_BASE_URL || 'https://buy-by-size-api.fly.dev/api';

    if (!productId) return console.warn("Buy by Size: ID faltando.");

    // --- ESTADO GLOBAL DO WIDGET ---
    let state = {
        step: 1,
        type: 'roupa', // Padrão 'roupa', mas a API pode mudar para 'calcado'
        gender: 'female',
        data: {
            altura: '',
            peso: '',
            busto: 90,
            cintura: 70,
            quadril: 100,
            pe: '' // NOVO: Medida do pé
        },
        result: null,
        loading: false,
        error: ''
    };

    // --- HTML BASE ---
    const baseHTML = `
        <div class="bbs-modal-overlay" id="bbs-overlay">
            <div class="bbs-modal-card">
                <button class="bbs-close-btn" id="bbs-close">&times;</button>
                <div class="bbs-col-image" id="bbs-product-image"></div>
                <div class="bbs-col-content" id="bbs-content-area"></div>
            </div>
        </div>
    `;

    // Injeta estrutura na página
    if (!document.getElementById('bbs-overlay')) {
        document.body.insertAdjacentHTML('beforeend', baseHTML);
    }

    const overlay = document.getElementById('bbs-overlay');
    const contentArea = document.getElementById('bbs-content-area');
    const imageArea = document.getElementById('bbs-product-image');

    if (productImage) {
        imageArea.style.backgroundImage = `url('${productImage}')`;
    }

    // --- RENDERIZAÇÃO CENTRAL ---
    function render() {
        if (state.step === 1) {
            // AQUI ESTÁ A MÁGICA: Decide qual tela mostrar baseado no tipo
            if (state.type === 'calcado') {
                renderStepShoe();
            } else {
                renderStep1(); // Tela de Altura/Peso (Roupa)
            }
        }
        else if (state.step === 2) renderStep2(); // Ajuste fino (Só roupa)
        else if (state.step === 3) renderLoading();
        else if (state.step === 4) renderResult();
    }

    // --- PASSO 1 (ROUPA): Altura e Peso ---
    function renderStep1() {
        contentArea.innerHTML = `
            <div class="bbs-anim-enter">
                <div class="bbs-header">
                    <h3 class="bbs-title">Qual é o Meu Tamanho?</h3>
                    <p class="bbs-subtitle">Informe seus dados para encontrar o ajuste perfeito.</p>
                </div>

                <div class="bbs-gender-toggle">
                    <button class="bbs-gender-btn ${state.gender === 'female' ? 'active' : ''}" id="btn-female">Feminino</button>
                    <button class="bbs-gender-btn ${state.gender === 'male' ? 'active' : ''}" id="btn-male">Masculino</button>
                </div>

                <div class="bbs-form-group">
                    <label class="bbs-label">Altura</label>
                    <div class="bbs-input-row">
                        <input type="number" id="inp-height" class="bbs-input" value="${state.data.altura}" placeholder="175">
                        <span class="bbs-unit">cm</span> 
                    </div>
                </div>

                <div class="bbs-form-group">
                    <label class="bbs-label">Peso</label>
                    <div class="bbs-input-row">
                        <input type="number" id="inp-weight" class="bbs-input" value="${state.data.peso}" placeholder="65.5">
                        <span class="bbs-unit">kg</span>
                    </div>
                </div>

                ${state.error ? `<p style="color:red; font-size:12px; margin-top:5px;">${state.error}</p>` : ''}

                <div class="bbs-footer-area">
                    <div class="bbs-dots">
                        <div class="bbs-dot active"></div>
                        <div class="bbs-dot"></div>
                    </div>
                    <button class="bbs-btn-next" id="btn-next-1">Próximo</button>
                </div>
            </div>
        `;

        document.getElementById('btn-female').onclick = () => { state.gender = 'female'; render(); };
        document.getElementById('btn-male').onclick = () => { state.gender = 'male'; render(); };

        document.getElementById('btn-next-1').onclick = () => {
            const h = document.getElementById('inp-height').value;
            const w = document.getElementById('inp-weight').value;

            if (!h || !w) { state.error = "Preencha altura e peso."; render(); return; }

            state.data.altura = h;
            state.data.peso = w;
            state.error = '';
            state.step = 2; // Roupa vai para ajuste fino
            render();
        };
    }

    // --- PASSO 1 (CALÇADO): Medida do Pé ---
    function renderStepShoe() {
        // Valores padrão para o slider (cm)
        const minRange = 20;
        const maxRange = 34;
        // Se já tiver valor salvo, usa, senão usa média (26)
        const currentVal = state.data.pe || 26;

        contentArea.innerHTML = `
            <div class="bbs-anim-enter">
                <div class="bbs-header">
                    <h3 class="bbs-title">Qual o tamanho do seu pé?</h3>
                    <p class="bbs-subtitle">Arraste para definir a medida em centímetros.</p>
                </div>

                <div class="bbs-form-group" style="margin-top: 30px;">
                     
                     <div style="margin-bottom: 15px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <label class="bbs-label" style="margin:0">Comprimento (cm)</label>
                            <input type="number" id="inp-foot-num" class="bbs-input" value="${currentVal}" step="0.1" style="width:80px; text-align:center;">
                        </div>
                        
                        <input type="range" id="inp-foot-range" min="${minRange}" max="${maxRange}" step="0.1" value="${currentVal}" style="width:100%; cursor: pointer;">
                        
                        <div style="display:flex; justify-content:space-between; color:#999; font-size:12px; margin-top:5px;">
                            <span>${minRange}cm</span>
                            <span>${maxRange}cm</span>
                        </div>
                     </div>

                     <div style="background:#f8f9fa; padding:10px; border-radius:8px; font-size:13px; color:#666; display:flex; gap:10px; align-items:center;">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="#666"><path d="M13.5,5.5c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S12.4,5.5,13.5,5.5z M16.5,10.2c-0.8-0.5-2-1.3-2-2.7c0-1.7,1.3-3,3-3s3,1.3,3,3c0,2.1-1.7,4.4-4,6.3V24h-2v-9.5C14.5,12.7,15.6,11.3,16.5,10.2z"/></svg>
                        <span>Meça do calcanhar à ponta do dedão.</span>
                     </div>
                </div>

                ${state.error ? `<p style="color:red; font-size:12px; margin-top:5px;">${state.error}</p>` : ''}

                <div class="bbs-footer-area">
                    <button class="bbs-btn-next" id="btn-calc-shoe">Ver Recomendação</button>
                </div>
            </div>
        `;

        // Sincronização Range <-> Number
        const range = document.getElementById('inp-foot-range');
        const num = document.getElementById('inp-foot-num');

        range.oninput = (e) => {
            num.value = e.target.value;
            state.data.pe = e.target.value;
        };
        num.oninput = (e) => {
            range.value = e.target.value;
            state.data.pe = e.target.value;
        };

        document.getElementById('btn-calc-shoe').onclick = () => {
            const val = num.value;
            if (!val || val < 10) { state.error = "Medida inválida."; render(); return; }
            state.data.pe = val;
            state.error = '';
            submitData();
        };
    }
    // --- PASSO 2 (ROUPA): Ajuste Fino ---
    function renderStep2() {
        // ... (Mantém sua lógica atual de sliders Busto/Cintura/Quadril) ...
        contentArea.innerHTML = `
            <div class="bbs-anim-enter">
                <div class="bbs-header">
                    <h3 class="bbs-title">Ajuste Fino</h3>
                    <p class="bbs-subtitle">Ajuste suas medidas se necessário</p>
                </div>
                <div style="flex:1; overflow-y: auto;">
                    ${renderSlider('Busto (cm)', 'busto', 60, 130)}
                    ${renderSlider('Cintura (cm)', 'cintura', 50, 120)}
                    ${renderSlider('Quadril (cm)', 'quadril', 60, 140)}
                </div>
                <div class="bbs-footer-area">
                    <div class="bbs-dots">
                        <div class="bbs-dot"></div>
                        <div class="bbs-dot active"></div>
                    </div>
                    <div style="display:flex; gap:10px; width:100%">
                        <button class="bbs-btn-next" style="background:transparent; color:#333; border:1px solid #ccc; flex:1" id="btn-prev">Voltar</button>
                        <button class="bbs-btn-next" style="flex:2" id="btn-calc">Ver Tamanho</button>
                    </div>
                </div>
            </div>
        `;
        // Listeners dos inputs...
        ['busto', 'cintura', 'quadril'].forEach(key => {
            document.getElementById(`range-${key}`).oninput = (e) => {
                state.data[key] = e.target.value;
                document.getElementById(`num-${key}`).value = e.target.value;
            };
            document.getElementById(`num-${key}`).oninput = (e) => {
                state.data[key] = e.target.value;
                document.getElementById(`range-${key}`).value = e.target.value;
            };
        });

        document.getElementById('btn-prev').onclick = () => { state.step = 1; render(); };
        document.getElementById('btn-calc').onclick = submitData;
    }

    function renderSlider(label, key, min, max) {
        return `
            <div style="margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <label class="bbs-label" style="margin:0">${label}</label>
                    <input type="number" id="num-${key}" value="${state.data[key]}" style="width:50px; text-align:center;">
                </div>
                <input type="range" id="range-${key}" min="${min}" max="${max}" value="${state.data[key]}" style="width:100%">
            </div>
        `;
    }

    function renderLoading() {
        contentArea.innerHTML = `
            <div class="bbs-anim-enter" style="align-items: center; justify-content: center;">
                <div class="bbs-loader"></div>
                <h3 class="bbs-title" style="margin-top: 30px; margin-bottom: 5px; text-align: center;">Analisando...</h3>
            </div>
        `;
    }

    // --- PASSO 4: RESULTADO (Inteligente) ---
    function renderResult() {
        // O Backend agora retorna { sugestao: '38', frase: 'Fica justo', ... }
        // Mas guardamos tudo em state.result ou state.resultPhrase

        // Ajuste no submitData para salvar a frase no state:
        // if (json.sugestao) { state.result = json.sugestao; state.resultPhrase = json.frase; ... }

        const hasResult = !!state.result;
        const size = state.result || '?';
        const phrase = state.resultPhrase || (state.type === 'calcado' ? 'Ideal para o seu pé' : 'Medida compatível');

        let contentHTML = '';

        if (hasResult) {
            contentHTML = `
                <div class="bbs-header"><h3 class="bbs-title">Sua Recomendação</h3></div>
                <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                    
                    <div class="bbs-size-box">
                        ${size}
                        <div class="bbs-check-badge"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>
                    </div>
                    
                    <p style="font-weight:700; font-size:1.1rem; margin-bottom:5px;">${size} é a melhor opção</p>
                    
                    <div class="bbs-match-info" style="background:#f0f9ff; color:#0369a1; padding:8px 16px; border-radius:20px; font-weight:600; font-size:0.9rem;">
                        ${phrase}
                    </div>

                </div>
            `;
        } else {
            // ... (código de erro igual ao anterior) ...
            contentHTML = `<div class="bbs-header"><h3 class="bbs-title">Ops!</h3></div><p>${state.error || "Sem tamanho encontrado."}</p>`;
        }

        contentArea.innerHTML = `
            <div class="bbs-anim-enter" style="height: 100%; display: flex; flex-direction: column;">
                ${contentHTML}
                <div class="bbs-footer-area" style="justify-content: space-between; gap: 10px;">
                     <button class="bbs-btn-outline" id="btn-edit" style="flex: 1;">Refazer</button>
                     <button class="bbs-btn-next" id="btn-close-final" style="flex: 1; background-color: #333;">Fechar</button>
                </div>
            </div>
        `;
        document.getElementById('btn-close-final').onclick = () => overlay.classList.remove('open');
        document.getElementById('btn-edit').onclick = () => { state.step = 1; render(); };
    }

    // --- ENVIO DE DADOS ---
    async function submitData() {
        state.loading = true;
        state.step = 3;
        render();

        try {
            // Conversão de altura (cm -> m) apenas se for roupa
            let alturaMetros = parseFloat(state.data.altura);
            if (state.type !== 'calcado' && alturaMetros > 3) {
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
                    pe: parseFloat(state.data.pe) || 0
                }
            };

            const res = await fetch(`${API_BASE_URL}/sugestao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();

            if (json.sugestao) {
                state.result = json.sugestao;

                // ⚠️ AQUI ESTÁ A MUDANÇA: Captura a frase vinda do backend
                state.resultPhrase = json.frase;

                state.error = '';
            } else {
                state.result = null;
                state.resultPhrase = null;
                state.error = json.message || "Sem resultado.";
            }
        } catch (err) {
            state.error = "Erro de conexão.";
            state.result = null;
            state.resultPhrase = null;
        } finally {
            state.step = 4;
            state.loading = false;
            render();
        }
    }

    // --- INICIALIZAÇÃO E BOTÃO ---
    function openModal() { overlay.classList.add('open'); render(); }
    document.getElementById('bbs-close').onclick = () => overlay.classList.remove('open');
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('open'); };

    function createTriggerButton() {
        const btn = document.createElement('button');
        btn.id = 'bbs-trigger-btn';
        btn.type = 'button';
        btn.style.cssText = "display: flex; align-items: center; justify-content: center; width: 100%; margin-bottom: 10px; cursor: pointer;";
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 128 128" style="margin-right:8px; fill:currentColor"><g><path d="M112.6 127H15.4c-5.8 0-10.6-3.6-12.4-9.1s.2-11.2 4.9-14.6l63-44.6c3.5-2.5 5.4-6.6 5-10.9-.5-5.6-5.1-10.3-10.7-10.8-6.2-.6-11.7 3.5-13 9.5-.3 1.6-1.9 2.7-3.5 2.3-1.6-.3-2.7-1.9-2.3-3.5 1.9-9 10.2-15.2 19.4-14.3 8.6.8 15.4 7.7 16.1 16.3.6 6.5-2.2 12.6-7.5 16.3l-63 44.6c-3.1 2.2-3.4 5.5-2.6 7.8.8 2.4 2.9 4.9 6.7 4.9h97.1c3.8 0 5.9-2.5 6.7-4.9s.5-5.7-2.6-7.8L74.4 78.4c-1.4-1-1.7-2.8-.7-4.2s2.8-1.7 4.2-.7l42.2 29.9c4.7 3.3 6.6 9 4.9 14.6s-6.7 9-12.4 9z"></path></g></svg> Achar o Tamanho Certo`;
        btn.onclick = openModal;
        return btn;
    }

    // "VIGIA" DE BOTÃO (Para evitar que suma)
    function waitForElement(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) return resolve(document.querySelector(selector));
            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) { observer.disconnect(); resolve(document.querySelector(selector)); }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    async function init() {
        const targetSelector = config.targetElement || '.js-addtocart';

        // Garante que temos o storeId vindo do injector
        const currentStoreId = config.storeId;

        try {
            // 1. CHECAGEM NA API (Agora enviando o storeId)
            // ⚠️ MUDANÇA AQUI: Adicionado ?storeId=${currentStoreId}
            const res = await fetch(`${API_BASE_URL}/widget/check/${productId}?storeId=${currentStoreId}`);

            const json = await res.json();

            if (!json.available) return;

            // ... (resto do código permanece igual) ...
            if (json.type) state.type = json.type;

            const targetElement = await waitForElement(targetSelector);
            if (targetElement) {
                const inject = () => {
                    if (!document.getElementById('bbs-trigger-btn')) {
                        const btn = createTriggerButton();
                        targetElement.parentNode.insertBefore(btn, targetElement);
                    }
                };
                inject();
                new MutationObserver(() => inject()).observe(targetElement.parentNode, { childList: true, subtree: true });
            }
        } catch (e) { console.error(e); }
    }

    init();
})();