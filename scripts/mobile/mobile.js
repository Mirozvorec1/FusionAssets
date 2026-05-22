(function() {
    if (window.mobileInit) return;
    window.mobileInit = true;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchDragging = false;
    let touchDragStart = { x: 0, y: 0 };

    let pinchStartDist = 0;
    let pinchStartZoom = 1;

    function getTouchDist(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    document.addEventListener('touchstart', (e) => {
        const previewModal = document.getElementById('preview-modal');
        if (!previewModal || !previewModal.classList.contains('active')) return;

        if (e.touches.length === 2) {
            pinchStartDist = getTouchDist(e.touches);
            pinchStartZoom = previewZoom;
            touchDragging = false;
            return;
        }

        const previewImage = document.getElementById('preview-image');
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

        if (previewImage && e.target === previewImage) {
            touchDragging = true;
            touchDragStart = { ...previewImageOffset };
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        const previewModal = document.getElementById('preview-modal');
        if (!previewModal || !previewModal.classList.contains('active')) return;

        if (e.touches.length === 2) {
            e.preventDefault();
            const dist = getTouchDist(e.touches);
            const scale = dist / pinchStartDist;
            const newZoom = Math.max(0.1, Math.min(10, pinchStartZoom * scale));
            updateZoom(newZoom - previewZoom);
            return;
        }

        const touch = e.touches[0];

        if (touchDragging) {
            e.preventDefault();
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            previewImageOffset.x = touchDragStart.x + dx / previewZoom;
            previewImageOffset.y = touchDragStart.y + dy / previewZoom;
            const previewImage = document.getElementById('preview-image');
            if (previewImage) {
                previewImage.style.transform = `scale(${previewZoom}) translate(${previewImageOffset.x}px, ${previewImageOffset.y}px)`;
            }
            return;
        }
    }, { passive: false });

    document.addEventListener('touchend', () => {
        touchDragging = false;
    }, { passive: true });
})();
