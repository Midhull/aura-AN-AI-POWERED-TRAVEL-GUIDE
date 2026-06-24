import React, { useState, useRef } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

interface PlaceSearchAutocompleteProps {
  /**
   * Callback invoked when a place is selected.
   * The argument is the formatted address (or name) of the place.
   */
  onPlaceSelected: (placeName: string) => void;
  /**
   * Optional initial value for the input field.
   */
  initialValue?: string;
}

const libraries: ("places")[] = ["places"];

export const PlaceSearchAutocomplete: React.FC<PlaceSearchAutocompleteProps> = ({
  onPlaceSelected,
  initialValue = '',
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [value, setValue] = useState(initialValue);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place && place.formatted_address) {
      setValue(place.formatted_address);
      onPlaceSelected(place.formatted_address);
    } else if (place && place.name) {
      setValue(place.name);
      onPlaceSelected(place.name);
    }
  };

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  if (!isLoaded) {
    return (
      <input
        type="text"
        placeholder="Loading..."
        disabled
        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-sm text-white/50 placeholder:text-white/20 focus:outline-none"
      />
    );
  }

  return (
    <Autocomplete onLoad={onLoad} onPlaceChanged={handlePlaceChanged}>
      <input
        type="text"
        placeholder="Search destination…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-sm text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none"
      />
    </Autocomplete>
  );
};

