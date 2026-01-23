/**
 * ============================================
 * CONTENT EDITOR - Editor de Contenido Inline
 * ============================================
 * Sistema de edición visual para modificar textos
 * directamente en la página.
 * 
 * Características:
 * - Edición inline con contenteditable
 * - Renderizado dinámico de secciones
 * - Drag & Drop para reordenar tarjetas
 * - Guardado/Exportar/Importar
 */

// ============================================
// CLASE PRINCIPAL: ContentEditor
// ============================================
class ContentEditor {

    // ---- ESTADO DEL EDITOR (class fields) ----
    isEditMode = false;
    content = {};
    originalContent = {};
    toolbar = null;
    draggedElement = null;

    // ---- CONFIGURACIÓN DE SECCIONES ----
    // Define cómo renderizar cada tipo de sección
    sectionConfig = {
        'services': {
            itemClass: 'service-card',
            template: (item, index) => `
                <div class="service-card" data-glow data-index="${index}" draggable="false">
                    <div class="drag-handle">⋮⋮</div>
                    <div class="card-icon" data-content="services.${index}.icon">${item.icon}</div>
                    <h3 data-content="services.${index}.title">${item.title}</h3>
                    <p data-content="services.${index}.description">${item.description}</p>
                    <a href="#" class="card-link">Saber más →</a>
                </div>
            `,
            getItems: () => this.content.services?.items || []
        },
        'benefits': {
            itemClass: 'benefit-item',
            template: (item, index) => `
                <div class="benefit-item" data-glow data-index="${index}" draggable="false">
                    <div class="drag-handle">⋮⋮</div>
                    <div class="benefit-icon" data-content="benefits.${index}.icon">${item.icon}</div>
                    <h4 data-content="benefits.${index}.title">${item.title}</h4>
                    <p data-content="benefits.${index}.description">${item.description}</p>
                </div>
            `,
            getItems: () => this.content.benefits?.items || []
        },
        'hero.stats': {
            itemClass: 'stat-item',
            template: (item, index) => `
                <div class="stat-item" data-index="${index}" draggable="false">
                    <div class="drag-handle">⋮⋮</div>
                    <span class="stat-number" data-content="hero.stats.${index}.number">${item.number}</span>
                    <span class="stat-label" data-content="hero.stats.${index}.label">${item.label}</span>
                </div>
            `,
            getItems: () => this.content.hero?.stats || []
        }
    };

    // ============================================
    // MÉTODO ESTÁTICO: create
    // ============================================
    static async create() {
        const instance = new ContentEditor();
        await instance.loadContent();
        instance.renderAllSections();
        instance.createToolbar();
        instance.setupEditableElements();
        return instance;
    }

    // ============================================
    // MÉTODO: loadContent
    // ============================================
    async loadContent() {
        try {
            const response = await fetch('content.json');
            if (response.ok) {
                this.content = await response.json();
                this.originalContent = structuredClone(this.content);
                console.log('✓ Contenido cargado desde content.json');
            } else {
                console.log('⚠ content.json no encontrado');
            }
        } catch (error) {
            console.log('⚠ Error cargando content.json:', error.message);
        }
    }

    // ============================================
    // MÉTODO: renderAllSections
    // ============================================
    renderAllSections() {
        // Renderizar cada sección definida en sectionConfig
        for (const sectionName of Object.keys(this.sectionConfig)) {
            this.renderSection(sectionName);
        }
        // Aplicar contenido estático
        this.applyStaticContent();
    }

    // ============================================
    // MÉTODO: renderSection
    // ============================================
    renderSection(sectionName) {
        const container = document.querySelector(`[data-section="${sectionName}"]`);
        if (!container) return;

        const config = this.sectionConfig[sectionName];
        const items = config.getItems.call(this);

        // Generar HTML para todos los items
        container.innerHTML = items.map((item, index) => config.template(item, index)).join('');
    }

    // ============================================
    // MÉTODO: applyStaticContent
    // ============================================
    applyStaticContent() {
        // Contenido que no es parte de secciones dinámicas
        this.setTextContent('[data-content="siteName"]', this.content.siteName);
        this.setTextContent('[data-content="hero.title"]', this.content.hero?.title);
        this.setTextContent('[data-content="hero.subtitle"]', this.content.hero?.subtitle);
        this.setTextContent('[data-content="hero.ctaPrimary"]', this.content.hero?.ctaPrimary);
        this.setTextContent('[data-content="hero.ctaSecondary"]', this.content.hero?.ctaSecondary);
        this.setTextContent('[data-content="services.title"]', this.content.services?.title);
        this.setTextContent('[data-content="benefits.title"]', this.content.benefits?.title);
        this.setTextContent('[data-content="contact.title"]', this.content.contact?.title);
        this.setTextContent('[data-content="contact.subtitle"]', this.content.contact?.subtitle);
        this.setTextContent('[data-content="footer.copyright"]', this.content.footer?.copyright);
    }

