document.addEventListener('DOMContentLoaded', () => {
    const forceLogo = document.getElementById('force-logo');
    const logoUpload = document.getElementById('logo-upload');
    if (!forceLogo || !logoUpload) {
        return;
    }


    forceLogo.addEventListener('click', () => {
        logoUpload.click();
    });

    logoUpload.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();

            reader.onload = function(e) {
                forceLogo.innerHTML = `<img src="${e.target.result}" alt="Force Logo">`;
            }

            reader.readAsDataURL(this.files[0]);
        }
    });

    const editDetailsBtn = document.getElementById('edit-details-btn');
    const editForceModal = document.getElementById('edit-force-modal');
    const closeForceModal = document.getElementById('close-force-modal');
    const cancelForceDetails = document.getElementById('cancel-force-details');
    const saveForceDetails = document.getElementById('save-force-details');

    editDetailsBtn.addEventListener('click', () => {
        document.getElementById('edit-force-name').value = document.querySelector('.force-name').textContent.replace('🇺🇸 ', '');
        document.getElementById('edit-ships').value = document.getElementById('ships-count').textContent;
        document.getElementById('edit-aircraft').value = document.getElementById('aircraft-count').textContent;
        document.getElementById('edit-fleets').value = document.getElementById('fleets-count').textContent;
        document.getElementById('edit-personnel').value = document.getElementById('personnel-count').textContent;
        document.getElementById('edit-commander').value = document.getElementById('commander-value').textContent;
        document.getElementById('edit-established').value = document.getElementById('established-value').textContent;
        document.getElementById('edit-headquarters').value = document.getElementById('headquarters-value').textContent;
        document.getElementById('edit-motto').value = document.getElementById('motto-value').textContent.replace(/"/g, '');

        editForceModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    function closeModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    closeForceModal.addEventListener('click', () => closeModal(editForceModal));
    cancelForceDetails.addEventListener('click', () => closeModal(editForceModal));

    editForceModal.addEventListener('click', (e) => {
        if (e.target === editForceModal) {
            closeModal(editForceModal);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editForceModal.classList.contains('show')) {
            closeModal(editForceModal);
        }
    });

    saveForceDetails.addEventListener('click', () => {
        document.querySelector('.force-name').innerHTML = `🇺🇸 ${document.getElementById('edit-force-name').value}`;
        document.getElementById('ships-count').textContent = document.getElementById('edit-ships').value;
        document.getElementById('aircraft-count').textContent = document.getElementById('edit-aircraft').value;
        document.getElementById('fleets-count').textContent = document.getElementById('edit-fleets').value;
        document.getElementById('personnel-count').textContent = document.getElementById('edit-personnel').value;
        document.getElementById('commander-value').textContent = document.getElementById('edit-commander').value;
        document.getElementById('established-value').textContent = document.getElementById('edit-established').value;
        document.getElementById('headquarters-value').textContent = document.getElementById('edit-headquarters').value;
        document.getElementById('motto-value').textContent = `"${document.getElementById('edit-motto').value}"`;

        closeModal(editForceModal);
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => {
                t.classList.remove('active');
            });

            tab.classList.add('active');

            document.getElementById('bases-content').classList.add('hidden');
            document.getElementById('ships-content').classList.add('hidden');
            document.getElementById('fleets-content').classList.add('hidden');

            const tabName = tab.getAttribute('data-tab');
            if (tabName) {
                document.getElementById(`${tabName}-content`).classList.remove('hidden');
            }
        });
    });

    // Stat card click to edit
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', () => {
            const statType = card.getAttribute('data-stat');
            const statValue = card.querySelector('.stat-value').textContent;
            const newValue = prompt(`Enter new value for ${statType}:`, statValue);

            if (newValue !== null) {
                card.querySelector('.stat-value').textContent = newValue;
            }
        });
    });

    let bases = [
        {
            id: 1,
            name: "Norfolk Naval Station",
            location: "Virginia, USA",
            capacity: "12,000 personnel",
            status: "operational"
        },
        {
            id: 2,
            name: "Pearl Harbor",
            location: "Hawaii, USA",
            capacity: "15,000 personnel",
            status: "operational"
        },
        {
            id: 3,
            name: "Guantanamo Bay",
            location: "Cuba",
            capacity: "8,000 personnel",
            status: "limited"
        }
    ];

    let nextBaseId = 4;

    // Base modal elements
    const baseModal = document.getElementById('base-modal');
    const closeBaseModal = document.getElementById('close-base-modal');
    const cancelBase = document.getElementById('cancel-base');
    const saveBase = document.getElementById('save-base');
    const addBaseBtn = document.getElementById('add-base-btn');
    const baseModalTitle = document.getElementById('base-modal-title');
    const baseIdInput = document.getElementById('base-id');
    const baseNameInput = document.getElementById('base-name');
    const baseLocationInput = document.getElementById('base-location');
    const baseCapacityInput = document.getElementById('base-capacity');
    const baseStatusInput = document.getElementById('base-status');
    const baseList = document.getElementById('base-list');

    addBaseBtn.addEventListener('click', () => {
        baseModalTitle.textContent = 'Add New Base';
        baseIdInput.value = '';
        baseNameInput.value = '';
        baseLocationInput.value = '';
        baseCapacityInput.value = '';
        baseStatusInput.value = 'operational';

        baseModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    closeBaseModal.addEventListener('click', () => closeModal(baseModal));
    cancelBase.addEventListener('click', () => closeModal(baseModal));

    baseModal.addEventListener('click', (e) => {
        if (e.target === baseModal) {
            closeModal(baseModal);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && baseModal.classList.contains('show')) {
            closeModal(baseModal);
        }
    });

    saveBase.addEventListener('click', () => {
        const id = baseIdInput.value ? parseInt(baseIdInput.value) : null;
        const name = baseNameInput.value.trim();
        const location = baseLocationInput.value.trim();
        const capacity = baseCapacityInput.value.trim();
        const status = baseStatusInput.value;

        if (!name || !location || !capacity) {
            alert('Please fill in all fields');
            return;
        }

        if (id) {
            const index = bases.findIndex(base => base.id === id);
            if (index !== -1) {
                bases[index] = { id, name, location, capacity, status };
            }
        } else {
            bases.push({
                id: nextBaseId++,
                name,
                location,
                capacity,
                status
            });
        }

        renderBases();
        closeModal(baseModal);
    });

    // Edit base
    function editBase(id) {
        const base = bases.find(base => base.id === id);
        if (base) {
            baseModalTitle.textContent = 'Edit Base';
            baseIdInput.value = base.id;
            baseNameInput.value = base.name;
            baseLocationInput.value = base.location;
            baseCapacityInput.value = base.capacity;
            baseStatusInput.value = base.status;

            baseModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    // Delete base
    function deleteBase(id) {
        if (confirm('Are you sure you want to delete this base?')) {
            bases = bases.filter(base => base.id !== id);
            renderBases();
        }
    }

    // Render bases
    function renderBases() {
        baseList.innerHTML = '';

        if (bases.length === 0) {
            baseList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚓</div>
                    <h3>No Naval Bases</h3>
                    <p>Click "Add Base" to create your first naval base</p>
                </div>
            `;
            return;
        }

        bases.forEach(base => {
            const statusClass = getStatusClass(base.status);
            const statusText = getStatusText(base.status);

            const baseCard = document.createElement('div');
            baseCard.className = 'base-card';
            baseCard.innerHTML = `
                <div class="base-card-header">
                    <h3 class="base-name">${base.name}</h3>
                    <div class="base-actions">
                        <button class="btn btn-edit" data-id="${base.id}">✏️</button>
                        <button class="btn btn-danger" data-id="${base.id}">🗑️</button>
                    </div>
                </div>
                <div class="base-details">
                    <div class="base-detail">
                        <span class="base-detail-label">Location:</span>
                        <span class="base-detail-value">${base.location}</span>
                    </div>
                    <div class="base-detail">
                        <span class="base-detail-label">Capacity:</span>
                        <span class="base-detail-value">${base.capacity}</span>
                    </div>
                    <div class="base-detail">
                        <span class="base-detail-label">Status:</span>
                        <span class="base-detail-value status"><span class="status-dot ${statusClass}"></span> ${statusText}</span>
                    </div>
                </div>
            `;

            baseList.appendChild(baseCard);
        });

        // Add event listeners to edit and delete buttons
        baseList.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(button.getAttribute('data-id'));
                editBase(id);
            });
        });

        baseList.querySelectorAll('.btn-danger').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(button.getAttribute('data-id'));
                deleteBase(id);
            });
        });
    }

    // Helper functions for status
    function getStatusClass(status) {
        switch(status) {
            case 'operational': return 'status-green';
            case 'limited': return 'status-yellow';
            case 'under-construction': return 'status-blue';
            case 'decommissioned': return 'status-red';
            default: return 'status-green';
        }
    }

    function getStatusText(status) {
        switch(status) {
            case 'operational': return 'Operational';
            case 'limited': return 'Limited Operations';
            case 'under-construction': return 'Under Construction';
            case 'decommissioned': return 'Decommissioned';
            default: return 'Operational';
        }
    }

    // Initial render
    renderBases();

    // Ship Management
    let ships = [
        {
            id: 1,
            name: "USS Gerald R. Ford",
            class: "Aircraft Carrier",
            hull: "CVN-78",
            status: "active"
        },
        {
            id: 2,
            name: "USS Zumwalt",
            class: "Destroyer",
            hull: "DDG-1000",
            status: "active"
        },
        {
            id: 3,
            name: "USS Virginia",
            class: "Submarine",
            hull: "SSN-774",
            status: "active"
        }
    ];

    let nextShipId = 4;

    // Ship modal elements
    const shipModal = document.getElementById('ship-modal');
    const closeShipModal = document.getElementById('close-ship-modal');
    const cancelShip = document.getElementById('cancel-ship');
    const saveShip = document.getElementById('save-ship');
    const addShipBtn = document.getElementById('add-ship-btn');
    const shipModalTitle = document.getElementById('ship-modal-title');
    const shipIdInput = document.getElementById('ship-id');
    const shipNameInput = document.getElementById('ship-name');
    const shipClassInput = document.getElementById('ship-class');
    const shipHullInput = document.getElementById('ship-hull');
    const shipStatusInput = document.getElementById('ship-status');
    const shipList = document.getElementById('ship-list');

    // Show add ship modal
    addShipBtn.addEventListener('click', () => {
        shipModalTitle.textContent = 'Add New Ship';
        shipIdInput.value = '';
        shipNameInput.value = '';
        shipClassInput.value = 'Aircraft Carrier';
        shipHullInput.value = '';
        shipStatusInput.value = 'active';

        shipModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    // Close ship modal
    closeShipModal.addEventListener('click', () => closeModal(shipModal));
    cancelShip.addEventListener('click', () => closeModal(shipModal));

    shipModal.addEventListener('click', (e) => {
        if (e.target === shipModal) {
            closeModal(shipModal);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && shipModal.classList.contains('show')) {
            closeModal(shipModal);
        }
    });

    // Save ship
    saveShip.addEventListener('click', () => {
        const id = shipIdInput.value ? parseInt(shipIdInput.value) : null;
        const name = shipNameInput.value.trim();
        const shipClass = shipClassInput.value;
        const hull = shipHullInput.value.trim();
        const status = shipStatusInput.value;

        if (!name || !hull) {
            alert('Please fill in all required fields');
            return;
        }

        if (id) {
            // Edit existing ship
            const index = ships.findIndex(ship => ship.id === id);
            if (index !== -1) {
                ships[index] = { id, name, class: shipClass, hull, status };
            }
        } else {
            // Add new ship
            ships.push({
                id: nextShipId++,
                name,
                class: shipClass,
                hull,
                status
            });
        }

        renderShips();
        closeModal(shipModal);
    });

    // Edit ship
    function editShip(id) {
        const ship = ships.find(ship => ship.id === id);
        if (ship) {
            shipModalTitle.textContent = 'Edit Ship';
            shipIdInput.value = ship.id;
            shipNameInput.value = ship.name;
            shipClassInput.value = ship.class;
            shipHullInput.value = ship.hull;
            shipStatusInput.value = ship.status;

            shipModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    // Delete ship
    function deleteShip(id) {
        if (confirm('Are you sure you want to delete this ship?')) {
            ships = ships.filter(ship => ship.id !== id);
            renderShips();
        }
    }

    // Render ships
    function renderShips() {
        shipList.innerHTML = '';

        if (ships.length === 0) {
            shipList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🚢</div>
                    <h3>No Naval Ships</h3>
                    <p>Click "Add Ship" to register your first naval vessel</p>
                </div>
            `;
            return;
        }

        ships.forEach(ship => {
            const statusClass = getShipStatusClass(ship.status);
            const statusText = getShipStatusText(ship.status);
            const classBadge = getShipClassBadge(ship.class);

            const shipCard = document.createElement('div');
            shipCard.className = 'ship-card';
            shipCard.innerHTML = `
                <div class="ship-card-header">
                    <h3 class="ship-name">${ship.name}</h3>
                    <div class="ship-actions">
                        <button class="btn btn-edit" data-id="${ship.id}">✏️</button>
                        <button class="btn btn-danger" data-id="${ship.id}">🗑️</button>
                    </div>
                </div>
                <div class="ship-details">
                    <div class="ship-detail">
                        <span class="ship-detail-label">Class:</span>
                        <span class="ship-detail-value">${classBadge}</span>
                    </div>
                    <div class="ship-detail">
                        <span class="ship-detail-label">Hull Number:</span>
                        <span class="ship-detail-value">${ship.hull}</span>
                    </div>
                    <div class="ship-detail">
                        <span class="ship-detail-label">Status:</span>
                        <span class="ship-detail-value status"><span class="status-dot ${statusClass}"></span> ${statusText}</span>
                    </div>
                </div>
            `;

            shipList.appendChild(shipCard);
        });

        // Add event listeners to edit and delete buttons
        shipList.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(button.getAttribute('data-id'));
                editShip(id);
            });
        });

        shipList.querySelectorAll('.btn-danger').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(button.getAttribute('data-id'));
                deleteShip(id);
            });
        });
    }

    // Helper functions for ship status
    function getShipStatusClass(status) {
        switch(status) {
            case 'active': return 'status-green';
            case 'reserve': return 'status-yellow';
            case 'under-construction': return 'status-blue';
            case 'decommissioned': return 'status-red';
            default: return 'status-green';
        }
    }

    function getShipStatusText(status) {
        switch(status) {
            case 'active': return 'Active';
            case 'reserve': return 'Reserve';
            case 'under-construction': return 'Under Construction';
            case 'decommissioned': return 'Decommissioned';
            default: return 'Active';
        }
    }

    function getShipClassBadge(shipClass) {
        return `<span class="ship-class-badge">${shipClass}</span>`;
    }

    // Initial render for ships
    renderShips();
});
