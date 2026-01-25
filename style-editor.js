/**
 * ============================================
 * STYLE EDITOR - Editor de Estilos Global
 * ============================================
 * Panel para editar estilos por tipo de elemento
 * (tarjetas, botones, secciones, textos, general)
 */

class StyleEditor {
    styles = {};
    defaultStyles = {};
    panel = null;

    // ============================================
    // MÉTODO ESTÁTICO: create
    // ============================================
    static async create() {
        const instance = new StyleEditor();
        await instance.loadStyles();
        instance.applyStyles();
        instance.createPanel();
        return instance;
    }

    // ============================================
    // MÉTODO: loadStyles
    // ============================================
    async loadStyles() {
        try {
            const response = await fetch('styles.json');
            if (response.ok) {
                this.styles = await response.json();
                // Merge with defaults to ensure structure exists
                this.styles = { ...this.defaultStyles, ...this.styles,
                    colors: { ...this.defaultStyles.colors, ...(this.styles.colors || {}) }
                };
                this.defaultStyles = structuredClone(this.styles);
                console.log('✓ Estilos cargados desde styles.json');
            } else {
                console.log('⚠ styles.json no encontrado, usando valores por defecto');
                this.setDefaults();
            }
        } catch (error) {
            console.log('⚠ Error cargando styles.json:', error.message);
            this.setDefaults();
        }
    }

    // ============================================
    // MÉTODO: setDefaults
    // ============================================
    setDefaults() {
        this.styles = {
            colors: {
                primary: '#f59e0b',
                secondary: '#fbbf24',
                background: '#0f172a',
                text: '#f8fafc'
            },
            cards: {
                bgOpacity: 0.04,
                borderRadius: 20,
                shadow: true,
                hoverScale: 1.02,
                padding: 2.5,
                gap: 2
            },
            buttons: {
                borderRadius: 12,
                hoverScale: 1.03
            },
            sections: {
                heroOpacity: 1,
                servicesOpacity: 0.7,
                benefitsOpacity: 1,
                contactOpacity: 0.7,
                padding: 6
            },
            texts: {
                titleOpacity: 1,
                paragraphOpacity: 0.7,
                titleSize: 2.5,
                bodySize: 1
            },
            general: {
                networkOpacity: 0.5,
                navbarBlur: 20,
                navbarOpacity: 0.8,
                containerWidth: 1200
            },
            animations: {
                transitionSpeed: 0.3,
                hoverLift: 8
            },
            effects: {
                glowIntensity: 0.25,
                borderOpacity: 0.08
            }
        };
        this.defaultStyles = structuredClone(this.styles);
    }

    // ============================================
    // MÉTODO: applyStyles
    // ============================================
    applyStyles() {
        const root = document.documentElement;
        const s = this.styles;

        // Colores Globales
        if (s.colors) {
            root.style.setProperty('--primary', s.colors.primary);
            root.style.setProperty('--secondary', s.colors.secondary);
            root.style.setProperty('--bg', s.colors.background);
            root.style.setProperty('--text', s.colors.text);
            // Derived colors could be calculated here (e.g. surface)
        }

        // Tarjetas
        root.style.setProperty('--card-bg-opacity', s.cards.bgOpacity);
        root.style.setProperty('--card-border-radius', `${s.cards.borderRadius}px`);
        root.style.setProperty('--card-shadow', s.cards.shadow ? '0 25px 50px rgba(0,0,0,0.5)' : 'none');
        root.style.setProperty('--card-hover-scale', s.cards.hoverScale);
        root.style.setProperty('--card-padding', `${s.cards.padding}rem`);
        root.style.setProperty('--card-gap', `${s.cards.gap}rem`);

        // Botones
        root.style.setProperty('--btn-border-radius', `${s.buttons.borderRadius}px`);
        root.style.setProperty('--btn-hover-scale', s.buttons.hoverScale);

        // Secciones
        root.style.setProperty('--hero-opacity', s.sections.heroOpacity);
        root.style.setProperty('--services-opacity', s.sections.servicesOpacity);
        root.style.setProperty('--benefits-opacity', s.sections.benefitsOpacity);
        root.style.setProperty('--contact-opacity', s.sections.contactOpacity);
        root.style.setProperty('--section-padding', `${s.sections.padding}rem`);

        // Textos
        root.style.setProperty('--title-opacity', s.texts.titleOpacity);
        root.style.setProperty('--paragraph-opacity', s.texts.paragraphOpacity);
        root.style.setProperty('--title-size', `${s.texts.titleSize}rem`);
        root.style.setProperty('--body-size', `${s.texts.bodySize}rem`);

        // General
        root.style.setProperty('--network-opacity', s.general.networkOpacity);
        root.style.setProperty('--navbar-blur', `${s.general.navbarBlur}px`);
        root.style.setProperty('--navbar-opacity', s.general.navbarOpacity);
        root.style.setProperty('--container-width', `${s.general.containerWidth}px`);

        // Animaciones
        root.style.setProperty('--transition-speed', `${s.animations.transitionSpeed}s`);
        root.style.setProperty('--hover-lift', `${s.animations.hoverLift}px`);

        // Efectos
        root.style.setProperty('--glow-intensity', s.effects.glowIntensity);
        root.style.setProperty('--border-opacity', s.effects.borderOpacity);
    }

