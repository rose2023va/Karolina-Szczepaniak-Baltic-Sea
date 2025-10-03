// ================= CONFIG =================
const GPX_URL =
  "https://raw.githubusercontent.com/rose2023va/Karolina-Szczepaniak-Baltic-Sea/refs/heads/main/Morze%20Emocji%202025%20track%20(2).gpx";
const TRACK_COLOR = "blue";
const FILENAME = "Morze Emocji 2025 track (2).gpx";

// ================= MAP =================
const map = L.map("map", { center: [55.0, 18.0], zoom: 6, zoomControl: true });
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

let gpxLayer = null;

// Safeguard: show a clear error if plugin didn't load
if (typeof L.GPX !== "function") {
  console.error("Leaflet-GPX plugin failed to load. Check the script URL.");
  document.getElementById("status").innerText =
    "Error: GPX plugin not loaded.";
}

// ================= HELPERS =================
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseGpxMetadata(url) {
  return fetch(url, { cache: "no-cache" })
    .then((r) => r.text())
    .then((txt) => {
      const xml = new DOMParser().parseFromString(txt, "application/xml");
      const pts = Array.from(xml.getElementsByTagName("trkpt"));
      if (!pts.length) return null;
      const first = pts[0];
      const last = pts[pts.length - 1];
      const startLat = Number(first.getAttribute("lat"));
      const startLon = Number(first.getAttribute("lon"));
      const endLat = Number(last.getAttribute("lat"));
      const endLon = Number(last.getAttribute("lon"));
      const startTime = first.getElementsByTagName("time")[0]?.textContent?.trim() || "";
      const endTime = last.getElementsByTagName("time")[0]?.textContent?.trim() || "";
      return { startLat, startLon, endLat, endLon, startTime, endTime };
    })
    .catch(() => null);
}

// ================= UI ACTIONS =================
function showTrack() {
  if (typeof L.GPX !== "function") return; // plugin missing

  if (gpxLayer) {
    map.addLayer(gpxLayer);
    if (gpxLayer.getBounds) map.fitBounds(gpxLayer.getBounds());
    return;
  }

  document.getElementById("status").innerText = "Loading…";

  // Pre-parse for popup info
  parseGpxMetadata(GPX_URL).then((info) => {
    gpxLayer = new L.GPX(GPX_URL, {
      async: true,
      polyline_options: { color: TRACK_COLOR, weight: 4, opacity: 0.9 },
      marker_options: { startIconUrl: null, endIconUrl: null, shadowUrl: null },
    })
      .on("loaded", function (e) {
        const layer = e.target;
        if (layer.getBounds) map.fitBounds(layer.getBounds().pad(0.05));

        const sCoord =
          info && isFinite(info.startLat) && isFinite(info.startLon)
            ? `${info.startLat.toFixed(6)}, ${info.startLon.toFixed(6)}`
            : "";
        const eCoord =
          info && isFinite(info.endLat) && isFinite(info.endLon)
            ? `${info.endLat.toFixed(6)}, ${info.endLon.toFixed(6)}`
            : "";

        const html = `
          <div class="small">
            <strong>${escapeHtml(FILENAME)}</strong><br/>
            <b>Source:</b> Raw GPX<br/>
            <b>Start:</b> ${escapeHtml(info?.startTime || "")} ${sCoord ? `| ${sCoord}` : ""}<br/>
            <b>End:</b> ${escapeHtml(info?.endTime || "")} ${eCoord ? `| ${eCoord}` : ""}
          </div>
        `;

        layer.bindTooltip(FILENAME);
        layer.bindPopup(html);
        document.getElementById("status").innerText = "Loaded.";
      })
      .on("error", function (e) {
        console.error("GPX error:", e);
        document.getElementById("status").innerText = "Error loading GPX.";
      })
      .addTo(map);
  });
}
function clearTrack() {
  if (gpxLayer) map.removeLayer(gpxLayer);
}

// Expose to buttons
window.showTrack = showTrack;
window.clearTrack = clearTrack;
