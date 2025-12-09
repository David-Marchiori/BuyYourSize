(function () {
    console.log("📏 Buy by Size - Layout Horizontal Iniciado");

    const config = window.BuyBySizeConfig || {};
    const productId = config.productId;
    // URL da imagem (Se não vier da config, fica vazio e o CSS cuida do cinza)
    const productImage = config.productImage || '';

    const targetSelector = config.targetElement || 'form.cart';

    // ⚠️ SUA URL DE TESTE LOCAL
    const API_BASE_URL = 'https://expert-couscous-vj9xr7wp7q5c4qx-3000.app.github.dev/api';

    if (!productId) return console.warn("Buy by Size: ID faltando.");

    // --- ESTADO ---
    let state = {
        step: 1,
        gender: 'female', // Padrão
        data: {
            altura: '',
            peso: '',
            busto: 90,
            cintura: 70,
            quadril: 100
        },
        result: null,
        loading: false,
        error: ''
    };

    // --- TEMPLATE BASE (Estrutura Horizontal) ---
    const baseHTML = `
        <div class="bbs-modal-overlay" id="bbs-overlay">
            <div class="bbs-modal-card">
                <button class="bbs-close-btn" id="bbs-close">&times;</button>
                
                <div class="bbs-col-image" id="bbs-product-image">
                    </div>

                <div class="bbs-col-content" id="bbs-content-area">
                    </div>
            </div>
        </div>
    `;

    // Injeta na página
    document.body.insertAdjacentHTML('beforeend', baseHTML);

    // Referências DOM
    const overlay = document.getElementById('bbs-overlay');
    const contentArea = document.getElementById('bbs-content-area');
    const imageArea = document.getElementById('bbs-product-image');

    // Se tiver imagem configurada, aplica.
    if (productImage) {
        imageArea.style.backgroundImage = `url('${productImage}')`;
    }

    // --- RENDERIZAÇÃO ---

    function render() {
        if (state.step === 1) renderStep1();
        else if (state.step === 2) renderStep2();
        else if (state.step === 3) renderLoading();
        else if (state.step === 4) renderResult();
    }

    function renderStep1() {
        // Note a <div class="bbs-anim-enter"> envolvendo TUDO
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
                        <input type="number" id="inp-height" class="bbs-input" value="${state.data.altura}" placeholder="1.75">
                        <span class="bbs-unit">m</span> 
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

        // ... (resto dos eventos de clique continua igual) ...
        document.getElementById('btn-female').onclick = () => { state.gender = 'female'; render(); };
        document.getElementById('btn-male').onclick = () => { state.gender = 'male'; render(); };
        document.getElementById('btn-next-1').onclick = () => {
            // ... lógica de validação igual ...
            // Se passar:
            state.step = 2; render();
        };
    }

    function renderStep2() {
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
                    <div style="display:flex; gap:10px;">
                        <button class="bbs-btn-next" style="background:transparent; color:#333; border:1px solid #ccc" id="btn-prev">Voltar</button>
                        <button class="bbs-btn-next" id="btn-calc">${state.loading ? '...' : 'Ver Tamanho'}</button>
                    </div>
                </div>
            </div>
        `;

        // ... (resto da lógica dos sliders e botões igual) ...
        ['busto', 'cintura', 'quadril'].forEach(key => {
            // ... lógica igual ...
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
                <h3 class="bbs-title" style="margin-top: 30px; margin-bottom: 5px; text-align: center;">Analisando suas medidas...</h3>
                <p class="bbs-subtitle" style="text-align: center;">Estamos combinando seus dados com as regras de ajuste desta peça.</p>
            </div>
        `;
    }

    function renderResult() {
        const size = state.result || '?';

        contentArea.innerHTML = `
            <div class="bbs-anim-enter" style="height: 100%; display: flex; flex-direction: column;">
                
                <div class="bbs-header">
                    <h3 class="bbs-title">Sua Recomendação</h3>
                    <p class="bbs-subtitle">Baseado nas suas medidas, esta é a melhor opção.</p>
                </div>
                
                <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                    
                    <div class="bbs-size-box">
                        ${size}
                        <div class="bbs-check-badge">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        </div>
                    </div>

                    <p style="font-size: 16px; font-weight: 600; margin-bottom: 20px; color: #333;">
                        ${size} é a melhor opção
                    </p>

                    <div style="width: 100%; max-width: 280px;">
                        <div class="bbs-match-info">
                            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                            Medida de busto compatível
                        </div>
                        <div class="bbs-match-info">
                            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                            Caimento ideal para sua altura
                        </div>
                    </div>

                    ${state.error ? `<p style="color:red; margin-top:10px;">${state.error}</p>` : ''}
                </div>

                <div class="bbs-footer-area" style="justify-content: space-between; gap: 10px;">
                     <button class="bbs-btn-outline" id="btn-edit" style="flex: 1;">Editar Medidas</button>
                     <button class="bbs-btn-next" id="btn-close-final" style="flex: 1; background-color: #333;">Fechar</button>
                </div>
            </div>
         `;

        // AÇÃO DOS BOTÕES
        document.getElementById('btn-close-final').onclick = () => overlay.classList.remove('open');

        // Editar volta para o passo 1 (ou 2, se preferir o ajuste fino)
        document.getElementById('btn-edit').onclick = () => {
            state.step = 1;
            render();
        };
    }

    // --- API CALL ---
    async function submitData() {
        state.loading = true;
        state.step = 3;
        render();

        try {
            const payload = {
                produto_id: productId,
                store_id: config.storeId || '00000000-0000-0000-0000-000000000000',
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
                state.step = 4; // Se sucesso, vai para o Passo 4 (Resultado)
            } else {
                state.error = json.message || "Não encontramos um tamanho.";
                state.step = 4; // Vai para o resultado mesmo se for erro, para mostrar a mensagem
            }

        } catch (err) {
            state.error = "Erro de conexão.";
            state.step = 4; // Mostra erro no Passo 4
            console.error(err);
        } finally {
            state.loading = false;
            render(); // Roda o render final, que mostrará Step 4 (Resultado/Erro)
        }
    }

    // --- INICIALIZAÇÃO ---
    function openModal() {
        overlay.classList.add('open');
        render();
    }

    function createTriggerButton() {
        const btn = document.createElement('button');
        btn.id = 'bbs-trigger-btn';
        btn.type = 'button';
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="auto" x="0" y="0" viewBox="0 0 128 128" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><path fill="#444b54" d="M112.6 127H15.4c-5.8 0-10.6-3.6-12.4-9.1s.2-11.2 4.9-14.6l63-44.6c3.5-2.5 5.4-6.6 5-10.9-.5-5.6-5.1-10.3-10.7-10.8-6.2-.6-11.7 3.5-13 9.5-.3 1.6-1.9 2.7-3.5 2.3-1.6-.3-2.7-1.9-2.3-3.5 1.9-9 10.2-15.2 19.4-14.3 8.6.8 15.4 7.7 16.1 16.3.6 6.5-2.2 12.6-7.5 16.3l-63 44.6c-3.1 2.2-3.4 5.5-2.6 7.8.8 2.4 2.9 4.9 6.7 4.9h97.1c3.8 0 5.9-2.5 6.7-4.9s.5-5.7-2.6-7.8L74.4 78.4c-1.4-1-1.7-2.8-.7-4.2s2.8-1.7 4.2-.7l42.2 29.9c4.7 3.3 6.6 9 4.9 14.6s-6.7 9-12.4 9z" opacity="1" data-original="#444b54" class=""></path></g></svg>
            Achar o Tamanho Certo
        `;
        btn.onclick = openModal;
        return btn;
    }

    // Fecha ao clicar no X ou fora
    document.getElementById('bbs-close').onclick = () => overlay.classList.remove('open');
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('open'); };

    // Injeta botão na página
    async function init() {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) return;

        try {
            // Verificação simplificada para teste
            const res = await fetch(`${API_BASE_URL}/widget/check/${productId}`);
            const json = await res.json();

            if (json.available) {
                targetElement.appendChild(createTriggerButton());
            } else {
                console.log("Widget oculto (Sem regras)");
            }
        } catch (e) { console.error(e); }
    }

    init();

})();