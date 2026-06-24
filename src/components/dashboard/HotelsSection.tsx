import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { Building2, Star, MapPin } from "lucide-react";
import { PlaceSearchAutocomplete } from "../google/PlaceSearchAutocomplete";

const libraries: ("places")[] = ["places"];

// Helper to geocode a location name to a LatLng
const geocodeAddress = (address: string): Promise<google.maps.LatLngLiteral> => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      return reject(new Error("Google Maps API not loaded"));
    }
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else {
        reject(new Error(`Geocode failed for "${address}" – ${status}`));
      }
    });
  });
};

export function HotelsSection() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [searchLocation, setSearchLocation] = useState<string>("");
  const [center, setCenter] = useState<google.maps.LatLngLiteral>({ lat: 48.8566, lng: 2.3522 }); // Default Paris
  const [hotels, setHotels] = useState<google.maps.places.PlaceResult[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<google.maps.places.PlaceResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !searchLocation) return;

    let cancelled = false;

    const fetchHotels = async () => {
      setLoading(true);
      try {
        const pos = await geocodeAddress(searchLocation);
        if (cancelled) return;
        setCenter(pos);

        // Fetch nearby hotels
        const mapDiv = document.createElement("div");
        const map = new google.maps.Map(mapDiv, { center: pos, zoom: 14 });
        const service = new google.maps.places.PlacesService(map);

        service.nearbySearch(
          {
            location: pos,
            radius: 5000, // 5km radius
            type: "lodging",
          },
          (results, status) => {
            if (cancelled) return;
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              setHotels(results);
            } else {
              setHotels([]);
            }
            setLoading(false);
          }
        );
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchHotels();

    return () => {
      cancelled = true;
    };
  }, [searchLocation, isLoaded]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl mb-2 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-gold" />
          Hotels & Stays
        </h1>
        <p className="text-white/60">
          Search for a destination to discover nearby luxury hotels, boutique stays, and highly-rated accommodations.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl">
        <PlaceSearchAutocomplete
          initialValue=""
          onPlaceSelected={(place) => setSearchLocation(place)}
        />
      </div>

      {/* Content Container */}
      <div className="w-full">
        {loadError && (
          <div className="flex items-center justify-center p-10 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
            Error loading Google Places API
          </div>
        )}
        
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white/5 rounded-2xl h-[320px] animate-pulse border border-white/5" />
            ))}
          </div>
        )}

        {!loading && isLoaded && hotels.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {hotels.map((hotel, idx) => (
              <div 
                key={hotel.place_id || idx} 
                className="group relative bg-[oklch(0.12_0.02_250)] rounded-2xl overflow-hidden border border-white/10 hover:border-gold/30 transition-all hover:shadow-glow-gold flex flex-col"
              >
                {/* Image */}
                <div className="h-48 w-full bg-white/5 relative overflow-hidden shrink-0">
                  {hotel.photos && hotel.photos.length > 0 ? (
                    <img 
                      src={hotel.photos[0].getUrl({ maxWidth: 400 })} 
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Building2 className="h-10 w-10 text-white/20" />
                    </div>
                  )}
                  {hotel.rating && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10">
                      <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                      <span className="text-xs font-bold text-white">{hotel.rating}</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-white mb-1 line-clamp-2">{hotel.name}</h3>
                    <div className="flex items-start gap-1.5 text-xs text-white/60 mb-3">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-white/40" />
                      <span className="line-clamp-2">{hotel.vicinity}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    <div className="text-[10px] text-white/50 uppercase font-mono tracking-wider">
                      {hotel.user_ratings_total || 0} Internet Reviews
                    </div>
                    <div className="text-xs font-semibold text-gold bg-gold/10 px-2 py-1 rounded border border-gold/20">
                      {hotel.business_status === "OPERATIONAL" ? "Open" : "Status Unknown"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && isLoaded && searchLocation && hotels.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 bg-white/5 rounded-2xl border border-white/10 text-center space-y-4">
            <Building2 className="h-12 w-12 text-white/20" />
            <div>
              <h3 className="text-lg font-bold text-white mb-1">No hotels found</h3>
              <p className="text-sm text-white/50">We couldn't find any lodgings near this location. Try another search.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
