import React, { useEffect, useState, useRef } from "react";
import { freeMapService } from "../../services/freeMapService";

interface ItineraryMapProps {
  /** The full itinerary days as returned by the server */
  itineraryDays: any[];
}

export const ItineraryMap: React.FC<ItineraryMapProps> = ({ itineraryDays }) => {
  const [maplibreLoaded, setMaplibreLoaded] = useState(false);
  const [markers, setMarkers] = useState<{
    position: { lat: number; lng: number };
    dayNumber: number;
    activity: any;
  }[]>([]);
  const [resolving, setResolving] = useState(false);
  const [routeStats, setRouteStats] = useState<{ distanceKm: number; durationMins: number } | null>(null);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  // Dynamically load MapLibre GL JS script and stylesheet
  useEffect(() => {
    if (!document.getElementById("maplibre-css")) {
      const link = document.createElement("link");
      link.id = "maplibre-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("maplibre-js")) {
      const script = document.createElement("script");
      script.id = "maplibre-js";
      script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
      script.async = true;
      script.onload = () => setMaplibreLoaded(true);
      document.body.appendChild(script);
    } else {
      setMaplibreLoaded(true);
    }
  }, []);

  // Geocode all activity locations using the free geocoding service
  useEffect(() => {
    if (!itineraryDays || itineraryDays.length === 0) return;

    let cancelled = false;
    const resolved: typeof markers = [];

    const geocodeAll = async () => {
      setResolving(true);
      setRouteStats(null);
      
      for (const day of itineraryDays) {
        if (!day.activities) continue;
        for (const act of day.activities) {
          if (!act.locationName) continue;
          
          try {
            const results = await freeMapService.geocode(act.locationName);
            if (results && results.length > 0 && !cancelled) {
              resolved.push({
                position: { lat: results[0].lat, lng: results[0].lng },
                dayNumber: day.dayNumber,
                activity: act,
              });
            }
          } catch (e) {
            console.warn("Geocoding failed for activity location:", act.locationName, e);
          }
        }
      }

      if (!cancelled) {
        setMarkers(resolved);
        setResolving(false);
      }
    };

    geocodeAll();

    return () => {
      cancelled = true;
    };
  }, [itineraryDays]);

  // Render and update MapLibre Map instance
  useEffect(() => {
    if (!maplibreLoaded || !mapRef.current || markers.length === 0) return;

    const maplibregl = (window as any).maplibregl;
    if (!maplibregl) return;

    const mapCenter: [number, number] = [markers[0].position.lng, markers[0].position.lat];
    
    // Clean up previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize MapLibre Map using premium keyless CartoDB Dark Matter tiles
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            ],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
          }
        },
        layers: [
          {
            id: "carto-dark-layer",
            type: "raster",
            source: "carto-dark",
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: mapCenter,
      zoom: 12,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Add navigation (zoom) control at bottom-right
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    const bounds = new maplibregl.LngLatBounds();

    // Add activity markers to the map
    markers.forEach((m) => {
      // Create HTML element for custom gold marker
      const el = document.createElement("div");
      el.className = "select-none cursor-pointer flex items-center justify-center font-bold text-xs shadow-lg transition-transform hover:scale-110";
      el.style.width = "26px";
      el.style.height = "26px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#e6c27e"; // Gold
      el.style.border = "2px solid #08080a";
      el.style.color = "#08080a";
      el.textContent = String(m.dayNumber);

      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="color: #111111; font-family: system-ui, -apple-system, sans-serif; padding: 6px; line-height: 1.4; max-width: 220px;">
          <h4 style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #111111;">${m.activity.title}</h4>
          <p style="margin: 0 0 2px; font-size: 11px; font-weight: 600; color: #b45309;">Day ${m.dayNumber} - ${m.activity.timeSlot}</p>
          <p style="margin: 0; font-size: 10px; color: #4b5563;">${m.activity.locationName}</p>
        </div>
      `);

      new maplibregl.Marker(el)
        .setLngLat([m.position.lng, m.position.lat])
        .setPopup(popup)
        .addTo(map);

      bounds.extend([m.position.lng, m.position.lat]);
    });

    if (markers.length > 1) {
      // Fit to marker bounds
      map.fitBounds(bounds, { padding: 60 });
    }

    // Fetch and Draw routing paths
    const drawRoute = async () => {
      if (markers.length < 2) return;
      try {
        const routeData = await freeMapService.getRoute(markers.map(m => m.position));
        if (routeData && mapInstanceRef.current === map) {
          setRouteStats({
            distanceKm: routeData.distanceKm,
            durationMins: routeData.durationMins
          });

          // Add Route geometry source
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: routeData.coordinates
              }
            }
          });

          // Add Route line layer
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round"
            },
            paint: {
              "line-color": "#e6c27e",
              "line-width": 4,
              "line-opacity": 0.85
            }
          });
        }
      } catch (err) {
        console.warn("Failed to retrieve routing geometry:", err);
      }
    };

    map.on("load", () => {
      drawRoute();
    });

    return () => {
      if (mapInstanceRef.current === map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [maplibreLoaded, markers]);

  if (!maplibreLoaded || resolving) {
    return (
      <div className="w-full h-[400px] bg-white/5 animate-pulse rounded-2xl flex flex-col items-center justify-center text-white/50 gap-2 border border-white/5">
        <div className="h-6 w-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">Loading open-source mapping engine and resolving coordinates...</span>
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="w-full h-[150px] bg-white/5 rounded-2xl flex items-center justify-center text-white/40 border border-white/5 text-xs">
        No locations could be mapped for this itinerary.
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
      {routeStats && (
        <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl text-xs flex flex-col gap-0.5 shadow-lg select-none">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-gold">Route Estimates</span>
          <span className="text-white/80 font-mono">
            Total Distance: <strong className="text-white">{routeStats.distanceKm} km</strong>
          </span>
          <span className="text-white/80 font-mono">
            Est. Driving Time: <strong className="text-white">{routeStats.durationMins} mins</strong>
          </span>
        </div>
      )}
      <div 
        ref={mapRef} 
        style={{ width: "100%", height: "100%" }} 
        className="z-0"
      />
    </div>
  );
};
