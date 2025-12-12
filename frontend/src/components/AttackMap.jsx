import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './AttackMap.css'; // Make sure this file exists (see below)
import L from 'leaflet';

// --- 1. CUSTOM PULSING ICON ---
// Instead of an image, we use HTML/CSS to create a glowing radar dot
const createRadarIcon = () => {
  return L.divIcon({
    className: 'radar-marker', // Hooks into AttackMap.css
    html: `
      <div class="radar-pulse"></div>
      <div class="radar-dot"></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10], // Center the point
    popupAnchor: [0, -10]
  });
};

const radarIcon = createRadarIcon();

// --- 2. LOCATION DATABASE ---
// Maps the location strings from Backend to Lat/Long
const locationMap = {
  "New York, USA": [40.7128, -74.0060],
  "Moscow, Russia": [55.7558, 37.6173],
  "Lagos, Nigeria": [6.5244, 3.3792],
  "Beijing, China": [39.9042, 116.4074],
  "Vellore, India": [12.9165, 79.1325],
  "London, UK": [51.5074, -0.1278],
};

// --- 3. AUTO-PAN COMPONENT ---
// This invisible component watches the logs and moves the camera
const MapUpdater = ({ latestLog }) => {
  const map = useMap();
  
  useEffect(() => {
    if (latestLog && locationMap[latestLog.location]) {
      // Smoothly fly to the newest attack
      map.flyTo(locationMap[latestLog.location], 4, {
        duration: 2.0, // Animation duration in seconds
        easeLinearity: 0.25
      });
    }
  }, [latestLog, map]);

  return null;
};

const AttackMap = ({ logs }) => {
  // Filter only logs that have coordinates
  const markers = logs
    .filter(log => locationMap[log.location])
    .map(log => ({
      ...log,
      coords: locationMap[log.location]
    }));

  // Get the most recent log for the "FlyTo" effect
  const latestLog = markers.length > 0 ? markers[0] : null;

  return (
    <MapContainer 
      center={[20, 0]} 
      zoom={2} 
      minZoom={2}
      style={{ height: "100%", width: "100%", background: '#0f172a' }}
      scrollWheelZoom={true} 
      zoomControl={false} // Cleaner look, use scroll to zoom
    >
      {/* High-Tech Dark Map Tiles (CartoDB Dark Matter) */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      {/* Auto-Pan Controller */}
      <MapUpdater latestLog={latestLog} />

      {markers.map((log) => (
        <Marker key={log.id} position={log.coords} icon={radarIcon}>
          <Popup closeButton={false}>
            <div style={{ color: 'white' }}>
               <strong style={{color: '#ef4444', fontSize:'13px', display:'block', marginBottom:'4px'}}>
                 {log.reason}
               </strong>
               <div style={{fontSize:'11px', opacity:0.8, marginBottom:'2px'}}>
                 {log.location}
               </div>
               <div style={{fontSize:'10px', fontFamily:'monospace', color:'#94a3b8'}}>
                 {log.ip}
               </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default AttackMap;