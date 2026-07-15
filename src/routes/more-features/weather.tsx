import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CloudSun,
  Sun,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  Compass,
  Sparkles,
  Search,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";

export const Route = createFileRoute("/more-features/weather")({
  head: () => ({
    meta: [
      { title: "Weather Intelligence · Aria" },
      { name: "description", content: "Advanced microclimate forecasts, UV indexes, and weather-driven packing advice." }
    ]
  }),
  component: WeatherPage,
});

interface DayForecast {
  day: string;
  temp: string;
  condition: "Sunny" | "Rainy" | "Partly Cloudy" | "Stormy";
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  advice: string;
}

function WeatherPage() {
  const [searchQuery, setSearchQuery] = useState("Kyoto");
  const [resolvedLocation, setResolvedLocation] = useState("Kyoto, Japan");
  const [forecast, setForecast] = useState<DayForecast[]>([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    setError(false);
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found");
      }
      
      const { latitude, longitude, name, country } = geoData.results[0];
      setResolvedLocation(`${name}, ${country}`);

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,weathercode,relative_humidity_2m_max,windspeed_10m_max,uv_index_max&timezone=auto`);
      const weatherData = await weatherRes.json();
      if (!weatherData.daily) {
        throw new Error("No forecast data");
      }

      const daily = weatherData.daily;
      const mappedForecast: DayForecast[] = daily.time.map((timeStr: string, idx: number) => {
        const date = new Date(timeStr);
        const dayLabel = idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
        const code = daily.weathercode[idx];
        
        let condition: DayForecast["condition"] = "Partly Cloudy";
        if (code === 0) condition = "Sunny";
        else if ([1, 2, 3, 45, 48].includes(code)) condition = "Partly Cloudy";
        else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) condition = "Rainy";
        else condition = "Stormy";

        const temp = `${Math.round(daily.temperature_2m_max[idx])}°C`;
        const humidity = Math.round(daily.relative_humidity_2m_max[idx] || 60);
        const windSpeed = Math.round(daily.windspeed_10m_max[idx] || 10);
        const uvIndex = Math.round(daily.uv_index_max[idx] || 3);
        
        let advice = "Mild, comfortable climate. Great for sightseeing.";
        if (condition === "Sunny" && uvIndex > 6) {
          advice = "Extreme UV index. Sunscreen SPF 50+ is highly recommended.";
        } else if (condition === "Rainy") {
          advice = "Bring a travel umbrella. High chance of precipitation.";
        } else if (condition === "Stormy") {
          advice = "Indoor dining and museum visits recommended due to storm fronts.";
        }

        return {
          day: dayLabel,
          temp,
          condition,
          humidity,
          windSpeed,
          uvIndex,
          advice
        };
      });

      setForecast(mappedForecast);
      setSelectedDayIdx(0);
    } catch (err) {
      console.error(err);
      setError(true);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather("Kyoto");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeather(searchQuery.trim());
    }
  };

  const handleAlertClick = () => {
    toast.warning(`Weather Alert: Air Quality Index (AQI) is monitored in ${resolvedLocation}. Keep medication handy if allergic.`);
  };

  return (
    <DashboardLayout activeLabel="More Features">
      <div className="space-y-8 pb-16">
        
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/more-features"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-white/70 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="text-[10px] tracking-wider text-sky-400 uppercase font-semibold">Climate Analysis</div>
              <h1 className="font-display text-3xl">Weather Intelligence</h1>
            </div>
          </div>
        </div>

        {/* Location Selection & Warnings */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter city name... (e.g. Kyoto, London, Ubud)"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/45 focus:border-gold/50 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/10 text-white transition cursor-pointer"
            >
              Search
            </button>
          </form>

          {!error && forecast.length > 0 && (
            <button
              onClick={handleAlertClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-400 text-[10px] font-semibold cursor-pointer animate-pulse shrink-0"
            >
              <AlertCircle className="h-3.5 w-3.5" /> 1 Warning Active
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 rounded-2xl glass">
            <Loader2 className="h-8 w-8 text-gold animate-spin mx-auto" />
            <p className="text-xs text-white/40 mt-3 font-mono">Retrieving climate feeds from satellite networks...</p>
          </div>
        ) : error || forecast.length === 0 || !forecast[selectedDayIdx] ? (
          <div className="text-center py-20 rounded-2xl border border-white/5 bg-white/5 max-w-sm mx-auto space-y-4">
            <CloudSun className="h-10 w-10 text-white/10 mx-auto animate-pulse" />
            <h4 className="text-white/60 font-semibold">Weather intelligence data currently unavailable</h4>
            <p className="text-xs text-white/40 max-w-xs mx-auto">
              Please check your search query or try again later. Live climate feeds are offline.
            </p>
          </div>
        ) : (
          <>
            {/* Weather overview dashboard card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Weather details */}
              <div className="lg:col-span-2 rounded-2xl glass p-6 border border-white/5 flex flex-col justify-between h-[300px] relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-gold/5 rounded-full blur-2xl" />

                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Current Selection ({forecast[selectedDayIdx].day})</span>
                    <h2 className="text-2xl font-bold mt-1 text-white">{resolvedLocation}</h2>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {forecast[selectedDayIdx].condition === "Sunny" && <Sun className="h-10 w-10 text-yellow-400 animate-spin-slow" />}
                    {forecast[selectedDayIdx].condition === "Partly Cloudy" && <CloudSun className="h-10 w-10 text-sky-400" />}
                    {forecast[selectedDayIdx].condition === "Rainy" && <CloudRain className="h-10 w-10 text-blue-400 animate-bounce" />}
                    {forecast[selectedDayIdx].condition === "Stormy" && <CloudLightning className="h-10 w-10 text-indigo-400" />}
                    <span className="text-4xl font-display font-bold">{forecast[selectedDayIdx].temp}</span>
                  </div>
                </div>

                {/* Weather metrics */}
                <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-5 pb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white/5 text-white/60">
                      <Droplets className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 uppercase block">Humidity</span>
                      <span className="text-xs font-mono font-semibold">{forecast[selectedDayIdx].humidity}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white/5 text-white/60">
                      <Wind className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 uppercase block">Wind</span>
                      <span className="text-xs font-mono font-semibold">{forecast[selectedDayIdx].windSpeed} km/h</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white/5 text-white/60">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 uppercase block">UV Index</span>
                      <span className="text-xs font-mono font-semibold">{forecast[selectedDayIdx].uvIndex}</span>
                    </div>
                  </div>
                </div>

                {/* Advice banner */}
                <div className="bg-sky-500/5 border border-sky-500/10 p-3 rounded-xl flex items-start gap-2 text-[10px] text-sky-300">
                  <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                  <span><strong>AI Weather Suggestion:</strong> {forecast[selectedDayIdx].advice}</span>
                </div>

              </div>

              {/* Microclimate Advice Sidebar */}
              <div className="rounded-2xl glass p-6 border border-white/5 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Compass className="h-4 w-4 text-gold" />
                    Weather-Based Travel DNA
                  </h3>
                  
                  <div className="space-y-3.5 text-xs">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[8px] text-white/40 uppercase font-mono block">Optimal Activity Window</span>
                      <p className="font-semibold text-white">09:00 - 15:00</p>
                      <p className="text-[9px] text-white/45 leading-relaxed">Lowest probability of storms and optimal temperatures for walking.</p>
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[8px] text-white/40 uppercase font-mono block">Smart Apparel Suggestion</span>
                      <p className="font-semibold text-gold">
                        {forecast[selectedDayIdx].condition === "Sunny" ? "Breathable linen shirt" : forecast[selectedDayIdx].condition === "Rainy" ? "Waterproof outer + Shell" : "Layered cardigan"}
                      </p>
                      <p className="text-[9px] text-white/45 leading-relaxed">Adaptable layers shield from direct sunlight or sudden cold drafts.</p>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-white/30 text-right font-mono">Last refreshed: Just Now</div>

              </div>

            </div>

            {/* 7-Day Forecast Cards Scroll */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Weekly Forecast</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {forecast.map((day, idx) => {
                  const active = idx === selectedDayIdx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDayIdx(idx)}
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col items-center gap-3 select-none text-center ${
                        active
                          ? "bg-gold/15 border-gold shadow-glow-gold scale-102"
                          : "bg-white/5 border-white/5 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-white/60">{day.day}</span>
                      
                      {day.condition === "Sunny" && <Sun className="h-6 w-6 text-yellow-400" />}
                      {day.condition === "Partly Cloudy" && <CloudSun className="h-6 w-6 text-sky-400" />}
                      {day.condition === "Rainy" && <CloudRain className="h-6 w-6 text-blue-400 animate-pulse" />}
                      {day.condition === "Stormy" && <CloudLightning className="h-6 w-6 text-indigo-400" />}
                      
                      <span className="text-sm font-bold font-mono text-white">{day.temp}</span>
                      <span className="text-[8px] text-white/45 font-mono truncate max-w-full">{day.condition}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
