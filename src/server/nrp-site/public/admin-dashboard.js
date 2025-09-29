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
const attachSignOutHandler = () => {
    const button = $('.sign-out-btn');
    if (!button) {
        return;
    }

    button.addEventListener('click', () => {
        const params = new URLSearchParams();
        const returnTo = (button.dataset.logoutReturnTo || '').trim();
        if (returnTo) {
            params.set('returnTo', returnTo);
        }

        const logoutPath = applyBasePath('/logout');
        const query = params.toString();
        const targetUrl = query ? `${logoutPath}?${query}` : logoutPath;
        window.location.assign(targetUrl);
    });
};
attachSignOutHandler();
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
    tf: {
        operational: { cls: 'status-green', txt: 'Operational' },
        deployed: { cls: 'status-green', txt: 'Deployed' },
        training: { cls: 'status-yellow', txt: 'Training' },
        maintenance: { cls: 'status-blue', txt: 'Maintenance' }
    },
    get(type, status) {
        return this[type][status] || this[type][Object.keys(this[type])[0]];
    }
};
const TemplateFactory = {
    base: b => {
        const s = StatusStrategy.get('base', b.status);
        const coordinates = b.coordinates || b.location || '';
        return `
<div class="base-card" data-id="${b.id}">
    <div class="base-card-header">
        <h3 class="base-name">${b.name}</h3>
        <div class="base-actions">
            <button class="btn btn-edit" type="button">
                <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="btn btn-danger" type="button">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </div>
    </div>
    <div class="base-details">
        <div class="base-detail">
            <span class="base-detail-label">Coordinates:</span>
            <span class="base-detail-value">${coordinates}</span>
        </div>
        <div class="base-detail">
            <span class="base-detail-label">Capacity (Tonnage):</span>
            <span class="base-detail-value">${b.capacity || ''}</span>
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
            <button class="btn btn-edit" type="button">
                <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="btn btn-danger" type="button">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </div>
    </div>
    <div class="ship-details">
        <div class="ship-detail">
            <span class="ship-detail-label">Class:</span>
            <span class="ship-detail-value"><span class="ship-class-badge">${s.class || ''}</span></span>
        </div>
        <div class="ship-detail">
            <span class="ship-detail-label">Hull Number:</span>
            <span class="ship-detail-value">${s.hull || ''}</span>
        </div>
        <div class="ship-detail">
            <span class="ship-detail-label">Status:</span>
            <span class="ship-detail-value status"><span class="status-dot ${st.cls}"></span> ${st.txt}</span>
        </div>
    </div>
</div>`;
    },
    tf: tf => {
        const status = StatusStrategy.get('tf', tf.status);
        const shipsList = Array.isArray(tf.ships)
            ? tf.ships.map(shipId => {
                const shipObj = store.ships().find(s => s.id === shipId);
                return shipObj ? `${shipObj.name} (${shipObj.hull})` : null;
            }).filter(Boolean).join(', ')
            : '';
        const baseObj = store.bases().find(b => b.id === tf.baseId);
        const baseName = baseObj ? baseObj.name : '';
        return `
<div class="tf-card" data-id="${tf.id}">
    <div class="tf-card-header">
        <h3 class="tf-name">${tf.name}</h3>
        <div class="tf-actions">
            <button class="btn btn-edit" type="button">
                <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="btn btn-danger" type="button">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </div>
    </div>
    <div class="tf-details">
        <div class="tf-detail">
            <span class="tf-detail-label">Base:</span>
            <span class="tf-detail-value">${baseName}</span>
        </div>
        <div class="tf-detail">
            <span class="tf-detail-label">Ships:</span>
            <span class="tf-detail-value">${shipsList}</span>
        </div>
        <div class="tf-detail">
            <span class="tf-detail-label">Location:</span>
            <span class="tf-detail-value">${tf.location || ''}</span>
        </div>
        <div class="tf-detail">
            <span class="tf-detail-label">Status:</span>
            <span class="tf-detail-value status"><span class="status-dot ${status.cls}"></span> ${status.txt}</span>
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
                <div class="empty-state-icon">${type === 'base'
                    ? '<span class="material-symbols-outlined">bike_dock</span>'
                    : type === 'ship'
                        ? '<span class="material-symbols-outlined">directions_boat</span>'
                        : '<span class="material-symbols-outlined">groups</span>'}</div>
                <h3>No Naval ${type === 'base' ? 'Bases' : type === 'ship' ? 'Ships' : 'Task Forces'}</h3>
                <p>Click "Add ${type[0].toUpperCase() + type.slice(1)}" to add your first ${type}</p>
            </div>`;
    }
};
class DataStore {
    constructor() {
        this._bases = [];
        this._ships = [];
        this._tfs = [];
        this._nextBaseId = 1;
        this._nextShipId = 1;
        this._nextTfId = 1;
        this.fileReader = typeof FileReader !== 'undefined' ? new FileReader() : null;
        this.fileInput = $('#data-upload');
    }

