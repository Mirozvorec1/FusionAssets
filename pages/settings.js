const ENABLED_STORAGE_KEY = 'fusionassets_debug_mode';

document.addEventListener('DOMContentLoaded', () => {
    const debugToggle = document.getElementById('debug-toggle');
    if (debugToggle) {
        debugToggle.checked = localStorage.getItem(ENABLED_STORAGE_KEY) !== 'false';
        debugToggle.addEventListener('change', () => {
            localStorage.setItem(ENABLED_STORAGE_KEY, debugToggle.checked ? 'true' : 'false');
        });
    }
});
