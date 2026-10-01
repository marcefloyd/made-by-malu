const currentYear = document.querySelector('[data-current-year]');

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

const galleryItems = [...document.querySelectorAll('.gallery-item')];
const galleryTrack = document.querySelector('.gallery-grid');
const galleryDialog = document.querySelector('.gallery-dialog');
const galleryFilterButtons = [...document.querySelectorAll('.gallery-filter')];
const getVisibleGalleryItems = () => galleryItems.filter((item) => !item.hidden);

if (galleryTrack && galleryItems.length) {
    const previousButton = document.querySelector('.gallery-scroll-previous');
    const nextButton = document.querySelector('.gallery-scroll-next');
    const position = document.querySelector('.gallery-position');

    const getStep = () => {
        const firstItem = getVisibleGalleryItems()[0];
        if (!firstItem) return 0;
        const itemWidth = firstItem.getBoundingClientRect().width;
        const gap = parseFloat(getComputedStyle(galleryTrack).gap) || 0;
        return itemWidth + gap;
    };

    const updateControls = () => {
        const visibleItems = getVisibleGalleryItems();
        const maxScroll = galleryTrack.scrollWidth - galleryTrack.clientWidth;
        const step = getStep();
        const activeIndex = step ? Math.min(visibleItems.length - 1, Math.round(galleryTrack.scrollLeft / step)) : 0;
        previousButton.disabled = galleryTrack.scrollLeft <= 1 || visibleItems.length < 2;
        nextButton.disabled = galleryTrack.scrollLeft >= maxScroll - 1;
        nextButton.disabled = nextButton.disabled || visibleItems.length < 2;
        position.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(visibleItems.length).padStart(2, '0')}`;
    };

    galleryFilterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            galleryFilterButtons.forEach((filterButton) => {
                filterButton.setAttribute('aria-pressed', String(filterButton === button));
            });
            galleryItems.forEach((item) => {
                item.hidden = category !== 'all' && item.dataset.category !== category;
            });
            galleryTrack.scrollTo({ left: 0, behavior: 'smooth' });
            updateControls();
        });
    });

    previousButton.addEventListener('click', () => galleryTrack.scrollBy({ left: -getStep(), behavior: 'smooth' }));
    nextButton.addEventListener('click', () => galleryTrack.scrollBy({ left: getStep(), behavior: 'smooth' }));
    galleryTrack.addEventListener('scroll', updateControls, { passive: true });
    window.addEventListener('resize', updateControls);
    galleryTrack.scrollLeft = 0;
    updateControls();
}

if (galleryDialog && galleryItems.length) {
    const galleryImage = galleryDialog.querySelector('.gallery-dialog-image');
    const galleryCount = galleryDialog.querySelector('.gallery-count');
    const galleryBackground = galleryDialog.querySelector('.gallery-dialog-background');
    let activeImage = 0;

    const showImage = (index) => {
        const visibleItems = getVisibleGalleryItems();
        activeImage = (index + visibleItems.length) % visibleItems.length;
        const image = visibleItems[activeImage].querySelector('img');
        galleryImage.src = image.src;
        galleryImage.alt = image.alt;
        galleryCount.textContent = `${activeImage + 1} / ${visibleItems.length}`;
    };

    galleryItems.forEach((item) => {
        item.addEventListener('click', () => {
            showImage(getVisibleGalleryItems().indexOf(item));
            galleryDialog.showModal();
            galleryBackground.play().catch(() => {});
        });
    });

    galleryDialog.addEventListener('close', () => galleryBackground.pause());
    galleryDialog.querySelector('.gallery-close').addEventListener('click', () => galleryDialog.close());
    galleryDialog.querySelector('.gallery-previous').addEventListener('click', () => showImage(activeImage - 1));
    galleryDialog.querySelector('.gallery-next').addEventListener('click', () => showImage(activeImage + 1));
    galleryDialog.addEventListener('click', (event) => {
        if (event.target === galleryDialog) galleryDialog.close();
    });
    galleryDialog.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') showImage(activeImage - 1);
        if (event.key === 'ArrowRight') showImage(activeImage + 1);
    });
}
