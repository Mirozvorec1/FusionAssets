function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

const downloadingButtons = new Set();

function createAssetCard(asset) {
    const ext = asset.path.split('.').pop();
    const filename = `${asset.name}.${ext}`;
    const card = document.createElement('div');
    card.className = 'asset-card';
    const img = document.createElement('img');
    img.src = asset.path;
    img.alt = asset.name;
    img.className = 'asset-image';
    img.onerror = function() { this.style.display = 'none'; };
    const nameEl = document.createElement('div');
    nameEl.className = 'asset-name';
    nameEl.textContent = asset.name;
    nameEl.title = asset.name;
    const btn = document.createElement('button');
    btn.className = 'download-btn';
    btn.textContent = 'Скачать';
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadAsset(asset.path, filename, btn);
    });
    card.addEventListener('click', () => {
        if (window.editMode) return;
        openPreview(asset.path, asset.name);
    });
    card.appendChild(img);
    card.appendChild(nameEl);
    card.appendChild(btn);
    return card;
}

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function loadAssets() {
    const assets = [];
    window.assets = assets;
    const dataFiles = [assetsData, assetsUI, assetsPlants, assetsZombies];
    const seen = new Set();
    for (const data of dataFiles) {
        for (const asset of data) {
            if (!seen.has(asset.path)) {
                seen.add(asset.path);
                assets.push(asset);
            }
        }
    }
    renderAssets();
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        const debouncedSearch = debounce((e) => searchAssets(e.target.value), 200);
        searchInput.addEventListener('input', debouncedSearch);
    }
}

async function downloadAsset(url, filename, btn) {
    if (btn && downloadingButtons.has(btn)) return;
    if (btn) downloadingButtons.add(btn);

    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '...';
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'wait';
    }

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('Ошибка скачивания:', error);
    } finally {
        if (btn) {
            downloadingButtons.delete(btn);
            btn.textContent = 'Скачать';
            btn.disabled = false;
            btn.style.opacity = '';
            btn.style.cursor = '';
        }
    }
}

function calculateSimilarity(query, asset) {
    const searchParts = query.toLowerCase().split(/[ ,;]+/).filter(p => p);
    let score = 0;
    const assetText = (asset.name + ' ' + asset.tags.join(' ')).toLowerCase();
    
    for (const part of searchParts) {
        if (asset.name.toLowerCase().includes(part)) score += 10;
        if (asset.tags.some(t => t.includes(part))) score += 5;
        for (const char of part) {
            if (assetText.includes(char)) score += 0.5;
        }
    }
    return score;
}

