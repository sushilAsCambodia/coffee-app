import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

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

export default function LiveMapView({ shopLat, shopLng, deliveryLat, deliveryLng, driverLat, driverLng, status, style }: MapProps) {
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    if (webViewRef.current && driverLat && driverLng) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'updateDriver', lat: driverLat, lng: driverLng }));
    }
  }, [driverLat, driverLng]);

  const html = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;background:#f0ebe4}
.leaflet-control-attribution{display:none!important}
.leaflet-control-zoom{display:none!important}
.shop-marker{
  width:44px;height:44px;border-radius:50%;background:#6f4e37;border:3px solid #fff;
  display:flex;align-items:center;justify-content:center;font-size:22px;
  box-shadow:0 3px 12px rgba(0,0,0,0.35);
}
.dest-marker{
  width:44px;height:44px;border-radius:50%;background:#d4a574;border:3px solid #fff;
  display:flex;align-items:center;justify-content:center;font-size:20px;
  box-shadow:0 3px 12px rgba(0,0,0,0.35);
}
.driver-marker{
  width:52px;height:52px;border-radius:50%;background:#1a73e8;border:4px solid #fff;
  display:flex;align-items:center;justify-content:center;font-size:24px;
  box-shadow:0 4px 20px rgba(26,115,232,0.55);
  animation:pulse 2s ease-in-out infinite;
}
@keyframes pulse{
  0%,100%{box-shadow:0 4px 20px rgba(26,115,232,0.55)}
  50%{box-shadow:0 4px 30px rgba(26,115,232,0.85),0 0 0 12px rgba(26,115,232,0.15)}
}
.label{
  position:absolute;top:-28px;left:50%;transform:translateX(-50%);
  background:#fff;color:#333;font-size:11px;font-weight:700;padding:3px 8px;
  border-radius:10px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.15);
}
.shop-marker .label{background:#6f4e37;color:#fff}
.dest-marker .label{background:#d4a574;color:#fff}
.driver-marker .label{background:#1a73e8;color:#fff}
</style>
</head><body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:false});

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
  maxZoom:19,subdomains:'abcd'
}).addTo(map);

var shopIcon=L.divIcon({html:'<div class="shop-marker"><span class="label">Cafe Empire</span>&#9749;</div>',iconSize:[44,44],iconAnchor:[22,22],className:''});
var destIcon=L.divIcon({html:'<div class="dest-marker"><span class="label">Delivery</span>&#127968;</div>',iconSize:[44,44],iconAnchor:[22,22],className:''});
var driverIconDiv=L.divIcon({html:'<div class="driver-marker"><span class="label">Driver</span>&#128690;</div>',iconSize:[52,52],iconAnchor:[26,26],className:''});

var shopM=L.marker([${shopLat},${shopLng}],{icon:shopIcon}).addTo(map);
var destM=L.marker([${deliveryLat},${deliveryLng}],{icon:destIcon}).addTo(map);

// Curved route
var midLat=(${shopLat}+${deliveryLat})/2+(Math.random()*0.003-0.0015);
var midLng=(${shopLng}+${deliveryLng})/2+(Math.random()*0.003-0.0015);
var pts=[];
for(var t=0;t<=1;t+=0.02){
  var lat=(1-t)*(1-t)*${shopLat}+2*(1-t)*t*midLat+t*t*${deliveryLat};
  var lng=(1-t)*(1-t)*${shopLng}+2*(1-t)*t*midLng+t*t*${deliveryLng};
  pts.push([lat,lng]);
}
L.polyline(pts,{color:'#1a73e8',weight:5,opacity:0.7,lineCap:'round'}).addTo(map);
L.polyline(pts,{color:'#1a73e8',weight:5,opacity:0.3,dashArray:'1,12',lineCap:'round'}).addTo(map);

var driverM=null;
${driverLat ? `driverM=L.marker([${driverLat},${driverLng}],{icon:driverIconDiv,zIndexOffset:1000}).addTo(map);` : ''}

var bounds=L.latLngBounds([[${shopLat},${shopLng}],[${deliveryLat},${deliveryLng}]]);
${driverLat ? `bounds.extend([${driverLat},${driverLng}]);` : ''}
map.fitBounds(bounds,{padding:[60,60],maxZoom:15});

function updateDriver(lat,lng){
  if(!driverM){driverM=L.marker([lat,lng],{icon:driverIconDiv,zIndexOffset:1000}).addTo(map);}
  else{driverM.setLatLng([lat,lng]);}
}
window.addEventListener('message',function(e){try{var d=JSON.parse(e.data);if(d.type==='updateDriver')updateDriver(d.lat,d.lng);}catch(x){}});
document.addEventListener('message',function(e){try{var d=JSON.parse(e.data);if(d.type==='updateDriver')updateDriver(d.lat,d.lng);}catch(x){}});
</script>
</body></html>`;

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled={true}
        originWhitelist={['*']}
        onError={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ebe4' },
  webview: { flex: 1 },
});