    // ============================================
    // MÉTODO: createPanel
    // ============================================
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'styleEditorPanel';
        this.panel.className = 'style-editor-panel floating-module';
        this.panel.innerHTML = `
            <div class="panel-header">
                <h2>🎨 Estilos</h2>
                <button id="closeStylePanel" class="close-btn">&times;</button>
            </div>
            <div class="panel-content">
                <!-- COLORES -->
                <div class="control-group">
                    <h3>🎨 Colores Globales</h3>
                </div>
                <div class="control-group">
                    <label>Primario</label>
                    <div class="color-input-wrapper">
                        <input type="color" id="globalPrimaryColor">
                        <input type="text" id="globalPrimaryText" placeholder="#...">
                    </div>
                </div>
                <div class="control-group">
                    <label>Secundario</label>
                    <div class="color-input-wrapper">
                        <input type="color" id="globalSecondaryColor">
                        <input type="text" id="globalSecondaryText" placeholder="#...">
                    </div>
                </div>
                <div class="control-group">
                    <label>Fondo</label>
                    <div class="color-input-wrapper">
                        <input type="color" id="globalBgColor">
                        <input type="text" id="globalBgText" placeholder="#...">
                    </div>
                </div>
                <div class="control-group">
                    <label>Texto</label>
                    <div class="color-input-wrapper">
                        <input type="color" id="globalTextColor">
                        <input type="text" id="globalTextText" placeholder="#...">
                    </div>
                </div>

                <!-- TARJETAS -->
                <hr style="border:0; border-top:1px solid var(--border); margin: 1rem 0;">
                <div class="control-group">
                    <h3>🃏 Tarjetas</h3>
                </div>
                <div class="control-group">
                    <label>Opacidad Fondo: <span id="cardBgOpacityValue">${Math.round(this.styles.cards.bgOpacity * 100)}%</span></label>
                    <input type="range" id="cardBgOpacity" min="0" max="30" value="${this.styles.cards.bgOpacity * 100}">
                </div>
                <div class="control-group">
                    <label>Radio Bordes: <span id="cardBorderRadiusValue">${this.styles.cards.borderRadius}px</span></label>
                    <input type="range" id="cardBorderRadius" min="0" max="50" value="${this.styles.cards.borderRadius}">
                </div>
                <div class="control-group">
                    <label>Padding: <span id="cardPaddingValue">${this.styles.cards.padding}rem</span></label>
                    <input type="range" id="cardPadding" min="1" max="5" step="0.5" value="${this.styles.cards.padding}">
                </div>
                <div class="control-group">
                    <label>Gap: <span id="cardGapValue">${this.styles.cards.gap}rem</span></label>
                    <input type="range" id="cardGap" min="0.5" max="4" step="0.5" value="${this.styles.cards.gap}">
                </div>
                <div class="control-group">
                    <label>Sombra</label>
                    <input type="checkbox" id="cardShadow" ${this.styles.cards.shadow ? 'checked' : ''}>
                </div>

                <!-- BOTONES -->
                <hr style="border:0; border-top:1px solid var(--border); margin: 1rem 0;">
                <div class="control-group">
                    <h3>🔘 Botones</h3>
                </div>
                <div class="control-group">
                    <label>Radio Bordes: <span id="btnBorderRadiusValue">${this.styles.buttons.borderRadius}px</span></label>
                    <input type="range" id="btnBorderRadius" min="0" max="30" value="${this.styles.buttons.borderRadius}">
                </div>

                <!-- SECCIONES -->
                <hr style="border:0; border-top:1px solid var(--border); margin: 1rem 0;">
                <div class="control-group">
                    <h3>📄 Secciones</h3>
                </div>
                <div class="control-group">
                    <label>Servicios Opacidad: <span id="servicesOpacityValue">${Math.round(this.styles.sections.servicesOpacity * 100)}%</span></label>
                    <input type="range" id="servicesOpacity" min="0" max="100" value="${this.styles.sections.servicesOpacity * 100}">
                </div>
                <div class="control-group">
                    <label>Beneficios Opacidad: <span id="benefitsOpacityValue">${Math.round(this.styles.sections.benefitsOpacity * 100)}%</span></label>
                    <input type="range" id="benefitsOpacity" min="0" max="100" value="${this.styles.sections.benefitsOpacity * 100}">
                </div>
                <div class="control-group">
                    <label>Contacto Opacidad: <span id="contactOpacityValue">${Math.round(this.styles.sections.contactOpacity * 100)}%</span></label>
                    <input type="range" id="contactOpacity" min="0" max="100" value="${this.styles.sections.contactOpacity * 100}">
                </div>
                <div class="control-group">
                    <label>Padding: <span id="sectionPaddingValue">${this.styles.sections.padding}rem</span></label>
                    <input type="range" id="sectionPadding" min="2" max="10" step="0.5" value="${this.styles.sections.padding}">
                </div>

                <!-- TIPOGRAFÍA -->
                <hr style="border:0; border-top:1px solid var(--border); margin: 1rem 0;">
                <div class="control-group">
                    <h3>✏️ Tipografía</h3>
                </div>
                <div class="control-group">
                    <label>Tamaño Títulos: <span id="titleSizeValue">${this.styles.texts.titleSize}rem</span></label>
                    <input type="range" id="titleSize" min="1.5" max="4" step="0.25" value="${this.styles.texts.titleSize}">
                </div>
                <div class="control-group">
                    <label>Tamaño Texto: <span id="bodySizeValue">${this.styles.texts.bodySize}rem</span></label>
                    <input type="range" id="bodySize" min="0.8" max="1.5" step="0.1" value="${this.styles.texts.bodySize}">
                </div>

                <!-- ANIMACIONES -->
                <hr style="border:0; border-top:1px solid var(--border); margin: 1rem 0;">
                <div class="control-group">
                    <h3>⚡ Animaciones</h3>
                </div>
                <div class="control-group">
                    <label>Velocidad: <span id="transitionSpeedValue">${this.styles.animations.transitionSpeed}s</span></label>
                    <input type="range" id="transitionSpeed" min="0.1" max="1" step="0.1" value="${this.styles.animations.transitionSpeed}">
                </div>
                <div class="control-group">
                    <label>Elevación Hover: <span id="hoverLiftValue">${this.styles.animations.hoverLift}px</span></label>
                    <input type="range" id="hoverLift" min="0" max="20" value="${this.styles.animations.hoverLift}">
                </div>

                <!-- EFECTOS -->
                <hr style="border:0; border-top:1px solid var(--border); margin: 1rem 0;">
                <div class="control-group">
                    <h3>✨ Efectos</h3>
                </div>
                <div class="control-group">
                    <label>Intensidad Glow: <span id="glowIntensityValue">${Math.round(this.styles.effects.glowIntensity * 100)}%</span></label>
                    <input type="range" id="glowIntensity" min="0" max="100" value="${this.styles.effects.glowIntensity * 100}">
                </div>
                <div class="control-group">
                    <label>Opacidad Bordes: <span id="borderOpacityValue">${Math.round(this.styles.effects.borderOpacity * 100)}%</span></label>
                    <input type="range" id="borderOpacity" min="0" max="30" value="${this.styles.effects.borderOpacity * 100}">
                </div>

                <!-- GENERAL -->
                <hr style="border:0; border-top:1px solid var(--border); margin: 1rem 0;">
                <div class="control-group">
                    <h3>🌐 General</h3>
                </div>
                <div class="control-group">
                    <label>Opacidad Red: <span id="networkOpacityValue">${Math.round(this.styles.general.networkOpacity * 100)}%</span></label>
                    <input type="range" id="networkOpacity" min="0" max="100" value="${this.styles.general.networkOpacity * 100}">
                </div>
                <div class="control-group">
                    <label>Blur Navbar: <span id="navbarBlurValue">${this.styles.general.navbarBlur}px</span></label>
                    <input type="range" id="navbarBlur" min="0" max="40" value="${this.styles.general.navbarBlur}">
                </div>
                <div class="control-group">
                    <label>Opacidad Navbar: <span id="navbarOpacityValue">${Math.round(this.styles.general.navbarOpacity * 100)}%</span></label>
                    <input type="range" id="navbarOpacity" min="0" max="100" value="${this.styles.general.navbarOpacity * 100}">
                </div>
                <div class="control-group">
                    <label>Ancho Contenedor: <span id="containerWidthValue">${this.styles.general.containerWidth}px</span></label>
                    <input type="range" id="containerWidth" min="800" max="1600" step="50" value="${this.styles.general.containerWidth}">
                </div>

                <!-- ACCIONES -->
                <div class="panel-actions">
                    <button id="saveStylesBtn" class="save-btn">💾 Guardar</button>
                    <button id="resetStylesBtn" class="reset-btn">Restablecer</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.panel);

        this.setupEvents();
        this.setupDockButton();
        this.updatePanelValues(); // Update initially
    }

    setupDockButton() {
        if (!globalThis.prototyper) return;

        globalThis.prototyper.addDockButton({
            id: 'dockStyleBtn',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`,
            tooltip: 'Estilos Globales',
            onClick: () => this.togglePanel()
        });
    }

    togglePanel() {
        const isActive = this.panel.classList.contains('active');
        if (isActive) {
            this.panel.classList.remove('active');
        } else {
            globalThis.prototyper.closeAllPanels();
            this.panel.classList.add('active');
            const btn = document.getElementById('dockStyleBtn');
            if (btn) btn.classList.add('active');
        }
    }

    // ============================================
    // MÉTODO: setupEvents
    // ============================================
    setupEvents() {
        window.addEventListener('proto-ui-close-all', () => {
            if (this.panel.classList.contains('active')) {
                this.togglePanel();
            }
        });

        // Cerrar panel
        document.getElementById('closeStylePanel').addEventListener('click', () => {
            this.togglePanel();
        });

        // COLORES
        this.setupColor('globalPrimaryColor', 'globalPrimaryText', 'primary');
        this.setupColor('globalSecondaryColor', 'globalSecondaryText', 'secondary');
        this.setupColor('globalBgColor', 'globalBgText', 'background');
        this.setupColor('globalTextColor', 'globalTextText', 'text');

        // ---- TARJETAS ----
        this.setupSlider('cardBgOpacity', 'cardBgOpacityValue', (v) => {
            this.styles.cards.bgOpacity = v / 100;
            return `${Math.round(v)}%`;
        });
        this.setupSlider('cardBorderRadius', 'cardBorderRadiusValue', (v) => {
            this.styles.cards.borderRadius = v;
            return `${v}px`;
        });
        this.setupSlider('cardPadding', 'cardPaddingValue', (v) => {
            this.styles.cards.padding = parseFloat(v);
            return `${v}rem`;
        });
        this.setupSlider('cardGap', 'cardGapValue', (v) => {
            this.styles.cards.gap = parseFloat(v);
            return `${v}rem`;
        });
        document.getElementById('cardShadow').addEventListener('change', (e) => {
            this.styles.cards.shadow = e.target.checked;
            this.applyStyles();
        });

        // ---- BOTONES ----
        this.setupSlider('btnBorderRadius', 'btnBorderRadiusValue', (v) => {
            this.styles.buttons.borderRadius = v;
            return `${v}px`;
        });

        // ---- SECCIONES ----
        this.setupSlider('servicesOpacity', 'servicesOpacityValue', (v) => {
            this.styles.sections.servicesOpacity = v / 100;
            return `${Math.round(v)}%`;
        });
        this.setupSlider('benefitsOpacity', 'benefitsOpacityValue', (v) => {
            this.styles.sections.benefitsOpacity = v / 100;
            return `${Math.round(v)}%`;
        });
        this.setupSlider('contactOpacity', 'contactOpacityValue', (v) => {
            this.styles.sections.contactOpacity = v / 100;
            return `${Math.round(v)}%`;
        });
        this.setupSlider('sectionPadding', 'sectionPaddingValue', (v) => {
            this.styles.sections.padding = parseFloat(v);
            return `${v}rem`;
        });

        // ---- TIPOGRAFÍA ----
        this.setupSlider('titleSize', 'titleSizeValue', (v) => {
            this.styles.texts.titleSize = parseFloat(v);
            return `${v}rem`;
        });
        this.setupSlider('bodySize', 'bodySizeValue', (v) => {
            this.styles.texts.bodySize = parseFloat(v);
            return `${v}rem`;
        });

        // ---- ANIMACIONES ----
        this.setupSlider('transitionSpeed', 'transitionSpeedValue', (v) => {
            this.styles.animations.transitionSpeed = parseFloat(v);
            return `${v}s`;
        });
        this.setupSlider('hoverLift', 'hoverLiftValue', (v) => {
            this.styles.animations.hoverLift = parseInt(v);
            return `${v}px`;
        });

        // ---- EFECTOS ----
        this.setupSlider('glowIntensity', 'glowIntensityValue', (v) => {
            this.styles.effects.glowIntensity = v / 100;
            return `${Math.round(v)}%`;
        });
        this.setupSlider('borderOpacity', 'borderOpacityValue', (v) => {
            this.styles.effects.borderOpacity = v / 100;
            return `${Math.round(v)}%`;
        });

        // ---- GENERAL ----
        this.setupSlider('networkOpacity', 'networkOpacityValue', (v) => {
            this.styles.general.networkOpacity = v / 100;
            return `${Math.round(v)}%`;
        });
        this.setupSlider('navbarBlur', 'navbarBlurValue', (v) => {
            this.styles.general.navbarBlur = v;
            return `${v}px`;
        });
        this.setupSlider('navbarOpacity', 'navbarOpacityValue', (v) => {
            this.styles.general.navbarOpacity = v / 100;
            return `${Math.round(v)}%`;
        });
        this.setupSlider('containerWidth', 'containerWidthValue', (v) => {
            this.styles.general.containerWidth = parseInt(v);
            return `${v}px`;
        });

        // Guardar
        document.getElementById('saveStylesBtn').addEventListener('click', async () => {
            const btn = document.getElementById('saveStylesBtn');
            btn.textContent = 'Guardando...';
            const success = await this.saveStyles();
            btn.textContent = success ? '¡Guardado!' : 'Error';
            setTimeout(() => { btn.textContent = '💾 Guardar'; }, 2000);
        });

        // Restablecer
        document.getElementById('resetStylesBtn').addEventListener('click', () => {
            this.styles = structuredClone(this.defaultStyles);
            this.applyStyles();
            this.updatePanelValues();
        });
    }

    // ============================================
    // MÉTODO: setupSlider
    // ============================================
    setupSlider(inputId, labelId, updateFn) {
        const input = document.getElementById(inputId);
        const label = document.getElementById(labelId);
        input.addEventListener('input', (e) => {
            const value = Number(e.target.value);
            label.textContent = updateFn(value);
            this.applyStyles();
        });
    }

    // ============================================
    // MÉTODO: setupColor
    // ============================================
    setupColor(pickerId, textId, propName) {
        const picker = document.getElementById(pickerId);
        const text = document.getElementById(textId);

        picker.addEventListener('input', (e) => {
            text.value = e.target.value;
            if (!this.styles.colors) this.styles.colors = {};
            this.styles.colors[propName] = e.target.value;
            this.applyStyles();
        });

        text.addEventListener('change', (e) => {
            picker.value = e.target.value;
            if (!this.styles.colors) this.styles.colors = {};
            this.styles.colors[propName] = e.target.value;
            this.applyStyles();
        });
    }

    // ============================================
    // MÉTODO: updatePanelValues
    // ============================================
    updatePanelValues() {
        // Colores
        if (this.styles.colors) {
            const updateColor = (pickerId, textId, val) => {
                document.getElementById(pickerId).value = val;
                document.getElementById(textId).value = val;
            };
            updateColor('globalPrimaryColor', 'globalPrimaryText', this.styles.colors.primary);
            updateColor('globalSecondaryColor', 'globalSecondaryText', this.styles.colors.secondary);
            updateColor('globalBgColor', 'globalBgText', this.styles.colors.background);
            updateColor('globalTextColor', 'globalTextText', this.styles.colors.text);
        }

        // Tarjetas
        document.getElementById('cardBgOpacity').value = this.styles.cards.bgOpacity * 100;
        document.getElementById('cardBgOpacityValue').textContent = `${Math.round(this.styles.cards.bgOpacity * 100)}%`;
        document.getElementById('cardBorderRadius').value = this.styles.cards.borderRadius;
        document.getElementById('cardBorderRadiusValue').textContent = `${this.styles.cards.borderRadius}px`;
        document.getElementById('cardPadding').value = this.styles.cards.padding;
        document.getElementById('cardPaddingValue').textContent = `${this.styles.cards.padding}rem`;
        document.getElementById('cardGap').value = this.styles.cards.gap;
        document.getElementById('cardGapValue').textContent = `${this.styles.cards.gap}rem`;
        document.getElementById('cardShadow').checked = this.styles.cards.shadow;

        // Botones
        document.getElementById('btnBorderRadius').value = this.styles.buttons.borderRadius;
        document.getElementById('btnBorderRadiusValue').textContent = `${this.styles.buttons.borderRadius}px`;

        // Secciones
        document.getElementById('servicesOpacity').value = this.styles.sections.servicesOpacity * 100;
        document.getElementById('servicesOpacityValue').textContent = `${Math.round(this.styles.sections.servicesOpacity * 100)}%`;
        document.getElementById('benefitsOpacity').value = this.styles.sections.benefitsOpacity * 100;
        document.getElementById('benefitsOpacityValue').textContent = `${Math.round(this.styles.sections.benefitsOpacity * 100)}%`;
        document.getElementById('contactOpacity').value = this.styles.sections.contactOpacity * 100;
        document.getElementById('contactOpacityValue').textContent = `${Math.round(this.styles.sections.contactOpacity * 100)}%`;
        document.getElementById('sectionPadding').value = this.styles.sections.padding;
        document.getElementById('sectionPaddingValue').textContent = `${this.styles.sections.padding}rem`;

        // Tipografía
        document.getElementById('titleSize').value = this.styles.texts.titleSize;
        document.getElementById('titleSizeValue').textContent = `${this.styles.texts.titleSize}rem`;
        document.getElementById('bodySize').value = this.styles.texts.bodySize;
        document.getElementById('bodySizeValue').textContent = `${this.styles.texts.bodySize}rem`;

        // Animaciones
        document.getElementById('transitionSpeed').value = this.styles.animations.transitionSpeed;
        document.getElementById('transitionSpeedValue').textContent = `${this.styles.animations.transitionSpeed}s`;
        document.getElementById('hoverLift').value = this.styles.animations.hoverLift;
        document.getElementById('hoverLiftValue').textContent = `${this.styles.animations.hoverLift}px`;

        // Efectos
        document.getElementById('glowIntensity').value = this.styles.effects.glowIntensity * 100;
        document.getElementById('glowIntensityValue').textContent = `${Math.round(this.styles.effects.glowIntensity * 100)}%`;
        document.getElementById('borderOpacity').value = this.styles.effects.borderOpacity * 100;
        document.getElementById('borderOpacityValue').textContent = `${Math.round(this.styles.effects.borderOpacity * 100)}%`;

        // General
        document.getElementById('networkOpacity').value = this.styles.general.networkOpacity * 100;
        document.getElementById('networkOpacityValue').textContent = `${Math.round(this.styles.general.networkOpacity * 100)}%`;
        document.getElementById('navbarBlur').value = this.styles.general.navbarBlur;
        document.getElementById('navbarBlurValue').textContent = `${this.styles.general.navbarBlur}px`;
        document.getElementById('navbarOpacity').value = this.styles.general.navbarOpacity * 100;
        document.getElementById('navbarOpacityValue').textContent = `${Math.round(this.styles.general.navbarOpacity * 100)}%`;
        document.getElementById('containerWidth').value = this.styles.general.containerWidth;
        document.getElementById('containerWidthValue').textContent = `${this.styles.general.containerWidth}px`;
    }

    // ============================================
    // MÉTODO: saveStyles
    // ============================================
    async saveStyles() {
        try {
            const response = await fetch('/api/save-styles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.styles)
            });
            if (response.ok) {
                console.log('✓ Estilos guardados en styles.json');
                return true;
            }
            return false;
        } catch (error) {
            console.error('✗ Error guardando estilos:', error);
            return false;
        }
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const styleEditor = await StyleEditor.create();
    globalThis.styleEditor = styleEditor;
});
