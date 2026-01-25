/**
 * ============================================
 * NETWORK MESH ANIMATION
 * ============================================
 * Sistema de animación de malla/red interactiva
 * que responde al movimiento del mouse.
 *
 * Características:
 * - Red de nodos conectados en forma de cuadrícula
 * - Efectos de interacción: repeler, atraer, onda, iluminar
 * - Panel de configuración en tiempo real
 * - Colores personalizables que afectan toda la UI
 */

// ============================================
// CLASE PRINCIPAL: NetworkMesh
// ============================================
class NetworkMesh {

    constructor() {
        // ---- REFERENCIAS AL DOM ----
        this.canvas = document.getElementById('networkCanvas');
        this.ctx = this.canvas.getContext('2d');

        // ---- PANEL UI ----
        this.panel = null;

        // ---- ESTADO DE LA ANIMACIÓN ----
        this.nodes = [];
        this.mouse = { x: null, y: null };
        this.animationId = null;

        // ---- CONFIGURACIÓN POR DEFECTO ----
        this.config = {
            gridDensity: 40,
            interactionRadius: 150,
            lineColor: '#f59e0b',
            glowColor: '#fbbf24',
            interactionType: 'repel'
        };
        this.defaultConfig = { ...this.config };
        this.time = 0;
    }

    static async create() {
        const instance = new NetworkMesh();
        await instance.loadConfig();
        return instance;
    }

    async loadConfig() {
        try {
            const response = await fetch('config.json');
            if (response.ok) {
                const savedConfig = await response.json();
                this.config = { ...this.config, ...savedConfig };
                this.defaultConfig = { ...this.config };
                console.log('✓ Configuración cargada desde config.json');
            } else {
                console.log('⚠ config.json no encontrado, usando valores por defecto');
            }
        } catch (error) {
            console.log('⚠ Error cargando config.json:', error.message);
        }

        this.initCanvas();
        this.setupEventListeners();
        this.createPanel(); // Crea el panel
        this.setupControls(); // Bind eventos
        this.updateCSSVariables();
        this.updateControlsUI();
        this.animate();

        // Registro en el Dock
        this.setupDockButton();
    }

    // ============================================
    // UI: Create Panel
    // ============================================
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'networkPanel'; // ID actualizado
        this.panel.className = 'floating-module network-panel';

        this.panel.innerHTML = `
            <div class="panel-header">
                <h2>Configuración de Red</h2>
                <button class="close-btn" id="closeNetworkPanel">&times;</button>
            </div>

            <div class="panel-content">
                <div class="control-group">
                    <label>Tipo de Interacción</label>
                    <select id="netInteractionType">
                        <option value="repel">Repeler</option>
                        <option value="attract">Atraer</option>
                        <option value="glow">Iluminar</option>
                        <option value="wave">Onda</option>
                    </select>
                </div>

                <div class="control-group">
                    <label>Densidad de Malla: <span id="netGridDensityValue">40</span>px</label>
                    <input type="range" id="netGridDensity" min="20" max="80" value="40">
                </div>

                <div class="control-group">
                    <label>Radio de Interacción: <span id="netInteractionRadiusValue">150</span>px</label>
                    <input type="range" id="netInteractionRadius" min="50" max="300" value="150">
                </div>

                <div class="control-group">
                    <label>Color de Red</label>
                    <input type="color" id="netLineColor" value="#f59e0b">
                </div>

                <div class="control-group">
                    <label>Color de Iluminación</label>
                    <input type="color" id="netGlowColor" value="#fbbf24">
                </div>

                <!-- Botones de acción del panel -->
                <div class="panel-actions">
                    <button id="netSaveBtn" class="save-btn">Guardar</button>
                    <div class="btn-row">
                        <button id="netExportBtn" class="export-btn">Exportar</button>
                        <button id="netImportBtn" class="import-btn">Importar</button>
                    </div>
                    <input type="file" id="netImportFile" accept=".json" style="display: none;">
                    <button id="netResetBtn" class="reset-btn">Restablecer</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.panel);
    }

    setupDockButton() {
        if (!globalThis.prototyper) return;

        globalThis.prototyper.addDockButton({
            id: 'dockNetworkBtn',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
            tooltip: 'Red',
            onClick: () => this.togglePanel()
        });
    }

    togglePanel() {
        const isActive = this.panel.classList.contains('active');
        if (isActive) {
            this.panel.classList.remove('active');
        } else {
            // Close others
            globalThis.prototyper.closeAllPanels();
            this.panel.classList.add('active');
            // Re-activate dock button
            const btn = document.getElementById('dockNetworkBtn');
            if (btn) btn.classList.add('active');
        }
    }

    // ============================================
    // SERVER LOGIC
    // ============================================
    async saveConfig() {
        try {
            const response = await fetch('/api/save-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.config)
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('✗ No se pudo conectar al servidor:', error.message);
            alert('No se pudo guardar. Asegúrate de que server.py esté corriendo.');
            return false;
        }
    }

    exportConfig() {
        const configJSON = JSON.stringify(this.config, null, 4);
        const blob = new Blob([configJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-');
        link.download = `config_${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    async importConfig(file) {
        try {
            const text = await file.text();
            const importedConfig = JSON.parse(text);
            this.config = { ...this.config, ...importedConfig };
            this.createGrid();
            this.updateCSSVariables();
            this.updateControlsUI();
        } catch (error) {
            console.error('Error al parsear JSON:', error);
            alert('El archivo no es un JSON válido');
        }
    }

    // ============================================
    // CANVAS LOGIC
    // ============================================
    initCanvas() {
        this.resize();
        this.createGrid();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createGrid() {
        this.nodes = [];
        const spacing = this.config.gridDensity;
        const cols = Math.ceil(this.canvas.width / spacing) + 2;
        const rows = Math.ceil(this.canvas.height / spacing) + 2;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                this.nodes.push({
                    baseX: i * spacing,
                    baseY: j * spacing,
                    x: i * spacing,
                    y: j * spacing,
                    col: i,
                    row: j
                });
            }
        }
        this.cols = cols;
        this.rows = rows;
    }

