/*********************************
 * 1️⃣ إنشاء الخريطة
 *********************************/
const map = L.map("map", {
  fullscreenControl: true
}).setView([24.5, 39.5], 6);

/*********************************
 * 2️⃣ Base Maps
 *********************************/
const osm = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  { attribution: "© OpenStreetMap" }
).addTo(map);

const satellite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { attribution: "© Esri" }
);

const topo = L.tileLayer(
  "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
  { attribution: "© OpenTopoMap" }
);

/*********************************
 * 3️⃣ ألوان حسب الحالة
 *********************************/
function getColor(status) {
  switch (status) {
    case "Known": return "#2ecc71";
    case "Cancelled": return "#e74c3c";
    case "Unknown": return "#f39c12";
    default: return "#7f8c8d";
  }
}

/*********************************
 * 4️⃣ متغيرات عامة
 *********************************/
let allData;          // كل GeoJSON
let pointsLayer;     // طبقة النقاط
const myLocation = L.layerGroup();

/*********************************
 * 5️⃣ رسم النقاط
 *********************************/
function drawPoints(filteredData) {

  if (pointsLayer) {
    map.removeLayer(pointsLayer);
  }

  pointsLayer = L.geoJSON(filteredData, {
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, {
        radius: 7,
        fillColor: getColor(feature.properties.Main_Statu),
        color: "#000",
        weight: 1,
        fillOpacity: 0.9
      }),

    onEachFeature: (feature, layer) => {
      const p = feature.properties;
      layer.bindPopup(`
        <b>Code:</b> ${p.SWA_Code ?? "-"}<br>
        <b>Name:</b> ${p.CityGate_N ?? "-"}<br>
        <b>Status:</b> ${p.Main_Statu ?? "-"}
      `);
    }
  }).addTo(map);
}

/*********************************
 * 6️⃣ تحميل GeoJSON
 *********************************/
fetch("data.geojson")
  .then(res => res.json())
  .then(data => {
    allData = data;
    drawPoints(allData);
    map.fitBounds(pointsLayer.getBounds());

    // Layer Control بعد التحميل
    L.control.layers(
      {
        "OpenStreetMap": osm,
        "Satellite": satellite,
        "OpenTopoMap": topo
      },
      {
        "Points": pointsLayer,
        "My Location": myLocation
      }
    ).addTo(map);
  });

/*********************************
 * 7️⃣ Filters (Checkboxes)
 *********************************/
function applyFilters() {
  const selected = Array.from(
    document.querySelectorAll(".filters input:checked")
  ).map(cb => cb.value);

  const filtered = {
    type: "FeatureCollection",
    features: allData.features.filter(
      f => selected.includes(f.properties.Main_Statu)
    )
  };

  drawPoints(filtered);
}

// ربط الفلاتر
document.querySelectorAll(".filters input").forEach(cb => {
  cb.addEventListener("change", applyFilters);
});

/*********************************
 * 8️⃣ My Location
 *********************************/
map.on("locationfound", e => {
  myLocation.clearLayers();
  L.marker(e.latlng).addTo(myLocation);
});

/*********************************
 * 9️⃣ Locate Button
 *********************************/
const locateBtn = L.control({ position: "bottomleft" });
locateBtn.onAdd = () => {
  const btn = L.DomUtil.create("button", "map-btn");
  btn.innerHTML = "📍 Locate";
  btn.onclick = () => map.locate({ setView: true, maxZoom: 12 });
  return btn;
};
locateBtn.addTo(map);

/*********************************
 * 🔟 Reset Button
 *********************************/
const resetBtn = L.control({ position: "bottomleft" });
resetBtn.onAdd = () => {
  const btn = L.DomUtil.create("button", "map-btn");
  btn.innerHTML = "🔄 Reset";
  btn.onclick = () => map.fitBounds(pointsLayer.getBounds());
  return btn;
};
resetBtn.addTo(map);
