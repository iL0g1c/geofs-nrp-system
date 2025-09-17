(function() {
  function initShipMap() {
    const mapContainer = document.getElementById("ship-map");
    if (!mapContainer || typeof L === "undefined") {
      return;
    }

    const map = L.map(mapContainer, {
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      worldCopyJump: true
    }).setView([20, 0], 2.5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    const ships = Array.isArray(window.shipLocations) ? window.shipLocations : [];

    const markers = ships.map(ship => {
      const marker = L.marker([ship.latitude, ship.longitude], {
        icon: L.divIcon({
          className: `ship-marker-icon leaflet-div-icon ${getStatusClass(ship.status)}`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -10],
          html: '<span class="ship-marker-icon__dot"></span>'
        }),
        riseOnHover: true
      }).addTo(map);

      const popupHtml = [
        `<div class="popup-title">${ship.name}</div>`,
        `<div class="popup-meta">`,
        `<span><strong>Type:</strong> ${ship.type}</span>`,
        `<span><strong>Status:</strong> ${formatStatus(ship.status)}</span>`,
        `<span><strong>Location:</strong> ${ship.location}</span>`,
        `<span><strong>Speed:</strong> ${ship.speed}</span>`,
        `<span><strong>Course:</strong> ${ship.course}</span>`,
        `<span><strong>Report:</strong> ${ship.updated}</span>`,
        `</div>`
      ].join("");

      marker.bindPopup(popupHtml);
      return marker;
    });

    if (markers.length) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.35));
    }
  }

  function formatStatus(status) {
    switch (status) {
      case "on-patrol":
        return "Active Patrol";
      case "in-port":
        return "In Port";
      case "maintenance":
        return "Maintenance";
      default:
        return status;
    }
  }

  function getStatusClass(status) {
    if (!status) {
      return "status-default";
    }

    const normalized = String(status)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return normalized ? `status-${normalized}` : "status-default";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initShipMap);
  } else {
    initShipMap();
  }
})();
