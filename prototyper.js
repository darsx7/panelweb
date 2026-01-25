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

        // El botón de Toggle Mode siempre va al final o separado
        // Lo añadiremos dinámicamente o reservaremos el espacio
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
