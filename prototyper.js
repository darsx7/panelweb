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
        const dockContainer = document.querySelector('.dock');
        if (!dockContainer) return;

        // 1. Añadir separador visual
        const sep = document.createElement('div');
        sep.className = 'dock-separator';
        dockContainer.appendChild(sep);

        // 2. Botón de Modo Juego/Diseño
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'dock-btn mode-toggle';
        toggleBtn.id = 'toggleModeBtn';
        toggleBtn.title = 'Alternar Diseño/Juego';
        toggleBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
        toggleBtn.addEventListener('click', () => this.toggleMode());
        dockContainer.appendChild(toggleBtn);

        // Añadiremos más botones (Inspector, Palette) en los siguientes pasos
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
    // Retrasar ligeramente para asegurar que el DOM y Dock existan
    setTimeout(() => {
        globalThis.prototyper = new Prototyper();
    }, 100);
});
