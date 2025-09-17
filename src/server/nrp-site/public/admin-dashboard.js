const $ = sel => document.querySelector(sel), $$ = sel => document.querySelectorAll(sel);

// Modal class
class Modal {
    constructor(element, closeBtns = []) {
        this.element = element;
        this.closeBtns = closeBtns;
        this.isBound = false;
    }

    open() {
        this.element.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.element.classList.remove('show');
        document.body.style.overflow = '';
    }

    bind() {
        if (this.isBound) return;
        this.closeBtns.forEach(btn => btn.onclick = () => this.close());
        this.element.onclick = e => e.target === this.element && this.close();
        document.addEventListener('keydown', this._escHandler = (e) => {
            if (e.key === 'Escape' && this.element.classList.contains('show')) this.close();
        });
        this.isBound = true;
    }

    unbind() {
        this.closeBtns.forEach(btn => btn.onclick = null);
        this.element.onclick = null;
        document.removeEventListener('keydown', this._escHandler);
        this.isBound = false;
    }
}

// StatusStrategy class
class StatusStrategy {
    static base = {
        operational: { cls: 'status-green', txt: 'Operational' },
        limited: { cls: 'status-yellow', txt: 'Limited Operations' },
        'under-construction': { cls: 'status-blue', txt: 'Under Construction' },
        decommissioned: { cls: 'status-red', txt: 'Decommissioned' }
    };

    static ship = {
        active: { cls: 'status-green', txt: 'Active' },
        reserve: { cls: 'status-yellow', txt: 'Reserve' },
        'under-construction': { cls: 'status-blue', txt: 'Under Construction' },
        decommissioned: { cls: 'status-red', txt: 'Decommissioned' }
    };

    static get(type, status) {
        return this[type][status] || (type === 'ship'
            ? { cls: 'status-green', txt: 'Active' }
            : { cls: 'status-green', txt: 'Operational' });
    }
}

// TemplateFactory class
class TemplateFactory {
    static base(b) {
        const status = StatusStrategy.get('base', b.status);
        return `
<div class="base-card" data-id="${b.id}">
    <div class="base-card-header">
        <h3>${b.name}</h3>
        <div class="base-actions">
            <button class="btn btn-edit">✏️</button>
            <button class="btn btn-danger">🗑️</button>
        </div>
    </div>
    <div class="base-details">
        <div><strong>Location:</strong> ${b.location}</div>
        <div><strong>Capacity:</strong> ${b.capacity}</div>
        <div><strong>Status:</strong> <span class="status"><span class="status-dot ${status.cls}"></span> ${status.txt}</span></div>
    </div>
</div>`;
    }
    static ship(s) {
        const status = StatusStrategy.get('ship', s.status);
        return `
<div class="ship-card" data-id="${s.id}">
    <div class="ship-card-header">
        <h3>${s.name}</h3>
        <div class="ship-actions">
            <button class="btn btn-edit">✏️</button>
            <button class="btn btn-danger">🗑️</button>
        </div>
    </div>
    <div class="ship-details">
        <div><strong>Class:</strong> <span class="ship-class-badge">${s.class}</span></div>
        <div><strong>Hull:</strong> ${s.hull}</div>
        <div><strong>Status:</strong> <span class="status"><span class="status-dot ${status.cls}"></span> ${status.txt}</span></div>
    </div>
</div>`;
    }
}

// ListRenderer class
class ListRenderer {
    static render(type, list, container) {
        container.innerHTML = list.length
            ? list.map(TemplateFactory[type]).join('')
            : `<div class="empty-state">
                <div class="empty-state-icon">${type === 'base' ? '⚓' : '🚢'}</div>
                <h3>No Naval ${type === 'base' ? 'Bases' : 'Ships'}</h3>
                <p>Click "Add ${type[0].toUpperCase() + type.slice(1)}" to add your first ${type}</p>
            </div>`;
    }
}

// DataStore class
class DataStore {
    constructor() {
        this._bases = [
            { id: 1, name: "Norfolk Naval Station", location: "Virginia, USA", capacity: "12,000 personnel", status: "operational" },
            { id: 2, name: "Pearl Harbor", location: "Hawaii, USA", capacity: "15,000 personnel", status: "operational" },
            { id: 3, name: "Guantanamo Bay", location: "Cuba", capacity: "8,000 personnel", status: "limited" }
        ];
        this._ships = [
            { id: 1, name: "USS Gerald R. Ford", class: "Aircraft Carrier", hull: "CVN-78", status: "active" },
            { id: 2, name: "USS Zumwalt", class: "Destroyer", hull: "DDG-1000", status: "active" },
            { id: 3, name: "USS Virginia", class: "Submarine", hull: "SSN-774", status: "active" }
        ];
        this._nextBaseId = 4;
        this._nextShipId = 4;
    }

    bases() { return this._bases; }
    ships() { return this._ships; }

    addBase(b) { this._bases.push({ ...b, id: this._nextBaseId++ }); }
    updateBase(b) { this._bases[this._bases.findIndex(x => x.id === b.id)] = b; }
    removeBase(id) { this._bases = this._bases.filter(b => b.id !== id); }

    addShip(s) { this._ships.push({ ...s, id: this._nextShipId++ }); }
    updateShip(s) { this._ships[this._ships.findIndex(x => x.id === s.id)] = s; }
    removeShip(id) { this._ships = this._ships.filter(s => s.id !== id); }
}

// ---- App Initialization and Event Wiring ---- //
const store = new DataStore();

