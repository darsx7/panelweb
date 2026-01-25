/**
 * ============================================
 * PROTOTYPING ENGINE - Core Orchestrator
 * ============================================
 * Gestiona el ciclo de vida del prototipo:
 * - Modos: Diseño vs Juego
 * - Sistema de Selección de Elementos
 * - Coordinación entre módulos (Inspector, Palette)
 */

class Prototyper {
    constructor() {
        this.mode = 'design'; // 'design' | 'play'
        this.selectedElement = null;
        this.dock = null;

        this.init();
    }

    init() {
        // Inicializar interfaz
        this.setupDock();
        this.addSaveButton();

        // Inicializar eventos de interacción
        this.setupInteractions();

        console.log('⚡ Prototyping Engine Initialized');
    }

    // ============================================
    // SETUP: Dock & UI
    // ============================================
    setupDock() {
        let dockContainer = document.querySelector('.dock');

        // Si no existe, lo creamos (para limpiar index.html)
        if (!dockContainer) {
            const container = document.createElement('div');
            container.className = 'dock-container';
            dockContainer = document.createElement('div');
            dockContainer.className = 'dock';
            container.appendChild(dockContainer);
            document.body.appendChild(container);
        } else {
            // Limpiar botones hardcoded existentes si los hay
            dockContainer.innerHTML = '';
        }

        this.dock = dockContainer;
    }

    /**
     * API para que otros módulos añadan botones al Dock
     * @param {Object} config - { id, icon, tooltip, onClick, isToggle }
     */
    addDockButton(config) {
        if (!this.dock) return;

        const btn = document.createElement('button');
        btn.className = 'dock-btn';
        if (config.id) btn.id = config.id;
        if (config.isToggle) btn.className += ' mode-toggle';

        btn.title = config.tooltip || '';
        btn.innerHTML = `
            ${config.icon}
            ${config.tooltip ? `<span class="dock-tooltip">${config.tooltip}</span>` : ''}
        `;

        if (config.onClick) {
            btn.addEventListener('click', (e) => {
                // Si no es el toggle de modo, gestionar estado activo
                if (!config.isToggle) {
                   this.handleDockButtonClick(btn);
                }
                config.onClick(e);
            });
        }

        // Insertar antes del separador si existe, para mantener el toggle al final
        const sep = this.dock.querySelector('.dock-separator');
        if (sep) {
            this.dock.insertBefore(btn, sep);
        } else {
            this.dock.appendChild(btn);
        }

        return btn;
    }

    handleDockButtonClick(clickedBtn) {
        const isActive = clickedBtn.classList.contains('active');

        // Cerrar todos otros botones
        this.dock.querySelectorAll('.dock-btn').forEach(b => {
             if (!b.classList.contains('mode-toggle')) b.classList.remove('active');
        });

        if (!isActive) {
            clickedBtn.classList.add('active');
        }
    }

    addSeparator() {
        if (!this.dock) return;
        const sep = document.createElement('div');
        sep.className = 'dock-separator';
        this.dock.appendChild(sep);
    }

    addModeToggle() {
        this.addSeparator();
        // Llamamos directamente a appendChild para saltarnos la lógica de "insertar antes del separador"
        // ya que este ES el botón final
        const btn = document.createElement('button');
        btn.className = 'dock-btn mode-toggle';
        btn.id = 'toggleModeBtn';
        btn.title = 'Play Mode';
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        btn.addEventListener('click', () => this.toggleMode());
        this.dock.appendChild(btn);
    }