    bases() { return this._bases; }
    ships() { return this._ships; }
    tfs() { return this._tfs; }

    _update(list, obj) {
        const index = list.findIndex(x => x.id === obj.id);
        if (index !== -1) {
            list[index] = obj;
        }
    }

    _remove(list, id) {
        return list.filter(x => x.id !== id);
    }

    _normalizeBase(base) {
        const coordinates = base.coordinates || base.location || '';
        return {
            ...base,
            coordinates,
            location: base.location || coordinates
        };
    }

    addBase(b) {
        const newBase = this._normalizeBase({ ...b, id: this._nextBaseId++ });
        this._bases.push(newBase);
        return newBase;
    }

    updateBase(b) {
        this._update(this._bases, this._normalizeBase({ ...b }));
    }

    removeBase(id) {
        this._bases = this._remove(this._bases, id);
        this._tfs = this._tfs.map(tf => tf.baseId === id ? { ...tf, baseId: null } : tf);
    }

    addShip(s) {
        const newShip = { ...s, id: this._nextShipId++ };
        this._ships.push(newShip);
        return newShip;
    }

    updateShip(s) {
        this._update(this._ships, { ...s });
    }

    removeShip(id) {
        this._ships = this._remove(this._ships, id);
        this._tfs = this._tfs.map(tf => ({
            ...tf,
            ships: Array.isArray(tf.ships) ? tf.ships.filter(shipId => shipId !== id) : []
        }));
    }

    addTf(tf) {
        const newTf = { ...tf, id: this._nextTfId++ };
        this._tfs.push(newTf);
        return newTf;
    }

    updateTf(tf) {
        this._update(this._tfs, { ...tf });
    }

    removeTf(id) {
        this._tfs = this._remove(this._tfs, id);
    }

