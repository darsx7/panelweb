/**
 * ============================================
 * PROTOTYPING ENGINE - Property Inspector
 * ============================================
 * Panel para editar propiedades CSS individuales
 * del elemento seleccionado.
 */

class Inspector {
    constructor() {
        this.panel = null;
        this.selectedEl = null;
        this.init();
    }

    init() {
        this.createPanel();
        this.setupEvents();
        this.setupDockButton();
    }

    // ============================================
    // UI: Create Panel
    // ============================================
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'inspectorPanel';
        this.panel.className = 'floating-module inspector-panel';

        this.panel.innerHTML = `
            <div class="panel-header">
                <h2>🔍 Inspector</h2>
                <button class="close-btn" id="closeInspector">&times;</button>
            </div>
            <div class="panel-content" id="inspectorContent">
                <div class="empty-state">Selecciona un elemento para editar</div>

                <!-- CONTROLES (Ocultos hasta selección) -->
                <div id="inspectorControls" style="display:none;">

                    <!-- ID & CLASSES -->
                    <div class="control-group">
                        <label>Selector</label>
                        <input type="text" id="inspSelector" disabled style="opacity:0.7; background:rgba(0,0,0,0.2);">
                    </div>

                    <!-- LAYOUT -->
                    <hr class="panel-divider">
                    <h3>📏 Layout</h3>
                    <div class="control-row">
                        <div class="control-col">
                            <label>Display</label>
                            <select id="inspDisplay">
                                <option value="block">Block</option>
                                <option value="flex">Flex</option>
                                <option value="grid">Grid</option>
                                <option value="inline-block">Inline-Block</option>
                                <option value="inline">Inline</option>
                                <option value="none">None</option>
                            </select>
                        </div>
                    </div>

                    <!-- FLEXBOX CONTROLS (Hidden by default) -->
                    <div id="inspFlexControls" style="display:none; background:rgba(255,255,255,0.05); padding:8px; border-radius:4px; margin-bottom:10px;">
                        <div class="control-group">
                            <label>Direction</label>
                            <select id="inspFlexDirection">
                                <option value="row">Row (→)</option>
                                <option value="column">Column (↓)</option>
                                <option value="row-reverse">Row Rev (←)</option>
                                <option value="column-reverse">Col Rev (↑)</option>
                            </select>
                        </div>
                        <div class="control-group">
                            <label>Justify (Eje Principal)</label>
                            <select id="inspJustifyContent">
                                <option value="flex-start">Start</option>
                                <option value="center">Center</option>
                                <option value="flex-end">End</option>
                                <option value="space-between">Space Between</option>
                                <option value="space-around">Space Around</option>
                            </select>
                        </div>
                        <div class="control-group">
                            <label>Align (Eje Cruzado)</label>
                            <select id="inspAlignItems">
                                <option value="stretch">Stretch</option>
                                <option value="flex-start">Start</option>
                                <option value="center">Center</option>
                                <option value="flex-end">End</option>
                            </select>
                        </div>
                    </div>

                    <div class="control-row">
                        <div class="control-col">
                            <label>Margin (px)</label>
                            <input type="text" id="inspMargin" placeholder="10px">
                        </div>
                        <div class="control-col">
                            <label>Padding (px)</label>
                            <input type="text" id="inspPadding" placeholder="10px">
                        </div>
                    </div>

                    <!-- SIZE -->
                    <hr class="panel-divider">
                    <h3>📐 Tamaño</h3>
                    <div class="control-row">
                        <div class="control-col">
                            <label>Width</label>
                            <input type="text" id="inspWidth" placeholder="auto">
                        </div>
                        <div class="control-col">
                            <label>Height</label>
                            <input type="text" id="inspHeight" placeholder="auto">
                        </div>
                    </div>

                    <!-- TYPOGRAPHY -->
                    <hr class="panel-divider">
                    <h3>Aa Tipografía</h3>
                    <div class="control-group">
                        <label>Color</label>
                        <div class="color-input-wrapper">
                            <input type="color" id="inspColorPicker">
                            <input type="text" id="inspColorText" placeholder="#ffffff">
                        </div>
                    </div>
                    <div class="control-row">
                        <div class="control-col">
                            <label>Size (px/rem)</label>
                            <input type="text" id="inspFontSize">
                        </div>
                        <div class="control-col">
                            <label>Align</label>
                            <div class="icon-toggle-group">
                                <button data-align="left" class="icon-btn">L</button>
                                <button data-align="center" class="icon-btn">C</button>
                                <button data-align="right" class="icon-btn">R</button>
                            </div>
                        </div>
                    </div>

                    <!-- BACKGROUND & BORDER -->
                    <hr class="panel-divider">
                    <h3>🎨 Estilo</h3>
                    <div class="control-group">
                        <label>Fondo</label>
                        <div class="color-input-wrapper">
                            <input type="color" id="inspBgPicker">
                            <input type="text" id="inspBgText" placeholder="transparent">
                        </div>
                    </div>
                    <div class="control-row">
                        <div class="control-col">
                            <label>Radio (px)</label>
                            <input type="text" id="inspRadius">
                        </div>
                        <div class="control-col">
                            <label>Borde</label>
                            <input type="text" id="inspBorder" placeholder="1px solid #...">
                        </div>
                    </div>

                    <!-- INTERACTIONS -->
                    <hr class="panel-divider">
                    <h3>⚡ Interacción</h3>
                    <div class="control-group">
                        <label>Acción (Click)</label>
                        <select id="inspInteractionAction">
                            <option value="">Ninguna</option>
                            <option value="alert">Mostrar Alerta</option>
                            <option value="link">Abrir Enlace</option>
                            <option value="scroll">Scroll a Sección</option>
                            <option value="toggle">Mostrar/Ocultar</option>
                        </select>
                    </div>
                    <div class="control-group" id="inspInteractionValueGroup" style="display:none;">
                        <label id="inspInteractionLabel">Valor</label>
                        <input type="text" id="inspInteractionValue" placeholder="...">
                    </div>

                    <!-- ACTIONS -->
                    <hr class="panel-divider">
                    <button id="deleteElementBtn" class="danger-btn" style="width:100%; margin-top:1rem;">
                        🗑 Eliminar Elemento
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(this.panel);
    }

    setupDockButton() {
        const dock = document.querySelector('.dock');
        const btn = document.createElement('button');
        btn.className = 'dock-btn';
        btn.id = 'dockInspectorBtn';
        btn.title = 'Inspector';
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span class="dock-tooltip">Inspector</span>
        `;