    addSaveButton() {
        this.addDockButton({
            id: 'dockSaveBtn',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`,
            tooltip: 'Guardar Layout',
            onClick: () => this.saveLayout()
        });
    }

    /**
     * Cierra cualquier panel flotante abierto
     */
    closeAllPanels() {
        // Disparar evento para que todos los módulos se cierren
        window.dispatchEvent(new CustomEvent('proto-ui-close-all'));

        // Limpieza de seguridad por si algún módulo no escucha
        document.querySelectorAll('.floating-module.active').forEach(p => p.classList.remove('active'));
        if (this.dock) {
             this.dock.querySelectorAll('.dock-btn.active').forEach(b => b.classList.remove('active'));
        }
    }

    // ============================================
    // PERSISTENCE: Save Layout
    // ============================================
    async saveLayout() {
        if (!confirm('¿Sobrescribir index.html con el estado actual?')) return;

        const btn = document.getElementById('dockSaveBtn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '...';

        try {
            // 1. Clone body to clean it up
            const clone = document.body.cloneNode(true);

            // 2. Remove System UI elements
            const selectorsToRemove = [
                '.dock-container',
                '.floating-module',
                '.proto-drop-marker',
                '.proto-ghost-drag',
                '#networkCanvas' // Usually canvas is regenerated by JS, saving it might be redundant or messy if it has inline styles/width
            ];

            // Note: We might want to KEEP networkCanvas structure but empty it?
            // Actually network.js recreates it or finds it. It's in HTML.
            // If we remove it, network.js might fail on reload if it expects it.
            // But network.js usually appends if missing? No, it `getElementById`.
            // Let's keep canvas but clear attributes if needed.
            // Actually, let's NOT remove networkCanvas, but maybe clear its width/height attributes to let resize handle it.

            selectorsToRemove.forEach(sel => {
                clone.querySelectorAll(sel).forEach(el => el.remove());
            });

            // Special handling for canvas: Keep element but clean
            // Actually we removed it above if included. Let's remove from list above and handle separately.
            // Correct approach: Don't remove canvas, let script handle it.

            // 3. Clean up classes and attributes on remaining elements
            const allElements = clone.querySelectorAll('*');
            allElements.forEach(el => {
                el.classList.remove('proto-selected', 'proto-hover', 'proto-drop-target', 'dragging-active', 'editable');
                el.removeAttribute('data-proto-label');
                el.removeAttribute('contenteditable');
                el.removeAttribute('spellcheck');

                // Remove inline styles added by dragging?
                if (el.style.length === 0) el.removeAttribute('style');
                if (el.classList.length === 0) el.removeAttribute('class');
            });

            // Clean body attributes
            clone.classList.remove('proto-play', 'edit-mode', 'dragging-active');
            if (clone.classList.length === 0) clone.removeAttribute('class');

            // 4. Send to server
            // Note: The Clone includes <script> tags which is good.
            const htmlContent = clone.innerHTML;

            const response = await fetch('/api/save-layout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html: htmlContent })
            });

            const result = await response.json();

            if (result.success) {
                alert('¡Layout guardado exitosamente!');
            } else {
                alert('Error al guardar: ' + result.message);
            }

        } catch (err) {
            console.error(err);
            alert('Error al procesar el layout');
        } finally {
            btn.innerHTML = originalHtml;
            // Re-select button if needed (it lost focus/state?)
            document.getElementById('dockSaveBtn').classList.remove('active');
        }
    }

    // ============================================
    // EVENTS: Interaction Logic
    // ============================================
    setupInteractions() {
        // Hover effects
        document.addEventListener('mouseover', (e) => this.handleHover(e));
        document.addEventListener('mouseout', (e) => this.handleHoverExit(e));

        // Selection
        document.addEventListener('click', (e) => this.handleClick(e));

        // Intercept links in design mode
        document.addEventListener('click', (e) => {
            if (this.mode === 'design' && (e.target.closest('a') || e.target.tagName === 'BUTTON')) {
                // Permitir clicks en el dock y paneles
                if (!this.shouldIgnore(e.target)) {
                    e.preventDefault();
                }
            }
        }, true);
    }

    handleHover(e) {
        if (this.mode !== 'design') return;
        if (this.shouldIgnore(e.target)) return;

        e.target.classList.add('proto-hover');
    }

    handleHoverExit(e) {
        if (e.target.classList) {
            e.target.classList.remove('proto-hover');
        }
    }

    handleClick(e) {
        // Click en espacio vacío (body) deselecciona
        if (e.target === document.body || e.target.id === 'networkCanvas') {
            if (this.mode === 'design') {
                this.clearSelection();
                return;
            }
        }

        // --- PLAY MODE LOGIC ---
        if (this.mode === 'play') {
            const interactionEl = e.target.closest('[data-interaction]');
            if (interactionEl) {
                try {
                    const config = JSON.parse(interactionEl.dataset.interaction);
                    this.executeInteraction(config, e);
                } catch (err) {
                    console.error('Interaction Error:', err);
                }
            }
            return;
        }

        // --- DESIGN MODE LOGIC ---
        if (this.shouldIgnore(e.target)) return;

        // Detener propagación para no disparar eventos del sitio
        e.preventDefault();
        e.stopPropagation();

        this.selectElement(e.target);
    }

    executeInteraction(config, e) {
        if (!config || !config.action) return;

        console.log('⚡ Executing:', config);

        if (config.action === 'alert') {
            alert(config.value || 'Alerta');
        }
        else if (config.action === 'link') {
            if (config.value) window.open(config.value, '_blank');
        }
        else if (config.action === 'scroll') {
            e.preventDefault(); // Prevent default anchor jump if any
            const target = document.querySelector(config.value);
            if (target) target.scrollIntoView({behavior: 'smooth'});
        }
        else if (config.action === 'toggle') {
            e.preventDefault();
            const target = document.querySelector(config.value);
            if (target) {
                // Determine current state
                const currentDisplay = target.style.display || window.getComputedStyle(target).display;

                if (currentDisplay === 'none') {
                    // Show it
                    target.style.display = ''; // Try removing inline style first
                    if (window.getComputedStyle(target).display === 'none') {
                        target.style.display = 'block'; // Force block if class hides it
                    }
                } else {
                    // Hide it
                    target.style.display = 'none';
                }
            }
        }
    }

    shouldIgnore(el) {
        if (!el) return true;
        // Ignorar herramientas del sistema
        if (el.closest('.dock-container')) return true;
        if (el.closest('.floating-module')) return true;
        if (el.closest('.content-actions-panel')) return true; // Toolbar del editor antiguo

        // Ignorar si se está editando texto (Legacy Content Editor)
        if (el.isContentEditable) return true;

        // Ignorar elementos estructurales raíz intocables
        if (el === document.documentElement) return true;

        return false;
    }

    // ============================================
    // CORE: Selection System
    // ============================================
    selectElement(el) {
        this.clearSelection();

        this.selectedElement = el;
        this.selectedElement.classList.add('proto-selected');

        // Generar etiqueta visual para el elemento
        let label = el.tagName.toLowerCase();
        if (el.id) label += '#' + el.id;
        else if (el.classList.length > 0) label += '.' + el.classList[0];

        this.selectedElement.setAttribute('data-proto-label', label);

        console.log('🎯 Element Selected:', label);

        // Disparar evento para que otros módulos (Inspector) reaccionen
        window.dispatchEvent(new CustomEvent('proto-element-selected', { detail: el }));
    }

    clearSelection() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('proto-selected');
            this.selectedElement.removeAttribute('data-proto-label');
            this.selectedElement = null;

            // Evento de deselección
            window.dispatchEvent(new CustomEvent('proto-element-deselected'));
        }
    }

    // ============================================
    // CORE: Mode Switching
    // ============================================
    toggleMode() {
        this.mode = this.mode === 'design' ? 'play' : 'design';
        const body = document.body;
        const btn = document.getElementById('toggleModeBtn');

        if (this.mode === 'play') {
            // ACTIVAR MODO JUEGO
            body.classList.add('proto-play');
            btn.classList.add('active');
            // Icono Pause
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;

            this.clearSelection();

            // Ocultar cursores de edición
            document.body.style.cursor = 'default';

            console.log('▶ Mode: PLAY');
        } else {
            // ACTIVAR MODO DISEÑO
            body.classList.remove('proto-play');
            btn.classList.remove('active');
            // Icono Play
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;

            console.log('✎ Mode: DESIGN');
        }
    }
}

// Inicialización global
document.addEventListener('DOMContentLoaded', () => {
    globalThis.prototyper = new Prototyper();
    // Añadir el toggle al final de la inicialización
    globalThis.prototyper.addModeToggle();
});
