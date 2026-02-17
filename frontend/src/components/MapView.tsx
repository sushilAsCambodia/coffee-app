import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../constants/theme';

interface MapProps {
  shopLat: number;
  shopLng: number;
  deliveryLat: number;
  deliveryLng: number;
  driverLat?: number;
  driverLng?: number;
  status: string;
  style?: any;
}

const generateMapHTML = (shopLat: number, shopLng: number, deliveryLat: number, deliveryLng: number, driverLat?: number, driverLng?: number, status?: string) => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;background:#e8e0d4}
  .shop-icon{background:#6f4e37;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)}
  .delivery-icon{background:#d4a574;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)}
  .driver-icon{background:#3B82F6;color:#fff;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #fff;box-shadow:0 4px 12px rgba(59,130,246,0.5);animation:pulse 2s infinite}
  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(59,130,246,0.4)}70%{box-shadow:0 0 0 15px rgba(59,130,246,0)}100%{box-shadow:0 0 0 0 rgba(59,130,246,0)}}
  .leaflet-control-zoom{display:none}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:false});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

var shopIcon=L.divIcon({html:'<div class="shop-icon">☕</div>',iconSize:[36,36],iconAnchor:[18,18],className:''});
var deliveryIcon=L.divIcon({html:'<div class="delivery-icon">🏠</div>',iconSize:[36,36],iconAnchor:[18,18],className:''});
var driverIcon=L.divIcon({html:'<div class="driver-icon">🛵</div>',iconSize:[42,42],iconAnchor:[21,21],className:''});

var shopMarker=L.marker([${shopLat},${shopLng}],{icon:shopIcon}).addTo(map).bindPopup('<b>Cafe Empire</b><br>Your order is here');
var deliveryMarker=L.marker([${deliveryLat},${deliveryLng}],{icon:deliveryIcon}).addTo(map).bindPopup('<b>Delivery Location</b>');

var routeLine=L.polyline([[${shopLat},${shopLng}],[${deliveryLat},${deliveryLng}]],{color:'#6f4e37',weight:4,opacity:0.7,dashArray:'10, 8'}).addTo(map);

var driverMarker=null;
${driverLat ? `driverMarker=L.marker([${driverLat},${driverLng}],{icon:driverIcon}).addTo(map).bindPopup('<b>Your Driver</b><br>On the way!');` : ''}

var bounds=L.latLngBounds([[${shopLat},${shopLng}],[${deliveryLat},${deliveryLng}]]);
${driverLat ? `bounds.extend([${driverLat},${driverLng}]);` : ''}
map.fitBounds(bounds,{padding:[50,50]});

function updateDriver(lat,lng){
  if(driverMarker){driverMarker.setLatLng([lat,lng])}
  else{driverMarker=L.marker([lat,lng],{icon:driverIcon}).addTo(map)}
}
document.addEventListener('message',function(e){
  try{var d=JSON.parse(e.data);if(d.type==='updateDriver')updateDriver(d.lat,d.lng)}catch(err){}
});
window.addEventListener('message',function(e){
  try{var d=JSON.parse(e.data);if(d.type==='updateDriver')updateDriver(d.lat,d.lng)}catch(err){}
});
</script>
</body>
</html>`;

export default function MapView({ shopLat, shopLng, deliveryLat, deliveryLng, driverLat, driverLng, status, style }: MapProps) {
  const webViewRef = useRef<any>(null);
  const html = generateMapHTML(shopLat, shopLng, deliveryLat, deliveryLng, driverLat, driverLng, status);

  useEffect(() => {
    if (webViewRef.current && driverLat && driverLng) {
      const msg = JSON.stringify({ type: 'updateDriver', lat: driverLat, lng: driverLng });
      webViewRef.current.postMessage(msg);
    }
  }, [driverLat, driverLng]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled={true}
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: 300, borderRadius: 20, overflow: 'hidden', backgroundColor: '#e8e0d4' },
  webview: { flex: 1 },
});
