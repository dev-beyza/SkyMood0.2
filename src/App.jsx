import { useEffect, useState } from "react";
import { fetchWeather, fetchCoordinates } from "./services/weather";
import { 
  getWeatherDetails, getWMOInfo, getDayName, 
  getHourlySummary, getDailySummary 
} from "./utils/weatherHelpers";
import { Search, MapPin } from "lucide-react"; 

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayTitle, setDisplayTitle] = useState("İstanbul");

  const getWeatherData = async (city) => {
    setLoading(true);
    const locationData = await fetchCoordinates(city);
    if (locationData) {
      const data = await fetchWeather(locationData.latitude, locationData.longitude);
      setWeatherData(data);
      setDisplayTitle(locationData.name);
    }
    setLoading(false);
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const data = await fetchWeather(latitude, longitude);
          setWeatherData(data);
          setDisplayTitle("Konumunuz");
          setLoading(false);
        }
      );
    }
  };

  useEffect(() => { getWeatherData("İstanbul"); }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      getWeatherData(searchTerm);
      setSearchTerm("");
    }
  };

  if (loading || !weatherData) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white/70 tracking-widest text-sm uppercase">Yükleniyor...</div>;
  }

  const { current, daily, hourly } = weatherData;
  const details = getWeatherDetails(current, daily);
  const currentPrecipitation = daily.precipitation_probability_max[7];

  // Yağmur veya Kar ikonu olup olmadığını ve oranın %10'dan büyük olup olmadığını kontrol eden akıllı filtre
  const shouldShowPrecip = (label, precip) => {
    const isRainOrSnow = /Yağmur|Sağanak|Kar|Çiseleyen/i.test(label);
    return isRainOrSnow && precip >= 10;
  };

  const currentHourIndex = hourly.time.findIndex(time => new Date(time) >= new Date());
  const nextHours = hourly.time.slice(currentHourIndex, currentHourIndex + 24).map((time, index) => ({
    time: new Date(time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    temp: Math.round(hourly.temperature_2m[currentHourIndex + index]),
    precip: hourly.precipitation_probability[currentHourIndex + index],
    wmo: getWMOInfo(hourly.weather_code[currentHourIndex + index], hourly.is_day[currentHourIndex + index])
  }));

  const nextDays = daily.time.slice(7, 14).map((time, index) => ({
    day: getDayName(time, index === 0),
    minTemp: Math.round(daily.temperature_2m_min[7 + index]),
    maxTemp: Math.round(daily.temperature_2m_max[7 + index]),
    precip: daily.precipitation_probability_max[7 + index],
    wmo: getWMOInfo(daily.weather_code[7 + index], 1)
  }));

  const hourlySummary = getHourlySummary(nextHours);
  const dailySummary = getDailySummary(nextDays);

  return (
    <div className={`min-h-screen flex flex-col items-center p-6 ${details.bgStyle} font-sans overflow-x-hidden transition-colors duration-1000`}>
      
      <div className="w-full max-w-md flex justify-center mb-6">
        <span className="text-white/70 text-xs font-bold tracking-[0.3em] uppercase drop-shadow-md">skymood</span>
      </div>

      <div className="w-full max-w-md flex gap-3 mb-6">
        <div className="relative flex-1 bg-white/20 backdrop-blur-xl rounded-[1.5rem] shadow-sm border border-white/30 flex items-center px-5 py-3">
          <input 
            type="text" 
            placeholder="Şehir girin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full bg-transparent outline-none text-white placeholder-white/70 text-sm font-medium"
          />
          <button onClick={() => {if(searchTerm.trim() !== "") getWeatherData(searchTerm); setSearchTerm("");}} className="text-white/70 hover:text-white transition-colors">
            <Search size={20} />
          </button>
        </div>
        <button onClick={handleGetLocation} className="w-[52px] h-[52px] bg-white/20 backdrop-blur-xl rounded-[1.5rem] shadow-sm border border-white/30 flex items-center justify-center text-white/80 hover:bg-white/40 transition-colors">
          <MapPin size={20} />
        </button>
      </div>

      <div className="w-full max-w-md pb-12 flex flex-col gap-4">
        
        {/* ANA KART */}
        <div className="rounded-[2.5rem] bg-white/20 backdrop-blur-3xl shadow-lg border border-white/30 p-8 flex flex-col items-center text-center transition-all">
          <p className="text-[12px] font-bold tracking-[0.15em] text-white/90 mb-4 uppercase drop-shadow-md">{displayTitle}</p>
          <details.Icon size={84} strokeWidth={1.5} className={`mb-2 drop-shadow-lg ${details.iconColor}`} />
          <h1 className="text-[5.5rem] leading-none font-light text-white mb-2 tracking-tight drop-shadow-md">{Math.round(current.temperature_2m)}°</h1>
          <p className="text-xl text-white font-medium mb-1 drop-shadow-md">{details.condition}</p>
          
          {/* YÜKSEK, DÜŞÜK VE HİSSEDİLEN SICAKLIK */}
          <p className="text-sm text-white/90 font-medium mb-3 drop-shadow-md">
            Y: {details.todayMax}° <span className="mx-2 opacity-50">|</span> D: {details.todayMin}° <span className="mx-2 opacity-50">|</span> Hissedilen: {Math.round(current.apparent_temperature)}°
          </p>

          <p className="text-[13px] text-white/80 font-medium leading-relaxed max-w-[280px] mb-8">{details.comparisonText}</p>

          <div className="flex w-full justify-between px-2 gap-4 mb-8">
            <div className="flex flex-col items-center bg-black/10 rounded-2xl py-3 w-1/3">
              <span className="text-[9px] font-bold tracking-widest text-white/60 uppercase mb-1">Nem</span>
              <span className="text-[13px] font-semibold text-white drop-shadow-sm">%{current.relative_humidity_2m}</span>
            </div>
            <div className="flex flex-col items-center bg-black/10 rounded-2xl py-3 w-1/3">
              <span className="text-[9px] font-bold tracking-widest text-white/60 uppercase mb-1">Rüzgar</span>
              <span className="text-[13px] font-semibold text-white drop-shadow-sm">{Math.round(current.wind_speed_10m)} km/s</span>
            </div>
            <div className="flex flex-col items-center bg-black/10 rounded-2xl py-3 w-1/3">
              <span className="text-[9px] font-bold tracking-widest text-white/60 uppercase mb-1">Yağış</span>
              <span className="text-[13px] font-semibold text-white drop-shadow-sm">%{currentPrecipitation || 0}</span>
            </div>
          </div>

          <div className="w-full flex items-center gap-4 bg-black/10 rounded-[1.5rem] p-4 border border-white/20 text-left shadow-inner">
            <details.AdviceIcon size={24} className="text-white/80 shrink-0" />
            <p className="text-[13px] text-white/90 font-medium leading-relaxed">{details.advice}</p>
          </div>
        </div>

        {/* SONRAKİ SAATLER KARTI */}
        <div className="rounded-[2rem] bg-white/20 backdrop-blur-2xl border border-white/20 p-6 flex flex-col shadow-lg">
          <p className="text-[11px] font-bold tracking-[0.15em] text-white/90 mb-1 uppercase drop-shadow-md">Sonraki Saatler</p>
          <p className="text-[13px] text-white/80 font-medium mb-5 drop-shadow-sm">{hourlySummary}</p>
          
          <div className="flex overflow-x-auto pb-2 gap-3 hide-scrollbar">
            {nextHours.map((hour, index) => (
              <div key={index} className="flex flex-col items-center justify-between bg-black/10 border border-white/10 rounded-2xl min-w-[75px] py-4 shadow-sm transition-transform hover:scale-105">
                <span className="text-[13px] font-semibold text-white/90 mb-2">{hour.time}</span>
                <hour.wmo.Icon size={26} className={`mb-1 drop-shadow-md ${hour.wmo.color}`} />
                
                {/* Akıllı Yağış Filtresi */}
                <div className="h-4 mb-1">
                  {shouldShowPrecip(hour.wmo.label, hour.precip) && (
                    <span className="text-[10px] font-bold text-cyan-300 drop-shadow-sm">%{hour.precip}</span>
                  )}
                </div>
                
                <span className="text-base font-bold text-white drop-shadow-sm">{hour.temp}°</span>
              </div>
            ))}
          </div>
        </div>

        {/* SONRAKİ GÜNLER KARTI */}
        <div className="rounded-[2rem] bg-white/20 backdrop-blur-2xl border border-white/20 p-6 flex flex-col shadow-lg">
          <p className="text-[11px] font-bold tracking-[0.15em] text-white/90 mb-1 uppercase drop-shadow-md">Sonraki Günler</p>
          <p className="text-[13px] text-white/80 font-medium mb-5 drop-shadow-sm">{dailySummary}</p>
          
          <div className="flex flex-col gap-2">
            {nextDays.map((day, index) => (
              <div key={index} className="flex items-center justify-between bg-black/10 border border-white/10 rounded-[1.2rem] px-5 py-3 shadow-sm hover:bg-black/20 transition-colors">
                <span className="text-[14px] font-semibold text-white/90 w-1/3 drop-shadow-sm">{day.day}</span>
                
                <div className="w-1/3 flex flex-col items-center justify-center">
                  <day.wmo.Icon size={22} className={`drop-shadow-md ${day.wmo.color}`} />
                  {/* Akıllı Yağış Filtresi */}
                  {shouldShowPrecip(day.wmo.label, day.precip) && (
                    <span className="text-[10px] font-bold text-cyan-300 mt-0.5 drop-shadow-sm">%{day.precip}</span>
                  )}
                </div>
                
                <span className="text-[14px] font-bold text-white w-1/3 text-right drop-shadow-sm">
                  {day.maxTemp}° <span className="text-white/60 font-medium">/ {day.minTemp}°</span>
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;