    // ============================================
    // MÉTODO: setTextContent
    // ============================================
    setTextContent(selector, value) {
        const element = document.querySelector(selector);
        if (element && value !== undefined) {
            element.textContent = value;
        }
    }

    // ============================================
    // MÉTODO: createToolbar
    // ============================================
    createToolbar() {
        this.toolbar = document.createElement('div');
        this.toolbar.id = 'contentEditorToolbar';
        this.toolbar.className = 'content-editor-toolbar';
        this.toolbar.innerHTML = `
            <button id="toggleEditMode" class="editor-btn edit-mode-btn">
                <span class="icon">🔓</span>
                <span class="text">Modo Edición</span>
            </button>
            <div class="editor-actions" style="display: none;">
                <button id="saveContentBtn" class="editor-btn save-btn">
                    <span class="icon">💾</span>
                    <span class="text">Guardar</span>
                </button>
                <button id="exportContentBtn" class="editor-btn export-btn">
                    <span class="icon">📤</span>
                    <span class="text">Exportar</span>
                </button>
                <button id="importContentBtn" class="editor-btn import-btn">
                    <span class="icon">📥</span>
                    <span class="text">Importar</span>
                </button>
                <input type="file" id="importContentFile" accept=".json" style="display: none;">
                <button id="cancelEditBtn" class="editor-btn cancel-btn">
                    <span class="icon">↩️</span>
                    <span class="text">Cancelar</span>
                </button>
            </div>
        `;

        document.body.appendChild(this.toolbar);
        this.setupToolbarEvents();
    }

