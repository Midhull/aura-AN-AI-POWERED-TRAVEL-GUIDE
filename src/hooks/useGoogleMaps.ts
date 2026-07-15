import { useState, useEffect } from "react";

let isScriptLoading = false;
let isScriptLoaded = false;
const loadCallbacks: (() => void)[] = [];

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(isScriptLoaded);

  useEffect(() => {
    if (isScriptLoaded) {
      setIsLoaded(true);
      return;
    }

    const callback = () => setIsLoaded(true);
    loadCallbacks.push(callback);

    if (!isScriptLoading) {
      isScriptLoading = true;
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
      if (!apiKey) {
        console.error("VITE_GOOGLE_MAPS_API_KEY is not defined in environment variables");
      }
      
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        isScriptLoaded = true;
        isScriptLoading = false;
        while (loadCallbacks.length > 0) {
          const cb = loadCallbacks.shift();
          if (cb) cb();
        }
      };
      script.onerror = (err) => {
        console.error("Failed to load Google Maps script:", err);
      };
      document.head.appendChild(script);
    }

    return () => {
      const index = loadCallbacks.indexOf(callback);
      if (index !== -1) {
        loadCallbacks.splice(index, 1);
      }
    };
  }, []);

  return { isLoaded };
}
