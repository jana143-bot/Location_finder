import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Forward ref to expose map control methods to parent
const MapComponent = forwardRef(({ results, selectedLocation, loading }, ref) => {
  const mapRef = useRef(null);
  const [markerPos, setMarkerPos] = useState(null);

  // Expose updateLocation method for parent to call
  useImperativeHandle(ref, () => ({
    updateLocation: (lat, lng) => {
      const position = [lat, lng];
      setMarkerPos(position);
      if (mapRef.current) {
        mapRef.current.setView(position, 13, { animate: true, duration: 1 });
      }
    }
  }));

  // Sync with selectedLocation prop
  useEffect(() => {
    if (selectedLocation) {
      const lat = parseFloat(selectedLocation.lat);
      const lng = parseFloat(selectedLocation.lon);
      const position = [lat, lng];
      setMarkerPos(position);
      if (mapRef.current) {
        mapRef.current.setView(position, 13, { animate: true, duration: 1 });
      }
    }
  }, [selectedLocation]);

  const defaultCenter = [20, 0];
  const tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &amp; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div className="map-wrapper modern-card fade-in relative overflow-hidden" style={{ height: '50vh', minHeight: '350px', maxHeight: '600px', width: '100%' }}>
      {loading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backgroundColor: 'rgba(5, 8, 22, 0.6)', backdropFilter: 'blur(4px)',
          zIndex: 20, borderRadius: '16px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Loader2 className="animate-spin" size={32} style={{ color: '#00FF9D' }} />
            <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Loading Map Data...</span>
          </div>
        </div>
      )}
      <MapContainer
        center={defaultCenter}
        zoom={2}
        style={{ height: '100%', width: '100%', borderRadius: '16px' }}
        scrollWheelZoom={true}
        whenCreated={mapInstance => { mapRef.current = mapInstance; }}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
      >
        <TileLayer attribution={attribution} url={tileUrl} noWrap={true} reuseTiles={true} />
        {markerPos && (
          <Marker position={markerPos}>
            <Popup>
              <strong>{selectedLocation?.name || selectedLocation?.display_name?.split(',')[0] || 'Location'}</strong><br />
              Lat: {markerPos[0].toFixed(4)}<br />
              Lon: {markerPos[1].toFixed(4)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
});

export default MapComponent;
