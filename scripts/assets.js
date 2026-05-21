const assets = [];
const dataFiles = [assetsData, assetsUI, assetsPlants, assetsZombie];

function loadAssets() {
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
        searchInput.addEventListener('input', (e) => searchAssets(e.target.value));
    }
}

async function downloadAsset(url, filename) {
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

function renderAssets(filteredAssets = assets, searchQuery = '') {
    const container = document.getElementById('assets-container');
    if (!container) return;

    if (filteredAssets.length === 0 && searchQuery) {
        const similar = [...assets]
            .map(asset => ({ asset, score: calculateSimilarity(searchQuery, asset) }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
            .map(item => item.asset);

        if (similar.length > 0) {
            container.innerHTML = `
                <div class="no-results">Ничего не найдено</div>
                <h2 class="similar-title">Похожее</h2>
                <div class="assets-grid">${similar.map(asset => {
                    const ext = asset.path.split('.').pop();
                    const filename = `${asset.name}.${ext}`;
                    return `
                    <div class="asset-card">
                        <img src="${asset.path}" alt="${asset.name}" class="asset-image">
                        <div class="asset-name">${asset.name}</div>
                        <button class="download-btn" onclick="downloadAsset('${asset.path}', '${filename}')">Скачать</button>
                    </div>`;
                }).join('')}</div>
            `;
            return;
        }
        
        container.innerHTML = '<div class="no-results">Ничего не найдено</div>';
        return;
    }

    container.innerHTML = filteredAssets.map(asset => {
        const ext = asset.path.split('.').pop();
        const filename = `${asset.name}.${ext}`;
        return `
        <div class="asset-card">
            <img src="${asset.path}" alt="${asset.name}" class="asset-image">
            <div class="asset-name">${asset.name}</div>
            <button class="download-btn" onclick="downloadAsset('${asset.path}', '${filename}')">Скачать</button>
        </div>
    `}).join('');
}

function searchAssets(query) {
    const searchQuery = query.toLowerCase().trim();
    if (!searchQuery) {
        renderAssets();
        return;
    }
    const searchParts = searchQuery.split(/[ ,;]+/).filter(p => p);
    const filtered = assets.filter(asset => {
        const nameMatch = asset.name.toLowerCase();
        const tagMatch = asset.tags.join(' ');
        return searchParts.every(part => 
            nameMatch.includes(part) || tagMatch.includes(part)
        );
    });
    renderAssets(filtered, searchQuery);
}

document.addEventListener('DOMContentLoaded', loadAssets);

