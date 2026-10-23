export const DRIVER_MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #141F1B; }
  .leaflet-control-attribution { font-size: 8px; opacity: 0.6; }
  .me { position: relative; width: 22px; height: 22px; }
  .me .dot { position: absolute; left: 3px; top: 3px; width: 16px; height: 16px; border-radius: 50%; background: #0FA968; border: 3px solid #0B1210; box-sizing: border-box; }
  .me .pulse { position: absolute; left: -13px; top: -13px; width: 48px; height: 48px; border-radius: 50%; background: #0FA968; animation: pulse 2s ease-out infinite; }
  @keyframes pulse { 0% { transform: scale(0.3); opacity: 0.5; } 100% { transform: scale(1); opacity: 0; } }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map', { zoomControl: false, attributionControl: true, dragging: true });
map.attributionControl.setPrefix(false);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19, subdomains: 'abcd', attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

window.setCenter = function (lat, lng, zoom) {
  map.setView([lat, lng], zoom || 15, { animate: false });
  var icon = L.divIcon({ className: '', html: '<div class="me"><div class="pulse"></div><div class="dot"></div></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
  L.marker([lat, lng], { icon: icon, interactive: false }).addTo(map);
};

var zoneLayers = [];
var ZONE_COLORS = { high: '#E63946', medium: '#F0A828', normal: '#0FA968' };

// Mapa de procura (secao 48): zonas coloridas por intensidade - nao ligadas a
// posicao exata de nenhum motorista, apenas a media da regiao.
window.setZones = function (zones) {
  zoneLayers.forEach(function (l) { map.removeLayer(l); });
  zoneLayers = [];
  zones.forEach(function (z) {
    var color = ZONE_COLORS[z.intensity] || ZONE_COLORS.normal;
    var circle = L.circle([z.latitude, z.longitude], {
      radius: z.radiusMeters, color: color, weight: 1, fillColor: color, fillOpacity: 0.25, interactive: false
    }).addTo(map);
    zoneLayers.push(circle);
  });
};
</script>
</body>
</html>`;

