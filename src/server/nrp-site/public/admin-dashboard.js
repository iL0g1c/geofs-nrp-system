const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const applyBasePath = (pathname = '/') => {
    const safePath = typeof pathname === 'string' ? pathname : '/';
    const normalized = safePath.startsWith('/') ? safePath : `/${safePath}`;
    const basePath = window.__BASE_PATH__ || '';

    if (!basePath) {
        return normalized === '//' ? '/' : normalized;
    }

    if (normalized === '/') {
        return basePath;
    }

    return `${basePath}${normalized}`.replace(/\/{2,}/g, '/');
};
class Modal {
    constructor(el, closeBtns = []) {
        this.el = el;
        closeBtns.forEach(b => b.onclick = () => this.close());
        el.onclick = e => e.target === el && this.close();
        document.addEventListener('keydown', e => e.key === 'Escape' && this.isOpen() && this.close());
    }
    open() { this.el.classList.add('show'); document.body.style.overflow = 'hidden'; }
    close() { this.el.classList.remove('show'); document.body.style.overflow = ''; }
    isOpen() { return this.el.classList.contains('show'); }
}
const StatusStrategy = {
    base: {
        operational: { cls: 'status-green', txt: 'Operational' },
        limited: { cls: 'status-yellow', txt: 'Limited Operations' },
        'under-construction': { cls: 'status-blue', txt: 'Under Construction' },
        decommissioned: { cls: 'status-red', txt: 'Decommissioned' }
    },
    ship: {
        active: { cls: 'status-green', txt: 'Active' },
        reserve: { cls: 'status-yellow', txt: 'Reserve' },
        'under-construction': { cls: 'status-blue', txt: 'Under Construction' },
        decommissioned: { cls: 'status-red', txt: 'Decommissioned' }
    },
    get(type, status) {
        return this[type][status] || this[type][Object.keys(this[type])[0]];
    }
};
const TemplateFactory = {
    base: b => {
        const s = StatusStrategy.get('base', b.status);
        return `
<div class="base-card" data-id="${b.id}">
    <div class="base-card-header">
        <h3 class="base-name">${b.name}</h3>
        <div class="base-actions">
            <button class="btn btn-edit">
                <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="btn btn-danger">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </div>
    </div>
    <div class="base-details">
        <div class="base-detail">
            <span class="base-detail-label">Location:</span>
            <span class="base-detail-value">${b.location}</span>
        </div>
        <div class="base-detail">
            <span class="base-detail-label">Capacity:</span>
            <span class="base-detail-value">${b.capacity}</span>
        </div>
        <div class="base-detail">
            <span class="base-detail-label">Status:</span>
            <span class="base-detail-value status"><span class="status-dot ${s.cls}"></span> ${s.txt}</span>
        </div>
    </div>
</div>`;
    },
    ship: s => {
        const st = StatusStrategy.get('ship', s.status);
        return `
<div class="ship-card" data-id="${s.id}">
    <div class="ship-card-header">
        <h3 class="ship-name">${s.name}</h3>
        <div class="ship-actions">
            <button class="btn btn-edit">
                <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="btn btn-danger">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </div>
    </div>
    <div class="ship-details">
        <div class="ship-detail">
            <span class="ship-detail-label">Class:</span>
            <span class="ship-detail-value"><span class="ship-class-badge">${s.class}</span></span>
        </div>
        <div class="ship-detail">
            <span class="ship-detail-label">Hull Number:</span>
            <span class="ship-detail-value">${s.hull}</span>
        </div>
        <div class="ship-detail">
            <span class="ship-detail-label">Status:</span>
            <span class="ship-detail-value status"><span class="status-dot ${st.cls}"></span> ${st.txt}</span>
        </div>
    </div>
</div>`;
    }
};
const ListRenderer = {
    render(type, list, container) {
        container.innerHTML = list.length
            ? list.map(TemplateFactory[type]).join('')
            : `<div class="empty-state">
                <div class="empty-state-icon">${type === 'base' ? '⚓' : '🚢'}</div>
                <h3>No Naval ${type === 'base' ? 'Bases' : 'Ships'}</h3>
                <p>Click "Add ${type[0].toUpperCase() + type.slice(1)}" to add your first ${type}</p>
            </div>`;
    }
};
class DataStore {
    constructor() {
        this._bases = [];
        this._ships = [];
        this._nextBaseId = 1;
        this._nextShipId = 1;
    }
    
