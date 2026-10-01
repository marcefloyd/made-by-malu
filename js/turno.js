const serviceCards = [...document.querySelectorAll('.booking-service')];
const addOnInputs = [...document.querySelectorAll('[data-addon]')];
const selectedServices = new Map();
const selectedAddOns = new Map();
const summaryItems = document.querySelector('#summary-items');
const summaryEmpty = document.querySelector('#summary-empty');
const summaryCount = document.querySelector('#summary-count');
const summaryTotal = document.querySelector('#summary-total');
const continueButton = document.querySelector('#continue-request');
const requestDialog = document.querySelector('#request-dialog');
const requestForm = document.querySelector('#request-form');
const requestError = document.querySelector('#request-error');
const preferredDate = document.querySelector('#preferred-date');
const serviceGalleryDialog = document.querySelector('#service-gallery-dialog');
const serviceGalleryImage = document.querySelector('#service-gallery-image');
const serviceGalleryTitle = document.querySelector('#service-gallery-title');
const serviceGalleryCount = document.querySelector('#service-gallery-count');
const serviceGalleryBackground = document.querySelector('.service-gallery-background');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const servicePhotoSets = {
    semipermanente: { title: 'Semipermanente', photos: Array.from({ length: 4 }, (_, index) => `assets/semipermanentes${index + 1}.jpg`) },
    capping: { title: 'Capping', photos: Array.from({ length: 6 }, (_, index) => `assets/capping${index + 1}.jpg`) },
    'soft-gel': { title: 'Soft gel', photos: Array.from({ length: 4 }, (_, index) => `assets/soft${index + 1}.jpg`) },
    'press-on': { title: 'Press On · fotos de referencia', photos: Array.from({ length: 14 }, (_, index) => `assets/nuevo${index + 1}.jpg`) }
};
let activePhotoSet = [];
let activePhotoIndex = 0;

function showServicePhoto(index) {
    activePhotoIndex = (index + activePhotoSet.length) % activePhotoSet.length;
    serviceGalleryImage.src = activePhotoSet[activePhotoIndex];
    serviceGalleryImage.alt = `${serviceGalleryTitle.textContent}, foto ${activePhotoIndex + 1}`;
    serviceGalleryCount.textContent = `${String(activePhotoIndex + 1).padStart(2, '0')} / ${String(activePhotoSet.length).padStart(2, '0')}`;
}

document.querySelectorAll('.booking-photo-open').forEach((button) => {
    button.addEventListener('click', () => {
        const photoSet = servicePhotoSets[button.dataset.photoService];
        if (!photoSet?.photos.length) return;
        activePhotoSet = photoSet.photos;
        serviceGalleryTitle.textContent = photoSet.title;
        showServicePhoto(0);
        serviceGalleryDialog.showModal();
        if (!prefersReducedMotion.matches) serviceGalleryBackground.play().catch(() => {});
    });
});

    serviceGalleryDialog.addEventListener('close', () => serviceGalleryBackground.pause());
document.querySelector('#close-service-gallery').addEventListener('click', () => serviceGalleryDialog.close());
document.querySelector('#previous-service-photo').addEventListener('click', () => showServicePhoto(activePhotoIndex - 1));
document.querySelector('#next-service-photo').addEventListener('click', () => showServicePhoto(activePhotoIndex + 1));
serviceGalleryDialog.addEventListener('click', (event) => {
    if (event.target === serviceGalleryDialog) serviceGalleryDialog.close();
});
serviceGalleryDialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showServicePhoto(activePhotoIndex - 1);
    if (event.key === 'ArrowRight') showServicePhoto(activePhotoIndex + 1);
});

function getServiceData(card) {
    const pressOn = card.dataset.serviceId === 'press-on';
    const personalized = pressOn && card.querySelector('.press-on-custom-input').checked;
    const size = pressOn ? card.querySelector('.press-on-size').value : '';
    const price = personalized ? Number(card.dataset.customPrice) : Number(card.dataset.price);

    return {
        id: card.dataset.serviceId,
        name: card.dataset.serviceName,
        detail: pressOn ? `Talle ${size}${personalized ? ' · diseño personalizado' : ''}` : '',
        price,
        estimate: card.dataset.estimate === 'true',
        type: 'service'
    };
}

function getEntries() {
    return [...selectedServices.values(), ...selectedAddOns.values()];
}

