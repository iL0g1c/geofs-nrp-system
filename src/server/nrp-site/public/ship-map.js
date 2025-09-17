(function() {
  function initShipMap() {
    const mapContainer = document.getElementById("ship-map");
    if (!mapContainer || typeof L === "undefined") {
      return;
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const statusColors = {
      "on-patrol": rootStyles.getPropertyValue("--accent-green").trim() || "#2ea043",
      "in-port": rootStyles.getPropertyValue("--accent-blue").trim() || "#58a6ff",
      maintenance: rootStyles.getPropertyValue("--accent-yellow").trim() || "#d29922"
    };

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
      const color = statusColors[ship.status] || rootStyles.getPropertyValue("--accent-blue").trim() || "#58a6ff";

      const marker = L.circleMarker([ship.latitude, ship.longitude], {
        radius: 8,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.7
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initShipMap);
  } else {
    initShipMap();
  }
})();
