const assets = [
    { name: "Melonpult", path: "data/assets/Растения/Стандартные/Арбузопульта/Melonpult.png", tags: ["растение", "стандартный", "арбузопульта"] },
    { name: "Melonpult_0", path: "data/assets/Растения/Стандартные/Арбузопульта/Melonpult_0.png", tags: ["растение", "стандартный", "арбузопульта"] }
];

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

function renderAssets() {
    const container = document.getElementById('assets-container');
    if (!container) return;

    container.innerHTML = assets.map(asset => {
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

document.addEventListener('DOMContentLoaded', renderAssets);