function renderSummary() {
    const entries = getEntries();
    const total = entries.reduce((sum, item) => sum + item.price, 0);
    const hasStartingPrice = [...selectedServices.values()].some((item) => item.estimate);

    summaryItems.replaceChildren();
    summaryEmpty.hidden = entries.length > 0;
    summaryCount.textContent = `${entries.length} ${entries.length === 1 ? 'opción' : 'opciones'}`;
    summaryTotal.textContent = `${hasStartingPrice ? 'Desde ' : ''}${currency.format(total)}`;
    continueButton.disabled = selectedServices.size === 0;

    entries.forEach((item) => {
        const row = document.createElement('li');
        row.className = 'summary-item';

        const name = document.createElement('span');
        name.className = 'summary-item-name';
        name.textContent = item.name;
        row.append(name);

        if (item.detail) {
            const detail = document.createElement('span');
            detail.className = 'summary-item-detail';
            detail.textContent = item.detail;
            row.append(detail);
        }

        const price = document.createElement('span');
        price.className = 'summary-item-price';
        price.textContent = `${item.estimate ? 'Desde ' : ''}${currency.format(item.price)}`;
        row.append(price);

        const remove = document.createElement('button');
        remove.className = 'summary-remove';
        remove.type = 'button';
        remove.setAttribute('aria-label', `Quitar ${item.name}`);
        remove.textContent = '×';
        remove.addEventListener('click', () => removeItem(item));
        row.append(remove);
        summaryItems.append(row);
    });

    serviceCards.forEach((card) => {
        const selected = selectedServices.has(card.dataset.serviceId);
        const addButton = card.querySelector('.service-add');
        card.classList.toggle('is-selected', selected);
        addButton.setAttribute('aria-pressed', String(selected));
        addButton.textContent = selected ? 'Quitar' : 'Agregar';
    });
}

function removeItem(item) {
    if (item.type === 'addon') {
        selectedAddOns.delete(item.id);
        const input = addOnInputs.find((addon) => addon.dataset.addon === item.id);
        if (input) input.checked = false;
    } else {
        selectedServices.delete(item.id);
    }
    renderSummary();
}

serviceCards.forEach((card) => {
    const addButton = card.querySelector('.service-add');
    const serviceId = card.dataset.serviceId;

    addButton.addEventListener('click', () => {
        if (selectedServices.has(serviceId)) {
            selectedServices.delete(serviceId);
        } else {
            selectedServices.set(serviceId, getServiceData(card));
        }
        renderSummary();
    });

    card.querySelector('.press-on-size')?.addEventListener('change', () => {
        if (selectedServices.has(serviceId)) {
            selectedServices.set(serviceId, getServiceData(card));
            renderSummary();
        }
    });

    card.querySelector('.press-on-custom-input')?.addEventListener('change', () => {
        const custom = card.querySelector('.press-on-custom-input').checked;
        card.querySelector('.press-on-price').textContent = custom ? 'Personalizado $12.000' : 'Estándar $10.000';
        if (selectedServices.has(serviceId)) {
            selectedServices.set(serviceId, getServiceData(card));
            renderSummary();
        }
    });
});

addOnInputs.forEach((input) => {
    input.addEventListener('change', () => {
        const id = input.dataset.addon;
        if (input.checked) {
            selectedAddOns.set(id, {
                id,
                name: input.dataset.addonName,
                detail: '',
                price: Number(input.dataset.addonPrice),
                estimate: false,
                type: 'addon'
            });
        } else {
            selectedAddOns.delete(id);
        }
        renderSummary();
    });
});

const today = new Date();
const localToday = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
preferredDate.min = localToday;

continueButton.addEventListener('click', () => {
    requestError.textContent = '';
    requestDialog.showModal();
});

document.querySelector('#close-request').addEventListener('click', () => requestDialog.close());
document.querySelector('#back-to-summary').addEventListener('click', () => requestDialog.close());
requestDialog.addEventListener('click', (event) => {
    if (event.target === requestDialog) requestDialog.close();
});

requestForm.addEventListener('submit', (event) => {
    event.preventDefault();
    requestError.textContent = '';

    if (!requestForm.reportValidity()) return;
    if (selectedServices.size === 0) {
        requestError.textContent = 'Agregá al menos un servicio para continuar.';
        return;
    }

    const entries = getEntries();
    const total = entries.reduce((sum, item) => sum + item.price, 0);
    const hasStartingPrice = [...selectedServices.values()].some((item) => item.estimate);
    const dateLabel = new Date(`${preferredDate.value}T12:00:00`).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const serviceLines = entries.map((item) => {
        const detail = item.detail ? ` (${item.detail})` : '';
        const priceLabel = `${item.estimate ? 'desde ' : ''}${currency.format(item.price)}`;
        return `- ${item.name}${detail}: ${priceLabel}`;
    });
    const note = document.querySelector('#request-note').value.trim();
    const message = [
        'Hola Malu, quisiera solicitar un turno:',
        `Nombre: ${document.querySelector('#client-name').value.trim()}`,
        `Fecha preferida: ${dateLabel}`,
        '',
        'Servicios:',
        ...serviceLines,
        `Estimado: ${hasStartingPrice ? 'desde ' : ''}${currency.format(total)}`,
        note ? `Nota: ${note}` : '',
        '',
        'Entiendo que la fecha queda pendiente de confirmación.'
    ].filter(Boolean).join('\n');

    const whatsappUrl = `https://wa.me/5491164639977?text=${encodeURIComponent(message)}`;
    requestDialog.close();
    window.location.assign(whatsappUrl);
});

renderSummary();