function renderAssets(filteredAssets = window.assets, searchQuery = '') {
    const container = document.getElementById('assets-container');
    if (!container) return;

    container.innerHTML = '';

    if (filteredAssets.length === 0 && searchQuery) {
        const similar = [...window.assets]
            .map(asset => ({ asset, score: calculateSimilarity(searchQuery, asset) }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
            .map(item => item.asset);

        if (similar.length > 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'Ничего не найдено';
            container.appendChild(noResults);

            const similarTitle = document.createElement('h2');
            similarTitle.className = 'similar-title';
            similarTitle.textContent = 'Похожее';
            container.appendChild(similarTitle);

            for (const asset of similar) {
                container.appendChild(createAssetCard(asset));
            }
            return;
        }

        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'Ничего не найдено';
        container.appendChild(noResults);
        return;
    }

    for (const asset of filteredAssets) {
        container.appendChild(createAssetCard(asset));
    }
}

function searchAssets(query) {
    const spinner = document.getElementById('search-spinner');
    if (spinner) spinner.style.display = 'block';

    const searchQuery = query.toLowerCase().trim();
    if (!searchQuery) {
        renderAssets();
        if (spinner) spinner.style.display = 'none';
        return;
    }
    const searchParts = searchQuery.split(/[ ,;]+/).filter(p => p);
    const filtered = window.assets.filter(asset => {
        const nameMatch = asset.name.toLowerCase();
        const tagMatch = asset.tags.join(' ');
        return searchParts.every(part =>
            nameMatch.includes(part) || tagMatch.includes(part)
        );
    });
    renderAssets(filtered, searchQuery);
    if (spinner) spinner.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', loadAssets);

let previewZoom = 1;
let previewDragging = false;
let previewDragStart = { x: 0, y: 0 };
let previewImageOffset = { x: 0, y: 0 };
let previewCurrentSrc = '';
let previewCurrentFilename = '';
let previewMouseDownPos = { x: 0, y: 0 };
let previewMouseMoved = false;

let previewScrollY = 0;

function openPreview(src, name) {
    const previewModal = document.getElementById('preview-modal');
    const previewImage = document.getElementById('preview-image');
    const previewName = document.getElementById('preview-name');
    const zoomLevel = document.getElementById('zoom-level');
    if (!previewModal || !previewImage || !previewName) return;

    previewCurrentSrc = src;
    const ext = src.split('.').pop();
    previewCurrentFilename = `${name}.${ext}`;

    previewZoom = 1;
    previewImageOffset = { x: 0, y: 0 };
    previewImage.style.transform = 'scale(1) translate(0px, 0px)';
    previewImage.style.cursor = 'grab';
    previewName.textContent = name;
    if (zoomLevel) zoomLevel.textContent = '100%';

    previewImage.onload = function() {
        const container = document.querySelector('.preview-image-container');
        if (!container) return;
        const containerW = container.clientWidth;
        const containerH = container.clientHeight;
        const imgW = previewImage.naturalWidth;
        const imgH = previewImage.naturalHeight;

        if (imgW > containerW || imgH > containerH) {
            const scaleX = containerW / imgW;
            const scaleY = containerH / imgH;
            previewZoom = Math.min(scaleX, scaleY, 1);
            previewImage.style.transform = `scale(${previewZoom}) translate(0px, 0px)`;
            if (zoomLevel) zoomLevel.textContent = Math.round(previewZoom * 100) + '%';
        }
    };

    previewImage.src = src;
    previewImage.alt = name;
    previewScrollY = window.scrollY;
    previewModal.classList.add('active');
    document.body.classList.add('preview-open');
    document.documentElement.classList.add('preview-open');
}

function closePreview() {
    const previewModal = document.getElementById('preview-modal');
    if (!previewModal) return;
    previewModal.classList.remove('active');
    document.body.classList.remove('preview-open');
    document.documentElement.classList.remove('preview-open');
    window.scrollTo(0, previewScrollY);
    const previewImage = document.getElementById('preview-image');
    if (previewImage) {
        previewImage.src = '';
        previewImage.style.cursor = 'grab';
    }
    previewZoom = 1;
    previewImageOffset = { x: 0, y: 0 };
    previewDragging = false;
    previewCurrentSrc = '';
    previewCurrentFilename = '';
}

function updateZoom(delta) {
    const previewImage = document.getElementById('preview-image');
    const zoomLevel = document.getElementById('zoom-level');
    if (!previewImage) return;

    previewZoom = Math.max(0.1, Math.min(10, previewZoom + delta));
    previewImage.style.transform = `scale(${previewZoom}) translate(${previewImageOffset.x}px, ${previewImageOffset.y}px)`;
    if (zoomLevel) zoomLevel.textContent = Math.round(previewZoom * 100) + '%';
}

function resetZoom() {
    previewZoom = 1;
    previewImageOffset = { x: 0, y: 0 };
    const previewImage = document.getElementById('preview-image');
    const zoomLevel = document.getElementById('zoom-level');
    if (previewImage) {
        previewImage.style.transform = 'scale(1) translate(0px, 0px)';
        const container = document.querySelector('.preview-image-container');
        if (container && previewImage.naturalWidth) {
            const containerW = container.clientWidth;
            const containerH = container.clientHeight;
            const imgW = previewImage.naturalWidth;
            const imgH = previewImage.naturalHeight;
            if (imgW > containerW || imgH > containerH) {
                const scaleX = containerW / imgW;
                const scaleY = containerH / imgH;
                previewZoom = Math.min(scaleX, scaleY, 1);
                previewImage.style.transform = `scale(${previewZoom}) translate(0px, 0px)`;
            }
        }
    }
    if (zoomLevel) zoomLevel.textContent = Math.round(previewZoom * 100) + '%';
}

function previewDownload() {
    if (!previewCurrentSrc || !previewCurrentFilename) return;
    downloadAsset(previewCurrentSrc, previewCurrentFilename, null);
}

document.addEventListener('click', (e) => {
    const previewModal = document.getElementById('preview-modal');
    if (previewModal && previewModal.classList.contains('active')) {
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const zoomResetBtn = document.getElementById('zoom-reset-btn');
        const previewDownloadBtn = document.getElementById('preview-download-btn');
        const previewClose = document.querySelector('.preview-close');
        const previewImage = document.getElementById('preview-image');
        const previewName = document.getElementById('preview-name');

        if (e.target === zoomInBtn) {
            e.stopPropagation();
            updateZoom(0.25);
            return;
        }
        if (e.target === zoomOutBtn) {
            e.stopPropagation();
            updateZoom(-0.25);
            return;
        }
        if (e.target === zoomResetBtn) {
            e.stopPropagation();
            resetZoom();
            return;
        }
        if (e.target === previewDownloadBtn) {
            e.stopPropagation();
            previewDownload();
            return;
        }
        if (e.target === previewClose) {
            e.stopPropagation();
            closePreview();
            return;
        }
        if (e.target === previewImage || e.target === previewName) {
            return;
        }
        if (e.target === previewModal) {
            closePreview();
            return;
        }
    }
});

document.addEventListener('wheel', (e) => {
    const previewModal = document.getElementById('preview-modal');
    if (previewModal && previewModal.classList.contains('active')) {
        const previewImage = document.getElementById('preview-image');
        if (previewImage && e.target === previewImage) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.15 : 0.15;
            updateZoom(delta);
        } else {
            e.preventDefault();
        }
    }
}, { passive: false });

document.addEventListener('mousedown', (e) => {
    const previewModal = document.getElementById('preview-modal');
    if (previewModal && previewModal.classList.contains('active')) {
        const previewImage = document.getElementById('preview-image');
        if (previewImage && e.target === previewImage) {
            previewDragging = true;
            previewMouseMoved = false;
            previewMouseDownPos = { x: e.clientX, y: e.clientY };
            previewDragStart = { x: e.clientX - previewImageOffset.x, y: e.clientY - previewImageOffset.y };
            previewImage.style.cursor = 'grabbing';
            e.preventDefault();
        }
    }
});

document.addEventListener('mousemove', (e) => {
    if (previewDragging) {
        const dx = Math.abs(e.clientX - previewMouseDownPos.x);
        const dy = Math.abs(e.clientY - previewMouseDownPos.y);
        if (dx > 3 || dy > 3) {
            previewMouseMoved = true;
        }
        previewImageOffset.x = (e.clientX - previewDragStart.x) / previewZoom;
        previewImageOffset.y = (e.clientY - previewDragStart.y) / previewZoom;
        const previewImage = document.getElementById('preview-image');
        if (previewImage) {
            previewImage.style.transform = `scale(${previewZoom}) translate(${previewImageOffset.x}px, ${previewImageOffset.y}px)`;
        }
    }
});

document.addEventListener('mouseup', () => {
    if (previewDragging) {
        previewDragging = false;
        const previewImage = document.getElementById('preview-image');
        if (previewImage) previewImage.style.cursor = 'grab';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePreview();
    }
});

