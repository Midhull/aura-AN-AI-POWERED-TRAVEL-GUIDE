import React, { useState, useEffect } from "react";
import { freeMapService, GeocodeResult } from "../../services/freeMapService";

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

export const PlaceSearchAutocomplete: React.FC<PlaceSearchAutocompleteProps> = ({
  onPlaceSelected,
  initialValue = "",
}) => {
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setValue(query);
    
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    try {
      const results = await freeMapService.geocode(query);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    } catch (err) {
      console.warn("Fuzzy geocode suggestion fetch failed:", err);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Search destination (e.g. Paris, Tokyo)…"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(suggestions.length > 0)}
          onBlur={() => {
            // Delay closing so click on suggestion goes through
            setTimeout(() => setShowDropdown(false), 250);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onPlaceSelected(value);
              setShowDropdown(false);
            }
          }}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-sm text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-all"
        />
        {searching && (
          <div className="absolute right-4 h-4 w-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        )}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-[#121620] border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <button
              key={`${s.lat}-${s.lng}-${idx}`}
              type="button"
              onClick={() => {
                setValue(s.name);
                onPlaceSelected(s.name);
                setSuggestions([]);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs text-white/70 hover:bg-white/5 hover:text-white border-b border-white/5 transition"
            >
              <div className="font-semibold text-white/90">{s.name}</div>
              <div className="text-[10px] text-white/40 truncate">{s.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
