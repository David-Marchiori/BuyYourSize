(function () {
    console.log("📏 Buy by Size - Layout Horizontal Iniciado");

    const config = window.BuyBySizeConfig || {};
    const productId = config.productId;
    // URL da imagem (Se não vier da config, fica vazio e o CSS cuida do cinza)
    const productImage = config.productImage || '';

    const targetSelector = config.targetElement || '.js-addtocart';

    // ⚠️ SUA URL DE TESTE LOCAL
    const API_BASE_URL = config.API_BASE_URL;

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

        // EVENTOS DE CLIQUE
        document.getElementById('btn-female').onclick = () => { state.gender = 'female'; render(); };
        document.getElementById('btn-male').onclick = () => { state.gender = 'male'; render(); };

        document.getElementById('btn-next-1').onclick = () => {
            const hInput = document.getElementById('inp-height');
            const wInput = document.getElementById('inp-weight');

            const h = hInput.value;
            const w = wInput.value;

            if (!h || !w) {
                state.error = "Preencha altura e peso para continuar.";
                render();
                return;
            }

            // SALVA O VALOR EM CM MESMO (EX: 175)
            state.data.altura = h;
            state.data.peso = w;
            state.error = '';

            state.step = 2;
            render();
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
        const hasResult = !!state.result; // Transforma em booleano (true/false)
        const size = state.result || '?';

        // LÓGICA DE TEMPLATE: Sucesso vs Falha
        let contentHTML = '';

        if (hasResult) {
            // --- CENÁRIO DE SUCESSO (O que você já tinha) ---
            contentHTML = `
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
                </div>
            `;
        } else {
            // --- CENÁRIO DE FALHA / NÃO ENCONTRADO ---
            contentHTML = `
                <div class="bbs-header">
                    <h3 class="bbs-title">Resultado Indefinido</h3>
                    <p class="bbs-subtitle">Não conseguimos determinar um tamanho exato.</p>
                </div>
                
                <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                    
                    <div class="bbs-size-box bbs-warning-box">
                        <span style="font-size:30px">?</span>
                        <div class="bbs-check-badge bbs-warning-badge">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                        </div>
                    </div>

                    <p style="font-size: 15px; text-align:center; color: #666; margin-bottom: 20px; max-width: 80%;">
                        ${state.error || "Suas medidas parecem estar fora da grade padrão deste produto."}
                    </p>

                    <div style="width: 100%; max-width: 280px;">
                         <div class="bbs-match-info bbs-warning-info">
                            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                            Verifique se digitou corretamente
                        </div>
                    </div>
                </div>
            `;
        }

        // Renderiza o HTML decidido acima
        contentArea.innerHTML = `
            <div class="bbs-anim-enter" style="height: 100%; display: flex; flex-direction: column;">
                ${contentHTML}
                <div class="bbs-footer-area" style="justify-content: space-between; gap: 10px;">
                     <button class="bbs-btn-outline" id="btn-edit" style="flex: 1;">${hasResult ? 'Refazer Teste' : 'Ajustar Medidas'}</button>
                     <button class="bbs-btn-next" id="btn-close-final" style="flex: 1; background-color: #333;">Fechar</button>
                </div>
            </div>
        `;

        // AÇÃO DOS BOTÕES
        document.getElementById('btn-close-final').onclick = () => overlay.classList.remove('open');
        document.getElementById('btn-edit').onclick = () => {
            state.step = 1;
            render();
        };
    }

    // --- API CALL ---
    async function submitData() {
        if (!state.data.altura || !state.data.peso) {
            state.step = 1;
            render();
            return;
        }

        state.loading = true;
        state.step = 3;
        render();

        try {
            // CONVERSÃO DE CM PARA METROS
            let alturaMetros = parseFloat(state.data.altura);

            // Se o usuário digitou > 3 (ex: 175), assumimos que é CM e dividimos por 100.
            // Se ele digitou 1.75, mantemos assim. É uma segurança dupla.
            if (alturaMetros > 3) {
                alturaMetros = alturaMetros / 100;
            }

            const payload = {
                produto_id: productId,
                store_id: config.storeId,
                medidas: {
                    altura: alturaMetros, // Enviamos em metros (1.75)
                    peso: parseFloat(state.data.peso) || 0,
                    busto: parseFloat(state.data.busto) || 0,
                    cintura: parseFloat(state.data.cintura) || 0,
                    quadril: parseFloat(state.data.quadril) || 0
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
        // Verifica se já existe para não criar duplicado
        if (document.getElementById('bbs-trigger-btn')) return document.getElementById('bbs-trigger-btn');

        const btn = document.createElement('button');
        btn.id = 'bbs-trigger-btn';
        btn.type = 'button';
        // Estilo inline para garantir visibilidade imediata e margem
        btn.style.cssText = "display: flex; align-items: center; justify-content: center; width: 100%; margin-bottom: 10px; cursor: pointer;";

        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="20" height="20" viewBox="0 0 128 128" style="margin-right:8px; fill:currentColor"><g><path d="M112.6 127H15.4c-5.8 0-10.6-3.6-12.4-9.1s.2-11.2 4.9-14.6l63-44.6c3.5-2.5 5.4-6.6 5-10.9-.5-5.6-5.1-10.3-10.7-10.8-6.2-.6-11.7 3.5-13 9.5-.3 1.6-1.9 2.7-3.5 2.3-1.6-.3-2.7-1.9-2.3-3.5 1.9-9 10.2-15.2 19.4-14.3 8.6.8 15.4 7.7 16.1 16.3.6 6.5-2.2 12.6-7.5 16.3l-63 44.6c-3.1 2.2-3.4 5.5-2.6 7.8.8 2.4 2.9 4.9 6.7 4.9h97.1c3.8 0 5.9-2.5 6.7-4.9s.5-5.7-2.6-7.8L74.4 78.4c-1.4-1-1.7-2.8-.7-4.2s2.8-1.7 4.2-.7l42.2 29.9c4.7 3.3 6.6 9 4.9 14.6s-6.7 9-12.4 9z"></path></g></svg>
            Achar o Tamanho Certo
        `;
        btn.onclick = openModal;
        return btn;
    }

    // Função para esperar o elemento aparecer
    function waitForElement(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) return resolve(document.querySelector(selector));

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    // Função "Vigia": Garante que o botão fique lá
    function ensureWidgetVisibility(targetElement) {
        const inject = () => {
            if (!document.getElementById('bbs-trigger-btn')) {
                console.log("BuyBySize: Re-injetando botão...");
                const btn = createTriggerButton();
                // Tenta inserir ANTES do alvo (menos chance de ser apagado)
                // Se preferir dentro, use targetElement.prepend(btn);
                targetElement.parentNode.insertBefore(btn, targetElement);
            }
        };

        // 1. Injeta imediatamente
        inject();

        // 2. Cria um observador para ver se o botão é apagado
        const observer = new MutationObserver((mutations) => {
            let removed = false;
            mutations.forEach(mutation => {
                if (mutation.removedNodes.length > 0) {
                    mutation.removedNodes.forEach(node => {
                        if (node.id === 'bbs-trigger-btn') removed = true;
                    });
                }
            });

            // Se o botão sumiu ou se o container mudou muito, tenta injetar de novo
            if (removed || !document.getElementById('bbs-trigger-btn')) {
                inject();
            }
        });

        // Observa o PAI do elemento alvo (pois se o alvo for substituído, precisamos saber)
        if (targetElement.parentNode) {
            observer.observe(targetElement.parentNode, { childList: true, subtree: true });
        }
    }

    // Fecha ao clicar no X ou fora
    document.getElementById('bbs-close').onclick = () => overlay.classList.remove('open');
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('open'); };

    function waitForElement(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    async function init() {
        const targetSelector = config.targetElement || '.js-addtocart';
        console.log(`BuyBySize: Procurando alvo "${targetSelector}"...`);

        try {
            const res = await fetch(`${API_BASE_URL}/widget/check/${productId}`);
            const json = await res.json();

            if (!json.available) return console.log("BuyBySize: Widget inativo.");

            // Espera o alvo aparecer
            const targetElement = await waitForElement(targetSelector);

            if (targetElement) {
                console.log("BuyBySize: Alvo encontrado, ativando vigia.");
                ensureWidgetVisibility(targetElement);
            } else {
                console.error("BuyBySize: Alvo não encontrado.");
            }

        } catch (e) {
            console.error("BuyBySize: Erro init", e);
        }
    }

    // Inicia (agora é seguro chamar direto pois o waitForElement cuida do tempo)
    init();
})();