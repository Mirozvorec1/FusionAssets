const ENABLED_STORAGE_KEY = 'fusionassets_debug_mode';
const ENABLED = localStorage.getItem(ENABLED_STORAGE_KEY) === 'true';

function createTagChip(container, text) {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.textContent = text;
    const removeBtn = document.createElement('span');
    removeBtn.className = 'tag-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chip.remove();
    });
    chip.appendChild(removeBtn);
    container.insertBefore(chip, container.querySelector('.tags-input'));
}

function getTagsFromContainer(container) {
    const chips = container.querySelectorAll('.tag-chip');
    return Array.from(chips).map(chip => {
        const removeBtn = chip.querySelector('.tag-remove');
        return chip.textContent.replace(removeBtn.textContent, '').trim();
    }).filter(t => t);
}

function setTagsInContainer(container, tags) {
    const chips = container.querySelectorAll('.tag-chip');
    chips.forEach(chip => chip.remove());
    for (const tag of tags) {
        createTagChip(container, tag);
    }
}

function handleTagInput(e, container) {
    const value = e.target.value;
    const parts = value.split(/[ ,;]+/).filter(t => t.trim());
    if (parts.length > 0) {
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed) createTagChip(container, trimmed);
        }
        e.target.value = '';
    }
}

function initTagsContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const input = container.querySelector('.tags-input');
    if (!input) return;

    container.addEventListener('click', () => input.focus());

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTagInput(e, container);
        }
    });

    input.addEventListener('input', (e) => {
        const value = e.target.value;
        if (/[ ,;]/.test(value)) {
            handleTagInput(e, container);
        }
    });
}

const filePathMap = {
    'assets_other.js': 'data/assets/other/',
    'assets_plants.js': 'data/assets/plants/',
    'assets_ui.js': 'data/assets/ui/',
    'assets_zombies.js': 'data/assets/zombies/',
    'assets_other': 'data/assets/other/',
    'assets_plants': 'data/assets/plants/',
    'assets_ui': 'data/assets/ui/',
    'assets_zombies': 'data/assets/zombies/'
};

function getBasePathForKey(key) {
    return filePathMap[key] || 'data/assets/other/';
}

const addBtn = document.getElementById('add-btn');
const exportBtn = document.getElementById('export-btn');
const editBtn = document.getElementById('edit-btn');
const bulkBtn = document.getElementById('bulk-btn');
const modal = document.getElementById('add-modal');
const exportModal = document.getElementById('export-modal');
const editModal = document.getElementById('edit-modal');
const bulkInput = document.getElementById('file-path-input');

if (addBtn) addBtn.style.display = ENABLED ? 'flex' : 'none';
if (exportBtn) exportBtn.style.display = ENABLED ? 'flex' : 'none';
if (editBtn) editBtn.style.display = ENABLED ? 'flex' : 'none';
if (bulkBtn) bulkBtn.style.display = ENABLED ? 'flex' : 'none';

let editMode = false;
window.editMode = false;
let selectedCard = null;
let selectedAsset = null;
let deletedPaths = [];
let lastClickCard = null;
let lastClickTime = 0;

