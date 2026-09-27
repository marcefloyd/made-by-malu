const currentYear = document.querySelector('[data-current-year]');

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

const galleryItems = [...document.querySelectorAll('.gallery-item')];
const galleryDialog = document.querySelector('.gallery-dialog');

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
