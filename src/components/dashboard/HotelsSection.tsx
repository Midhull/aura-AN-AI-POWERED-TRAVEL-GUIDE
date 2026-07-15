import React, { useState, useEffect } from "react";
import { Building2, Star, MapPin } from "lucide-react";
import { PlaceSearchAutocomplete } from "../google/PlaceSearchAutocomplete";
import { freeMapService, POIResult } from "../../services/freeMapService";

interface HotelSuggestion {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  photoUrl: string;
}

const hotelPhotos = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80"
];

export function HotelsSection() {
  const [searchLocation, setSearchLocation] = useState<string>("");
  const [hotels, setHotels] = useState<HotelSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchLocation) return;

    let cancelled = false;

    const fetchHotels = async () => {
      setLoading(true);
      setApiError(null);
      
      try {
        // Resolve coords using free geocoding service
        const geoResults = await freeMapService.geocode(searchLocation);
        if (cancelled) return;

        if (geoResults.length === 0) {
          setHotels([]);
          setLoading(false);
          return;
        }

        const { lat, lng } = geoResults[0];

        // Fetch lodgings via Overpass API
        const poiResults = await freeMapService.getNearbyPOIs(lat, lng, "lodging");
        if (cancelled) return;

        const mapped: HotelSuggestion[] = poiResults.map((poi, idx) => {
          // Select a beautiful hotel stock photo deterministically based on name hash
          let hash = 0;
          for (let i = 0; i < poi.name.length; i++) {
            hash = poi.name.charCodeAt(i) + ((hash << 5) - hash);
          }
          const photoIndex = Math.abs(hash) % hotelPhotos.length;
          const photoUrl = hotelPhotos[photoIndex];

          return {
            place_id: poi.id,
            name: poi.name,
            vicinity: poi.vicinity,
            rating: poi.rating,
            user_ratings_total: poi.user_ratings_total,
            business_status: poi.business_status,
            photoUrl,
          };
        });

        setHotels(mapped);
      } catch (err: any) {
        console.error("Overpass lodging query failed:", err);
        if (!cancelled) {
          setHotels([]);
          setApiError(err.message || "Failed to retrieve hotel list.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchHotels();

    return () => {
      cancelled = true;
    };
  }, [searchLocation]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl mb-2 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-gold" />
          Hotels & Stays
        </h1>
        <p className="text-white/60">
          Search for a destination to discover nearby luxury hotels, stays, and lodgings via OpenStreetMap and Overpass.
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
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white/5 rounded-2xl h-[320px] animate-pulse border border-white/5" />
            ))}
          </div>
        )}

        {apiError && (
          <div className="flex flex-col items-center justify-center p-12 bg-red-950/20 border border-red-500/20 rounded-2xl text-center space-y-3 mb-6">
            <span className="text-sm font-semibold text-red-400">Lodging Query Error</span>
            <p className="text-xs text-white/70 max-w-lg">{apiError}</p>
            <p className="text-[10px] text-white/40 max-w-md">
              The query could not be completed. Please check your internet connection or try again shortly.
            </p>
          </div>
        )}

        {!loading && hotels.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {hotels.map((hotel, idx) => (
              <div
                key={hotel.place_id || idx}
                className="group relative bg-[oklch(0.12_0.02_250)] rounded-2xl overflow-hidden border border-white/10 hover:border-gold/30 transition-all hover:shadow-glow-gold flex flex-col"
              >
                {/* Image */}
                <div className="h-48 w-full bg-white/5 relative overflow-hidden shrink-0">
                  {hotel.photoUrl ? (
                    <img
                      src={hotel.photoUrl}
                      alt={hotel.name}
                      referrerPolicy="no-referrer"
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
                      {hotel.user_ratings_total || 0} Reviews
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

        {!loading && searchLocation && hotels.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 bg-white/5 rounded-2xl border border-white/10 text-center space-y-4">
            <Building2 className="h-12 w-12 text-white/20" />
            <div>
              <h3 className="text-lg font-bold text-white mb-1">No hotels found</h3>
              <p className="text-sm text-white/50">We couldn't find any lodging near this location. Try another search.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