    bases() { return this._bases; }
    ships() { return this._ships; }
    
    _update(list, obj) {
        const index = list.findIndex(x => x.id === obj.id);
        if (index !== -1) {
            list[index] = obj;
        }
    }
    
    _remove(list, id) {
        return list.filter(x => x.id !== id);
    }
    
    addBase(b) {
        const newBase = { ...b, id: this._nextBaseId++ };
        this._bases.push(newBase);
        return newBase;
    }
    
    updateBase(b) {
        this._update(this._bases, b);
    }
    
    removeBase(id) {
        this._bases = this._remove(this._bases, id);
    }
    
    addShip(s) {
        const newShip = { ...s, id: this._nextShipId++ };
        this._ships.push(newShip);
        return newShip;
    }
    
    updateShip(s) {
        this._update(this._ships, s);
    }
    
    removeShip(id) {
        this._ships = this._remove(this._ships, id);
    }
    
    async loadData() {
        try {
            const [basesResponse, shipsResponse] = await Promise.all([
                fetch(applyBasePath('/bases.json')),
                fetch(applyBasePath('/ships.json'))
            ]);
            
            if (basesResponse.ok) {
                this._bases = await basesResponse.json();
                this._nextBaseId = Math.max(0, ...this._bases.map(b => b.id)) + 1;
            }
            
            if (shipsResponse.ok) {
                this._ships = await shipsResponse.json();
                this._nextShipId = Math.max(0, ...this._ships.map(s => s.id)) + 1;
            }
            
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }
}
const store = new DataStore();
const editForceModal = new Modal($('#edit-force-modal'), [$('#close-force-modal'), $('#cancel-force-details')]);
const baseModal = new Modal($('#base-modal'), [$('#close-base-modal'), $('#cancel-base')]);
const shipModal = new Modal($('#ship-modal'), [$('#close-ship-modal'), $('#cancel-ship')]);
$('#force-logo').onclick = () => $('#logo-upload').click();
$('#logo-upload').onchange = function() {
    if (this.files[0]) {
        const r = new FileReader();
        r.onload = e => $('#force-logo').innerHTML = `<img src="${e.target.result}" alt="Force Logo">`;
        r.readAsDataURL(this.files[0]);
    }
};
$('#edit-details-btn').onclick = () => {
    $('#edit-force-name').value = $('.force-name').textContent.replace(/^🇺🇸\s*/, '');
    ['ships','aircraft','fleets','personnel','commander','established','headquarters'].forEach(f => 
        $(`#edit-${f}`).value = $(`#${f}-count, #${f}-value`.split(', ').map(sel => $(sel)).find(el=>el)?.textContent)
    );
    $('#edit-motto').value = $('#motto-value').textContent.replace(/"/g,'');
    editForceModal.open();
};
$('#save-force-details').onclick = () => {
    $('.force-name').innerHTML = `🇺🇸 ${$('#edit-force-name').value}`;
    ['ships','aircraft','fleets','personnel','commander','established','headquarters'].forEach(f => {
        const v = $(`#edit-${f}`).value;
        $(`#${f}-count, #${f}-value`.split(', ').map(sel => $(sel)).find(el=>el)).textContent = v;
    });
    $('#motto-value').textContent = `"${$('#edit-motto').value}"`;
    editForceModal.close();
};
$$('.tab').forEach(tab => tab.onclick = () => {
    $$('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Scroll to the selected section
    const sectionId = tab.dataset.tab;
    const section = $(`#${sectionId}-section`);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
    
    updateStatsFromContent();
});
const renderShips = () => ListRenderer.render('ship', store.ships(), $('#ship-list'));
$('#ship-list').onclick = e => {
    const card = e.target.closest('.ship-card');
    if (!card) return;
    
    const id = +card.dataset.id;
    if (e.target.classList.contains('btn-edit')) {
        const s = store.ships().find(x => x.id === id);
        ['id','name','class','hull','status'].forEach(f => $(`#ship-${f}`).value = s[f] || '');
        $('#ship-modal-title').textContent = 'Edit Ship';
        shipModal.open();
        return;
    }
    
    if (e.target.classList.contains('btn-danger') && confirm('Delete ship?')) {
        store.removeShip(id);
        renderShips();
        updateStatsFromContent();
    }
};
$('#add-ship-btn').onclick = () => {
    ['ship-id','ship-name','ship-hull'].forEach(f => $(`#${f}`).value = '');
    $('#ship-class').value = 'Aircraft Carrier';
    $('#ship-status').value = 'active';
    $('#ship-modal-title').textContent = 'Add Ship';
    shipModal.open();
};
$('#save-ship').onclick = () => {
    const s = {
        id: $('#ship-id').value ? +$('#ship-id').value : null,
        name: $('#ship-name').value.trim(),
        class: $('#ship-class').value,
        hull: $('#ship-hull').value.trim(),
        status: $('#ship-status').value
    };
    
    if (!s.name || !s.hull) {
        alert('Fill all fields');
        return;
    }
    
    if (s.id) {
        store.updateShip(s);
    } else {
        store.addShip(s);
    }
    
    renderShips();
    shipModal.close();
    updateStatsFromContent();
};
const renderBases = () => ListRenderer.render('base', store.bases(), $('#base-list'));
$('#base-list').onclick = e => {
    const card = e.target.closest('.base-card');
    if (!card) return;
    
    const id = +card.dataset.id;
    if (e.target.classList.contains('btn-edit')) {
        const b = store.bases().find(x => x.id === id);
        ['id','name','location','capacity','status'].forEach(f => $(`#base-${f}`).value = b[f] || '');
        $('#base-modal-title').textContent = 'Edit Base';
        baseModal.open();
        return;
    }
    
    if (e.target.classList.contains('btn-danger') && confirm('Delete base?')) {
        store.removeBase(id);
        renderBases();
        updateStatsFromContent();
    }
};
$('#add-base-btn').onclick = () => {
    ['id','name','location','capacity'].forEach(f => $(`#base-${f}`).value = '');
    $('#base-status').value = 'operational';
    $('#base-modal-title').textContent = 'Add Base';
    baseModal.open();
};
$('#save-base').onclick = () => {
    const b = ['id','name','location','capacity','status'].reduce((o,f) => {
        o[f] = $(`#base-${f}`).value.trim();
        return o;
    }, {});
    
    if (!b.name || !b.location || !b.capacity) {
        alert('Fill all fields');
        return;
    }
    
    if (b.id) {
        store.updateBase(b);
    } else {
        store.addBase(b);
    }
    
    renderBases();
    baseModal.close();
    updateStatsFromContent();
};
const updateStatsFromContent = () => {
    const shipsCount = $('#ship-list').children.length;
    const actualShipsCount = $('#ship-list').querySelector('.empty-state') ? 0 : shipsCount;
    $('#ships-count').textContent = actualShipsCount;

    const fleetsContent = $('#fleets-section');
    let fleetsCount = 0;
    if (fleetsContent) {
        const fleetCards = fleetsContent.querySelectorAll('.grid > .card');
        fleetsCount = fleetCards.length;
    }
    $('#fleets-count').textContent = fleetsCount;
};
const initApp = async () => {
    const dataLoaded = await store.loadData();
    
    if (dataLoaded) {
        renderBases();
        renderShips();
        
        updateStatsFromContent();
    } else {
        $('#base-list').innerHTML = `<div class="empty-state">
            <h3>Error Loading Data</h3>
            <p>Failed to load bases and ships data.</p>
        </div>`;
        
        $('#ship-list').innerHTML = `<div class="empty-state">
            <h3>Error Loading Data</h3>
            <p>Failed to load bases and ships data.</p>
        </div>`;
    }
};
document.addEventListener('DOMContentLoaded', initApp);
