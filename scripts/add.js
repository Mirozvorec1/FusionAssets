const ENABLED = true;

function parseTags(input) {
    return input.split(/[ ,;]+/).filter(t => t.trim());
}

const filePathMap = {
    'assets_other.js': 'data/assets/other/',
    'assets_plants.js': 'data/assets/plants/',
    'assets_ui.js': 'data/assets/ui/',
    'assets_zombie.js': 'data/assets/zombie/'
};

function getBasePath(path) {
    for (const [key, val] of Object.entries(filePathMap)) {
        if (path.startsWith(val)) return val;
    }
    return '';
}

const addBtn = document.getElementById('add-btn');
const exportBtn = document.getElementById('export-btn');
const editBtn = document.getElementById('edit-btn');
const modal = document.getElementById('add-modal');
const exportModal = document.getElementById('export-modal');
const editModal = document.getElementById('edit-modal');

if (addBtn) addBtn.style.display = ENABLED ? 'flex' : 'none';
if (exportBtn) exportBtn.style.display = ENABLED ? 'flex' : 'none';
if (editBtn) editBtn.style.display = ENABLED ? 'flex' : 'none';

let editMode = false;
let selectedCard = null;
let deletedPaths = [];

if (ENABLED) {
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
        editBtn.classList.toggle('active', editMode);
        document.querySelectorAll('.asset-card').forEach(card => {
            card.style.cursor = editMode ? 'pointer' : 'default';
        });
    });

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.asset-card');
        if (editMode && card && !e.target.closest('.download-btn')) {
            selectedCard = card;
            const name = card.querySelector('.asset-name')?.textContent || '';
            const img = card.querySelector('img')?.src || '';
            const asset = assets.find(a => a.name === name);

            let currentFile = 'assets_other.js';
            const path = asset?.path || '';

            if (path.includes('/plants/')) currentFile = 'assets_plants.js';
            else if (path.includes('/ui/')) currentFile = 'assets_ui.js';
            else if (path.includes('/other/')) currentFile = 'assets_other.js';
            else if (path.includes('/zombie/')) currentFile = 'assets_zombie.js';

            document.getElementById('edit-name').value = name;
            document.getElementById('edit-tags').value = asset ? asset.tags.join(' ') : '';
            document.getElementById('edit-file-select').value = currentFile;
            document.getElementById('edit-preview').innerHTML = img ? `<img src="${img}" style="max-width: 100%; max-height: 100px; object-fit: contain;">` : '';

            const fileSelect = document.getElementById('edit-file-select');
            fileSelect.onchange = () => {
                if (asset) {
                    const basePath = filePathMap[fileSelect.value] || 'data/assets/other/';
                    const fileName = asset.path.split('/').pop();
                    asset.path = `${basePath}${fileName}`;
                }
            };

            editModal.style.display = 'flex';
        }
    });

    const editPreview = document.getElementById('edit-preview');
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
            const reader = new FileReader();
            reader.onload = (ev) => {
                editPreview.innerHTML = `<img src="${ev.target.result}" style="max-width: 100%; max-height: 100px; object-fit: contain;">`;
                if (selectedCard) {
                    const imgEl = selectedCard.querySelector('img');
                    if (imgEl) imgEl.src = ev.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    };

    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    const saveEditBtn = document.getElementById('save-edit-btn');
    const deleteBtn = document.getElementById('delete-asset-btn');

    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', () => {
            const name = document.getElementById('edit-name').value;
            const tags = parseTags(document.getElementById('edit-tags').value);
            const fileSelect = document.getElementById('edit-file-select').value;

            if (selectedCard) {
                const cardName = selectedCard.querySelector('.asset-name')?.textContent;
                const asset = assets.find(a => a.name === cardName);
                if (asset) {
                    asset.name = name;
                    asset.tags = tags;
                    selectedCard.querySelector('.asset-name').textContent = name;
                }
            }
            editModal.style.display = 'none';
            editMode = false;
            editBtn.classList.remove('active');
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (selectedCard) {
                const cardName = selectedCard.querySelector('.asset-name')?.textContent;
                const asset = assets.find(a => a.name === cardName);
                if (asset) {
                    deletedPaths.push(asset.path);
                    const idx = assets.findIndex(a => a.name === cardName);
                    if (idx !== -1) assets.splice(idx, 1);
                }
                selectedCard.remove();
            }
            editModal.style.display = 'none';
            editMode = false;
            editBtn.classList.remove('active');
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
                case 'assets_zombie': data = [...assetsZombie]; break;
            }

            const filePathMap2 = {
                'assets_other': 'data/assets/other/',
                'assets_plants': 'data/assets/plants/',
                'assets_ui': 'data/assets/ui/',
                'assets_zombie': 'data/assets/zombie/'
            };

            const basePath = filePathMap2[varName] || 'data/assets/plants/';
            const newAssets = assets.filter(a => a.path.startsWith(basePath) && !data.some(d => d.path === a.path));

            if (data || newAssets.length > 0) {
                data = [...data, ...newAssets];
                data = data.filter(a => !deletedPaths.includes(a.path));
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
    const fileInput = document.getElementById('file-input');
    const pathInput = document.getElementById('file-path-input');
    let currentFile = null;
    let currentPath = '';

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => pathInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.png')) {
                currentFile = file;
                const nameInput = document.getElementById('asset-name');
                if (nameInput) nameInput.value = file.name;
                const fileSelect = document.getElementById('data-file-select')?.value || 'assets_plants.js';
                const basePath = filePathMap[fileSelect] || 'data/assets/plants/';
                currentPath = `${basePath}${file.name}`;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    dropZone.innerHTML = `
                        <img src="${ev.target.result}" style="max-width: 100%; max-height: 100px; object-fit: contain;">
                        <div style="margin-top: 10px; color: #888; font-size: 12px;">${currentPath}</div>
                    `;
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
                const basePath = filePathMap[fileSelect] || 'data/assets/plants/';
                currentPath = `${basePath}${file.name}`;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    dropZone.innerHTML = `
                        <img src="${ev.target.result}" style="max-width: 100%; max-height: 100px; object-fit: contain;">
                        <div style="margin-top: 10px; color: #888; font-size: 12px;">${currentPath}</div>
                    `;
                };
                reader.readAsDataURL(file);
            }
        });

        const fileSelect = document.getElementById('data-file-select');
        if (fileSelect) {
            fileSelect.addEventListener('change', () => {
                if (currentFile) {
                    const basePath = filePathMap[fileSelect.value] || 'data/assets/plants/';
                    currentPath = `${basePath}${currentFile.name}`;
                    const img = dropZone.querySelector('img');
                    if (img) {
                        const src = img.src;
                        dropZone.innerHTML = `
                            <img src="${src}" style="max-width: 100%; max-height: 100px; object-fit: contain;">
                            <div style="margin-top: 10px; color: #888; font-size: 12px;">${currentPath}</div>
                        `;
                    }
                }
            });
        }

        const saveBtn = document.getElementById('save-asset-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const name = document.getElementById('asset-name')?.value;
                const tags = parseTags(document.getElementById('asset-tags')?.value || '');
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

                assets.push(newAsset);

                const container = document.getElementById('assets-container');
                if (container) {
                    const card = document.createElement('div');
                    card.className = 'asset-card';
                    const ext = path.split('.').pop();
                    card.innerHTML = `
                        <img src="${path}" alt="${newAsset.name}" class="asset-image" onerror="this.style.display='none'">
                        <div class="asset-name">${newAsset.name}</div>
                        <button class="download-btn" onclick="downloadAsset('${path}', '${newAsset.name}.${ext}')">Скачать</button>
                    `;
                    container.appendChild(card);
                }

                modal.style.display = 'none';

                document.getElementById('asset-name').value = '';
                document.getElementById('asset-tags').value = '';
                const dropZone = document.getElementById('drop-zone');
                if (dropZone) dropZone.innerHTML = '<span>Перетащите PNG сюда или нажмите</span>';
                currentFile = null;
                currentPath = '';
            });
        }
    }
}