    setupEventListeners() {
        window.addEventListener('proto-ui-close-all', () => {
            if (this.panel.classList.contains('active')) {
                this.togglePanel();
            }
        });

        window.addEventListener('resize', () => {
            this.resize();
            this.createGrid();
        });
        this.canvas.style.pointerEvents = 'auto';
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        document.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
        document.addEventListener('touchmove', (e) => {
            this.mouse.x = e.touches[0].clientX;
            this.mouse.y = e.touches[0].clientY;
        }, { passive: true });
        document.addEventListener('touchend', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    setupControls() {
        // Close Button
        this.panel.querySelector('#closeNetworkPanel').addEventListener('click', () => {
            this.togglePanel();
        });

        // Controls (using prefixed IDs to avoid collisions if any)
        const get = (id) => this.panel.querySelector('#' + id);

        get('netInteractionType').addEventListener('change', (e) => {
            this.config.interactionType = e.target.value;
        });

        const densityInput = get('netGridDensity');
        const densityVal = get('netGridDensityValue');
        densityInput.addEventListener('input', (e) => {
            this.config.gridDensity = parseInt(e.target.value);
            densityVal.textContent = e.target.value;
            this.createGrid();
        });

        const radiusInput = get('netInteractionRadius');
        const radiusVal = get('netInteractionRadiusValue');
        radiusInput.addEventListener('input', (e) => {
            this.config.interactionRadius = parseInt(e.target.value);
            radiusVal.textContent = e.target.value;
        });

        get('netLineColor').addEventListener('input', (e) => {
            this.config.lineColor = e.target.value;
            this.updateCSSVariables();
        });

        get('netGlowColor').addEventListener('input', (e) => {
            this.config.glowColor = e.target.value;
            this.updateCSSVariables();
        });

        get('netResetBtn').addEventListener('click', () => {
            this.config = { ...this.defaultConfig };
            this.updateControlsUI();
            this.updateCSSVariables();
            this.createGrid();
        });

        const saveBtn = get('netSaveBtn');
        saveBtn.addEventListener('click', async () => {
            const originalText = saveBtn.innerHTML;
            saveBtn.textContent = 'Guardando...';
            const success = await this.saveConfig();
            saveBtn.textContent = success ? '¡Guardado!' : 'Error';
            setTimeout(() => { saveBtn.innerHTML = originalText; }, 2000);
        });

        get('netExportBtn').addEventListener('click', () => this.exportConfig());

        const importBtn = get('netImportBtn');
        const importFile = get('netImportFile');
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importConfig(file);
                importFile.value = '';
            }
        });
    }

    updateCSSVariables() {
        document.documentElement.style.setProperty('--primary', this.config.lineColor);
        document.documentElement.style.setProperty('--secondary', this.config.glowColor);
        document.documentElement.style.setProperty('--glow-color', this.hexToRgba(this.config.glowColor, 0.6));
        document.documentElement.style.setProperty('--primary-glow', this.hexToRgba(this.config.lineColor, 0.4));
        document.documentElement.style.setProperty('--border-hover', this.hexToRgba(this.config.lineColor, 0.5));
    }

    updateControlsUI() {
        const get = (id) => this.panel.querySelector('#' + id);
        get('netInteractionType').value = this.config.interactionType;
        get('netGridDensity').value = this.config.gridDensity;
        get('netGridDensityValue').textContent = this.config.gridDensity;
        get('netInteractionRadius').value = this.config.interactionRadius;
        get('netInteractionRadiusValue').textContent = this.config.interactionRadius;
        get('netLineColor').value = this.config.lineColor;
        get('netGlowColor').value = this.config.glowColor;
    }

    animate() {
        this.time += 0.01;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.nodes.forEach(node => this.updateNode(node));
        this.drawConnections();
        this.drawNodes();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    updateNode(node) {
        let targetX = node.baseX + Math.sin(this.time + node.col * 0.3) * 3;
        let targetY = node.baseY + Math.cos(this.time + node.row * 0.3) * 3;

        if (this.mouse.x !== null && this.mouse.y !== null) {
            const dx = node.baseX - this.mouse.x;
            const dy = node.baseY - this.mouse.y;
            const distance = Math.hypot(dx, dy);

            if (distance < this.config.interactionRadius) {
                const force = (this.config.interactionRadius - distance) / this.config.interactionRadius;
                const angle = Math.atan2(dy, dx);

                switch (this.config.interactionType) {
                    case 'repel':
                        targetX = node.baseX + Math.cos(angle) * force * 40;
                        targetY = node.baseY + Math.sin(angle) * force * 40;
                        break;
                    case 'attract':
                        targetX = node.baseX - Math.cos(angle) * force * 30;
                        targetY = node.baseY - Math.sin(angle) * force * 30;
                        break;
                    case 'wave':
                        const wave = Math.sin(distance * 0.05 - this.time * 3) * force * 25;
                        targetX = node.baseX + Math.cos(angle) * wave;
                        targetY = node.baseY + Math.sin(angle) * wave;
                        break;
                }
            }
        }
        node.x += (targetX - node.x) * 0.1;
        node.y += (targetY - node.y) * 0.1;
    }

    drawConnections() {
        this.nodes.forEach((node, index) => {
            if (node.col < this.cols - 1) {
                const rightIndex = index + this.rows;
                if (rightIndex < this.nodes.length) this.drawLine(node, this.nodes[rightIndex]);
            }
            if (node.row < this.rows - 1) {
                const bottomIndex = index + 1;
                if (bottomIndex < this.nodes.length && this.nodes[bottomIndex].col === node.col) {
                    this.drawLine(node, this.nodes[bottomIndex]);
                }
            }
            if (node.col < this.cols - 1 && node.row < this.rows - 1) {
                const diagIndex = index + this.rows + 1;
                if (diagIndex < this.nodes.length) this.drawLine(node, this.nodes[diagIndex], 0.3);
            }
        });
    }

    drawLine(node1, node2, baseOpacity = 0.5) {
        let opacity = baseOpacity;
        let lineWidth = 1;

        if (this.mouse.x !== null && this.mouse.y !== null) {
            const midX = (node1.x + node2.x) / 2;
            const midY = (node1.y + node2.y) / 2;
            const dx = midX - this.mouse.x;
            const dy = midY - this.mouse.y;
            const distance = Math.hypot(dx, dy);

            if (distance < this.config.interactionRadius) {
                const proximity = 1 - (distance / this.config.interactionRadius);
                opacity = baseOpacity + proximity * 0.5;
                lineWidth = 1 + proximity * 1.5;
                if (this.config.interactionType === 'glow') {
                    opacity = baseOpacity + proximity * 0.8;
                    lineWidth = 1 + proximity * 2;
                }
            }
        }

        this.ctx.beginPath();
        this.ctx.strokeStyle = this.hexToRgba(this.config.lineColor, opacity);
        this.ctx.lineWidth = lineWidth;
        this.ctx.moveTo(node1.x, node1.y);
        this.ctx.lineTo(node2.x, node2.y);
        this.ctx.stroke();
    }

    drawNodes() {
        this.nodes.forEach(node => {
            let size = 2;
            let glowSize = 0;

            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = node.x - this.mouse.x;
                const dy = node.y - this.mouse.y;
                const distance = Math.hypot(dx, dy);

                if (distance < this.config.interactionRadius) {
                    const proximity = 1 - (distance / this.config.interactionRadius);
                    size = 2 + proximity * 3;
                    glowSize = proximity * 15;
                }
            }

            if (glowSize > 0) {
                const gradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
                gradient.addColorStop(0, this.hexToRgba(this.config.glowColor, 0.6));
                gradient.addColorStop(1, 'transparent');
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }

            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.config.lineColor;
            this.ctx.fill();
        });
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const networkMesh = await NetworkMesh.create();
    globalThis.networkMesh = networkMesh;
});
