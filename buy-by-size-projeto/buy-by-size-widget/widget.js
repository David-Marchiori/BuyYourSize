// buy-by-size-widget/widget.js

(function () {
    console.log("📏 Buy by Size Widget (Wizard Mode) Carregado...");

    // --- CONFIGURAÇÃO ---
    const config = window.BuyBySizeConfig || {};
    const productId = config.productId;
    const targetSelector = config.targetElement || 'body';

    // ⚠️ SUBSTITUA PELA SUA URL REAL
    const API_BASE_URL = 'https://expert-couscous-vj9xr7wp7q5c4qx-3000.app.github.dev/api';

    if (!productId) return console.warn("Buy by Size: ID faltando.");

    // --- ESTADO DO WIDGET ---
    let state = {
        step: 1, // 1: Altura/Peso, 2: Ajuste Fino, 3: Resultado
        data: {
            altura: '', // Metros
            peso: '',   // Kg
            busto: 90,  // cm (Valor padrão inicial para o slider)
            cintura: 70,// cm
            quadril: 100// cm
        },
        result: null,
        loading: false,
        error: ''
    };

    // --- ÍCONE SVG DO CORPO (Placeholder) ---
    // Um desenho simples de silhueta para ilustrar o passo 2
    const bodySVG = `
        <svg viewBox="0 0 100 200" width="100%" height="100%" fill="#ddd">
            <path d="M50 10 C60 10 65 18 65 25 C65 35 55 40 55 40 L70 45 L85 70 L80 110 L55 100 L55 130 L70 190 L30 190 L45 130 L45 100 L20 110 L15 70 L30 45 L45 40 C45 40 35 35 35 25 C35 18 40 10 50 10 Z" />
            <line x1="25" y1="55" x2="75" y2="55" stroke="#999" stroke-width="1" stroke-dasharray="2" /> <line x1="30" y1="80" x2="70" y2="80" stroke="#999" stroke-width="1" stroke-dasharray="2" /> <line x1="25" y1="100" x2="75" y2="100" stroke="#999" stroke-width="1" stroke-dasharray="2" /> </svg>
    `;

    // --- TEMPLATES HTML ---
    const baseHTML = `
        <div class="bbs-modal-overlay" id="bbs-overlay">
            <div class="bbs-modal-card">
                <div class="bbs-header">
                    <h3 class="bbs-title" id="bbs-title">Provador Virtual</h3>
                    <button class="bbs-close-btn" id="bbs-close">&times;</button>
                </div>
                
                <div class="bbs-steps" id="bbs-steps-indicator">
                    <div class="bbs-step-dot active"></div>
                    <div class="bbs-step-dot"></div>
                </div>

                <div class="bbs-body" id="bbs-body-content">
                    </div>

                <div class="bbs-footer" id="bbs-footer">
                    </div>
            </div>
        </div>
    `;

    // Injeta a estrutura base
    document.body.insertAdjacentHTML('beforeend', baseHTML);

    // Elementos DOM Fixos
    const overlay = document.getElementById('bbs-overlay');
    const bodyContent = document.getElementById('bbs-body-content');
    const footerContent = document.getElementById('bbs-footer');
    const titleEl = document.getElementById('bbs-title');
    const stepsIndicator = document.getElementById('bbs-steps-indicator');

    // --- FUNÇÕES DE RENDERIZAÇÃO ---

    function render() {
        // Atualiza título e conteúdo com base no passo
        if (state.step === 1) renderStep1();
        else if (state.step === 2) renderStep2();
        else if (state.step === 3) renderResult();

        // Atualiza bolinhas dos passos
        const dots = stepsIndicator.children;
        if (state.step <= 2) {
            stepsIndicator.style.display = 'flex';
            dots[0].className = state.step === 1 ? 'bbs-step-dot active' : 'bbs-step-dot';
            dots[1].className = state.step === 2 ? 'bbs-step-dot active' : 'bbs-step-dot';
        } else {
            stepsIndicator.style.display = 'none'; // Esconde no resultado
        }
    }

    function renderStep1() {
        titleEl.innerText = "Dados Básicos";
        bodyContent.innerHTML = `
            <div class="bbs-form-group">
                <label class="bbs-label">Qual sua altura? (m)</label>
                <input type="number" id="inp-height" class="bbs-input" placeholder="Ex: 1.75" step="0.01" value="${state.data.altura}">
            </div>
            <div class="bbs-form-group">
                <label class="bbs-label">Qual seu peso? (kg)</label>
                <input type="number" id="inp-weight" class="bbs-input" placeholder="Ex: 70.5" step="0.1" value="${state.data.peso}">
            </div>
            ${state.error ? `<p style="color:red; font-size:0.9em;">${state.error}</p>` : ''}
        `;

        footerContent.innerHTML = `
            <button class="bbs-btn bbs-btn-primary" id="btn-next-1">Ajuste Fino (Busto/Cintura)</button>
        `;

        // Listeners Passo 1
        document.getElementById('btn-next-1').onclick = () => {
            const h = document.getElementById('inp-height').value;
            const w = document.getElementById('inp-weight').value;
            if (!h || !w) { state.error = "Preencha altura e peso."; render(); return; }

            state.data.altura = h;
            state.data.peso = w;
            state.error = '';
            state.step = 2;
            render();
        };
    }

    function renderStep2() {
        titleEl.innerText = "Ajuste suas Medidas";
        bodyContent.innerHTML = `
            <div class="bbs-split-view">
                <div class="bbs-body-visual">${bodySVG}</div>
                <div class="bbs-controls">
                    
                    ${renderSlider('Busto (cm)', 'busto', 60, 130)}
                    ${renderSlider('Cintura (cm)', 'cintura', 50, 120)}
                    ${renderSlider('Quadril (cm)', 'quadril', 60, 140)}

                </div>
            </div>
            ${state.error ? `<p style="color:red; margin-top:10px; font-size:0.9em;">${state.error}</p>` : ''}
        `;

        footerContent.innerHTML = `
            <button class="bbs-btn bbs-btn-secondary" id="btn-back">Voltar</button>
            <button class="bbs-btn bbs-btn-primary" id="btn-calc">${state.loading ? 'Calculando...' : 'Ver meu Tamanho'}</button>
        `;

        // Listeners Passo 2 (Sliders)
        ['busto', 'cintura', 'quadril'].forEach(key => {
            const range = document.getElementById(`range-${key}`);
            const number = document.getElementById(`num-${key}`);

            // Sincroniza Range -> Number
            range.oninput = (e) => {
                state.data[key] = e.target.value;
                number.value = e.target.value;
            };
            // Sincroniza Number -> Range
            number.oninput = (e) => {
                state.data[key] = e.target.value;
                range.value = e.target.value;
            };
        });

        document.getElementById('btn-back').onclick = () => { state.step = 1; render(); };
        document.getElementById('btn-calc').onclick = submitData;
    }

    function renderSlider(label, key, min, max) {
        return `
            <div class="bbs-slider-row">
                <div class="bbs-slider-header">
                    <label class="bbs-label" style="margin:0">${label}</label>
                    <input type="number" id="num-${key}" value="${state.data[key]}" 
                           style="width:50px; padding:2px; border:1px solid #ccc; text-align:center; font-weight:bold;">
                </div>
                <input type="range" id="range-${key}" class="bbs-range" 
                       min="${min}" max="${max}" value="${state.data[key]}">
            </div>
        `;
    }

    function renderResult() {
        titleEl.innerText = "Resultado";

        if (state.result) {
            bodyContent.innerHTML = `
                <div class="bbs-result-container">
                    <div class="bbs-size-circle">${state.result}</div>
                    <p class="bbs-result-msg">Com base nas suas medidas de <strong>${state.data.altura}m</strong> e <strong>${state.data.peso}kg</strong> (e ajustes), este é o tamanho ideal.</p>
                </div>
            `;
        } else {
            bodyContent.innerHTML = `<div class="bbs-result-container"><p>${state.error || 'Sem recomendação.'}</p></div>`;
        }

        footerContent.innerHTML = `
            <button class="bbs-btn bbs-btn-secondary" id="btn-restart">Refazer Teste</button>
            <button class="bbs-btn bbs-btn-primary" onclick="document.getElementById('bbs-overlay').classList.remove('is-open')">Fechar</button>
        `;

        document.getElementById('btn-restart').onclick = () => { state.step = 1; state.result = null; render(); };
    }

    // --- API CALL ---
    async function submitData() {
        state.loading = true;
        render(); // Atualiza botão para 'Calculando...'

        try {
            const payload = {
                produto_id: productId,
                medidas: {
                    altura: parseFloat(state.data.altura),
                    peso: parseFloat(state.data.peso),
                    busto: parseFloat(state.data.busto),
                    cintura: parseFloat(state.data.cintura),
                    quadril: parseFloat(state.data.quadril)
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
                state.step = 3;
            } else {
                state.error = json.message || "Não encontramos um tamanho.";
            }

        } catch (err) {
            state.error = "Erro de conexão.";
            console.error(err);
        } finally {
            state.loading = false;
            render();
        }
    }

    // --- CONTROLES GERAIS ---
    function openModal() {
        overlay.classList.add('is-open');
        render(); // Renderiza o estado atual
    }

    function createTriggerButton() {
        const btn = document.createElement('button');
        btn.className = 'bbs-trigger-btn';
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 12h20M2 12l4-4m-4 4l4 4"/>
            </svg>
            Descubra seu tamanho
        `;
        btn.onclick = openModal;
        return btn;
    }

    // Inicialização
    // --- VERIFICAÇÃO DE DISPONIBILIDADE ---
    async function checkAvailability() {
        try {
            const res = await fetch(`${API_BASE_URL}/widget/check/${productId}`);
            const json = await res.json();
            return json.available;
        } catch (e) {
            console.warn('Erro ao verificar widget:', e);
            return false;
        }
    }

    // Inicialização
    const targetElement = document.querySelector(targetSelector);

    if (targetElement) {
        // Só desenha o botão se o produto tiver regras configuradas
        checkAvailability().then(isAvailable => {
            if (isAvailable) {
                targetElement.appendChild(createTriggerButton());
            } else {
                console.log('BuyBySize: Produto sem regras, widget oculto.');
            }
        });
    }

    document.getElementById('bbs-close').onclick = () => overlay.classList.remove('is-open');
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('is-open'); };

})();