import React, { useEffect, useState } from 'react';

interface ActivityPhotoProps {
  /** Name or address of the location to fetch a photo for */
  locationName: string;
  /** Desired max width of the photo in pixels */
  maxWidth?: number;
}

/**
 * Retrieves a beautiful travel photo from Unsplash deterministically based on locationName.
 * Bypasses Google Places API key requirements.
 */
export const ActivityPhoto: React.FC<ActivityPhotoProps> = ({ locationName, maxWidth = 300 }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!locationName) return;

    const travelPhotos = [
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1473116763269-255ea7b0b5f1?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80"
    ];

    let hash = 0;
    for (let i = 0; i < locationName.length; i++) {
      hash += locationName.charCodeAt(i);
    }
    const index = hash % travelPhotos.length;
    setPhotoUrl(travelPhotos[index]);
  }, [locationName]);

  if (!photoUrl) {
    return <div className="h-48 w-full bg-white/5 animate-pulse rounded" />;
  }

  return (
    <img
      src={photoUrl}
      alt={locationName}
      className="w-full h-auto max-h-48 object-cover rounded"
    />
  );
};