if (ENABLED) {
    initTagsContainer('asset-tags-container');
    initTagsContainer('edit-tags-container');

    addBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    exportBtn.addEventListener('click', () => {
        exportModal.style.display = 'flex';
    });

    exportModal.addEventListener('click', (e) => {
        if (e.target === exportModal) {
            exportModal.style.display = 'none';
        }
    });

    editBtn.addEventListener('click', () => {
        editMode = !editMode;
        window.editMode = editMode;
        editBtn.classList.toggle('active', editMode);
        document.querySelectorAll('.asset-card').forEach(card => {
            const icon = card.querySelector('.card-edit-btn');
            if (icon) icon.style.display = editMode ? 'flex' : 'none';
        });
    });

    function detectCategory(path) {
        const lower = path.toLowerCase();
        if (lower.includes('plants') || lower.includes('plant')) return 'assets_plants.js';
        if (lower.includes('ui') || lower.includes('userinterface')) return 'assets_ui.js';
        if (lower.includes('zombie')) return 'assets_zombies.js';
        return 'assets_other.js';
    }

    const bulkFileInput = document.createElement('input');
    bulkFileInput.type = 'file';
    bulkFileInput.accept = '.png';
    bulkFileInput.webkitdirectory = true;
    bulkFileInput.style.display = 'none';
    document.body.appendChild(bulkFileInput);

    bulkBtn.addEventListener('click', () => {
        bulkFileInput.click();
    });

    bulkFileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        const pngFiles = files.filter(f => f.name.toLowerCase().endsWith('.png'));
        if (pngFiles.length === 0) {
            alert('PNG файлы не найдены');
            return;
        }

        let added = 0;
        const container = document.getElementById('assets-container');

        for (const file of pngFiles) {
            const relativePath = file.webkitRelativePath || file.name;
            const name = file.name.replace(/\.png$/i, '');
            const fileSelect = detectCategory(relativePath);
            const basePath = getBasePathForKey(fileSelect);
            const path = `${basePath}${file.name}`;

            if (window.assets.some(a => a.path === path)) continue;

            const newAsset = { name, path, tags: [] };
            window.assets.push(newAsset);

            if (container) {
                container.appendChild(createAssetCard(newAsset));
            }
            added++;
        }

        alert(`Добавлено ассетов: ${added}${pngFiles.length - added > 0 ? `\nПропущено (уже есть): ${pngFiles.length - added}` : ''}`);
    });

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.asset-card');
        if (editMode && card && !e.target.closest('.download-btn')) {
            const now = Date.now();
            if (card === lastClickCard && now - lastClickTime < 350) {
                openEditModal(card);
            }
            lastClickCard = card;
            lastClickTime = now;
        }
    });

    function openEditModal(card) {
        selectedCard = card;
        const assetPath = card.dataset.path;
        selectedAsset = null;
        if (assetPath) {
            selectedAsset = window.assets.find(a => a.path === assetPath) || null;
        }

        let currentFile = 'assets_other';

        if (assetPath.includes('/plants/')) currentFile = 'assets_plants';
        else if (assetPath.includes('/ui/')) currentFile = 'assets_ui';
        else if (assetPath.includes('/other/')) currentFile = 'assets_other';
        else if (assetPath.includes('/zombies/')) currentFile = 'assets_zombies';

        document.getElementById('edit-name').value = selectedAsset?.name || '';
        setTagsInContainer(document.getElementById('edit-tags-container'), selectedAsset ? selectedAsset.tags : []);
        document.getElementById('edit-file-select').value = currentFile;
        const editPreview = document.getElementById('edit-preview');
        editPreview.innerHTML = '';
        const cardImg = card.querySelector('img');
        if (cardImg) {
            const previewImg = document.createElement('img');
            previewImg.src = cardImg.src;
            previewImg.style.maxWidth = '100%';
            previewImg.style.maxHeight = '100px';
            previewImg.style.objectFit = 'contain';
            editPreview.appendChild(previewImg);
        }

        const fileSelect = document.getElementById('edit-file-select');
        fileSelect.onchange = () => {
            if (selectedAsset) {
                const basePath = filePathMap[fileSelect.value] || 'data/assets/other/';
                const fileName = selectedAsset.path.split('/').pop();
                selectedAsset.path = `${basePath}${fileName}`;
            }
        };

        if (updateNameBtn) updateNameBtn.style.display = 'none';
        editDroppedFileName = '';
        editModal.style.display = 'flex';
    }

    const editPreview = document.getElementById('edit-preview');
    const updateNameBtn = document.getElementById('update-name-btn');
    let editDroppedFileName = '';

    editPreview.ondragover = (e) => {
        e.preventDefault();
        editPreview.classList.add('drag-over');
    };
    editPreview.ondragleave = () => {
        editPreview.classList.remove('drag-over');
    };
    editPreview.ondrop = (e) => {
        e.preventDefault();
        editPreview.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.png')) {
            editDroppedFileName = file.name.replace(/\.png$/i, '');
            if (selectedAsset) {
                const basePath = selectedAsset.path.substring(0, selectedAsset.path.lastIndexOf('/') + 1);
                selectedAsset.path = `${basePath}${file.name}`;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                editPreview.innerHTML = '';
                const previewImg = document.createElement('img');
                previewImg.src = ev.target.result;
                previewImg.style.maxWidth = '100%';
                previewImg.style.maxHeight = '100px';
                previewImg.style.objectFit = 'contain';
                editPreview.appendChild(previewImg);
                if (selectedCard) {
                    const imgEl = selectedCard.querySelector('img');
                    if (imgEl) imgEl.src = ev.target.result;
                }
                const nameInput = document.getElementById('edit-name');
                if (updateNameBtn && nameInput && editDroppedFileName !== nameInput.value) {
                    updateNameBtn.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    };

    if (updateNameBtn) {
        updateNameBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('edit-name');
            if (nameInput && editDroppedFileName) {
                nameInput.value = editDroppedFileName;
                updateNameBtn.style.display = 'none';
            }
        });
    }

    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
            selectedCard = null;
            selectedAsset = null;
            editDroppedFileName = '';
            if (updateNameBtn) updateNameBtn.style.display = 'none';
            setTagsInContainer(document.getElementById('edit-tags-container'), []);
        }
    });

    document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
            if (editModal.style.display === 'flex') {
                editModal.style.display = 'none';
                selectedCard = null;
                selectedAsset = null;
                editDroppedFileName = '';
                if (updateNameBtn) updateNameBtn.style.display = 'none';
                setTagsInContainer(document.getElementById('edit-tags-container'), []);
            } else if (exportModal.style.display === 'flex') {
                exportModal.style.display = 'none';
            } else if (modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        }
    });

    const saveEditBtn = document.getElementById('save-edit-btn');
    const deleteBtn = document.getElementById('delete-asset-btn');

    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', () => {
            const name = document.getElementById('edit-name').value;
            const tags = getTagsFromContainer(document.getElementById('edit-tags-container'));
            const fileSelect = document.getElementById('edit-file-select').value;

            if (selectedAsset) {
                selectedAsset.name = name;
                selectedAsset.tags = tags;
                const basePath = filePathMap[fileSelect] || 'data/assets/other/';
                const fileName = selectedAsset.path.split('/').pop();
                selectedAsset.path = `${basePath}${fileName}`;
                selectedCard.querySelector('.asset-name').textContent = name;
                const imgEl = selectedCard.querySelector('img');
                if (imgEl) {
                    if (!imgEl.src.startsWith('data:')) {
                        imgEl.src = selectedAsset.path;
                    }
                    imgEl.alt = name;
                }
            }
            editModal.style.display = 'none';
            selectedCard = null;
            selectedAsset = null;
            editDroppedFileName = '';
            if (updateNameBtn) updateNameBtn.style.display = 'none';
            setTagsInContainer(document.getElementById('edit-tags-container'), []);
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (!selectedAsset) return;
            if (!confirm(`Удалить ассет "${selectedAsset.name}"?`)) return;
            deletedPaths.push(selectedAsset.path);
            const idx = window.assets.indexOf(selectedAsset);
            if (idx !== -1) window.assets.splice(idx, 1);
            if (selectedCard) selectedCard.remove();
            editModal.style.display = 'none';
            selectedCard = null;
            selectedAsset = null;
            editDroppedFileName = '';
            if (updateNameBtn) updateNameBtn.style.display = 'none';
            setTagsInContainer(document.getElementById('edit-tags-container'), []);
        });
    }

    const doExportBtn = document.getElementById('do-export-btn');
    if (doExportBtn) {
        doExportBtn.addEventListener('click', () => {
            const select = document.getElementById('export-file-select');
            const varName = select.value;
            let data;

            switch (varName) {
                case 'assets_other': data = [...assetsData]; break;
                case 'assets_plants': data = [...assetsPlants]; break;
                case 'assets_ui': data = [...assetsUI]; break;
                case 'assets_zombies': data = [...assetsZombies]; break;
            }

            const basePath = getBasePathForKey(varName);
            const newAssets = window.assets.filter(a => a.path.startsWith(basePath) && !data.some(d => d.path === a.path));

            const filteredDeletedPaths = deletedPaths.filter(p => p.startsWith(basePath));
            deletedPaths = deletedPaths.filter(p => !p.startsWith(basePath));

            if (data || newAssets.length > 0) {
                data = [...data, ...newAssets];
                data = data.filter(a => !filteredDeletedPaths.includes(a.path));
                const content = `const ${varName} = ${JSON.stringify(data, null, 2)};`;
                const blob = new Blob([content], { type: 'text/javascript' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${varName}.js`;
                a.click();
                URL.revokeObjectURL(url);
                exportModal.style.display = 'none';
            }
        });
    }

    const dropZone = document.getElementById('drop-zone');
    const pathInput = document.getElementById('file-path-input');
    let currentFile = null;
    let currentPath = '';

    if (dropZone && pathInput) {
        dropZone.addEventListener('click', () => pathInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        function showDropZonePreview(src, pathText) {
            dropZone.innerHTML = '';
            const img = document.createElement('img');
            img.src = src;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100px';
            img.style.objectFit = 'contain';
            const div = document.createElement('div');
            div.style.marginTop = '10px';
            div.style.color = '#888';
            div.style.fontSize = '12px';
            div.textContent = pathText;
            dropZone.appendChild(img);
            dropZone.appendChild(div);
        }

        function resetDropZone() {
            dropZone.innerHTML = '';
            const span = document.createElement('span');
            span.textContent = 'Перетащите PNG сюда или нажмите';
            dropZone.appendChild(span);
        }

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.png')) {
                currentFile = file;
                const nameInput = document.getElementById('asset-name');
                if (nameInput) nameInput.value = file.name;
                const fileSelect = document.getElementById('data-file-select')?.value || 'assets_plants.js';
                const basePath = getBasePathForKey(fileSelect);
                currentPath = `${basePath}${file.name}`;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    showDropZonePreview(ev.target.result, currentPath);
                };
                reader.readAsDataURL(file);
            }
        });

        pathInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.name.endsWith('.png')) {
                currentFile = file;
                const nameInput = document.getElementById('asset-name');
                if (nameInput) nameInput.value = file.name;
                const fileSelect = document.getElementById('data-file-select')?.value || 'assets_plants.js';
                const basePath = getBasePathForKey(fileSelect);
                currentPath = `${basePath}${file.name}`;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    showDropZonePreview(ev.target.result, currentPath);
                };
                reader.readAsDataURL(file);
            }
        });

        const fileSelect = document.getElementById('data-file-select');
        if (fileSelect) {
            fileSelect.addEventListener('change', () => {
                if (currentFile) {
                    const basePath = getBasePathForKey(fileSelect.value);
                    currentPath = `${basePath}${currentFile.name}`;
                    const img = dropZone.querySelector('img');
                    if (img) {
                        const src = img.src;
                        showDropZonePreview(src, currentPath);
                    }
                }
            });
        }

        const saveBtn = document.getElementById('save-asset-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const name = document.getElementById('asset-name')?.value;
                const tags = getTagsFromContainer(document.getElementById('asset-tags-container'));
                const fileSelect = document.getElementById('data-file-select')?.value;

                if (!name) {
                    alert('Введите название');
                    return;
                }

                const path = currentPath || `data/assets/plants/${name}.png`;

                const newAsset = {
                    name: name.replace(/\.png$/i, ''),
                    path: path,
                    tags: tags
                };

                window.assets.push(newAsset);

                const container = document.getElementById('assets-container');
                if (container) {
                    container.appendChild(createAssetCard(newAsset));
                }

                modal.style.display = 'none';

                document.getElementById('asset-name').value = '';
                setTagsInContainer(document.getElementById('asset-tags-container'), []);
                resetDropZone();
                currentFile = null;
                currentPath = '';
            });
        }
    }
}