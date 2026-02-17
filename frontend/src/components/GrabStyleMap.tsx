import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface GrabMapProps {
  shopLat: number;
  shopLng: number;
  deliveryLat: number;
  deliveryLng: number;
  driverLat?: number;
  driverLng?: number;
  status: string;
  onMapReady?: () => void;
}

export default function GrabStyleMap({
  shopLat, shopLng, deliveryLat, deliveryLng, driverLat, driverLng, status, onMapReady
}: GrabMapProps) {
  const webViewRef = useRef<any>(null);

  const updateDriverPosition = useCallback((lat: number, lng: number) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'updateDriver', lat, lng }));
    }
  }, []);

  useEffect(() => {
    if (driverLat && driverLng) {
      updateDriverPosition(driverLat, driverLng);
    }
  }, [driverLat, driverLng, updateDriverPosition]);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;background:#E8E4E0;overflow:hidden}
.leaflet-control-attribution{display:none!important}
.leaflet-control-zoom{display:none!important}

/* Coffee Shop Marker - Premium Brown */
.shop-marker {
  position: relative;
  width: 52px;
  height: 52px;
}
.shop-marker-inner {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(145deg, #8B6944, #6f4e37);
  border: 4px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 20px rgba(111, 78, 55, 0.5), 0 0 0 2px rgba(111, 78, 55, 0.2);
}
.shop-label {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  background: #6f4e37;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 14px;
  white-space: nowrap;
  box-shadow: 0 3px 12px rgba(0,0,0,0.2);
  letter-spacing: 0.3px;
}

/* Destination Marker - Accent Gold */
.dest-marker {
  position: relative;
  width: 48px;
  height: 48px;
}
.dest-marker-inner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(145deg, #E8B87A, #d4a574);
  border: 4px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 4px 20px rgba(212, 165, 116, 0.5), 0 0 0 2px rgba(212, 165, 116, 0.2);
}
.dest-label {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  background: #d4a574;
  color: #3d2817;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 14px;
  white-space: nowrap;
  box-shadow: 0 3px 12px rgba(0,0,0,0.15);
  letter-spacing: 0.3px;
}

/* Driver Marker - Grab Green Style */
.driver-marker {
  position: relative;
  width: 60px;
  height: 60px;
}
.driver-marker-inner {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(145deg, #00B14F, #00963E);
  border: 5px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 6px 30px rgba(0, 177, 79, 0.6), 0 0 0 3px rgba(0, 177, 79, 0.15);
  animation: driverPulse 2s ease-in-out infinite;
  z-index: 100;
}
.driver-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(0, 177, 79, 0.15);
  animation: ringPulse 2s ease-in-out infinite;
}
.driver-label {
  position: absolute;
  top: -36px;
  left: 50%;
  transform: translateX(-50%);
  background: #00B14F;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 14px;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0, 177, 79, 0.4);
  letter-spacing: 0.3px;
}

@keyframes driverPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 6px 30px rgba(0, 177, 79, 0.6), 0 0 0 3px rgba(0, 177, 79, 0.15); }
  50% { transform: scale(1.05); box-shadow: 0 8px 40px rgba(0, 177, 79, 0.8), 0 0 0 6px rgba(0, 177, 79, 0.1); }
}
@keyframes ringPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
  50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
}

/* Route Line Styling */
.leaflet-interactive {
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
</head>
<body>
<div id="map"></div>
<script>
// Initialize map with smooth options
var map = L.map('map', {
  zoomControl: false,
  attributionControl: false,
  fadeAnimation: true,
  zoomAnimation: true,
  markerZoomAnimation: true
});

// Beautiful map tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  subdomains: 'abcd'
}).addTo(map);

// Shop marker
var shopIcon = L.divIcon({
  html: '<div class="shop-marker"><div class="shop-marker-inner">☕</div><div class="shop-label">Cafe Empire</div></div>',
  iconSize: [52, 84],
  iconAnchor: [26, 52],
  className: ''
});

// Destination marker
var destIcon = L.divIcon({
  html: '<div class="dest-marker"><div class="dest-marker-inner">📍</div><div class="dest-label">Your Location</div></div>',
  iconSize: [48, 80],
  iconAnchor: [24, 48],
  className: ''
});

// Driver marker
var driverIcon = L.divIcon({
  html: '<div class="driver-marker"><div class="driver-ring"></div><div class="driver-marker-inner">🛵</div><div class="driver-label">On the way</div></div>',
  iconSize: [60, 96],
  iconAnchor: [30, 60],
  className: ''
});

