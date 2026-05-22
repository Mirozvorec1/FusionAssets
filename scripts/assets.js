function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

const downloadingButtons = new Set();

function createAssetCard(asset) {
    const ext = asset.path.split('.').pop();
    const filename = `${asset.name}.${ext}`;
    const card = document.createElement('div');
    card.className = 'asset-card';
    card.dataset.path = asset.path;
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
        openPreview(img.src, asset.name);
    });
    const editIcon = document.createElement('button');
    editIcon.className = 'card-edit-btn';
    editIcon.textContent = '✎';
    editIcon.title = 'Редактировать';
    editIcon.style.display = 'none';
    editIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof openEditModal === 'function') {
            openEditModal(card);
        }
    });
    card.appendChild(editIcon);
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

    requestAnimationFrame(() => {
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
    });
}

document.addEventListener('DOMContentLoaded', loadAssets);


