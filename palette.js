/**
 * ============================================
 * PROTOTYPING ENGINE - Component Palette
 * ============================================
 * Panel de componentes arrastrables para
 * construir la estructura de la página.
 */

class Palette {
    constructor() {
        this.panel = null;
        this.components = [
            {
                id: 'container',
                label: 'Contenedor',
                icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>',
                html: '<div style="padding: 2rem; border: 1px dashed rgba(255,255,255,0.2); min-height: 100px;">Contenedor Vacío</div>'
            },
            {
                id: 'heading',
                label: 'Título',
                icon: '<path d="M4 7V4h16v3M9 20h6M12 4v16"></path>',
                html: '<h2 style="font-size: 2rem; margin-bottom: 1rem;">Nuevo Título</h2>'
            },
            {
                id: 'text',
                label: 'Párrafo',
                icon: '<line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line>',
                html: '<p style="margin-bottom: 1rem; line-height: 1.6;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.</p>'
            },
            {
                id: 'button',
                label: 'Botón',
                icon: '<rect x="5" y="11" width="14" height="10" rx="2"></rect><circle cx="12" cy="16" r="2"></circle>',
                html: '<button class="btn btn-primary">Click Aquí</button>'
            },
            {
                id: 'card',
                label: 'Tarjeta',
                icon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
                html: `
                <div class="service-card" style="padding: 2rem; border-radius: 1rem; background: rgba(255,255,255,0.05);">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">★</div>
                    <h3 style="margin-bottom: 0.5rem;">Nueva Tarjeta</h3>
                    <p>Descripción del servicio o característica.</p>
                </div>`
            },
            {
                id: 'image',
                label: 'Imagen',
                icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
                html: '<img src="https://via.placeholder.com/400x300" alt="Placeholder" style="width: 100%; border-radius: 8px; margin-bottom: 1rem;">'
            }
        ];

        this.draggedHTML = null;
        this.dropTarget = null;

        this.init();
    }

    init() {
        this.createPanel();
        this.setupDockButton();
        this.setupDragEvents();
    }

    // ============================================
    // UI: Create Panel
    // ============================================
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'palettePanel';
        this.panel.className = 'floating-module palette-panel';

        const itemsHTML = this.components.map(comp => `
            <div class="palette-item" draggable="true" data-id="${comp.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    ${comp.icon}
                </svg>
                <span>${comp.label}</span>
            </div>
        `).join('');

        this.panel.innerHTML = `
            <div class="panel-header">
                <h2>🧩 Componentes</h2>
                <button class="close-btn" id="closePalette">&times;</button>
            </div>
            <div class="panel-content palette-grid">
                ${itemsHTML}
                <div class="palette-info">
                    <small>Arrastra los elementos al lienzo para insertarlos.</small>
                </div>
            </div>
        `;
        document.body.appendChild(this.panel);

        // Events for draggable items (Source)
        this.panel.querySelectorAll('.palette-item').forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleDragStart(e, item));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
        });
    }

    setupDockButton() {
        if (!globalThis.prototyper) return;

        globalThis.prototyper.addDockButton({
            id: 'dockPaletteBtn',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
            tooltip: 'Componentes',
            onClick: () => this.togglePanel()
        });

        this.panel.querySelector('#closePalette').addEventListener('click', () => {
            this.closePanel();
        });
    }

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
        const btn = document.getElementById('dockPaletteBtn');
        if (btn) btn.classList.add('active');
    }

    closePanel() {
        this.panel.classList.remove('active');
        const btn = document.getElementById('dockPaletteBtn');
        if (btn) btn.classList.remove('active');
    }

    // ============================================
    // LOGIC: Drag & Drop
    // ============================================
    handleDragStart(e, item) {
        const compId = item.dataset.id;
        const comp = this.components.find(c => c.id === compId);

        this.draggedHTML = comp.html;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/html', comp.html);

        // Visual feedback
        item.style.opacity = '0.5';

        // Notify Prototyper (optional)
        document.body.classList.add('dragging-active');
    }

    handleDragEnd(e) {
        e.target.style.opacity = '1';
        document.body.classList.remove('dragging-active');
        this.clearDropTarget();
    }

    // ============================================
    // LOGIC: Drop Zone (The Whole Document)
    // ============================================
    setupDragEvents() {
        // These events are on the DESTINATION (Document)
        document.addEventListener('dragover', (e) => this.handleDragOver(e));
        document.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        document.addEventListener('drop', (e) => this.handleDrop(e));
    }

    handleDragOver(e) {
        if (!this.draggedHTML) return; // Only handle our own drags
        e.preventDefault(); // Allow drop
        e.dataTransfer.dropEffect = 'copy';

        const target = e.target;

        // Ignore drops on system UI
        if (target.closest('.dock-container') || target.closest('.floating-module')) return;

        // Visual feedback on target
        if (this.dropTarget !== target) {
            this.clearDropTarget();
            this.dropTarget = target;
            this.dropTarget.classList.add('proto-drop-target');
        }
    }

    handleDragLeave(e) {
        // Only clear if we really left the element (not entered a child)
        // This is tricky, simplified:
        if (e.target === this.dropTarget) {
            // this.clearDropTarget(); // Flickers too much
        }
    }

    handleDrop(e) {
        if (!this.draggedHTML) return;
        e.preventDefault();

        const target = this.dropTarget;
        if (!target) return;

        // Insert HTML
        // Insert as last child
        target.insertAdjacentHTML('beforeend', this.draggedHTML);

        console.log('✨ Component Dropped');

        this.clearDropTarget();
        this.draggedHTML = null; // Reset
    }

    clearDropTarget() {
        if (this.dropTarget) {
            this.dropTarget.classList.remove('proto-drop-target');
            this.dropTarget = null;
        }
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    globalThis.palette = new Palette();
});
