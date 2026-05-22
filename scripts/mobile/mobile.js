(function() {
    if (window.mobileInit) return;
    window.mobileInit = true;

    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartTime = 0;

    document.addEventListener('touchstart', (e) => {
        const previewModal = document.getElementById('preview-modal');
        if (!previewModal || !previewModal.classList.contains('active')) return;

        const touch = e.touches[0];
        touchStartY = touch.clientY;
        touchStartX = touch.clientX;
        touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        const previewModal = document.getElementById('preview-modal');
        if (!previewModal || !previewModal.classList.contains('active')) return;

        const touch = e.touches[0];
        const deltaY = touch.clientY - touchStartY;
        const deltaX = touch.clientX - touchStartX;
        const elapsed = Date.now() - touchStartTime;

        if (Math.abs(deltaY) > 80 && Math.abs(deltaY) > Math.abs(deltaX) * 2 && elapsed < 500) {
            closePreview();
        }
    }, { passive: true });
})();
