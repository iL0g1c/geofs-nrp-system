 const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function openModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Close modal on escape or outside click
function bindModalEvents(modal, closeBtns) {
    closeBtns.forEach(btn => btn.addEventListener('click', () => closeModal(modal)));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
    document.addEventListener('keydown', (e) => { 
        if (e.key === 'Escape' && modal.classList.contains('show')) closeModal(modal);
    });
}

function statusClass(type, status) {
    const map = {
        base: {
            operational: 'status-green',
            limited: 'status-yellow',
            'under-construction': 'status-blue',
            decommissioned: 'status-red'
        },
        ship: {
            active: 'status-green',
            reserve: 'status-yellow',
            'under-construction': 'status-blue',
            decommissioned: 'status-red'
        }
    };
    return map[type][status] || 'status-green';
}

function statusText(type, status) {
    const map = {
        base: {
            operational: 'Operational',
            limited: 'Limited Operations',
            'under-construction': 'Under Construction',
            decommissioned: 'Decommissioned'
        },
        ship: {
            active: 'Active',
            reserve: 'Reserve',
            'under-construction': 'Under Construction',
            decommissioned: 'Decommissioned'
        }
    };
    return map[type][status] || 'Active';
}

// ================== Force Logo Upload ================== //
const forceLogo = $('#force-logo');
const logoUpload = $('#logo-upload');
forceLogo.addEventListener('click', () => logoUpload.click());
logoUpload.addEventListener('change', function () {
    if (this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => forceLogo.innerHTML = `<img src="${e.target.result}" alt="Force Logo">`;
        reader.readAsDataURL(this.files[0]);
    }
});

// ================== Edit Force Details ================== //
const editForceModal = $('#edit-force-modal');
bindModalEvents(editForceModal, [$('#close-force-modal'), $('#cancel-force-details')]);

$('#edit-details-btn').addEventListener('click', () => {
    $('#edit-force-name').value = $('.force-name').textContent.replace('🇺🇸 ', '');
    $('#edit-ships').value = $('#ships-count').textContent;
    $('#edit-aircraft').value = $('#aircraft-count').textContent;
    $('#edit-fleets').value = $('#fleets-count').textContent;
    $('#edit-personnel').value = $('#personnel-count').textContent;
    $('#edit-commander').value = $('#commander-value').textContent;
    $('#edit-established').value = $('#established-value').textContent;
    $('#edit-headquarters').value = $('#headquarters-value').textContent;
    $('#edit-motto').value = $('#motto-value').textContent.replace(/"/g, '');
    openModal(editForceModal);
});

$('#save-force-details').addEventListener('click', () => {
    $('.force-name').innerHTML = `🇺🇸 ${$('#edit-force-name').value}`;
    $('#ships-count').textContent = $('#edit-ships').value;
    $('#aircraft-count').textContent = $('#edit-aircraft').value;
    $('#fleets-count').textContent = $('#edit-fleets').value;
    $('#personnel-count').textContent = $('#edit-personnel').value;
    $('#commander-value').textContent = $('#edit-commander').value;
    $('#established-value').textContent = $('#edit-established').value;
    $('#headquarters-value').textContent = $('#edit-headquarters').value;
    $('#motto-value').textContent = `"${$('#edit-motto').value}"`;
    closeModal(editForceModal);
});

// ================== Tabs ================== //
$$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        $$('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        ['bases','ships','fleets'].forEach(id => $(`#${id}-content`).classList.add('hidden'));
        $(`#${tab.dataset.tab}-content`).classList.remove('hidden');
    });
});

// ================== Inline Stat Editing ================== //
$$('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
        const type = card.dataset.stat;
        const value = card.querySelector('.stat-value').textContent;
        const newValue = prompt(`Enter new value for ${type}:`, value);
        if (newValue !== null) card.querySelector('.stat-value').textContent = newValue;
    });
});

// ================== Generic CRUD Renderer ================== //
function renderList(type, list, container, templateFn) {
    container.innerHTML = list.length
        ? list.map(item => templateFn(item)).join('')
        : `<div class="empty-state">
                <div class="empty-state-icon">${type === 'base' ? '⚓' : '🚢'}</div>
                <h3>No Naval ${type === 'base' ? 'Bases' : 'Ships'}</h3>
                <p>Click "Add ${type[0].toUpperCase() + type.slice(1)}" to add your first ${type}</p>
           </div>`;
}

// ================== Bases ================== //
let bases = [
    { id: 1, name: "Norfolk Naval Station", location: "Virginia, USA", capacity: "12,000 personnel", status: "operational" },
    { id: 2, name: "Pearl Harbor", location: "Hawaii, USA", capacity: "15,000 personnel", status: "operational" },
    { id: 3, name: "Guantanamo Bay", location: "Cuba", capacity: "8,000 personnel", status: "limited" }
];
let nextBaseId = 4;

const baseModal = $('#base-modal');
bindModalEvents(baseModal, [$('#close-base-modal'), $('#cancel-base')]);

function baseTemplate(base) {
    return `
        <div class="base-card" data-id="${base.id}">
            <div class="base-card-header">
                <h3>${base.name}</h3>
                <div class="base-actions">
                    <button class="btn btn-edit">✏️</button>
                    <button class="btn btn-danger">🗑️</button>
                </div>
            </div>
            <div class="base-details">
                <div><strong>Location:</strong> ${base.location}</div>
                <div><strong>Capacity:</strong> ${base.capacity}</div>
                <div><strong>Status:</strong> 
                    <span class="status"><span class="status-dot ${statusClass('base', base.status)}"></span> 
                    ${statusText('base', base.status)}</span>
                </div>
            </div>
        </div>`;
}

