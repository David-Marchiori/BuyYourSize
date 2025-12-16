(function () {
    console.log("Buy by Size - Widget atualizado");

    const config = window.BuyBySizeConfig || {};
    const productId = config.productId;
    const productImage = config.productImage || '';
    const targetSelector = config.targetElement || '.js-addtocart';
    const API_BASE_URL = config.API_BASE_URL || 'https://buy-by-size-api.fly.dev/api';

    if (!productId) {
        console.warn('Buy by Size: ID faltando.');
        return;
    }

    const state = {
        step: 1,
        type: 'roupa',
        gender: 'female',
        data: {
            altura: '',
            peso: '',
            busto: 90,
            cintura: 70,
            quadril: 100,
            pe: ''
        },
        result: null,
        resultPhrases: [],
        loading: false,
        error: ''
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

    if (!document.getElementById('bbs-overlay')) {
        document.body.insertAdjacentHTML('beforeend', baseHTML);
    }

    const overlay = document.getElementById('bbs-overlay');
    const contentArea = document.getElementById('bbs-content-area');
    const imageArea = document.getElementById('bbs-product-image');

    if (productImage) {
        imageArea.style.backgroundImage = `url('${productImage}')`;
    }

    const setError = (message) => {
        state.error = message || '';
    };

    function render() {
        if (state.step === 1) {
            if (state.type === 'calcado') {
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

                ${state.error ? `<p class="bbs-error-text">${state.error}</p>` : ''}

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
            const altura = document.getElementById('inp-height').value;
            const peso = document.getElementById('inp-weight').value;

            if (!altura || !peso) {
                setError('Preencha altura e peso.');
                render();
                return;
            }

            state.data.altura = altura;
            state.data.peso = peso;
            setError('');
            state.step = 2;
            render();
        };
    }

    function renderStepShoe() {
        const minRange = 20;
        const maxRange = 34;
        const markerValues = [22, 24, 26, 28, 30];
        const currentVal = state.data.pe || 26;

        contentArea.innerHTML = `
            <div class="bbs-anim-enter">
                <div class="bbs-header">
                    <h3 class="bbs-title">Qual o tamanho do seu pé?</h3>
                    <p class="bbs-subtitle">Meça do calcanhar à ponta do dedão para descobrir o ajuste perfeito.</p>
                </div>

                <div class="bbs-shoe-grid">
                    <div class="bbs-shoe-visual">
                        <div class="bbs-foot-hero">
                            <svg viewBox="0 0 120 200" width="120" height="200" aria-hidden="true">
                                <path d="M57 14c-8.4 0-15.3 6.9-15.3 15.3v31.5c0 8-3.4 15.7-9.3 21.1L21 92.1c-6.4 5.8-10 14-10 22.7 0 19.9 16.1 36 36 36h23.7c22.8 0 41.3-18.5 41.3-41.3 0-12.4-5.6-24.1-15.1-31.8l-11.8-9.4c-4.9-3.9-7.8-9.8-7.8-16.1V29.3C77.3 20.9 70.4 14 62 14H57z" fill="#f3f5f9" stroke="#c3d0e0" stroke-width="3"/>
                                <path d="M81 138c-3 12-15 21-28 21" stroke="#c3d0e0" stroke-width="3" stroke-linecap="round" fill="none"/>
                            </svg>
                            <div class="bbs-foot-value" id="bbs-foot-value">${Number(currentVal).toFixed(1)} cm</div>
                        </div>
                        <ul class="bbs-tip-list">
                            <li><strong>Encoste o calcanhar</strong> em uma parede para alinhar.</li>
                            <li><strong>Marque o dedão</strong> em uma folha e meça a distância.</li>
                            <li><strong>Repita no fim do dia</strong> quando o pé está mais dilatado.</li>
                        </ul>
                    </div>

                    <div class="bbs-shoe-form">
                        <div class="bbs-form-group">
                            <label class="bbs-label">Comprimento do pé</label>
                            <div class="bbs-input-row">
                                <input type="number" id="inp-foot-num" class="bbs-input" value="${currentVal}" step="0.1" min="${minRange}" max="${maxRange}">
                                <span class="bbs-unit">cm</span>
                            </div>
                        </div>

                        <div class="bbs-range-wrapper">
                            <div class="bbs-range-scale">
                                <span>${minRange}cm</span>
                                <span>${((minRange + maxRange) / 2).toFixed(1)}cm</span>
                                <span>${maxRange}cm</span>
                            </div>
                            <input type="range" id="inp-foot-range" class="bbs-range-control" min="${minRange}" max="${maxRange}" step="0.1" value="${currentVal}">
                            <div class="bbs-range-markers">
                                ${markerValues.map(value => `<span>${value}</span>`).join('')}
                            </div>
                        </div>

                        <div class="bbs-hint-card">
                            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#0f172a" d="M3 5h18v2H3V5zm2 6h14v2H5v-2zm4 6h6v2H9v-2z"/></svg>
                            <div>
                                <strong>Dica rápida</strong>
                                <p>Meça com o pé totalmente apoiado para garantir precisão.</p>
                            </div>
                        </div>
                    </div>
                </div>

                ${state.error ? `<p class="bbs-error-text">${state.error}</p>` : ''}

                <div class="bbs-footer-area shoe-footer">
                    <button class="bbs-btn-next" id="btn-calc-shoe">Ver recomendação</button>
                </div>
            </div>
        `;

        const range = document.getElementById('inp-foot-range');
        const num = document.getElementById('inp-foot-num');
        const valueDisplay = document.getElementById('bbs-foot-value');

        const syncValue = (val) => {
            const safeVal = parseFloat(val || currentVal);
            state.data.pe = safeVal;
            if (valueDisplay) valueDisplay.textContent = `${safeVal.toFixed(1)} cm`;
        };

        range.oninput = (e) => {
            num.value = e.target.value;
            syncValue(e.target.value);
        };

        num.oninput = (e) => {
            range.value = e.target.value;
            syncValue(e.target.value);
        };

        syncValue(currentVal);

        document.getElementById('btn-calc-shoe').onclick = () => {
            const val = parseFloat(num.value);
            if (!val || val < minRange || val > maxRange) {
                setError('Medida inválida.');
                render();
                return;
            }
            state.data.pe = val;
            setError('');
            submitData();
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
                    ${renderSlider('Busto (cm)', 'busto', 60, 130)}
                    ${renderSlider('Cintura (cm)', 'cintura', 50, 120)}
                    ${renderSlider('Quadril (cm)', 'quadril', 60, 140)}
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
        const size = state.result || '?';
        const phrases = state.resultPhrases && state.resultPhrases.length
            ? state.resultPhrases
            : [state.type === 'calcado' ? 'Ideal para o seu pé' : 'Medida compatível'];
        const [mainPhrase, ...extraPhrases] = phrases;

        let body = '';

        if (hasResult) {
            const feedbackList = extraPhrases.map(text => `
                <div class="bbs-feedback-card">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#0f172a" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    <span>${text}</span>
                </div>
            `).join('');

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
                        <p class="bbs-result-label">${mainPhrase || `${size} é a melhor escolha agora.`}</p>
                    </div>
                    ${extraPhrases.length ? `<div class="bbs-feedback-stack">
                        <div class="bbs-subtitle" style="margin-bottom:8px;font-weight:600;color:#0f172a;">Outros feedbacks</div>
                        ${feedbackList}
                    </div>` : ''}
                </div>
            `;
        } else {
            body = `
                <div class="bbs-header">
                    <h3 class="bbs-title">Ops!</h3>
                    <p class="bbs-subtitle">${state.error || 'Não encontramos uma sugestão.'}</p>
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

        document.getElementById('btn-edit').onclick = () => { state.step = 1; render(); };
        document.getElementById('btn-close-final').onclick = () => overlay.classList.remove('open');
    }

    async function submitData() {
        state.loading = true;
        state.step = 3;
        render();

        try {
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
                if (Array.isArray(json.frases) && json.frases.length) {
                    state.resultPhrases = json.frases;
                } else if (json.frase) {
                    state.resultPhrases = [json.frase];
                } else {
                    state.resultPhrases = [];
                }
                setError('');
            } else {
                state.result = null;
                state.resultPhrases = [];
                setError(json.message || 'Sem resultado.');
            }
        } catch (err) {
            console.error(err);
            state.result = null;
            state.resultPhrases = [];
            setError('Erro de conexão.');
        } finally {
            state.step = 4;
            state.loading = false;
            render();
        }
    }

    function openModal() {
        overlay.classList.add('open');
        state.step = 1;
        setError('');
        render();
    }

    function createTriggerButton() {
        const btn = document.createElement('button');
        btn.id = 'bbs-trigger-btn';
        btn.type = 'button';
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 128 128" aria-hidden="true"><path d="M112.6 127H15.4c-5.8 0-10.6-3.6-12.4-9.1s.2-11.2 4.9-14.6l63-44.6c3.5-2.5 5.4-6.6 5-10.9-.5-5.6-5.1-10.3-10.7-10.8-6.2-.6-11.7 3.5-13 9.5-.3 1.6-1.9 2.7-3.5 2.3-1.6-.3-2.7-1.9-2.3-3.5 1.9-9 10.2-15.2 19.4-14.3 8.6.8 15.4 7.7 16.1 16.3.6 6.5-2.2 12.6-7.5 16.3l-63 44.6c-3.1 2.2-3.4 5.5-2.6 7.8.8 2.4 2.9 4.9 6.7 4.9h97.1c3.8 0 5.9-2.5 6.7-4.9s.5-5.7-2.6-7.8L74.4 78.4c-1.4-1-1.7-2.8-.7-4.2s2.8-1.7 4.2-.7l42.2 29.9c4.7 3.3 6.6 9 4.9 14.6s-6.7 9-12.4 9z" fill="currentColor"/></svg>
            Achar o Tamanho Certo
        `;
        btn.onclick = openModal;
        return btn;
    }

    const waitForElement = (selector) => {
        return new Promise(resolve => {
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

    document.getElementById('bbs-close').onclick = () => overlay.classList.remove('open');
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            overlay.classList.remove('open');
        }
    });

    async function init() {
        const currentStoreId = config.storeId;
        try {
            const res = await fetch(`${API_BASE_URL}/widget/check/${productId}?storeId=${currentStoreId}`);
            const json = await res.json();
            if (!json.available) return;
            if (json.type) state.type = json.type;

            const targetElement = await waitForElement(targetSelector);
            if (!targetElement) return;

            const inject = () => {
                if (!document.getElementById('bbs-trigger-btn')) {
                    const btn = createTriggerButton();
                    targetElement.parentNode.insertBefore(btn, targetElement);
                }
            };

            inject();
            new MutationObserver(() => inject()).observe(targetElement.parentNode, { childList: true, subtree: true });
        } catch (err) {
            console.error(err);
        }
    }

    init();
})();
