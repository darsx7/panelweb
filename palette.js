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
        this.activeCategory = 'layout';
        this.dropMarker = null;
        this.currentDropTarget = null;

        // Define components with categories
        this.components = [
            // LAYOUT
            {
                id: 'container', category: 'layout', label: 'Contenedor',
                icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>',
                html: '<div style="padding: 2rem; border: 1px dashed rgba(255,255,255,0.2); min-height: 100px;"></div>'
            },
            {
                id: 'grid-2', category: 'layout', label: 'Grid 2 Col',
                icon: '<rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line>',
                html: '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;"><div style="border: 1px dashed rgba(255,255,255,0.2); min-height: 50px;"></div><div style="border: 1px dashed rgba(255,255,255,0.2); min-height: 50px;"></div></div>'
            },

            // TYPOGRAPHY
            {
                id: 'heading', category: 'typography', label: 'Título',
                icon: '<path d="M4 7V4h16v3M9 20h6M12 4v16"></path>',
                html: '<h2 style="font-size: 2rem; margin-bottom: 1rem;">Nuevo Título</h2>'
            },
            {
                id: 'text', category: 'typography', label: 'Párrafo',
                icon: '<line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line>',
                html: '<p style="margin-bottom: 1rem; line-height: 1.6;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.</p>'
            },

            // UI ELEMENTS
            {
                id: 'button', category: 'ui', label: 'Botón',
                icon: '<rect x="5" y="11" width="14" height="10" rx="2"></rect><circle cx="12" cy="16" r="2"></circle>',
                html: '<button class="btn btn-primary">Click Aquí</button>'
            },
            {
                id: 'card', category: 'ui', label: 'Tarjeta',
                icon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
                html: `
                <div class="service-card" style="padding: 2rem; border-radius: 1rem; background: rgba(255,255,255,0.05);">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">★</div>
                    <h3 style="margin-bottom: 0.5rem;">Nueva Tarjeta</h3>
                    <p>Descripción del servicio o característica.</p>
                </div>`
            },

            // MEDIA
            {
                id: 'image', category: 'media', label: 'Imagen',
                icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
                html: '<img src="https://via.placeholder.com/400x300" alt="Placeholder" style="width: 100%; border-radius: 8px; margin-bottom: 1rem;">'
            }
        ];

        this.draggedItem = null;
        this.init();
    }

    init() {
        this.createPanel();
        this.setupDockButton();
        this.setupDragEvents();
        this.createDropMarker();
    }

    createDropMarker() {
        this.dropMarker = document.createElement('div');
        this.dropMarker.className = 'proto-drop-marker';
        this.dropMarker.style.display = 'none';
        document.body.appendChild(this.dropMarker);
    }

    // ============================================
    // UI: Create Panel
    // ============================================
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'palettePanel';
        this.panel.className = 'floating-module palette-panel';

        this.renderPanelContent();
        document.body.appendChild(this.panel);
    }

    renderPanelContent() {
        const categories = [
            { id: 'layout', label: 'Layout' },
            { id: 'typography', label: 'Texto' },
            { id: 'ui', label: 'UI' },
            { id: 'media', label: 'Media' }
        ];

        // Tabs
        const tabsHTML = categories.map(cat =>
            `<button class="palette-tab ${this.activeCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">${cat.label}</button>`
        ).join('');

        // Items
        const items = this.components.filter(c => c.category === this.activeCategory);
        const itemsHTML = items.map(comp => `
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
            <div class="panel-content">
                <div class="palette-tabs">${tabsHTML}</div>
                <div class="palette-grid">${itemsHTML}</div>
                <div class="palette-info"><small>Arrastra para insertar</small></div>
            </div>
        `;

        // Bind Events
        this.panel.querySelectorAll('.palette-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent click-through issues since we re-render DOM
                this.activeCategory = btn.dataset.cat;
                this.renderPanelContent(); // Re-render logic is simple here
                this.bindDragEvents(); // Re-bind drag events for new items

                // Keep panel open logic
                this.panel.querySelector('#closePalette').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.closePanel();
                });
            });
        });

        this.panel.querySelector('#closePalette').addEventListener('click', () => this.closePanel());
        this.bindDragEvents();
    }

    bindDragEvents() {
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
        this.draggedItem = comp;

        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/html', comp.html);

        // Custom Ghost Image
        const ghost = document.createElement('div');
        ghost.className = 'proto-ghost-drag';
        ghost.innerHTML = `${comp.icon} <span>${comp.label}</span>`;
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 20, 20);
        setTimeout(() => ghost.remove(), 0);

        document.body.classList.add('dragging-active');
    }

    handleDragEnd(e) {
        document.body.classList.remove('dragging-active');
        this.hideMarker();
        this.draggedItem = null;
        this.currentDropTarget = null;
    }

    setupDragEvents() {
        document.addEventListener('dragover', (e) => this.handleDragOver(e));
        document.addEventListener('drop', (e) => this.handleDrop(e));
    }

    handleDragOver(e) {
        if (!this.draggedItem) return;
        e.preventDefault();

        const target = e.target;
        if (this.shouldIgnore(target)) return;

        // Calculate insertion point
        const dropInfo = this.calculateDropPosition(e.clientX, e.clientY, target);
        if (dropInfo) {
            this.showMarker(dropInfo);
            this.currentDropTarget = dropInfo;
            e.dataTransfer.dropEffect = 'copy';
        } else {
            this.hideMarker();
            this.currentDropTarget = null;
            e.dataTransfer.dropEffect = 'none';
        }
    }

    calculateDropPosition(x, y, target) {
        // If hovering body or main containers, check children
        // Simplified: We assume we can insert relative to any block element
        const rect = target.getBoundingClientRect();

        // Check if target is a container we can insert INSIDE (e.g. empty div)
        // For now, we mainly insert BEFORE or AFTER elements unless it's explicitly a container

        const isContainer = target.id === 'hero' || target.classList.contains('hero-content') || target.tagName === 'SECTION' || target.id.includes('grid');

        // Logic:
        // If y < middle -> Insert Before
        // If y > middle -> Insert After

        const midY = rect.top + rect.height / 2;
        const position = y < midY ? 'before' : 'after';

        return {
            element: target,
            position: position,
            rect: rect
        };
    }

    showMarker(info) {
        this.dropMarker.style.display = 'block';
        this.dropMarker.style.width = `${info.rect.width}px`;
        this.dropMarker.style.left = `${info.rect.left + window.scrollX}px`;

        if (info.position === 'before') {
            this.dropMarker.style.top = `${info.rect.top + window.scrollY - 2}px`;
        } else {
            this.dropMarker.style.top = `${info.rect.bottom + window.scrollY - 2}px`;
        }
    }

    hideMarker() {
        this.dropMarker.style.display = 'none';
    }

    handleDrop(e) {
        if (!this.draggedItem || !this.currentDropTarget) return;
        e.preventDefault();

        const { element, position } = this.currentDropTarget;

        if (position === 'before') {
            element.insertAdjacentHTML('beforebegin', this.draggedItem.html);
        } else {
            element.insertAdjacentHTML('afterend', this.draggedItem.html);
        }

        console.log(`✨ Component Inserted ${position}`);

        this.hideMarker();
    }

    shouldIgnore(el) {
        if (!el) return true;
        if (el.closest('.dock-container')) return true;
        if (el.closest('.floating-module')) return true;
        if (el.tagName === 'HTML') return true;
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    globalThis.palette = new Palette();
});
