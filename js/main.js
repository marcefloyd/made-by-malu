const currentYear = document.querySelector('[data-current-year]');

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

const galleryItems = [...document.querySelectorAll('.gallery-item')];
const galleryTrack = document.querySelector('.gallery-grid');
const galleryDialog = document.querySelector('.gallery-dialog');

if (galleryTrack && galleryItems.length) {
    const previousButton = document.querySelector('.gallery-scroll-previous');
    const nextButton = document.querySelector('.gallery-scroll-next');
    const position = document.querySelector('.gallery-position');

    const getStep = () => {
        const itemWidth = galleryItems[0].getBoundingClientRect().width;
        const gap = parseFloat(getComputedStyle(galleryTrack).gap) || 0;
        return itemWidth + gap;
    };

    const updateControls = () => {
        const maxScroll = galleryTrack.scrollWidth - galleryTrack.clientWidth;
        const activeIndex = Math.min(galleryItems.length - 1, Math.round(galleryTrack.scrollLeft / getStep()));
        previousButton.disabled = galleryTrack.scrollLeft <= 1;
        nextButton.disabled = galleryTrack.scrollLeft >= maxScroll - 1;
        position.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${galleryItems.length}`;
    };

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
    let activeImage = 0;

    const showImage = (index) => {
        activeImage = (index + galleryItems.length) % galleryItems.length;
        const image = galleryItems[activeImage].querySelector('img');
        galleryImage.src = image.src;
        galleryImage.alt = image.alt;
        galleryCount.textContent = `${activeImage + 1} / ${galleryItems.length}`;
    };

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            showImage(index);
            galleryDialog.showModal();
        });
    });

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