    // ============================================
    // MÉTODO: setupToolbarEvents
    // ============================================
    setupToolbarEvents() {
        document.getElementById('toggleEditMode').addEventListener('click', () => this.toggleEditMode());

        document.getElementById('saveContentBtn').addEventListener('click', async () => {
            const btn = document.getElementById('saveContentBtn');
            btn.querySelector('.text').textContent = 'Guardando...';
            const success = await this.saveContent();
            btn.querySelector('.text').textContent = success ? '¡Guardado!' : 'Error';
            setTimeout(() => {
                btn.querySelector('.text').textContent = 'Guardar';
            }, 2000);
        });

        document.getElementById('exportContentBtn').addEventListener('click', () => this.exportContent());

        const importBtn = document.getElementById('importContentBtn');
        const importFile = document.getElementById('importContentFile');
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.importContent(file);
                importFile.value = '';
            }
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => this.cancelEdit());
    }

    // ============================================
    // MÉTODO: setupEditableElements
    // ============================================
    setupEditableElements() {
        // Este método se llama al iniciar, pero los elementos
        // solo serán editables cuando se active el modo edición
    }

    // ============================================
    // MÉTODO: toggleEditMode
    // ============================================
    toggleEditMode() {
        this.isEditMode = !this.isEditMode;

        const toggleBtn = document.getElementById('toggleEditMode');
        const actions = this.toolbar.querySelector('.editor-actions');

        if (this.isEditMode) {
            toggleBtn.querySelector('.icon').textContent = '🔒';
            toggleBtn.querySelector('.text').textContent = 'Editando...';
            toggleBtn.classList.add('active');
            actions.style.display = 'flex';
            document.body.classList.add('edit-mode');

            this.originalContent = structuredClone(this.content);
            this.enableEditing();
            this.enableDragAndDrop();
        } else {
            toggleBtn.querySelector('.icon').textContent = '🔓';
            toggleBtn.querySelector('.text').textContent = 'Modo Edición';
            toggleBtn.classList.remove('active');
            actions.style.display = 'none';
            document.body.classList.remove('edit-mode');

            this.disableEditing();
            this.disableDragAndDrop();
        }
    }

    // ============================================
    // MÉTODO: enableEditing
    // ============================================
    enableEditing() {
        document.querySelectorAll('[data-content]').forEach(element => {
            element.contentEditable = 'true';
            element.classList.add('editable');
            element.addEventListener('blur', () => this.updateContentFromElement(element));
        });
    }

    // ============================================
    // MÉTODO: disableEditing
    // ============================================
    disableEditing() {
        document.querySelectorAll('[data-content]').forEach(element => {
            element.contentEditable = 'false';
            element.classList.remove('editable');
        });
    }

    // ============================================
    // MÉTODO: enableDragAndDrop
    // ============================================
    enableDragAndDrop() {
        // Activar draggable en todos los items de secciones
        document.querySelectorAll('[data-section]').forEach(container => {
            const sectionName = container.dataset.section;
            const config = this.sectionConfig[sectionName];
            if (!config) return;

            container.querySelectorAll(`.${config.itemClass}`).forEach(item => {
                item.draggable = true;
                item.classList.add('draggable');
            });

            // Event listeners para drag & drop
            container.addEventListener('dragstart', (e) => this.handleDragStart(e, sectionName));
            container.addEventListener('dragover', (e) => this.handleDragOver(e));
            container.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            container.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            container.addEventListener('drop', (e) => this.handleDrop(e, sectionName));
            container.addEventListener('dragend', (e) => this.handleDragEnd(e));
        });
    }

    // ============================================
    // MÉTODO: disableDragAndDrop
    // ============================================
    disableDragAndDrop() {
        document.querySelectorAll('[data-section]').forEach(container => {
            const sectionName = container.dataset.section;
            const config = this.sectionConfig[sectionName];
            if (!config) return;

            container.querySelectorAll(`.${config.itemClass}`).forEach(item => {
                item.draggable = false;
                item.classList.remove('draggable');
            });
        });
    }

    // ============================================
    // MÉTODOS DE DRAG & DROP
    // ============================================
    handleDragStart(e, sectionName) {
        const item = e.target.closest('[data-index]');
        if (!item) return;

        this.draggedElement = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.index);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        const item = e.target.closest('[data-index]');
        if (item && item !== this.draggedElement) {
            item.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const item = e.target.closest('[data-index]');
        if (item) {
            item.classList.remove('drag-over');
        }
    }

    handleDrop(e, sectionName) {
        e.preventDefault();
        const dropTarget = e.target.closest('[data-index]');
        if (!dropTarget || !this.draggedElement) return;

        const fromIndex = parseInt(this.draggedElement.dataset.index, 10);
        const toIndex = parseInt(dropTarget.dataset.index, 10);

        if (fromIndex !== toIndex) {
            this.reorderItems(sectionName, fromIndex, toIndex);
        }

        dropTarget.classList.remove('drag-over');
    }

    handleDragEnd(e) {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            this.draggedElement = null;
        }
        // Limpiar todas las clases de drag-over
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }

    // ============================================
    // MÉTODO: reorderItems
    // ============================================
    reorderItems(sectionName, fromIndex, toIndex) {
        // Obtener referencia al array correcto
        let items;
        if (sectionName === 'hero.stats') {
            items = this.content.hero.stats;
        } else {
            items = this.content[sectionName].items;
        }

        // Reordenar el array
        const [movedItem] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, movedItem);

        // Re-renderizar la sección
        this.renderSection(sectionName);

        // Re-activar edición y drag & drop en la sección actualizada
        if (this.isEditMode) {
            const container = document.querySelector(`[data-section="${sectionName}"]`);
            if (container) {
                container.querySelectorAll('[data-content]').forEach(element => {
                    element.contentEditable = 'true';
                    element.classList.add('editable');
                    element.addEventListener('blur', () => this.updateContentFromElement(element));
                });

                const config = this.sectionConfig[sectionName];
                container.querySelectorAll(`.${config.itemClass}`).forEach(item => {
                    item.draggable = true;
                    item.classList.add('draggable');
                });
            }
        }

        console.log(`✓ Reordenado: ${sectionName}[${fromIndex}] → ${sectionName}[${toIndex}]`);
    }

    // ============================================
    // MÉTODO: updateContentFromElement
    // ============================================
    updateContentFromElement(element) {
        const path = element.dataset.content;
        const value = element.textContent.trim();

        const keys = path.split('.');
        let obj = this.content;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            const nextKey = keys[i + 1];
            if (Number.isFinite(Number(nextKey))) {
                obj = obj[key];
            } else if (Number.isFinite(Number(key))) {
                obj = obj[Number.parseInt(key, 10)];
            } else {
                obj = obj[key];
            }
        }

        const lastKey = keys[keys.length - 1];
        if (Number.isFinite(Number(lastKey))) {
            obj[Number.parseInt(lastKey, 10)] = value;
        } else {
            obj[lastKey] = value;
        }
    }

    // ============================================
    // MÉTODO: saveContent
    // ============================================
    async saveContent() {
        try {
            const response = await fetch('/api/save-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.content)
            });

            if (response.ok) {
                console.log('✓ Contenido guardado en content.json');
                return true;
            }
            return false;
        } catch (error) {
            console.error('✗ Error guardando contenido:', error);
            return false;
        }
    }

    // ============================================
    // MÉTODO: exportContent
    // ============================================
    exportContent() {
        const json = JSON.stringify(this.content, null, 4);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-');
        link.download = `content_${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        console.log('✓ Contenido exportado');
    }

    // ============================================
    // MÉTODO: importContent
    // ============================================
    async importContent(file) {
        try {
            const text = await file.text();
            const imported = JSON.parse(text);
            this.content = { ...this.content, ...imported };
            this.renderAllSections();
            console.log('✓ Contenido importado. Pulsa "Guardar" para persistir.');
        } catch (error) {
            console.error('Error importando:', error);
            alert('El archivo no es un JSON válido');
        }
    }

    // ============================================
    // MÉTODO: cancelEdit
    // ============================================
    cancelEdit() {
        this.content = structuredClone(this.originalContent);
        this.renderAllSections();
        this.toggleEditMode();
        console.log('↩️ Cambios cancelados');
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const contentEditor = await ContentEditor.create();
    globalThis.contentEditor = contentEditor;
});

