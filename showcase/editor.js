document.addEventListener('DOMContentLoaded', () => {
    const sectionsList = document.getElementById('sectionsList');
    const saveBtn = document.getElementById('saveBtn');
    const previewFrame = document.getElementById('previewFrame');
    const fileInput = document.getElementById('fileInput');

    let content = {};
    let currentUploadCallback = null;

    // Load content
    async function loadContent() {
        try {
            const res = await fetch('../content.json');
            content = await res.json();
            renderSidebar();
        } catch (e) {
            console.error('Error loading content', e);
        }
    }

    // Update Preview
    function updatePreview() {
        if (previewFrame.contentWindow) {
            previewFrame.contentWindow.postMessage({
                type: 'update-content',
                content: content
            }, '*');
        }
    }

    // Save Content
    async function saveContent() {
        try {
            const res = await fetch('/api/save-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(content, null, 4)
            });
            const data = await res.json();
            if (data.success) {
                alert('¡Guardado exitosamente!');
            } else {
                alert('Error al guardar: ' + data.message);
            }
        } catch (e) {
            alert('Error de red al guardar');
        }
    }

    // Image Upload Logic
    fileInput.addEventListener('change', async (e) => {
        if (!e.target.files.length) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                // Ensure path is absolute from root
                const imageUrl = data.url.startsWith('/') ? data.url : '/' + data.url;
                if (currentUploadCallback) currentUploadCallback(imageUrl);
                updatePreview();
                renderSidebar(); // Re-render to show new image
            } else {
                alert('Error subiendo imagen: ' + data.message);
            }
        } catch (err) {
            alert('Error subiendo imagen');
        }
        fileInput.value = ''; // Reset
    });

    function triggerUpload(callback) {
        currentUploadCallback = callback;
        fileInput.click();
    }

    // Render Sidebar
    function renderSidebar() {
        // Save scroll position
        const scrollPos = sectionsList.scrollTop;
        sectionsList.innerHTML = '';

        // Sections to edit
        const editableSections = ['branding', 'styles', 'hero', 'services', 'benefits', 'team', 'about', 'contact'];

        editableSections.forEach(key => {
            // Ensure branding exists if selected
            if (key === 'branding' && !content.branding) {
                content.branding = { position: 'fixed', behavior: 'shrink', size: 40 };
            }
            if (key === 'styles' && !content.styles) {
                content.styles = { primary: '#f59e0b', secondary: '#fbbf24', bgDark: '#1e1e2e' };
            }

            if (!content[key]) return;
            const section = content[key];

            const sectionEl = document.createElement('div');
            sectionEl.className = 'section-item';

            // Header
            const header = document.createElement('div');
            header.className = 'section-header';
            header.innerHTML = `<span class="section-title">${section.title || key}</span> <span>▼</span>`;
            header.onclick = () => {
                sectionEl.classList.toggle('active');
            };

            // Body
            const body = document.createElement('div');
            body.className = 'section-body';

            // Config (Layout & Effects)
            // Ensure config object exists
            if (!section.config) section.config = {};

            const configRow = document.createElement('div');
            configRow.className = 'config-row';

            // Layout Selector
            const layoutGroup = createSelect('Layout', ['grid', 'carousel', 'list', 'featured'], section.config.layout || 'grid', (val) => {
                section.config.layout = val;
                updatePreview();
            });
            configRow.appendChild(layoutGroup);

            // Granular Effects (Only for sections with items)
            if (['services', 'benefits', 'team'].includes(key)) {
                // Interaction
                const interactGroup = createSelect('Interacción (Click)', ['none', 'expand', 'focus'], section.config.interaction || 'none', (val) => {
                    section.config.interaction = val;
                    updatePreview();
                });
                configRow.appendChild(interactGroup);

                // Hover
                const hoverGroup = createSelect('Reacción (Hover)', ['none', 'scale', 'lift', 'glow', 'border-flow'], section.config.hover || 'none', (val) => {
                    section.config.hover = val;
                    updatePreview();
                });
                configRow.appendChild(hoverGroup);

                // Border
                const borderGroup = createSelect('Estilo Borde', ['none', 'solid', 'neon', 'gradient'], section.config.border || 'none', (val) => {
                    section.config.border = val;
                    updatePreview();
                });
                configRow.appendChild(borderGroup);
            } else {
                // Legacy effect for others (if any)
                const effectGroup = createSelect('Efecto', ['none', 'glow', 'blur', 'slide'], section.config.cardEffect || 'none', (val) => {
                    section.config.cardEffect = val;
                    updatePreview();
                });
                configRow.appendChild(effectGroup);
            }

            // Branding Special Handling
            if (key === 'branding') {
                configRow.innerHTML = ''; // Clear default

                // Logo Upload
                const logoContainer = document.createElement('div');
                logoContainer.className = 'form-group';
                logoContainer.innerHTML = '<label>Logo de la Marca</label>';
                const imgPreview = document.createElement('div');
                imgPreview.className = 'image-preview';
                imgPreview.style.height = '60px';
                imgPreview.style.background = 'rgba(255,255,255,0.1)';

                if (section.logoUrl) {
                    imgPreview.innerHTML = `<img src="${section.logoUrl}" style="height:100%; object-fit:contain;">`;
                } else {
                    imgPreview.innerHTML = '<span>Subir Logo</span>';
                }

                imgPreview.onclick = () => {
                    triggerUpload((url) => {
                        section.logoUrl = url;
                        updatePreview();
                        renderSidebar();
                    });
                };
                logoContainer.appendChild(imgPreview);
                body.appendChild(logoContainer);

                // Position
                const posGroup = createSelect('Posición', ['fixed', 'absolute'], section.position || 'fixed', (val) => {
                    section.position = val;
                    updatePreview();
                });
                body.appendChild(posGroup);

                // Behavior
                const behGroup = createSelect('Comportamiento Scroll', ['shrink', 'none'], section.behavior || 'shrink', (val) => {
                    section.behavior = val;
                    updatePreview();
                });
                body.appendChild(behGroup);

                // Size Slider
                const sizeContainer = document.createElement('div');
                sizeContainer.className = 'form-group';
                sizeContainer.innerHTML = `<label>Tamaño Logo: <span id="logo-size-val">${section.size || 40}px</span></label>`;
                const slider = document.createElement('input');
                slider.type = 'range';
                slider.min = '20';
                slider.max = '120';
                slider.value = section.size || 40;
                slider.style.width = '100%';
                slider.oninput = (e) => {
                    section.size = e.target.value;
                    document.getElementById('logo-size-val').textContent = e.target.value + 'px';
                    updatePreview();
                };
                sizeContainer.appendChild(slider);
                body.appendChild(sizeContainer);

            }
            // Global Styles Handling
            else if (key === 'styles') {
                configRow.innerHTML = ''; // Clear default

                const createColorInput = (label, prop) => {
                    const div = document.createElement('div');
                    div.className = 'form-group';
                    div.innerHTML = `<label>${label}</label>`;
                    const input = document.createElement('input');
                    input.type = 'color';
                    input.className = 'form-control';
                    input.value = section[prop];
                    input.style.height = '40px';
                    input.oninput = (e) => {
                        section[prop] = e.target.value;
                        updatePreview();
                    };
                    div.appendChild(input);
                    return div;
                };

                body.appendChild(createColorInput('Color Primario', 'primary'));
                body.appendChild(createColorInput('Color Secundario', 'secondary'));
                body.appendChild(createColorInput('Fondo Oscuro', 'bgDark'));
            }
            else {
                body.appendChild(configRow);
            }

            // Special handling for 'About' section
            if (key === 'about') {
                const aboutContainer = document.createElement('div');
                aboutContainer.className = 'items-list';

                // Description
                aboutContainer.innerHTML += `
                    <div class="form-group">
                        <label>Descripción Principal</label>
                        <textarea class="form-control" rows="4" id="about-desc">${section.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Objetivo</label>
                        <textarea class="form-control" rows="2" id="about-obj">${section.objective || ''}</textarea>
                    </div>
                `;

                // Mission
                const missionCard = document.createElement('div');
                missionCard.className = 'item-card';
                missionCard.innerHTML = `
                    <h4 style="margin-bottom:10px; color:var(--text-muted)">Misión</h4>
                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" class="form-control" id="about-mission-title" value="${section.mission?.title || ''}">
                    </div>
                    <div class="form-group">
                        <label>Texto</label>
                        <textarea class="form-control" rows="3" id="about-mission-text">${section.mission?.text || ''}</textarea>
                    </div>
                `;
                aboutContainer.appendChild(missionCard);

                // Vision
                const visionCard = document.createElement('div');
                visionCard.className = 'item-card';
                visionCard.innerHTML = `
                    <h4 style="margin-bottom:10px; color:var(--text-muted)">Visión</h4>
                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" class="form-control" id="about-vision-title" value="${section.vision?.title || ''}">
                    </div>
                    <div class="form-group">
                        <label>Texto</label>
                        <textarea class="form-control" rows="3" id="about-vision-text">${section.vision?.text || ''}</textarea>
                    </div>
                `;
                aboutContainer.appendChild(visionCard);

                body.appendChild(aboutContainer);

                // Bind events after adding to DOM
                setTimeout(() => {
                    document.getElementById('about-desc').oninput = (e) => { section.description = e.target.value; updatePreview(); };
                    document.getElementById('about-obj').oninput = (e) => { section.objective = e.target.value; updatePreview(); };

                    document.getElementById('about-mission-title').oninput = (e) => {
                        if (!section.mission) section.mission = {};
                        section.mission.title = e.target.value;
                        updatePreview();
                    };
                    document.getElementById('about-mission-text').oninput = (e) => {
                        if (!section.mission) section.mission = {};
                        section.mission.text = e.target.value;
                        updatePreview();
                    };

                    document.getElementById('about-vision-title').oninput = (e) => {
                        if (!section.vision) section.vision = {};
                        section.vision.title = e.target.value;
                        updatePreview();
                    };
                    document.getElementById('about-vision-text').oninput = (e) => {
                        if (!section.vision) section.vision = {};
                        section.vision.text = e.target.value;
                        updatePreview();
                    };
                }, 0);
            }

            // Items List (if exists)
            else if (section.items && Array.isArray(section.items)) {
                const itemsContainer = document.createElement('div');
                itemsContainer.className = 'items-list';

                section.items.forEach((item, index) => {
                    const itemCard = document.createElement('div');
                    itemCard.className = 'item-card';

                    // Controls (Reorder & Delete)
                    const controls = document.createElement('div');
                    controls.style.display = 'flex';
                    controls.style.justifyContent = 'flex-end';
                    controls.style.gap = '8px';
                    controls.style.marginBottom = '10px';

                    // Up Button
                    if (index > 0) {
                        const upBtn = document.createElement('button');
                        upBtn.innerText = '↑';
                        upBtn.style.padding = '2px 8px';
                        upBtn.style.cursor = 'pointer';
                        upBtn.title = 'Mover arriba';
                        upBtn.onclick = () => {
                            [section.items[index], section.items[index-1]] = [section.items[index-1], section.items[index]];
                            updatePreview();
                            renderSidebar();
                        };
                        controls.appendChild(upBtn);
                    }

                    // Down Button
                    if (index < section.items.length - 1) {
                        const downBtn = document.createElement('button');
                        downBtn.innerText = '↓';
                        downBtn.style.padding = '2px 8px';
                        downBtn.style.cursor = 'pointer';
                        downBtn.title = 'Mover abajo';
                        downBtn.onclick = () => {
                            [section.items[index], section.items[index+1]] = [section.items[index+1], section.items[index]];
                            updatePreview();
                            renderSidebar();
                        };
                        controls.appendChild(downBtn);
                    }

                    // Delete Button
                    const deleteBtn = document.createElement('button');
                    deleteBtn.innerHTML = '🗑️';
                    deleteBtn.title = 'Eliminar elemento';
                    deleteBtn.style.padding = '2px 8px';
                    deleteBtn.style.cursor = 'pointer';
                    deleteBtn.style.color = '#ef4444';
                    deleteBtn.onclick = () => {
                        if (confirm('¿Eliminar este elemento?')) {
                            section.items.splice(index, 1);
                            updatePreview();
                            renderSidebar();
                        }
                    };
                    controls.appendChild(deleteBtn);
                    itemCard.appendChild(controls);

                    // Inputs Container
                    const inputsDiv = document.createElement('div');
                    inputsDiv.innerHTML = `
                        <div class="form-group">
                            <label>Título</label>
                            <input type="text" class="form-control item-title" value="${item.title || item.name || ''}">
                        </div>
                        <div class="form-group">
                            <label>Descripción / Rol</label>
                            <input type="text" class="form-control item-desc" value="${item.description || item.role || ''}">
                        </div>
                    `;
                    itemCard.appendChild(inputsDiv);

                    // Image Preview & Upload
                    if (item.image !== undefined) {
                         const imgPreview = document.createElement('div');
                         imgPreview.className = 'image-preview';
                         if (item.image) {
                             imgPreview.innerHTML = `<img src="${item.image}">`;
                         } else {
                             imgPreview.innerHTML = '<span>Subir Imagen</span>';
                         }
                         imgPreview.onclick = () => {
                             triggerUpload((url) => {
                                 item.image = url;
                             });
                         };
                         itemCard.appendChild(imgPreview);
                    }

                    // Bind inputs
                    const titleInput = itemCard.querySelector('.item-title');
                    titleInput.oninput = (e) => {
                        if (item.title !== undefined) item.title = e.target.value;
                        if (item.name !== undefined) item.name = e.target.value;
                        updatePreview();
                    };

                    const descInput = itemCard.querySelector('.item-desc');
                    descInput.oninput = (e) => {
                        if (item.description !== undefined) item.description = e.target.value;
                        if (item.role !== undefined) item.role = e.target.value;
                        updatePreview();
                    };

                    itemsContainer.appendChild(itemCard);
                });

                // Add Item Button
                const addBtn = document.createElement('button');
                addBtn.className = 'btn-add';
                addBtn.innerText = '+ Agregar Elemento';
                addBtn.onclick = () => {
                    const newItem = {};
                    if (key === 'team') {
                        newItem.name = 'Nuevo Miembro';
                        newItem.role = 'Rol';
                        newItem.image = '';
                    } else {
                        newItem.title = 'Nuevo Elemento';
                        newItem.description = 'Descripción';
                        newItem.icon = '✨';
                    }
                    section.items.push(newItem);
                    updatePreview();
                    renderSidebar();
                };

                body.appendChild(itemsContainer);
                body.appendChild(addBtn);
            }

            sectionEl.appendChild(header);
            sectionEl.appendChild(body);
            sectionsList.appendChild(sectionEl);
        });

        // Restore scroll
        sectionsList.scrollTop = scrollPos;
    }

    function createSelect(label, options, value, onChange) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `<label>${label}</label>`;
        const select = document.createElement('select');
        select.className = 'form-control';
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.text = opt.charAt(0).toUpperCase() + opt.slice(1);
            option.selected = opt === value;
            select.appendChild(option);
        });
        select.onchange = (e) => onChange(e.target.value);
        div.appendChild(select);
        return div;
    }

    saveBtn.onclick = saveContent;
    loadContent();
});
