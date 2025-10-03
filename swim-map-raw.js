// ====== CONFIG ======
const GPX_URL = "https://raw.githubusercontent.com/rose2023va/Karolina-Szczepaniak-Baltic-Sea/refs/heads/main/Morze%20Emocji%202025%20track%20(2).gpx";
const TRACK_COLOR = "blue";
const FILENAME = "Morze Emocji 2025 track (2).gpx";

// Globals
let map, gpxLayer, parsedInfo = null;

function initSwimMapRaw() {
  // Create map
  map = L.map("map", { center: [55.0, 18.0], zoom: 6, zoomControl: true });
  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "© OpenStreetMap contributors" }
  ).addTo(map);

  // Pre-parse GPX for popup details (first/last trkpt)
  fetchAndParseGpx(GPX_URL).then(info => {
    parsedInfo = info;  // {startLat, startLon, startTime, endLat, endLon, endTime}
    document.getElementById("status").textContent = "Ready.";
  }).catch(err => {
    console.error("Parse error:", err);
    document.getElementById("status").textContent = "Loaded (metadata unavailable)";
  });

  // Load the GPX track for drawing (shows all zig-zags)
  gpxLayer = new L.GPX(GPX_URL, {
    async: true,
    polyline_options: { color: TRACK_COLOR, weight: 3, opacity: 0.9 },
    marker_options: { startIconUrl: null, endIconUrl: null, shadowUrl: "" }
  })
  .on("loaded", (e) => {
    map.fitBounds(e.target.getBounds().pad(0.05));
    // Tooltip & popup
    const html = popupHtml(parsedInfo);
    e.target.bindTooltip(FILENAME);
    e.target.bindPopup(html);
    document.getElementById("status").textContent = "Track loaded.";
  })
  .addTo(map);

  // Expose UI handlers
  window.showTrack = function() {
    if (gpxLayer) gpxLayer.addTo(map);
  };
  window.hideTrack = function() {
    if (gpxLayer) map.removeLayer(gpxLayer);
  };
}
window.initSwimMapRaw = initSwimMapRaw;

// ------- Helpers -------
function popupHtml(info) {
  // Small font content requested
  const startTime = info?.startTime || "";
  const endTime   = info?.endTime   || "";
  const sCoord = (info && isFinite(info.startLat) && isFinite(info.startLon))
    ? `${info.startLat.toFixed(6)}, ${info.startLon.toFixed(6)}` : "";
  const eCoord = (info && isFinite(info.endLat) && isFinite(info.endLon))
    ? `${info.endLat.toFixed(6)}, ${info.endLon.toFixed(6)}` : "";

  return `
    <div class="small">
      <strong>${escapeHtml(FILENAME)}</strong><br/>
      <b>Source:</b> Raw GPX<br/>
      <b>Start:</b> ${escapeHtml(startTime)} ${sCoord ? `| ${sCoord}` : ""}<br/>
      <b>End:</b> ${escapeHtml(endTime)} ${eCoord ? `| ${eCoord}` : ""}
    </div>
  `;
}

function fetchAndParseGpx(url) {
  // Parse the first and last <trkpt> and their <time> fields
  return fetch(url, { cache: "no-cache" })
    .then(r => r.text())
    .then(txt => {
      const xml = new DOMParser().parseFromString(txt, "application/xml");
      const pts = [...xml.getElementsByTagName("trkpt")];
      if (!pts.length) throw new Error("No <trkpt> found");
      const first = pts[0], last = pts[pts.length - 1];

      const startLat = Number(first.getAttribute("lat"));
      const startLon = Number(first.getAttribute("lon"));
      const endLat   = Number(last.getAttribute("lat"));
      const endLon   = Number(last.getAttribute("lon"));

      const startTime = textOf(first.getElementsByTagName("time")[0]);
      const endTime   = textOf(last.getElementsByTagName("time")[0]);

      return { startLat, startLon, endLat, endLon, startTime, endTime };
    });
}

function textOf(node) { return node && node.textContent ? node.textContent.trim() : ""; }

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
