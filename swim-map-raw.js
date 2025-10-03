// ================= CONFIG =================
const GPX_URL = "https://raw.githubusercontent.com/rose2023va/Karolina-Szczepaniak-Baltic-Sea/refs/heads/main/Morze%20Emocji%202025%20track%20(2).gpx";

// ================= MAP =================
const map = L.map("map", { center:[55.0, 18.0], zoom:6, zoomControl:true });
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

let gpxLayer = null;

// ================= FUNCTIONS =================
function showTrack(){
  if (gpxLayer) {
    map.addLayer(gpxLayer);
    map.fitBounds(gpxLayer.getBounds());
    return;
  }

  document.getElementById("status").innerText = "Loading...";

  gpxLayer = new L.GPX(GPX_URL, {
    async: true,
    polyline_options: {
      color: "blue",
      weight: 4,
      opacity: 0.9
    },
    marker_options: {
      startIconUrl: null,
      endIconUrl: null,
      shadowUrl: null
    }
  }).on("loaded", function(e){
    map.fitBounds(e.target.getBounds());
    document.getElementById("status").innerText = "Loaded.";
  }).on("error", function(e){
    document.getElementById("status").innerText = "Error loading GPX.";
    console.error("GPX error:", e);
  }).addTo(map);
}

function clearTrack(){
  if (gpxLayer) map.removeLayer(gpxLayer);
}
