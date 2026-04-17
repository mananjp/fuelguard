import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2 } from 'lucide-react';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GUJARAT_CENTER = [23.0225, 72.5714]; // Ahmedabad

export default function LiveMap({ trucks = [] }) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <div className={isFullScreen ? "fixed inset-0 z-[9999] bg-white" : "relative h-full w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner"}>
      <button 
        onClick={() => setIsFullScreen(!isFullScreen)}
        className="absolute top-4 right-4 z-[1000] p-2 bg-white rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-all text-indigo-900"
        title={isFullScreen ? "Minimize" : "Full Screen"}
      >
        {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>

      <MapContainer 
        center={GUJARAT_CENTER} 
        zoom={12} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {trucks.map((truck) => (
          <Marker 
            key={truck.id} 
            position={truck.position || GUJARAT_CENTER}
          >
            <Popup className="font-sans">
              <div className="p-1">
                <p className="font-black text-indigo-900 leading-none">{truck.truckId}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{truck.driver}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`w-2 h-2 rounded-full ${truck.status === 'On Trip' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-[10px] font-black uppercase text-gray-600">{truck.status} • {truck.speed}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