        // Insert before mode toggle if possible
        const toggle = dock.querySelector('.mode-toggle');
        if (toggle) {
            dock.insertBefore(btn, toggle);
        } else {
            dock.appendChild(btn);
        }

        btn.addEventListener('click', () => {
            this.togglePanel();
        });

        // Close button logic
        this.panel.querySelector('#closeInspector').addEventListener('click', () => {
            this.closePanel();
        });
    }

    // ============================================
    // LOGIC: State Management
    // ============================================
    togglePanel() {
        const btn = document.getElementById('dockInspectorBtn');
        const isActive = this.panel.classList.contains('active');

        if (isActive) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    openPanel() {
        // Cerrar otros paneles (simple hack, idealmente centralizado)
        document.querySelectorAll('.floating-module.active').forEach(p => {
            if (p !== this.panel) p.classList.remove('active');
        });
        document.querySelectorAll('.dock-btn.active').forEach(b => {
             if (!b.classList.contains('mode-toggle')) b.classList.remove('active');
        });

        this.panel.classList.add('active');
        document.getElementById('dockInspectorBtn').classList.add('active');
    }

    closePanel() {
        this.panel.classList.remove('active');
        document.getElementById('dockInspectorBtn').classList.remove('active');
    }

    // ============================================
    // EVENTS: Listeners
    // ============================================
    setupEvents() {
        // 1. Selection Events
        window.addEventListener('proto-element-selected', (e) => {
            this.onSelect(e.detail);
            // Auto-open inspector on selection if configured?
            // Let's force open it for better UX
            this.openPanel();
        });

        window.addEventListener('proto-element-deselected', () => {
            this.onDeselect();
        });

        // 2. Input Change Events (Bind UI to Element)

        // Helper to bind input to style property
        const bind = (id, prop, unit = '') => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', (e) => this.applyStyle(prop, e.target.value + unit));
            el.addEventListener('change', (e) => this.applyStyle(prop, e.target.value + unit)); // Ensure final value
        };

        // Layout
        bind('inspDisplay', 'display');
        bind('inspMargin', 'margin');
        bind('inspPadding', 'padding');

        // Flexbox
        bind('inspFlexDirection', 'flexDirection');
        bind('inspJustifyContent', 'justifyContent');
        bind('inspAlignItems', 'alignItems');

        // Logic to show/hide Flex controls
        document.getElementById('inspDisplay').addEventListener('change', (e) => {
            const isFlex = e.target.value === 'flex' || e.target.value === 'inline-flex';
            document.getElementById('inspFlexControls').style.display = isFlex ? 'block' : 'none';
        });

        // Size
        bind('inspWidth', 'width');
        bind('inspHeight', 'height');

        // Typography
        bind('inspFontSize', 'fontSize');

        const colorPicker = document.getElementById('inspColorPicker');
        const colorText = document.getElementById('inspColorText');

        // Sync Picker -> Text -> Element
        colorPicker.addEventListener('input', (e) => {
            colorText.value = e.target.value;
            this.applyStyle('color', e.target.value);
        });
        // Sync Text -> Picker -> Element
        colorText.addEventListener('change', (e) => {
            colorPicker.value = e.target.value; // Only works if hex
            this.applyStyle('color', e.target.value);
        });

        // Align Buttons
        this.panel.querySelectorAll('[data-align]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyStyle('textAlign', e.target.dataset.align);
            });
        });

        // Background
        const bgPicker = document.getElementById('inspBgPicker');
        const bgText = document.getElementById('inspBgText');
        bgPicker.addEventListener('input', (e) => {
            bgText.value = e.target.value;
            this.applyStyle('backgroundColor', e.target.value);
        });
        bgText.addEventListener('change', (e) => {
            bgPicker.value = e.target.value;
            this.applyStyle('backgroundColor', e.target.value);
        });

        // Border
        bind('inspRadius', 'borderRadius');
        bind('inspBorder', 'border');

        // Interactions
        const actionSelect = document.getElementById('inspInteractionAction');
        const valueGroup = document.getElementById('inspInteractionValueGroup');
        const valueInput = document.getElementById('inspInteractionValue');
        const label = document.getElementById('inspInteractionLabel');

        actionSelect.addEventListener('change', (e) => {
            const action = e.target.value;
            if (!action) {
                valueGroup.style.display = 'none';
                this.updateInteraction(null);
            } else {
                valueGroup.style.display = 'block';
                if (action === 'alert') label.textContent = 'Mensaje';
                else if (action === 'link') label.textContent = 'URL (https://...)';
                else if (action === 'scroll') label.textContent = 'Selector Objetivo (#id)';
                else if (action === 'toggle') label.textContent = 'Selector Objetivo (#id)';

                this.updateInteraction({ action, value: valueInput.value });
            }
        });

        valueInput.addEventListener('input', (e) => {
            const action = actionSelect.value;
            if (action) {
                this.updateInteraction({ action, value: e.target.value });
            }
        });

        // Delete
        document.getElementById('deleteElementBtn').addEventListener('click', () => {
            if (this.selectedEl) {
                if(confirm('¿Eliminar este elemento?')) {
                    this.selectedEl.remove();
                    globalThis.prototyper.clearSelection();
                }
            }
        });
    }

    updateInteraction(config) {
        if (!this.selectedEl) return;
        if (!config) {
            this.selectedEl.removeAttribute('data-interaction');
        } else {
            this.selectedEl.setAttribute('data-interaction', JSON.stringify(config));
        }
    }

    // ============================================
    // LOGIC: Update UI from Element
    // ============================================
    onSelect(el) {
        this.selectedEl = el;
        const controls = document.getElementById('inspectorControls');
        const emptyState = this.panel.querySelector('.empty-state');

        controls.style.display = 'block';
        emptyState.style.display = 'none';

        // Populate fields
        const computed = window.getComputedStyle(el);
        const style = el.style; // Inline styles preferred for editing

        // Selector
        document.getElementById('inspSelector').value =
            el.tagName.toLowerCase() + (el.id ? '#'+el.id : '') + (el.className ? '.'+el.className.split(' ')[0] : '');

        // Layout
        this.setVal('inspDisplay', computed.display);

        // Show/Hide Flex Controls
        const isFlex = computed.display === 'flex' || computed.display === 'inline-flex';
        document.getElementById('inspFlexControls').style.display = isFlex ? 'block' : 'none';
        if (isFlex) {
            this.setVal('inspFlexDirection', style.flexDirection || computed.flexDirection);
            this.setVal('inspJustifyContent', style.justifyContent || computed.justifyContent);
            this.setVal('inspAlignItems', style.alignItems || computed.alignItems);
        }

        this.setVal('inspMargin', style.margin || computed.margin);
        this.setVal('inspPadding', style.padding || computed.padding);

        // Size
        this.setVal('inspWidth', style.width || computed.width);
        this.setVal('inspHeight', style.height || computed.height);

        // Typography
        this.setVal('inspFontSize', style.fontSize || computed.fontSize);

        // Colors (Convert RGB to Hex if possible for picker, or keep as is for text)
        const color = this.rgbToHex(computed.color) || computed.color;
        this.setVal('inspColorText', color);
        if (color.startsWith('#')) this.setVal('inspColorPicker', color);

        // Background
        const bg = this.rgbToHex(computed.backgroundColor) || computed.backgroundColor;
        this.setVal('inspBgText', bg);
        if (bg.startsWith('#')) this.setVal('inspBgPicker', bg);

        // Border
        this.setVal('inspRadius', style.borderRadius || computed.borderRadius);
        this.setVal('inspBorder', style.border || computed.border);

        // Interactions
        const interaction = el.getAttribute('data-interaction');
        const actionSelect = document.getElementById('inspInteractionAction');
        if (interaction) {
            try {
                const config = JSON.parse(interaction);
                this.setVal('inspInteractionAction', config.action);
                this.setVal('inspInteractionValue', config.value);
            } catch (e) { console.error('Error parsing interaction', e); }
        } else {
            this.setVal('inspInteractionAction', '');
            this.setVal('inspInteractionValue', '');
        }
        // Trigger visual update
        actionSelect.dispatchEvent(new Event('change'));
    }

    onDeselect() {
        this.selectedEl = null;
        document.getElementById('inspectorControls').style.display = 'none';
        this.panel.querySelector('.empty-state').style.display = 'block';
    }

    setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }

    applyStyle(prop, val) {
        if (!this.selectedEl) return;
        this.selectedEl.style[prop] = val;
        // Visual feedback?
    }

    // Helper: RGB to Hex
    rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent') return null;
        if (rgb.startsWith('#')) return rgb;
        const sep = rgb.indexOf(',') > -1 ? ',' : ' ';
        const rgbArr = rgb.substr(4).split(')')[0].split(sep);

        let r = (+rgbArr[0]).toString(16),
            g = (+rgbArr[1]).toString(16),
            b = (+rgbArr[2]).toString(16);

        if (r.length == 1) r = "0" + r;
        if (g.length == 1) g = "0" + g;
        if (b.length == 1) b = "0" + b;

        return "#" + r + g + b;
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Prototyper to be ready
    setTimeout(() => {
        globalThis.inspector = new Inspector();
    }, 200);
});
