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
// Esta clase maneja toda la lógica de la animación
// de la red interactiva en el canvas
class NetworkMesh {

    /**
     * Constructor - Inicializa la animación
     * Se ejecuta cuando se crea una instancia de NetworkMesh
     */
    constructor() {
        // ---- REFERENCIAS AL DOM ----
        // Obtiene el elemento canvas donde se dibujará la red
        this.canvas = document.getElementById('networkCanvas');

        // Obtiene el contexto 2D para dibujar en el canvas
        this.ctx = this.canvas.getContext('2d');

        // ---- ESTADO DE LA ANIMACIÓN ----
        // Array que almacenará todos los nodos de la red
        this.nodes = [];

        // Objeto para rastrear la posición del mouse
        // null significa que el mouse no está en la ventana
        this.mouse = { x: null, y: null };

        // ID de la animación para poder cancelarla si es necesario
        this.animationId = null;

        // ---- CONFIGURACIÓN POR DEFECTO ----
        // Se usa solo como fallback si config.json no existe
        this.config = {
            gridDensity: 40,
            interactionRadius: 150,
            lineColor: '#f59e0b',
            glowColor: '#fbbf24',
            interactionType: 'repel'
        };

        // Copia de la configuración por defecto para el botón "Restablecer"
        this.defaultConfig = { ...this.config };

        // Variable de tiempo para animaciones suaves
        this.time = 0;
    }

    // ============================================
    // MÉTODO ESTÁTICO: create
    // ============================================
    // Factory method para crear la instancia de forma asíncrona
    // Esto evita llamar operaciones async desde el constructor
    static async create() {
        const instance = new NetworkMesh();
        await instance.loadConfig();
        return instance;
    }

    // ============================================
    // MÉTODO: loadConfig
    // ============================================
    // Carga config.json y después inicializa la aplicación
    async loadConfig() {
        try {
            // ---- PASO 1: Cargar config.json ----
            const response = await fetch('config.json');

            if (response.ok) {
                const savedConfig = await response.json();
                // Combinar con valores por defecto (por si faltan campos)
                this.config = { ...this.config, ...savedConfig };
                // Actualizar defaultConfig para que "Restablecer" use los valores del archivo
                this.defaultConfig = { ...this.config };
                console.log('✓ Configuración cargada desde config.json');
            } else {
                console.log('⚠ config.json no encontrado, usando valores por defecto');
            }
        } catch (error) {
            console.log('⚠ Error cargando config.json:', error.message);
        }

        // ---- PASO 2: Inicializar la aplicación ----
        this.initCanvas();          // Configura el canvas y crea la red
        this.setupEventListeners(); // Configura eventos de mouse/touch
        this.setupControls();       // Configura el panel de edición
        this.updateCSSVariables();  // Aplica los colores al CSS
        this.updateControlsUI();    // Actualiza los controles del panel
        this.animate();             // Inicia el bucle de animación
    }