    async loadData() {
        try {
            const [basesResponse, shipsResponse, tfsResponse] = await Promise.all([
                fetch(applyBasePath('/bases.json')),
                fetch(applyBasePath('/ships.json')),
                fetch(applyBasePath('/tfs.json'))
            ]);

            if (basesResponse.ok) {
                const bases = await basesResponse.json();
                this._bases = Array.isArray(bases) ? bases.map(b => this._normalizeBase(b)) : [];
                this._nextBaseId = Math.max(0, ...this._bases.map(b => Number(b.id) || 0)) + 1;
            } else {
                this._bases = [];
                this._nextBaseId = 1;
            }

            if (shipsResponse.ok) {
                const ships = await shipsResponse.json();
                this._ships = Array.isArray(ships) ? ships : [];
                this._nextShipId = Math.max(0, ...this._ships.map(s => Number(s.id) || 0)) + 1;
            } else {
                this._ships = [];
                this._nextShipId = 1;
            }

            if (tfsResponse.ok) {
                const tfs = await tfsResponse.json();
                this._tfs = Array.isArray(tfs) ? tfs.map(tf => ({
                    ...tf,
                    ships: Array.isArray(tf.ships) ? tf.ships.slice() : []
                })) : [];
                this._nextTfId = Math.max(0, ...this._tfs.map(tf => Number(tf.id) || 0)) + 1;
            } else {
                this._tfs = [];
                this._nextTfId = 1;
            }

            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }

    parseCSV(text) {
        const rows = [];
        let index = 0, inQuotes = false, field = '', currentRow = [];
        const pushField = () => { currentRow.push(field); field = ''; };
        const pushRow = () => { rows.push(currentRow); currentRow = []; };
        const length = text.length;

        while (index <= length) {
            const char = text[index] || '\n';
            if (inQuotes) {
                if (char === '"') {
                    if (text[index + 1] === '"') {
                        field += '"';
                        index++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    field += char;
                }
            } else if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                pushField();
            } else if (char === '\n' || char === '\r') {
                if (char === '\r' && text[index + 1] === '\n') {
                    index++;
                }
                pushField();
                pushRow();
            } else if (index === length) {
                pushField();
                pushRow();
            } else {
                field += char;
            }
            index++;
        }

        if (rows.length < 1) {
            return [];
        }

        const headers = rows[0].map(header => header.trim());
        const parsed = new Array(rows.length - 1);
        for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            const entry = {};
            for (let headerIndex = 0; headerIndex < headers.length; headerIndex++) {
                const value = row[headerIndex] || '';
                entry[headers[headerIndex]] = value.trim();
            }
            parsed[rowIndex - 1] = entry;
        }
        return parsed;
    }

    import(contents, filename) {
        if (!contents || !filename) {
            throw new TypeError('invalid file upload');
        }
        const parsed = this.parseCSV(contents);
        let target = filename.split('.')[0];
        if (!target.endsWith('s')) {
            target += 's';
        }
        switch (target) {
            case 'bases':
            case 'ships':
            case 'fleets':
                console.log(target, parsed);
                break;
            default:
                console.warn('Unsupported import target:', target);
                break;
        }
        if (this.fileInput) {
            this.fileInput.removeAttribute('disabled');
            this.fileInput.value = '';
        }
    }

    export() {}

    async readCSV(event) {
        if (!this.fileReader) {
            return;
        }
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }
        const name = file.name;
        this.fileReader.onload = () => this.import(this.fileReader.result, name);
        if (this.fileInput) {
            this.fileInput.setAttribute('disabled', 'disabled');
        }
        this.fileReader.readAsText(file);
    }
}
const store = new DataStore();
const editForceModal = new Modal($('#edit-force-modal'), [$('#close-force-modal'), $('#cancel-force-details')]);
const baseModal = new Modal($('#base-modal'), [$('#close-base-modal'), $('#cancel-base')]);
const shipModal = new Modal($('#ship-modal'), [$('#close-ship-modal'), $('#cancel-ship')]);
const tfModal = new Modal($('#tf-modal'), [$('#close-tf-modal'), $('#cancel-tf')]);
let selectedShips = [];
let selectedBase = null;

