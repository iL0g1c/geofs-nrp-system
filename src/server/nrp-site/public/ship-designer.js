document.addEventListener('DOMContentLoaded', () => {
  // --- DATA ---
  const predefinedWeapons = {
    "Mk 45": { name: "Mk 45 5-inch Gun", quantity: 1, caliber: "5-inch", description: "Lightweight naval gun system" },
    "Mk 41": { name: "Mk 41 VLS", quantity: 16, caliber: "Cell launcher", description: "Vertical Launching System for missiles" },
    "Phalanx": { name: "Phalanx CIWS", quantity: 2, caliber: "20mm", description: "Close-in weapon system for defense" },
    "Harpoon": { name: "Harpoon Missile", quantity: 8, caliber: "Anti-ship missile", description: "All-weather, over-the-horizon, anti-ship missile" },
    "Tomahawk": { name: "Tomahawk Missile", quantity: 16, caliber: "Cruise missile", description: "Subsonic cruise missile for long-range strikes" },
    "Standard Missile": { name: "Standard Missile", quantity: 32, caliber: "Surface-to-air missile", description: "Medium-range surface-to-air missile" },
    "Mk 48": { name: "Mk 48 Torpedo", quantity: 6, caliber: "Heavyweight torpedo", description: "Advanced lightweight torpedo" }
  };

  const predefinedSensors = {
    "AN/SPY-6": { name: "AN/SPY-6", type: "Radar", range: 400, description: "Air and missile defense radar" },
    "AN/SPQ-9B": { name: "AN/SPQ-9B", type: "Radar", range: 200, description: "X-band radar for surface search and fire control" },
    "AN/SQQ-89": { name: "AN/SQQ-89", type: "Sonar", range: 20, description: "Underwater warfare combat system" },
    "AN/BYG-1": { name: "AN/BYG-1", type: "Sonar", range: 30, description: "Advanced fire control system for submarines" },
    "SLQ-32": { name: "SLQ-32", type: "ESM", range: 150, description: "Electronic warfare suite" },
    "AN/SPS-49": { name: "AN/SPS-49", type: "Radar", range: 300, description: "Long-range air search radar" }
  };

  // --- DOM ---
  const designNameInput = document.getElementById('design-name');
  const shipImageUpload = document.getElementById('ship-image-upload');
  const shipImagePreview = document.getElementById('ship-image-preview');
  const designTypeInput = document.getElementById('design-type');
  const designDisplacementInput = document.getElementById('design-displacement');
  const designLengthInput = document.getElementById('design-length');
  const designBeamInput = document.getElementById('design-beam');
  const designPropulsionInput = document.getElementById('design-propulsion');
  const sensorSlotsContainer = document.getElementById('sensor-slots');
  const addSensorSlotBtn = document.getElementById('add-sensor-slot');
  const weaponSlotsContainer = document.getElementById('weapon-slots');
  const addWeaponSlotBtn = document.getElementById('add-weapon-slot');
  const resetDesignBtn = document.getElementById('reset-design');
  const saveDesignBtn = document.getElementById('save-design');
  const designForm = document.getElementById('design-form');
  const uploadBtn = document.getElementById('upload-btn');

  // --- STATE ---
  let designs = [];
  let nextDesignId = 1;
  let shipImageDataUrl = null;

  // --- HELPERS ---
  const slotHtml = (type, idx) => {
    const isSensor = type === 'sensor';
    const predefined = isSensor ? predefinedSensors : predefinedWeapons;
    const predefinedKeys = Object.keys(predefined);
    const predefinedOpts = [`<option value="">-- Select a predefined ${isSensor ? 'sensor' : 'weapon'} --</option>`]
      .concat(
        predefinedKeys.map((key) =>
          isSensor
            ? `<option value="${key}">${predefined[key].name} (${predefined[key].type})</option>`
            : `<option value="${key}">${predefined[key].name}</option>`
        )
      )
      .join('');

    return `
        <div class="${type}-slot-header">
          <h4 class="${type}-slot-title">${type.charAt(0).toUpperCase() + type.slice(1)} Slot ${idx + 1}</h4>
          ${idx === 0 ? '' : `<button type="button" class="remove-${type}-slot" aria-label="Remove ${type} slot">&times;</button>`}
        </div>
        <div class="form-group predefined-select">
          <label class="form-label">Predefined ${isSensor ? 'Sensors' : 'Weapons'}</label>
          <select class="form-input ${type}-predefined">${predefinedOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">${isSensor ? 'Sensor' : 'Weapon'} Name</label>
          <input type="text" class="form-input ${type}-name" placeholder="Enter ${isSensor ? 'sensor' : 'weapon'} name">
        </div>
        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              ${isSensor
                ? `
                  <label class="form-label">Type</label>
                  <select class="form-input sensor-type">
                    <option value="Radar">Radar</option>
                    <option value="Sonar">Sonar</option>
                    <option value="ESM">ESM</option>
                    <option value="EO/IR">EO/IR</option>
                  </select>
                `
                : `
                  <label class="form-label">Quantity</label>
                  <input type="number" class="form-input weapon-quantity" placeholder="Enter quantity">
                `}
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              ${isSensor
                ? `
                  <label class="form-label">Range (km)</label>
                  <input type="number" class="form-input sensor-range" placeholder="Enter range">
                `
                : `
                  <label class="form-label">Caliber/Type</label>
                  <input type="text" class="form-input weapon-caliber" placeholder="Enter caliber or type">
                `}
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input ${type}-description" rows="2" placeholder="Enter ${isSensor ? 'sensor' : 'weapon'} description"></textarea>
        </div>
      `;
  };

  const renderSlots = (type, count) => {
    const container = type === 'sensor' ? sensorSlotsContainer : weaponSlotsContainer;
    container.innerHTML = '';

    for (let i = 0; i < count; ++i) {
      const slot = document.createElement('div');
      slot.className = `${type}-slot`;
      slot.setAttribute('data-slot', i);
      slot.innerHTML = slotHtml(type, i);
      container.appendChild(slot);
    }
  };

  const getSlotCount = (type) => (type === 'sensor' ? sensorSlotsContainer : weaponSlotsContainer).children.length;

  const addSlot = (type) => {
    const count = getSlotCount(type);
    const container = type === 'sensor' ? sensorSlotsContainer : weaponSlotsContainer;
    const slot = document.createElement('div');
    slot.className = `${type}-slot`;
    slot.setAttribute('data-slot', count);
    slot.innerHTML = slotHtml(type, count);
    container.appendChild(slot);
  };

  const updateSlotTitles = (type) => {
    const slots = (type === 'sensor' ? sensorSlotsContainer : weaponSlotsContainer).querySelectorAll(`.${type}-slot`);
    slots.forEach((slot, idx) => {
      slot.setAttribute('data-slot', idx);
      const title = slot.querySelector(`.${type}-slot-title`);
      if (title) {
        title.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Slot ${idx + 1}`;
      }
    });
  };

  const resetFormFields = () => {
    designNameInput.value = '';
    shipImagePreview.innerHTML = '<div class="ship-image-placeholder">No image uploaded</div>';
    shipImageDataUrl = null;
    designTypeInput.value = 'Aircraft Carrier';
    designDisplacementInput.value = '';
    designLengthInput.value = '';
    designBeamInput.value = '';
    designPropulsionInput.value = '';
    renderSlots('sensor', 1);
    renderSlots('weapon', 1);
  };

  // --- INIT ---
  renderSlots('sensor', 1);
  renderSlots('weapon', 1);

  // --- IMAGE UPLOAD ---
  uploadBtn.addEventListener('click', () => shipImageUpload.click());

  shipImageUpload.addEventListener('change', function handleImageUpload() {
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        shipImageDataUrl = e.target?.result || null;
        if (shipImageDataUrl) {
          shipImagePreview.innerHTML = `<img src="${shipImageDataUrl}" alt="Ship Image">`;
        }
      };
      reader.readAsDataURL(this.files[0]);
    }
  });

  // --- SLOT EVENT HANDLING (DELEGATED) ---
  const handlePredefinedChange = (event, type) => {
    if (event.target.classList.contains(`${type}-predefined`)) {
      const val = event.target.value;
      const slot = event.target.closest(`.${type}-slot`);
      if (!slot) {
        return;
      }

      if (type === 'sensor') {
        const sensor = predefinedSensors[val];
        slot.querySelector('.sensor-name').value = sensor ? sensor.name : '';
        slot.querySelector('.sensor-type').value = sensor ? sensor.type : 'Radar';
        slot.querySelector('.sensor-range').value = sensor ? sensor.range : '';
        slot.querySelector('.sensor-description').value = sensor ? sensor.description : '';
      } else {
        const weapon = predefinedWeapons[val];
        slot.querySelector('.weapon-name').value = weapon ? weapon.name : '';
        slot.querySelector('.weapon-quantity').value = weapon ? weapon.quantity : '';
        slot.querySelector('.weapon-caliber').value = weapon ? weapon.caliber : '';
        slot.querySelector('.weapon-description').value = weapon ? weapon.description : '';
      }
    }
  };

  const handleRemoveSlot = (event, type) => {
    if (event.target.classList.contains(`remove-${type}-slot`)) {
      const slot = event.target.closest(`.${type}-slot`);
      if (slot) {
        slot.remove();
        updateSlotTitles(type);
      }
    }
  };

  sensorSlotsContainer.addEventListener('change', (event) => handlePredefinedChange(event, 'sensor'));
  weaponSlotsContainer.addEventListener('change', (event) => handlePredefinedChange(event, 'weapon'));
  sensorSlotsContainer.addEventListener('click', (event) => handleRemoveSlot(event, 'sensor'));
  weaponSlotsContainer.addEventListener('click', (event) => handleRemoveSlot(event, 'weapon'));

  // --- ADD SLOT BUTTONS ---
  addSensorSlotBtn.addEventListener('click', () => addSlot('sensor'));
  addWeaponSlotBtn.addEventListener('click', () => addSlot('weapon'));

  // --- RESET ---
  resetDesignBtn.addEventListener('click', () => {
    if (window.confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
      resetFormFields();
    }
  });

  // --- SAVE DESIGN ---
  designForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = designNameInput.value.trim();
    const type = designTypeInput.value;
    const displacement = designDisplacementInput.value ? parseInt(designDisplacementInput.value, 10) : 0;
    const length = designLengthInput.value ? parseInt(designLengthInput.value, 10) : 0;
    const beam = designBeamInput.value ? parseInt(designBeamInput.value, 10) : 0;
    const propulsion = designPropulsionInput.value.trim();

    const sensors = Array.from(sensorSlotsContainer.querySelectorAll('.sensor-slot'))
      .map((slot) => ({
        name: slot.querySelector('.sensor-name').value.trim(),
        type: slot.querySelector('.sensor-type').value,
        range: slot.querySelector('.sensor-range').value ? parseInt(slot.querySelector('.sensor-range').value, 10) : 0,
        description: slot.querySelector('.sensor-description').value.trim()
      }))
      .filter((sensor) => sensor.name || sensor.type || sensor.range || sensor.description);

    const weapons = Array.from(weaponSlotsContainer.querySelectorAll('.weapon-slot'))
      .map((slot) => ({
        name: slot.querySelector('.weapon-name').value.trim(),
        quantity: slot.querySelector('.weapon-quantity').value ? parseInt(slot.querySelector('.weapon-quantity').value, 10) : 0,
        caliber: slot.querySelector('.weapon-caliber').value.trim(),
        description: slot.querySelector('.weapon-description').value.trim()
      }))
      .filter((weapon) => weapon.name || weapon.quantity || weapon.caliber || weapon.description);

    if (!name) {
      window.alert('Please enter a class name');
      return;
    }

    designs.push({
      id: nextDesignId++,
      name,
      type,
      displacement,
      length,
      beam,
      propulsion,
      sensors,
      weapons,
      image: shipImageDataUrl
    });

    window.alert('Design saved successfully!');
    resetFormFields();
  });
});