// Add markers
var shopMarker = L.marker([${shopLat}, ${shopLng}], { icon: shopIcon }).addTo(map);
var destMarker = L.marker([${deliveryLat}, ${deliveryLng}], { icon: destIcon }).addTo(map);

// Create curved route using bezier curve
function createCurvedRoute(start, end) {
  var points = [];
  var midLat = (start[0] + end[0]) / 2;
  var midLng = (start[1] + end[1]) / 2;
  
  // Calculate perpendicular offset for curve
  var dx = end[1] - start[1];
  var dy = end[0] - start[0];
  var dist = Math.sqrt(dx * dx + dy * dy);
  var offsetScale = dist * 0.15;
  
  // Control point offset perpendicular to the line
  var ctrlLat = midLat + (dx / dist) * offsetScale * 0.5;
  var ctrlLng = midLng - (dy / dist) * offsetScale * 0.5;
  
  // Generate bezier curve points
  for (var t = 0; t <= 1; t += 0.02) {
    var lat = Math.pow(1-t, 2) * start[0] + 2 * (1-t) * t * ctrlLat + Math.pow(t, 2) * end[0];
    var lng = Math.pow(1-t, 2) * start[1] + 2 * (1-t) * t * ctrlLng + Math.pow(t, 2) * end[1];
    points.push([lat, lng]);
  }
  return points;
}

var routePoints = createCurvedRoute([${shopLat}, ${shopLng}], [${deliveryLat}, ${deliveryLng}]);

// Route shadow
L.polyline(routePoints, {
  color: '#00B14F',
  weight: 8,
  opacity: 0.2,
  lineCap: 'round'
}).addTo(map);

// Main route line
L.polyline(routePoints, {
  color: '#00B14F',
  weight: 5,
  opacity: 0.9,
  lineCap: 'round'
}).addTo(map);

// Animated dashed line overlay
var dashLine = L.polyline(routePoints, {
  color: '#fff',
  weight: 3,
  opacity: 0.6,
  dashArray: '8, 16',
  lineCap: 'round'
}).addTo(map);

// Driver marker (if position available)
var driverMarker = null;
${driverLat && driverLng ? `
driverMarker = L.marker([${driverLat}, ${driverLng}], {
  icon: driverIcon,
  zIndexOffset: 1000
}).addTo(map);
` : ''}

// Fit bounds with padding
var bounds = L.latLngBounds([
  [${shopLat}, ${shopLng}],
  [${deliveryLat}, ${deliveryLng}]
]);
${driverLat && driverLng ? `bounds.extend([${driverLat}, ${driverLng}]);` : ''}
map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });

// Update driver position function
function updateDriverPosition(lat, lng) {
  if (!driverMarker) {
    driverMarker = L.marker([lat, lng], {
      icon: driverIcon,
      zIndexOffset: 1000
    }).addTo(map);
  } else {
    // Smooth animation to new position
    var currentLatLng = driverMarker.getLatLng();
    var targetLatLng = L.latLng(lat, lng);
    var steps = 20;
    var stepLat = (targetLatLng.lat - currentLatLng.lat) / steps;
    var stepLng = (targetLatLng.lng - currentLatLng.lng) / steps;
    var currentStep = 0;
    
    function animate() {
      if (currentStep < steps) {
        currentStep++;
        var newLat = currentLatLng.lat + stepLat * currentStep;
        var newLng = currentLatLng.lng + stepLng * currentStep;
        driverMarker.setLatLng([newLat, newLng]);
        requestAnimationFrame(animate);
      }
    }
    animate();
  }
  
  // Extend bounds to include driver
  var newBounds = L.latLngBounds([
    [${shopLat}, ${shopLng}],
    [${deliveryLat}, ${deliveryLng}],
    [lat, lng]
  ]);
  map.fitBounds(newBounds, { padding: [80, 80], maxZoom: 16, animate: true });
}

// Message handlers for React Native
function handleMessage(event) {
  try {
    var data = JSON.parse(event.data);
    if (data.type === 'updateDriver' && data.lat && data.lng) {
      updateDriverPosition(data.lat, data.lng);
    }
  } catch (e) {}
}

window.addEventListener('message', handleMessage);
document.addEventListener('message', handleMessage);

// Signal map ready
window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
</script>
</body>
</html>`;

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady' && onMapReady) {
        onMapReady();
      }
    } catch {}
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        originWhitelist={['*']}
        onMessage={onMessage}
        onError={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E4E0',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
