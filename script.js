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
 * 3️⃣ ألوان
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
 * 4️⃣ البيانات العامة
 *********************************/
let baseData = {
  type: "FeatureCollection",
  features: []
};

let csvData = {
  type: "FeatureCollection",
  features: []
};

let baseLayer;
let csvLayer;

/*********************************
 * 5️⃣ رسم الطبقة الأساسية
 *********************************/
function drawBaseLayer() {
  if (baseLayer) map.removeLayer(baseLayer);

  baseLayer = L.geoJSON(baseData, {
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, {
        radius: 7,
        fillColor: getColor(feature.properties.Main_Statu),
        color: "#000",
        weight: 1,
        fillOpacity: 0.9
      }),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(
        `<b>Name:</b> ${feature.properties.CityGate_N ?? "-"}<br>
         <b>Status:</b> ${feature.properties.Main_Statu ?? "-"}`
      );
    }
  }).addTo(map);
}

/*********************************
 * 6️⃣ رسم طبقة CSV (testing)
 *********************************/
function drawCSVLayer() {
  if (csvLayer) map.removeLayer(csvLayer);

  csvLayer = L.geoJSON(csvData, {
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, {
        radius: 7,
        fillColor: "#3498db",
        color: "#000",
        weight: 1,
        fillOpacity: 0.9
      }),
    onEachFeature: (feature, layer) => {
      layer.bindPopup("<b>CSV Testing Point</b>");
    }
  });

  if (document.getElementById("toggleCSV").checked) {
    csvLayer.addTo(map);
  }
}

/*********************************
 * 7️⃣ تحميل GeoJSON الأساسي
 *********************************/
fetch("data.geojson")
  .then(res => res.json())
  .then(data => {
    baseData.features.push(...data.features);
    drawBaseLayer();
    map.fitBounds(baseLayer.getBounds());

    L.control.layers(
      {
        "OpenStreetMap": osm,
        "Satellite": satellite,
        "OpenTopoMap": topo
      },
      {
        "Base Points": baseLayer
      }
    ).addTo(map);
  });

/*********************************
 * 8️⃣ Upload CSV (يضاف فوق البيانات)
 *********************************/
document.getElementById("csvInput").addEventListener("change", function (e) {

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (event) {

    const lines = event.target.result
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      alert("CSV فارغ");
      return;
    }

    const headers = lines[0].split(",");
    const latIndex = headers.indexOf("lat");
    const lonIndex = headers.indexOf("lon");

    if (latIndex === -1 || lonIndex === -1) {
      alert("CSV لازم يحتوي lat و lon");
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const lat = parseFloat(cols[latIndex]);
      const lon = parseFloat(cols[lonIndex]);
      if (isNaN(lat) || isNaN(lon)) continue;

      csvData.features.push({
        type: "Feature",
        properties: { source: "CSV" },
        geometry: {
          type: "Point",
          coordinates: [lon, lat]
        }
      });
    }

    drawCSVLayer();
  };

  reader.readAsText(file);
});

/*********************************
 * 9️⃣ Checkbox إظهار / إخفاء CSV
 *********************************/
document.getElementById("toggleCSV").addEventListener("change", function () {
  if (this.checked) {
    drawCSVLayer();
  } else {
    if (csvLayer) map.removeLayer(csvLayer);
  }
});

/*********************************
 * 🔟 Export كل البيانات
 *********************************/
document.getElementById("exportBtn").addEventListener("click", () => {

  const allFeatures = [
    ...baseData.features,
    ...csvData.features
  ];

  if (!allFeatures.length) {
    alert("لا يوجد بيانات");
    return;
  }

  const exportData = {
    type: "FeatureCollection",
    features: allFeatures
  };

  const blob = new Blob(
    [JSON.stringify(exportData, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "all_points.geojson";
  a.click();
  URL.revokeObjectURL(url);
});