function renderBases() {
    renderList('base', bases, $('#base-list'), baseTemplate);
}
renderBases();

// Delegated edit/delete for bases
$('#base-list').addEventListener('click', (e) => {
    const card = e.target.closest('.base-card');
    if (!card) return;
    const id = parseInt(card.dataset.id);

    if (e.target.classList.contains('btn-edit')) {
        const base = bases.find(b => b.id === id);
        $('#base-modal-title').textContent = 'Edit Base';
        $('#base-id').value = base.id;
        $('#base-name').value = base.name;
        $('#base-location').value = base.location;
        $('#base-capacity').value = base.capacity;
        $('#base-status').value = base.status;
        openModal(baseModal);
    }

    if (e.target.classList.contains('btn-danger') && confirm('Delete base?')) {
        bases = bases.filter(b => b.id !== id);
        renderBases();
    }
});

$('#add-base-btn').addEventListener('click', () => {
    $('#base-modal-title').textContent = 'Add Base';
    $('#base-id').value = '';
    $('#base-name').value = '';
    $('#base-location').value = '';
    $('#base-capacity').value = '';
    $('#base-status').value = 'operational';
    openModal(baseModal);
});

$('#save-base').addEventListener('click', () => {
    const id = $('#base-id').value ? parseInt($('#base-id').value) : null;
    const name = $('#base-name').value.trim();
    const location = $('#base-location').value.trim();
    const capacity = $('#base-capacity').value.trim();
    const status = $('#base-status').value;
    if (!name || !location || !capacity) return alert('Fill all fields');

    if (id) {
        const idx = bases.findIndex(b => b.id === id);
        bases[idx] = { id, name, location, capacity, status };
    } else {
        bases.push({ id: nextBaseId++, name, location, capacity, status });
    }
    renderBases();
    closeModal(baseModal);
});

// ================== Ships ================== //
let ships = [
    { id: 1, name: "USS Gerald R. Ford", class: "Aircraft Carrier", hull: "CVN-78", status: "active" },
    { id: 2, name: "USS Zumwalt", class: "Destroyer", hull: "DDG-1000", status: "active" },
    { id: 3, name: "USS Virginia", class: "Submarine", hull: "SSN-774", status: "active" }
];
let nextShipId = 4;

const shipModal = $('#ship-modal');
bindModalEvents(shipModal, [$('#close-ship-modal'), $('#cancel-ship')]);

function shipTemplate(ship) {
    return `
        <div class="ship-card" data-id="${ship.id}">
            <div class="ship-card-header">
                <h3>${ship.name}</h3>
                <div class="ship-actions">
                    <button class="btn btn-edit">✏️</button>
                    <button class="btn btn-danger">🗑️</button>
                </div>
            </div>
            <div class="ship-details">
                <div><strong>Class:</strong> <span class="ship-class-badge">${ship.class}</span></div>
                <div><strong>Hull:</strong> ${ship.hull}</div>
                <div><strong>Status:</strong> 
                    <span class="status"><span class="status-dot ${statusClass('ship', ship.status)}"></span> 
                    ${statusText('ship', ship.status)}</span>
                </div>
            </div>
        </div>`;
}

function renderShips() {
    renderList('ship', ships, $('#ship-list'), shipTemplate);
}
renderShips();

// Delegated edit/delete for ships
$('#ship-list').addEventListener('click', (e) => {
    const card = e.target.closest('.ship-card');
    if (!card) return;
    const id = parseInt(card.dataset.id);

    if (e.target.classList.contains('btn-edit')) {
        const ship = ships.find(s => s.id === id);
        $('#ship-modal-title').textContent = 'Edit Ship';
        $('#ship-id').value = ship.id;
        $('#ship-name').value = ship.name;
        $('#ship-class').value = ship.class;
        $('#ship-hull').value = ship.hull;
        $('#ship-status').value = ship.status;
        openModal(shipModal);
    }

    if (e.target.classList.contains('btn-danger') && confirm('Delete ship?')) {
        ships = ships.filter(s => s.id !== id);
        renderShips();
    }
});

$('#add-ship-btn').addEventListener('click', () => {
    $('#ship-modal-title').textContent = 'Add Ship';
    $('#ship-id').value = '';
    $('#ship-name').value = '';
    $('#ship-class').value = 'Aircraft Carrier';
    $('#ship-hull').value = '';
    $('#ship-status').value = 'active';
    openModal(shipModal);
});

$('#save-ship').addEventListener('click', () => {
    const id = $('#ship-id').value ? parseInt($('#ship-id').value) : null;
    const name = $('#ship-name').value.trim();
    const cls = $('#ship-class').value;
    const hull = $('#ship-hull').value.trim();
    const status = $('#ship-status').value;
    if (!name || !hull) return alert('Fill all fields');

    if (id) {
        const idx = ships.findIndex(s => s.id === id);
        ships[idx] = { id, name, class: cls, hull, status };
    } else {
        ships.push({ id: nextShipId++, name, class: cls, hull, status });
    }
    renderShips();
    closeModal(shipModal);
});