    // ============================================
    // MÉTODO: saveConfig
    // ============================================
    // Guarda la configuración actual en config.json via servidor
    // Requiere que el servidor Python esté corriendo
    async saveConfig() {
        try {
            // ---- Enviar POST al servidor ----
            const response = await fetch('http://localhost:5500/api/save-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.config)
            });

            // Parsear la respuesta
            const result = await response.json();

            if (result.success) {
                console.log('✓ Configuración guardada en config.json');
                return true;
            } else {
                console.error('✗ Error del servidor:', result.message);
                return false;
            }
        } catch (error) {
            // Error de conexión (servidor no está corriendo)
            console.error('✗ No se pudo conectar al servidor:', error.message);
            alert('No se pudo guardar. ¿El servidor está corriendo?\n\nEjecuta: python server.py');
            return false;
        }
    }

    // ============================================
    // MÉTODO: exportConfig
    // ============================================
    // Descarga la configuración visual actual como archivo JSON
    // No requiere servidor - descarga directamente al PC
    exportConfig() {
        try {
            // ---- PASO 1: Convertir config a JSON formateado ----
            const configJSON = JSON.stringify(this.config, null, 4);

            // ---- PASO 2: Crear un Blob (archivo en memoria) ----
            const blob = new Blob([configJSON], { type: 'application/json' });

            // ---- PASO 3: Crear URL temporal para el blob ----
            const url = URL.createObjectURL(blob);

            // ---- PASO 4: Crear enlace de descarga invisible ----
            const link = document.createElement('a');
            link.href = url;
            // Nombre con fecha/hora para identificar versiones
            const timestamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-');
            link.download = `config_${timestamp}.json`;

            // ---- PASO 5: Simular clic para iniciar descarga ----
            document.body.appendChild(link);
            link.click();

            // ---- PASO 6: Limpiar recursos ----
            link.remove();
            URL.revokeObjectURL(url);

            console.log('✓ Configuración exportada');
            return true;
        } catch (error) {
            console.error('Error al exportar:', error);
            return false;
        }
    }

    // ============================================
    // MÉTODO: importConfig
    // ============================================
    // Importa configuración desde un archivo JSON seleccionado
    // Aplica los cambios visualmente (no guarda en config.json)
    async importConfig(file) {
        try {
            // ---- Leer archivo como texto usando Blob.text() (moderno) ----
            const text = await file.text();

            // Parsear el JSON del archivo
            const importedConfig = JSON.parse(text);

            // Combinar con la config actual (por si faltan campos)
            this.config = { ...this.config, ...importedConfig };

            // Aplicar cambios visuales
            this.createGrid();           // Recrea la red
            this.updateCSSVariables();   // Actualiza colores CSS
            this.updateControlsUI();     // Actualiza controles del panel

            console.log('✓ Configuración importada (visual). Pulsa "Guardar" para persistir.');
        } catch (error) {
            console.error('Error al parsear JSON:', error);
            alert('El archivo no es un JSON válido');
        }
    }


    // ============================================
    // MÉTODO: initCanvas
    // ============================================
    // Inicializa el canvas y crea la cuadrícula de nodos
    initCanvas() {
        this.resize();      // Ajusta el tamaño del canvas
        this.createGrid();  // Crea los nodos de la red
    }

    // ============================================
    // MÉTODO: resize
    // ============================================
    // Ajusta el tamaño del canvas al tamaño de la ventana
    resize() {
        // El canvas debe ocupar toda la ventana
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // ============================================
    // MÉTODO: createGrid
    // ============================================
    // Crea una cuadrícula de nodos que formarán la red
    createGrid() {
        // Limpia los nodos existentes
        this.nodes = [];

        // Obtiene el espaciado de la configuración
        const spacing = this.config.gridDensity;

        // Calcula cuántas columnas y filas necesitamos
        // (+2 para cubrir los bordes de la pantalla)
        const cols = Math.ceil(this.canvas.width / spacing) + 2;
        const rows = Math.ceil(this.canvas.height / spacing) + 2;

        // Crea cada nodo de la cuadrícula
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                // Cada nodo tiene:
                this.nodes.push({
                    baseX: i * spacing,  // Posición X original (fija)
                    baseY: j * spacing,  // Posición Y original (fija)
                    x: i * spacing,      // Posición X actual (animada)
                    y: j * spacing,      // Posición Y actual (animada)
                    col: i,              // Índice de columna
                    row: j               // Índice de fila
                });
            }
        }

        // Guarda las dimensiones de la cuadrícula
        this.cols = cols;
        this.rows = rows;
    }

    // ============================================
    // MÉTODO: setupEventListeners
    // ============================================
    // Configura todos los eventos de interacción del usuario
    setupEventListeners() {

        // ---- EVENTO: Redimensionar ventana ----
        // Cuando cambia el tamaño de la ventana, recrea la red
        window.addEventListener('resize', () => {
            this.resize();
            this.createGrid();
        });

        // Permite que el canvas reciba eventos de mouse
        this.canvas.style.pointerEvents = 'auto';

        // ---- EVENTO: Movimiento del mouse ----
        // Actualiza la posición del mouse para la interacción
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;  // Posición X del mouse
            this.mouse.y = e.clientY;  // Posición Y del mouse
        });

        // ---- EVENTO: Mouse sale de la ventana ----
        // Resetea la posición cuando el mouse sale
        document.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        // ---- EVENTO: Touch en dispositivos móviles ----
        // Soporte táctil para tablets y celulares
        document.addEventListener('touchmove', (e) => {
            // Obtiene la posición del primer dedo
            this.mouse.x = e.touches[0].clientX;
            this.mouse.y = e.touches[0].clientY;
        }, { passive: true });  // passive: true mejora el rendimiento

        // ---- EVENTO: Fin del touch ----
        document.addEventListener('touchend', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    // ============================================
    // MÉTODO: setupControls
    // ============================================
    // Configura el panel de edición y sus controles
    setupControls() {
        // ---- REFERENCIAS A ELEMENTOS DEL DOM ----
        const resetBtn = document.getElementById('resetBtn');     // #resetBtn - Botón "Restablecer"

        // Nota: La apertura/cierre del panel ahora se maneja
        // centralizadamente desde la lógica del Dock en index.html

        // ---- CONTROL: interactionType (Tipo de interacción) ----
        // <select> para cambiar cómo responde la red al mouse
        document.getElementById('interactionType').addEventListener('change', (e) => {
            this.config.interactionType = e.target.value;
        });

        // ---- CONTROL: gridDensity (Densidad de malla) ----
        // <input range> para ajustar el espaciado entre nodos
        const gridDensity = document.getElementById('gridDensity');           // #gridDensity - Slider
        const gridDensityValue = document.getElementById('gridDensityValue'); // #gridDensityValue - Label valor
        gridDensity.addEventListener('input', (e) => {
            this.config.gridDensity = Number.parseInt(e.target.value, 10);
            gridDensityValue.textContent = e.target.value;
            this.createGrid();
        });

        // ---- CONTROL: interactionRadius (Radio de interacción) ----
        // <input range> para ajustar el área de efecto del mouse
        const interactionRadius = document.getElementById('interactionRadius');           // #interactionRadius - Slider
        const interactionRadiusValue = document.getElementById('interactionRadiusValue'); // #interactionRadiusValue - Label
        interactionRadius.addEventListener('input', (e) => {
            this.config.interactionRadius = Number.parseInt(e.target.value, 10);
            interactionRadiusValue.textContent = e.target.value;
        });

        // ---- CONTROL: lineColor (Color de la red) ----
        // <input color> para líneas y nodos
        document.getElementById('lineColor').addEventListener('input', (e) => {
            this.config.lineColor = e.target.value;
            this.updateCSSVariables();
        });

        // ---- CONTROL: glowColor (Color de iluminación) ----
        // <input color> para efectos de brillo
        document.getElementById('glowColor').addEventListener('input', (e) => {
            this.config.glowColor = e.target.value;
            this.updateCSSVariables();
        });

        // ---- BOTÓN: resetBtn (Restablecer) ----
        // Restaura todos los valores a defaultConfig
        resetBtn.addEventListener('click', () => {
            this.config = { ...this.defaultConfig };
            this.updateControlsUI();
            this.updateCSSVariables();
            this.createGrid();
        });

        // ---- BOTÓN: saveBtn (Guardar) ----
        // Guarda this.config en config.json vía servidor (POST /api/save-config)
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.addEventListener('click', async () => {
            // Guardar texto original del botón
            const originalText = saveBtn.innerHTML;

            // Mostrar estado "Guardando..."
            saveBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                </svg>
                Guardando...
            `;

            // Intentar guardar (async)
            const success = await this.saveConfig();

            if (success) {
                // Mostrar "¡Guardado!" con check
                saveBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    ¡Guardado!
                `;
                saveBtn.classList.add('saved');
            } else {
                // Mostrar error
                saveBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Error
                `;
            }

            // Restaurar botón después de 2 segundos
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.classList.remove('saved');
            }, 2000);
        });

        // ---- BOTÓN: exportBtn (Exportar) ----
        // Descarga this.config como archivo JSON
        const exportBtn = document.getElementById('exportBtn');
        exportBtn.addEventListener('click', () => {
            this.exportConfig();
        });

        // ---- BOTÓN: importBtn + importFile (Importar) ----
        // Abre selector de archivo y aplica la configuración visualmente
        const importBtn = document.getElementById('importBtn');   // #importBtn - Botón visible
        const importFile = document.getElementById('importFile'); // #importFile - Input oculto

        // Al hacer clic en "Importar", activa el input oculto
        importBtn.addEventListener('click', () => {
            importFile.click();
        });

        // Cuando el usuario selecciona un archivo
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importConfig(file);
                // Limpiar el input para poder importar el mismo archivo otra vez
                importFile.value = '';
            }
        });
    }

    // ============================================
    // MÉTODO: updateCSSVariables
    // ============================================
    // Sincroniza los colores del canvas con las variables CSS
    // Esto hace que los colores de la red afecten a toda la UI
    updateCSSVariables() {
        // Actualiza las variables CSS del documento
        // Estas variables controlan los colores de botones, tarjetas, etc.
        document.documentElement.style.setProperty('--primary', this.config.lineColor);
        document.documentElement.style.setProperty('--secondary', this.config.glowColor);
        document.documentElement.style.setProperty('--glow-color', this.hexToRgba(this.config.glowColor, 0.6));
        document.documentElement.style.setProperty('--primary-glow', this.hexToRgba(this.config.lineColor, 0.4));
        document.documentElement.style.setProperty('--border-hover', this.hexToRgba(this.config.lineColor, 0.5));
    }

    // ============================================
    // MÉTODO: updateControlsUI
    // ============================================
    // Actualiza los valores mostrados en el panel de control
    // Se usa al restablecer la configuración
    updateControlsUI() {
        // Actualiza cada control con su valor actual de la configuración
        document.getElementById('interactionType').value = this.config.interactionType;
        document.getElementById('gridDensity').value = this.config.gridDensity;
        document.getElementById('gridDensityValue').textContent = this.config.gridDensity;
        document.getElementById('interactionRadius').value = this.config.interactionRadius;
        document.getElementById('interactionRadiusValue').textContent = this.config.interactionRadius;
        document.getElementById('lineColor').value = this.config.lineColor;
        document.getElementById('glowColor').value = this.config.glowColor;
    }

    // ============================================
    // MÉTODO: animate
    // ============================================
    // Bucle principal de animación
    // Se ejecuta ~60 veces por segundo
    animate() {
        // Incrementa el tiempo para animaciones suaves
        this.time += 0.01;

        // Limpia el canvas completo para el nuevo frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // ---- PASO 1: Actualizar posiciones ----
        // Calcula la nueva posición de cada nodo
        this.nodes.forEach(node => {
            this.updateNode(node);
        });

        // ---- PASO 2: Dibujar conexiones ----
        // Dibuja las líneas entre nodos conectados
        this.drawConnections();

        // ---- PASO 3: Dibujar nodos ----
        // Dibuja los puntos de cada nodo
        this.drawNodes();

        // ---- PASO 4: Solicitar siguiente frame ----
        // requestAnimationFrame optimiza el rendimiento
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // ============================================
    // MÉTODO: updateNode
    // ============================================
    // Calcula la nueva posición de un nodo individual
    // Aplica efectos de flotación y respuesta al mouse
    updateNode(node) {
        // ---- ANIMACIÓN DE FLOTACIÓN ----
        // Los nodos flotan suavemente usando funciones sen/cos
        // Esto crea un efecto orgánico incluso sin interacción
        let targetX = node.baseX + Math.sin(this.time + node.col * 0.3) * 3;
        let targetY = node.baseY + Math.cos(this.time + node.row * 0.3) * 3;

        // ---- INTERACCIÓN CON EL MOUSE ----
        // Solo se aplica si el mouse está en la ventana
        if (this.mouse.x !== null && this.mouse.y !== null) {
            // Calcula la distancia del nodo al mouse
            const dx = node.baseX - this.mouse.x;  // Distancia X
            const dy = node.baseY - this.mouse.y;  // Distancia Y
            const distance = Math.hypot(dx, dy);  // Distancia total (Pitágoras)

            // Solo afecta a nodos dentro del radio de interacción
            if (distance < this.config.interactionRadius) {
                // Calcula la fuerza del efecto (más fuerte cuando más cerca)
                // 0 = en el borde del radio, 1 = justo en el mouse
                const force = (this.config.interactionRadius - distance) / this.config.interactionRadius;

                // Calcula el ángulo desde el mouse hacia el nodo
                const angle = Math.atan2(dy, dx);

                // Aplica el efecto según el tipo de interacción seleccionado
                switch (this.config.interactionType) {

                    case 'repel':
                        // REPELER: Los nodos se alejan del mouse
                        // cos/sin del ángulo * fuerza * intensidad
                        targetX = node.baseX + Math.cos(angle) * force * 40;
                        targetY = node.baseY + Math.sin(angle) * force * 40;
                        break;

                    case 'attract':
                        // ATRAER: Los nodos se acercan al mouse
                        // Signo negativo invierte la dirección
                        targetX = node.baseX - Math.cos(angle) * force * 30;
                        targetY = node.baseY - Math.sin(angle) * force * 30;
                        break;

                    case 'wave':
                        // ONDA: Los nodos crean un patrón ondulante
                        // Usa la distancia para crear ondas concéntricas
                        {
                            const wave = Math.sin(distance * 0.05 - this.time * 3) * force * 25;
                            targetX = node.baseX + Math.cos(angle) * wave;
                            targetY = node.baseY + Math.sin(angle) * wave;
                            break;
                        }

                    case 'glow':
                        // ILUMINAR: No mueve los nodos
                        // Solo afecta el renderizado (brillo)
                        break;
                }
            }
        }

        // ---- INTERPOLACIÓN SUAVE ----
        // Mueve el nodo gradualmente hacia su posición objetivo
        // 0.1 = 10% del camino por frame (transición suave)
        node.x += (targetX - node.x) * 0.1;
        node.y += (targetY - node.y) * 0.1;
    }

    // ============================================
    // MÉTODO: drawConnections
    // ============================================
    // Dibuja las líneas que conectan los nodos
    // Crea el efecto visual de "malla" o "red"
    drawConnections() {
        // Recorre todos los nodos
        this.nodes.forEach((node, index) => {

            // ---- CONEXIÓN HORIZONTAL ----
            // Conecta cada nodo con su vecino de la derecha
            if (node.col < this.cols - 1) {
                // El índice del vecino derecho está a 'rows' posiciones
                const rightIndex = index + this.rows;
                if (rightIndex < this.nodes.length) {
                    this.drawLine(node, this.nodes[rightIndex]);
                }
            }

            // ---- CONEXIÓN VERTICAL ----
            // Conecta cada nodo con su vecino de abajo
            if (node.row < this.rows - 1) {
                const bottomIndex = index + 1;
                // Verifica que sea la misma columna
                if (bottomIndex < this.nodes.length && this.nodes[bottomIndex].col === node.col) {
                    this.drawLine(node, this.nodes[bottomIndex]);
                }
            }

            // ---- CONEXIÓN DIAGONAL ----
            // Conecta cada nodo con su vecino diagonal inferior-derecho
            // Esto da un aspecto más "malla" a la red
            if (node.col < this.cols - 1 && node.row < this.rows - 1) {
                const diagIndex = index + this.rows + 1;
                if (diagIndex < this.nodes.length) {
                    // Las diagonales tienen menos opacidad (0.3)
                    this.drawLine(node, this.nodes[diagIndex], 0.3);
                }
            }
        });
    }

    // ============================================
    // MÉTODO: drawLine
    // ============================================
    // Dibuja una línea individual entre dos nodos
    // Aplica efectos de brillo cuando está cerca del mouse
    drawLine(node1, node2, baseOpacity = 0.5) {
        // Valores iniciales de la línea
        let opacity = baseOpacity;  // Transparencia
        let lineWidth = 1;          // Grosor

        // ---- EFECTO DE PROXIMIDAD AL MOUSE ----
        // Las líneas cerca del mouse brillan más
        if (this.mouse.x !== null && this.mouse.y !== null) {
            // Calcula el punto medio de la línea
            const midX = (node1.x + node2.x) / 2;
            const midY = (node1.y + node2.y) / 2;

            // Distancia del punto medio al mouse
            const dx = midX - this.mouse.x;
            const dy = midY - this.mouse.y;
            const distance = Math.hypot(dx, dy);

            // Si está dentro del radio de interacción
            if (distance < this.config.interactionRadius) {
                // Calcula la proximidad (0-1)
                const proximity = 1 - (distance / this.config.interactionRadius);

                // Aumenta opacidad y grosor según proximidad
                opacity = baseOpacity + proximity * 0.5;
                lineWidth = 1 + proximity * 1.5;

                // En modo "glow", el efecto es más pronunciado
                if (this.config.interactionType === 'glow') {
                    opacity = baseOpacity + proximity * 0.8;
                    lineWidth = 1 + proximity * 2;
                }
            }
        }

        // ---- DIBUJAR LA LÍNEA ----
        this.ctx.beginPath();  // Inicia un nuevo trazo
        this.ctx.strokeStyle = this.hexToRgba(this.config.lineColor, opacity);  // Color con transparencia
        this.ctx.lineWidth = lineWidth;  // Grosor de línea
        this.ctx.moveTo(node1.x, node1.y);  // Punto inicial
        this.ctx.lineTo(node2.x, node2.y);  // Punto final
        this.ctx.stroke();  // Aplica el trazo
    }

    // ============================================
    // MÉTODO: drawNodes
    // ============================================
    // Dibuja los puntos (nodos) de la red
    // Aplica efectos de brillo cerca del mouse
    drawNodes() {
        // Recorre todos los nodos
        this.nodes.forEach(node => {
            // Tamaño base del punto
            let size = 2;
            // Tamaño del efecto de brillo (0 = sin brillo)
            let glowSize = 0;

            // ---- EFECTO DE PROXIMIDAD AL MOUSE ----
            if (this.mouse.x !== null && this.mouse.y !== null) {
                // Calcula distancia del nodo al mouse
                const dx = node.x - this.mouse.x;
                const dy = node.y - this.mouse.y;
                const distance = Math.hypot(dx, dy);

                // Si está dentro del radio de interacción
                if (distance < this.config.interactionRadius) {
                    // Calcula proximidad (0-1)
                    const proximity = 1 - (distance / this.config.interactionRadius);

                    // Aumenta tamaño del nodo según proximidad
                    size = 2 + proximity * 3;

                    // Tamaño del halo de brillo
                    glowSize = proximity * 15;
                }
            }

            // ---- DIBUJAR EFECTO DE BRILLO (GLOW) ----
            // Solo si hay brillo que dibujar
            if (glowSize > 0) {
                // Crea un gradiente radial para el brillo
                const gradient = this.ctx.createRadialGradient(
                    node.x, node.y, 0,           // Centro del gradiente (radio 0)
                    node.x, node.y, glowSize     // Borde del gradiente
                );
                // Color sólido en el centro
                gradient.addColorStop(0, this.hexToRgba(this.config.glowColor, 0.6));
                // Transparente en el borde
                gradient.addColorStop(1, 'transparent');

                // Dibuja el círculo de brillo
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }

            // ---- DIBUJAR EL NODO ----
            this.ctx.beginPath();
            // Dibuja un círculo
            this.ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.config.lineColor;  // Color sólido
            this.ctx.fill();  // Rellena el círculo
        });
    }

    // ============================================
    // MÉTODO: hexToRgba
    // ============================================
    // Convierte un color hexadecimal (#RRGGBB) a formato RGBA
    // Esto permite agregar transparencia a cualquier color
    hexToRgba(hex, alpha) {
        // Extrae los componentes RGB del color hexadecimal
        const r = Number.parseInt(hex.slice(1, 3), 16);  // Rojo (posiciones 1-2)
        const g = Number.parseInt(hex.slice(3, 5), 16);  // Verde (posiciones 3-4)
        const b = Number.parseInt(hex.slice(5, 7), 16);  // Azul (posiciones 5-6)

        // Retorna el color en formato rgba con la transparencia especificada
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
// Espera a que el DOM esté completamente cargado
// antes de crear la instancia de NetworkMesh
document.addEventListener('DOMContentLoaded', async () => {
    // Crea la animación de la red usando el factory method
    const networkMesh = await NetworkMesh.create();
    // Exponer la instancia globalmente (opcional, para debugging)
    globalThis.networkMesh = networkMesh;
});