const dataUploadInput = $('#data-upload');
if (dataUploadInput) {
    dataUploadInput.addEventListener('change', store.readCSV.bind(store));
}
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
        $(`#edit-${f}`).value = $(`#${f}-count, #${f}-value`.split(', ').map(sel => $(sel)).find(el=>el)?.textContent || ''
    );
    $('#edit-motto').value = $('#motto-value').textContent.replace(/"/g,'');
    editForceModal.open();
};
$('#save-force-details').onclick = () => {
    $('.force-name').innerHTML = `🇺🇸 ${$('#edit-force-name').value}`;
    ['ships','aircraft','fleets','personnel','commander','established','headquarters'].forEach(f => {
        const v = $(`#edit-${f}`).value;
        const target = `#${f}-count, #${f}-value`.split(', ').map(sel => $(sel)).find(el => el);
        if (target) {
            target.textContent = v;
        }
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
const renderShips = () => {
    ListRenderer.render('ship', store.ships(), $('#ship-list'));
    updateShipSelector();
};
$('#ship-list').onclick = e => {
    const card = e.target.closest('.ship-card');
    if (!card) return;

    const actionBtn = e.target.closest('.btn');
    if (!actionBtn) return;

    const id = Number(card.dataset.id);
    if (actionBtn.classList.contains('btn-edit')) {
        const s = store.ships().find(x => x.id === id);
        if (!s) return;
        ['id','name','class','hull','status'].forEach(f => {
            const input = $(`#ship-${f}`);
            if (input) {
                input.value = s[f] || '';
            }
        });
        $('#ship-modal-title').textContent = 'Edit Ship';
        shipModal.open();
        return;
    }

    if (actionBtn.classList.contains('btn-danger') && confirm('Delete ship?')) {
        store.removeShip(id);
        renderShips();
        renderTfs();
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
    renderTfs();
    shipModal.close();
    updateStatsFromContent();
};
const renderBases = () => {
    ListRenderer.render('base', store.bases(), $('#base-list'));
    updateBaseSelector();
};
$('#base-list').onclick = e => {
    const card = e.target.closest('.base-card');
    if (!card) return;

    const actionBtn = e.target.closest('.btn');
    if (!actionBtn) return;

    const id = Number(card.dataset.id);
    if (actionBtn.classList.contains('btn-edit')) {
        const b = store.bases().find(x => x.id === id);
        if (!b) return;
        ['id','name','capacity','status'].forEach(f => {
            const input = $(`#base-${f}`);
            if (input) {
                input.value = b[f] || '';
            }
        });
        const coordinatesInput = $('#base-coordinates');
        if (coordinatesInput) {
            coordinatesInput.value = b.coordinates || b.location || '';
        }
        $('#base-modal-title').textContent = 'Edit Base';
        baseModal.open();
        return;
    }

    if (actionBtn.classList.contains('btn-danger') && confirm('Delete base?')) {
        store.removeBase(id);
        renderBases();
        renderTfs();
        updateStatsFromContent();
    }
};
$('#add-base-btn').onclick = () => {
    ['id','name','capacity'].forEach(f => {
        const input = $(`#base-${f}`);
        if (input) {
            input.value = '';
        }
    });
    const coordinatesInput = $('#base-coordinates');
    if (coordinatesInput) {
        coordinatesInput.value = '';
    }
    $('#base-status').value = 'operational';
    $('#base-modal-title').textContent = 'Add Base';
    baseModal.open();
};
$('#save-base').onclick = () => {
    const baseId = $('#base-id').value ? +$('#base-id').value : null;
    const name = $('#base-name').value.trim();
    const coordinates = $('#base-coordinates').value.trim();
    const capacity = $('#base-capacity').value.trim();
    const status = $('#base-status').value;

    if (!name || !coordinates || !capacity) {
        alert('Fill all fields');
        return;
    }

    const basePayload = {
        id: baseId,
        name,
        coordinates,
        capacity,
        status
    };

    if (basePayload.id) {
        store.updateBase(basePayload);
    } else {
        store.addBase(basePayload);
    }

    renderBases();
    renderTfs();
    baseModal.close();
    updateStatsFromContent();
};
function renderTfs() {
    ListRenderer.render('tf', store.tfs(), $('#tf-list'));
}
$('#tf-list').onclick = e => {
    const card = e.target.closest('.tf-card');
    if (!card) return;

    const actionBtn = e.target.closest('.btn');
    if (!actionBtn) return;

    const id = Number(card.dataset.id);
    if (actionBtn.classList.contains('btn-edit')) {
        const tf = store.tfs().find(x => x.id === id);
        if (!tf) return;
        ['id','name','status','location'].forEach(f => {
            const input = $(`#tf-${f}`);
            if (input) {
                input.value = tf[f] || '';
            }
        });
        selectedShips = Array.isArray(tf.ships) ? tf.ships.slice() : [];
        selectedBase = tf.baseId || null;
        updateShipSelector();
        updateBaseSelector();
        $('#tf-modal-title').textContent = 'Edit Task Force';
        tfModal.open();
        return;
    }

    if (actionBtn.classList.contains('btn-danger') && confirm('Delete task force?')) {
        store.removeTf(id);
        renderTfs();
        updateStatsFromContent();
    }
};
const addTfBtn = $('#add-tf-btn');
if (addTfBtn) {
    addTfBtn.onclick = () => {
        ['id','name','location'].forEach(f => {
            const input = $(`#tf-${f}`);
            if (input) {
                input.value = '';
            }
        });
        $('#tf-status').value = 'operational';
        selectedShips = [];
        selectedBase = null;
        updateShipSelector();
        updateBaseSelector();
        $('#tf-modal-title').textContent = 'Add Task Force';
        tfModal.open();
    };
}
const saveTfBtn = $('#save-tf');
if (saveTfBtn) {
    saveTfBtn.onclick = () => {
        const name = $('#tf-name').value.trim();
        const status = $('#tf-status').value;
        const location = $('#tf-location').value.trim();
        if (!name || selectedShips.length === 0 || !selectedBase) {
            alert('Please fill all required fields and select at least one ship and a base');
            return;
        }
        const tfPayload = {
            id: $('#tf-id').value ? +$('#tf-id').value : null,
            name,
            ships: selectedShips.slice(),
            baseId: selectedBase,
            status,
            location
        };
        if (tfPayload.id) {
            store.updateTf(tfPayload);
        } else {
            store.addTf(tfPayload);
        }
        renderTfs();
        tfModal.close();
        updateStatsFromContent();
    };
}
function updateShipSelector() {
    const shipSelector = $('#ship-selector');
    if (!shipSelector) return;
    const ships = store.ships();
    shipSelector.innerHTML = '';
    ships.forEach(ship => {
        const option = document.createElement('div');
        option.className = 'ship-option';
        option.dataset.id = ship.id;
        option.textContent = `${ship.name} (${ship.hull})`;
        if (selectedShips.includes(ship.id)) {
            option.classList.add('selected');
        }
        option.onclick = () => {
            const index = selectedShips.indexOf(ship.id);
            if (index === -1) {
                selectedShips.push(ship.id);
                option.classList.add('selected');
            } else {
                selectedShips.splice(index, 1);
                option.classList.remove('selected');
            }
        };
        shipSelector.appendChild(option);
    });
}
function updateBaseSelector() {
    const baseSelector = $('#base-selector');
    if (!baseSelector) return;
    const bases = store.bases();
    baseSelector.innerHTML = '';
    bases.forEach(base => {
        const option = document.createElement('div');
        option.className = 'base-option';
        option.dataset.id = base.id;
        option.textContent = `${base.name} (${base.coordinates || base.location || ''})`;
        if (selectedBase === base.id) {
            option.classList.add('selected');
        }
        option.onclick = () => {
            selectedBase = base.id;
            $$('.base-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        };
        baseSelector.appendChild(option);
    });
}
const updateStatsFromContent = () => {
    const shipsCount = $('#ship-list').children.length;
    const actualShipsCount = $('#ship-list').querySelector('.empty-state') ? 0 : shipsCount;
    $('#ships-count').textContent = actualShipsCount;
    const basesCount = $('#base-list').children.length;
    const actualBasesCount = $('#base-list').querySelector('.empty-state') ? 0 : basesCount;
    $('#bases-count').textContent = actualBasesCount;
};
const initApp = async () => {
    const dataLoaded = await store.loadData();
    
    if (dataLoaded) {
        renderBases();
        renderShips();
        renderTfs();

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

        $('#tf-list').innerHTML = `<div class="empty-state">
            <h3>Error Loading Data</h3>
            <p>Failed to load task forces data.</p>
        </div>`;
    }
};
document.addEventListener('DOMContentLoaded', initApp);