// Modal object instances
const editForceModal = new Modal($('#edit-force-modal'), [$('#close-force-modal'), $('#cancel-force-details')]);
const baseModal = new Modal($('#base-modal'), [$('#close-base-modal'), $('#cancel-base')]);
const shipModal = new Modal($('#ship-modal'), [$('#close-ship-modal'), $('#cancel-ship')]);
editForceModal.bind();
baseModal.bind();
shipModal.bind();

// Force Logo Upload
$('#force-logo').onclick = () => $('#logo-upload').click();
$('#logo-upload').onchange = function() {
    if (this.files[0]) {
        const r = new FileReader();
        r.onload = e => $('#force-logo').innerHTML = `<img src="${e.target.result}" alt="Force Logo">`;
        r.readAsDataURL(this.files[0]);
    }
};

// Edit Force Details
$('#edit-details-btn').onclick = () => {
    $('#edit-force-name').value = $('.force-name').textContent.replace('🇺🇸 ', '');
    ['ships-count', 'aircraft-count', 'fleets-count', 'personnel-count', 'commander-value', 'established-value', 'headquarters-value'].forEach(e => $(`#edit-${e.split("-")[0]}`).value = $(`#${e}`).textContent);
    $('#edit-motto').value = $('#motto-value').textContent.replace(/"/g, '');
    editForceModal.open();
};
$('#save-force-details').onclick = () => {
    $('.force-name').innerHTML = `🇺🇸 ${$('#edit-force-name').value}`;
    ['ships-count', 'aircraft-count', 'fleets-count', 'personnel-count', 'commander-value', 'established-value', 'headquarters-value'].forEach(e => $(`#${e}`).textContent = $(`#edit-${e.split("-")[0]}`).value);
    $('#motto-value').textContent = `"${$('#edit-motto').value}"`;
    editForceModal.close();
};

// Tabs
$$('.tab').forEach(tab =>
    tab.onclick = () => {
        $$('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        ['bases','ships','fleets'].forEach(id => $(`#${id}-content`).classList.add('hidden'));
        $(`#${tab.dataset.tab}-content`).classList.remove('hidden');
    }
);

// Inline stats
$$('.stat-card').forEach(card =>
    card.onclick = () => {
        const val = card.querySelector('.stat-value');
        if (prompt(`Enter new value for ${card.dataset.stat}:`, val.textContent) !== null) val.textContent = nv;
    }
);

// Bases (CRUD)
const renderBases = () => ListRenderer.render('base', store.bases(), $('#base-list'));
renderBases();
$('#base-list').onclick = e => {
    const card = e.target.closest('.base-card');
    if (!card) return;
    const id = +card.dataset.id;
    if (e.target.classList.contains('btn-edit')) {
        const b = store.bases().find(b => b.id === id);
        return void ($('#base-modal-title').textContent = 'Edit Base', ['id', 'name', 'location', 'capacity', 'status'].forEach(e => $(`#base-${e}`).value = b[e]), baseModal.open());
    }
    (e.target.classList.contains('btn-danger') && confirm('Delete base?')) && (store.removeBase(id), renderBases());
};
$('#add-base-btn').onclick = () => {
    $('#base-modal-title').textContent = 'Add Base';
    ['id', 'name', 'location', 'capacity'].forEach(e => $(`#base-${e}`).value = '');
    $('#base-status').value = 'operational';
    baseModal.open();
};
$('#save-base').onclick = () => {
    const id = $('#base-id').value ? +$('#base-id').value : null;
    const name = $('#base-name').value.trim(), location = $('#base-location').value.trim(), capacity = $('#base-capacity').value.trim(), status = $('#base-status').value;
    if (!name || !location || !capacity) return alert('Fill all fields');
    id
        ? store.updateBase({ id, name, location, capacity, status })
        : store.addBase({ name, location, capacity, status });
    renderBases();
    baseModal.close();
};

// Ships (CRUD)
function renderShips() { ListRenderer.render('ship', store.ships(), $('#ship-list')); }
renderShips();
$('#ship-list').onclick = e => {
    const card = e.target.closest('.ship-card');
    if (!card) return;
    const id = +card.dataset.id;
    if (e.target.classList.contains('btn-edit')) {
        const s = store.ships().find(s => s.id === id);
        $('#ship-modal-title').textContent = 'Edit Ship';
        ['id', 'name', 'class', 'hull', 'status'].forEach(e => $(`#ship-${e}`).value = s[e]);
        shipModal.open();
    }
    (e.target.classList.contains('btn-danger') && confirm('Delete ship?')) && (store.removeShip(id), renderShips());
};
$('#add-ship-btn').onclick = () => {
    $('#ship-modal-title').textContent = 'Add Ship';
    ['ship-id', 'ship-name', 'ship-hull'].forEach(e => $(`#${e}`).value = '');
    $('#ship-class').value = 'Aircraft Carrier';
    $('#ship-status').value = 'active';
    shipModal.open();
};
$('#save-ship').onclick = () => {
    const id = $('#ship-id').value ? +$('#ship-id').value : null
    , name = $('#ship-name').value.trim(), cls = $('#ship-class').value, hull = $('#ship-hull').value.trim(), status = $('#ship-status').value;
    if (!name || !hull) return alert('Fill all fields');
    id
        ? store.updateShip({ id, name, class: cls, hull, status })
        : store.addShip({ name, class: cls, hull, status });
    renderShips();
    shipModal.close();
};