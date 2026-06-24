import React, { useEffect, useState } from 'react';

import { useJsApiLoader } from '@react-google-maps/api';

interface ActivityPhotoProps {
  /** Name or address of the location to fetch a photo for */
  locationName: string;
  /** Desired max width of the photo in pixels */
  maxWidth?: number;
}

const libraries: ("places")[] = ["places"];

/**
 * Retrieves a photo URL from the Google Places Photo API.
 * It first uses the PlacesService to find a placeId for the given location name,
 * then requests a photo reference and builds the final image URL.
 */
export const ActivityPhoto: React.FC<ActivityPhotoProps> = ({ locationName, maxWidth = 300 }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!locationName || !isLoaded || !window.google || !window.google.maps) return;
    // Create a temporary map for the service (required by the API)
    const map = new google.maps.Map(document.createElement('div'));
    const service = new google.maps.places.PlacesService(map);
    service.findPlaceFromQuery(
      {
        query: locationName,
        fields: ['photo', 'place_id'],
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const place = results[0];
          if (place.photos && place.photos.length > 0) {
            const url = place.photos[0].getUrl({ maxWidth });
            setPhotoUrl(url);
          } else {
            // Fallback to static map image if no photos
            const staticUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(
              locationName
            )}&zoom=15&size=${maxWidth}x200&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
            setPhotoUrl(staticUrl);
          }
        }
      }
    );
  }, [locationName, maxWidth, isLoaded]);

  if (!photoUrl) {
    return <div className="h-48 w-full bg-gray-800 animate-pulse rounded" />;
  }

  return (
    <img
      src={photoUrl}
      alt={locationName}
      className="w-full h-auto max-h-48 object-cover rounded"
    />
  );
};
