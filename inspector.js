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
                        <input type="text" id="inspSelector" disabled style="opacity:0.7; background:rgba(0,0,0,0.2); margin-bottom: 0.5rem;">

                        <!-- Classes Manager -->
                        <div class="classes-input-container">
                            <input type="text" id="inspClassInput" placeholder="Añadir clase...">
                            <button id="inspAddClassBtn">+</button>
                        </div>
                        <div id="inspClassList" class="chips-container"></div>
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

                    <!-- BOX MODEL EDITOR -->
                    <div class="control-group">
                        <div class="box-model-editor">
                          <div class="box-margin" title="Margin">
                             <span class="box-label">Margin</span>
                             <input class="box-input top" data-prop="marginTop" placeholder="-">
                             <input class="box-input right" data-prop="marginRight" placeholder="-">
                             <input class="box-input bottom" data-prop="marginBottom" placeholder="-">
                             <input class="box-input left" data-prop="marginLeft" placeholder="-">
                             <div class="box-border" title="Border">
                                <span class="box-label">Border</span>
                                <input class="box-input top" data-prop="borderTopWidth" placeholder="-">
                                <input class="box-input right" data-prop="borderRightWidth" placeholder="-">
                                <input class="box-input bottom" data-prop="borderBottomWidth" placeholder="-">
                                <input class="box-input left" data-prop="borderLeftWidth" placeholder="-">
                                <div class="box-padding" title="Padding">
                                   <span class="box-label">Padding</span>
                                   <input class="box-input top" data-prop="paddingTop" placeholder="-">
                                   <input class="box-input right" data-prop="paddingRight" placeholder="-">
                                   <input class="box-input bottom" data-prop="paddingBottom" placeholder="-">
                                   <input class="box-input left" data-prop="paddingLeft" placeholder="-">
                                   <div class="box-content" title="Content">
                                       <span class="box-dims" id="inspBoxDims">WxH</span>
                                   </div>
                                </div>
                             </div>
                          </div>
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
        if (!globalThis.prototyper) return;

        globalThis.prototyper.addDockButton({
            id: 'dockInspectorBtn',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
            tooltip: 'Inspector',
            onClick: () => this.togglePanel()
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
        const isActive = this.panel.classList.contains('active');
        if (isActive) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    openPanel() {
        globalThis.prototyper.closeAllPanels();
        this.panel.classList.add('active');
        const btn = document.getElementById('dockInspectorBtn');
        if (btn) btn.classList.add('active');
    }

    closePanel() {
        this.panel.classList.remove('active');
        const btn = document.getElementById('dockInspectorBtn');
        if (btn) btn.classList.remove('active');
    }

    // ============================================
    // EVENTS: Listeners
    // ============================================
    setupEvents() {
        // Global Close Event
        window.addEventListener('proto-ui-close-all', () => {
            this.closePanel();
        });

        // 1. Selection Events
        window.addEventListener('proto-element-selected', (e) => {
            this.onSelect(e.detail);
            // Auto-open inspector on selection
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

        // Flexbox Controls Logic
        document.getElementById('inspDisplay').addEventListener('change', (e) => {
            const isFlex = e.target.value === 'flex' || e.target.value === 'inline-flex';
            document.getElementById('inspFlexControls').style.display = isFlex ? 'block' : 'none';
        });

        bind('inspFlexDirection', 'flexDirection');
        bind('inspJustifyContent', 'justifyContent');
        bind('inspAlignItems', 'alignItems');

        // Box Model Inputs (Generic Handler)
        this.panel.querySelectorAll('.box-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const prop = e.target.dataset.prop;
                let val = e.target.value;
                // Auto-append px if number
                if (val && !isNaN(val)) val += 'px';
                this.applyStyle(prop, val);
            });
            input.addEventListener('keydown', (e) => {
                 if(e.key === 'Enter') e.target.blur();
            });
        });

        // Size
        bind('inspWidth', 'width');
        bind('inspHeight', 'height');

        // Typography
        bind('inspFontSize', 'fontSize');

        const colorPicker = document.getElementById('inspColorPicker');
        const colorText = document.getElementById('inspColorText');

        colorPicker.addEventListener('input', (e) => {
            colorText.value = e.target.value;
            this.applyStyle('color', e.target.value);
        });
        colorText.addEventListener('change', (e) => {
            colorPicker.value = e.target.value;
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

        // Classes Manager
        document.getElementById('inspAddClassBtn').addEventListener('click', () => {
            const input = document.getElementById('inspClassInput');
            const className = input.value.trim();
            if (className && this.selectedEl) {
                this.selectedEl.classList.add(className);
                input.value = '';
                this.refreshClasses();
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

    refreshClasses() {
        if (!this.selectedEl) return;
        const container = document.getElementById('inspClassList');
        container.innerHTML = '';
        this.selectedEl.classList.forEach(cls => {
            const chip = document.createElement('div');
            chip.className = 'class-chip';
            chip.innerHTML = `<span>${cls}</span> <button>&times;</button>`;
            chip.querySelector('button').addEventListener('click', () => {
                this.selectedEl.classList.remove(cls);
                this.refreshClasses();
            });
            container.appendChild(chip);
        });
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

        const computed = window.getComputedStyle(el);
        const style = el.style;

        // Selector
        let selector = el.tagName.toLowerCase();
        if (el.id) selector += '#' + el.id;
        document.getElementById('inspSelector').value = selector;

        // Classes
        this.refreshClasses();

        // Helper for setting value and checking if computed
        const setVal = (id, prop, computedVal, inlineVal) => {
            const input = document.getElementById(id);
            if (!input) return;

            // Prefer inline value for editing, but show computed if inline is empty
            const hasInline = inlineVal && inlineVal !== '';
            input.value = hasInline ? inlineVal : computedVal;

            // Visual indication
            if (hasInline) {
                input.classList.add('inline-style');
                input.classList.remove('computed-style');
            } else {
                input.classList.add('computed-style');
                input.classList.remove('inline-style');
            }
        };

        // Layout
        setVal('inspDisplay', 'display', computed.display, style.display);

        const isFlex = computed.display === 'flex' || computed.display === 'inline-flex';
        document.getElementById('inspFlexControls').style.display = isFlex ? 'block' : 'none';
        if (isFlex) {
            setVal('inspFlexDirection', 'flexDirection', computed.flexDirection, style.flexDirection);
            setVal('inspJustifyContent', 'justifyContent', computed.justifyContent, style.justifyContent);
            setVal('inspAlignItems', 'alignItems', computed.alignItems, style.alignItems);
        }

        // Box Model
        this.panel.querySelectorAll('.box-input').forEach(input => {
            const prop = input.dataset.prop;
            const val = computed[prop];
            // Only show number if possible for simpler UI, or full value
            // Removing 'px' for display might be cleaner but let's keep it exact for now
            const inline = style[prop];

            const hasInline = inline && inline !== '';
            input.value = (hasInline ? inline : val).replace('px', ''); // Remove px for cleaner box look

            if (hasInline) input.classList.add('inline-style');
            else input.classList.remove('inline-style');
        });

        // Content Dims
        document.getElementById('inspBoxDims').textContent =
            `${Math.round(parseFloat(computed.width))} x ${Math.round(parseFloat(computed.height))}`;

        // Size
        setVal('inspWidth', 'width', computed.width, style.width);
        setVal('inspHeight', 'height', computed.height, style.height);

        // Typography
        setVal('inspFontSize', 'fontSize', computed.fontSize, style.fontSize);

        const color = this.rgbToHex(computed.color) || computed.color;
        document.getElementById('inspColorText').value = color;
        if (color.startsWith('#')) document.getElementById('inspColorPicker').value = color;

        // Background
        const bg = this.rgbToHex(computed.backgroundColor) || computed.backgroundColor;
        document.getElementById('inspBgText').value = bg;
        if (bg.startsWith('#')) document.getElementById('inspBgPicker').value = bg;

        // Border
        setVal('inspRadius', 'borderRadius', computed.borderRadius, style.borderRadius);
        setVal('inspBorder', 'border', computed.border, style.border);

        // Interactions
        const interaction = el.getAttribute('data-interaction');
        const actionSelect = document.getElementById('inspInteractionAction');
        if (interaction) {
            try {
                const config = JSON.parse(interaction);
                actionSelect.value = config.action;
                document.getElementById('inspInteractionValue').value = config.value;
            } catch (e) { console.error('Error parsing interaction', e); }
        } else {
            actionSelect.value = '';
            document.getElementById('inspInteractionValue').value = '';
        }
        actionSelect.dispatchEvent(new Event('change'));
    }

    onDeselect() {
        this.selectedEl = null;
        document.getElementById('inspectorControls').style.display = 'none';
        this.panel.querySelector('.empty-state').style.display = 'block';
    }

    applyStyle(prop, val) {
        if (!this.selectedEl) return;
        this.selectedEl.style[prop] = val;
        // Update visual indication to Inline
        // This is a bit complex to target specific inputs, but on next select it updates
    }

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

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        globalThis.inspector = new Inspector();
    }, 200);
});
