import React, { useEffect, useState } from 'react';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { ActivityPhoto } from './ActivityPhoto';

interface ItineraryMapProps {
  /** The full itinerary days as returned by the server */
  itineraryDays: any[];
}

const libraries: ("places")[] = ["places"];

/**
 * Helper to geocode a location name to a LatLng using the browser's Maps API.
 */
const geocodeAddress = (address: string): Promise<google.maps.LatLngLiteral> => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      return reject(new Error("Google Maps API not loaded"));
    }
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results.length > 0) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else {
        reject(new Error(`Geocode failed for "${address}" – ${status}`));
      }
    });
  });
};

export const ItineraryMap: React.FC<ItineraryMapProps> = ({ itineraryDays }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [markers, setMarkers] = useState<{
    position: google.maps.LatLngLiteral;
    dayNumber: number;
    activity: any;
  }[]>([]);

  const [selected, setSelected] = useState<null | {
    position: google.maps.LatLngLiteral;
    activity: any;
    dayNumber: number;
  }>(null);

  // On mount and after script loads, geocode all activity locations.
  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;
    const fetchAll = async () => {
      const all: typeof markers = [];
      for (const day of itineraryDays) {
        for (const act of day.activities) {
          try {
            const pos = await geocodeAddress(act.locationName);
            if (!cancelled) {
              all.push({ position: pos, dayNumber: day.dayNumber, activity: act });
            }
          } catch (e) {
            console.warn('Geocode error', e);
          }
        }
      }
      if (!cancelled) setMarkers(all);
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [itineraryDays, isLoaded]);

  if (loadError) {
    return <div className="p-4 bg-red-500/10 text-red-500 rounded">Error loading maps API</div>;
  }

  if (!isLoaded) {
    return <div className="w-full h-[400px] bg-white/5 animate-pulse rounded-2xl flex items-center justify-center text-white/50">Loading Map...</div>;
  }

  // Determine map bounds centre – use first marker or a default.
  const defaultCenter = { lat: 0, lng: 0 } as google.maps.LatLngLiteral;
  const center = markers.length > 0 ? markers[0].position : defaultCenter;

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '400px', borderRadius: '1rem' }}
      center={center}
      zoom={markers.length > 0 ? 10 : 2}
      options={{ 
        disableDefaultUI: true,
        streetViewControl: false, 
        mapTypeControl: false, 
        styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
          featureType: "administrative.locality",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [{ color: "#263c3f" }],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6b9a76" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#38414e" }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#212a37" }],
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9ca5b3" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#746855" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry.stroke",
          stylers: [{ color: "#1f2835" }],
        },
        {
          featureType: "road.highway",
          elementType: "labels.text.fill",
          stylers: [{ color: "#f3d19c" }],
        },
        {
          featureType: "transit",
          elementType: "geometry",
          stylers: [{ color: "#2f3948" }],
        },
        {
          featureType: "transit.station",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#17263c" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.fill",
          stylers: [{ color: "#515c6d" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#17263c" }],
        },
      ]}}
    >
      {markers.map((m, idx) => (
        <Marker
          key={idx}
          position={m.position}
          onClick={() => setSelected({ position: m.position, activity: m.activity, dayNumber: m.dayNumber })}
        />
      ))}
      {selected && (
        <InfoWindow
          position={selected.position}
          onCloseClick={() => setSelected(null)}
        >
          <div className="p-2 max-w-xs text-gray-900">
            <h4 className="font-bold text-sm mb-1">{selected.activity.title}</h4>
            <p className="text-xs mb-2">Day {selected.dayNumber}</p>
            <ActivityPhoto locationName={selected.activity.locationName} />
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};
