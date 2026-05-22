(function() {
    if (window.mobileInit) return;
    window.mobileInit = true;

    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartTime = 0;
    let touchDragging = false;
    let touchDragStart = { x: 0, y: 0 };

    document.addEventListener('touchstart', (e) => {
        const previewModal = document.getElementById('preview-modal');
        if (!previewModal || !previewModal.classList.contains('active')) return;

        const previewImage = document.getElementById('preview-image');
        const touch = e.touches[0];
        touchStartY = touch.clientY;
        touchStartX = touch.clientX;
        touchStartTime = Date.now();

        if (previewImage && e.target === previewImage) {
            touchDragging = true;
            touchDragStart = { x: touch.clientX - previewImageOffset.x, y: touch.clientY - previewImageOffset.y };
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        const previewModal = document.getElementById('preview-modal');
        if (!previewModal || !previewModal.classList.contains('active')) return;

        const touch = e.touches[0];
        const deltaY = touch.clientY - touchStartY;
        const deltaX = touch.clientX - touchStartX;
        const elapsed = Date.now() - touchStartTime;

        if (touchDragging) {
            e.preventDefault();
            previewImageOffset.x = (touch.clientX - touchDragStart.x) / previewZoom;
            previewImageOffset.y = (touch.clientY - touchDragStart.y) / previewZoom;
            const previewImage = document.getElementById('preview-image');
            if (previewImage) {
                previewImage.style.transform = `scale(${previewZoom}) translate(${previewImageOffset.x}px, ${previewImageOffset.y}px)`;
            }
            return;
        }

        if (Math.abs(deltaY) > 120 && Math.abs(deltaY) > Math.abs(deltaX) * 2 && elapsed < 500) {
            closePreview();
        }
    }, { passive: false });

    document.addEventListener('touchend', () => {
        touchDragging = false;
    }, { passive: true });
})();
