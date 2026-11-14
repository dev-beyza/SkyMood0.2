import { useEffect, useState, useRef } from "react";
import { fetchWeather, fetchCoordinates } from "./services/weather";
import { 
  getWeatherDetails, getWMOInfo, getDayName, 
  getHourlySummary, getDailySummary 
} from "./utils/weatherHelpers";
import { Search, MapPin, Star, ArrowLeft, X, GripVertical } from "lucide-react"; 

// --- FAVORİ KARTI BİLEŞENİ ---
function FavoriteCard({ 
  city, index, onClick, onRemove, 
  onDragStart, onDragEnter, onDragEnd,
  onTouchStart, onTouchMove, onTouchEnd
}) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchCoordinates(city).then(locData => {
      if (locData && mounted) {
        fetchWeather(locData.latitude, locData.longitude).then(data => {
          if (data && mounted) setWeather(data);
        });
      }
    });
    return () => { mounted = false; };
  }, [city]);

  if (!weather) {
    return (
      <div className="w-full h-[96px] bg-black/20 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-5 mb-4 flex items-center justify-center text-white/60 animate-pulse shadow-sm">
        <span className="font-bold text-[16px] tracking-wide text-center">{city} Yükleniyor...</span>
      </div>
    );
  }

  const currentTemp = Math.round(weather.current.temperature_2m);
  const wmo = getWMOInfo(weather.current.weather_code, weather.current.is_day);
  const WeatherIcon = wmo.Icon;

  return (
    <div 
      className="fav-card relative w-full mb-4 group"
      data-index={index}
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <button 
        onClick={() => onClick(city)} 
        className="w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-5 pl-2 flex items-center justify-between shadow-lg hover:bg-black/30 transition-all text-left active:scale-95"
      >
        <div className="flex items-center gap-2 flex-1 pr-4">
          <div 
            className="p-3 -ml-2 touch-none cursor-grab active:cursor-grabbing"
            onTouchStart={(e) => { e.stopPropagation(); onTouchStart(e, index); }}
            onTouchMove={(e) => { e.stopPropagation(); onTouchMove(e); }}
            onTouchEnd={(e) => { e.stopPropagation(); onTouchEnd(e); }}
            onClick={(e) => e.stopPropagation()} 
          >
            <GripVertical size={24} className="text-white/30 shrink-0 hover:text-white/60 transition-colors" />
          </div>
          
          <div>
            <div className="text-white text-[17px] font-bold drop-shadow-md tracking-wide leading-snug">{city}</div>
            <div className="text-white/80 text-[14px] font-semibold mt-1 drop-shadow-sm">{wmo.label}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 pr-10 shrink-0">
          <WeatherIcon size={38} strokeWidth={2} className={`drop-shadow-lg ${wmo.color}`} />
          <span className="text-white text-[2.5rem] font-light drop-shadow-md">{currentTemp}°</span>
        </div>
      </button>
      
      {/* Silme Butonu */}
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(city); }}
        className="absolute top-1/2 -translate-y-1/2 right-3 p-2 text-white/40 hover:text-red-400 transition-colors z-10 active:scale-90"
      >
        <X size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// --- ANA UYGULAMA ---
function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayTitle, setDisplayTitle] = useState("İstanbul");
  const [isUserLocation, setIsUserLocation] = useState(false);
  const [searchError, setSearchError] = useState(""); // YENİ: Hata mesajı state'i

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('skymood_favorites_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  useEffect(() => {
    localStorage.setItem('skymood_favorites_v2', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => { 
    getWeatherData("İstanbul", true); 
  }, []);

  const getWeatherData = async (city, isInitial = false) => {
    if(!city || !city.trim()) return;
    
    setLoading(true);
    setIsUserLocation(false);
    setSearchError(""); // Yeni aramada eski hatayı temizle

    if (!isInitial) setCurrentScreen('details'); 

    const locationData = await fetchCoordinates(city);
    if (locationData) {
      const data = await fetchWeather(locationData.latitude, locationData.longitude);
      if (data) {
        setWeatherData(data);
        setDisplayTitle(locationData.name);
      } else {
        if (!isInitial) {
          setCurrentScreen('home');
          setSearchError("Hava durumu verisine ulaşılamadı. Lütfen tekrar deneyin.");
        }
      }
    } else {
      if (!isInitial) {
        setCurrentScreen('home'); 
        // Şehir bulunamadığında verilecek hata mesajı
        setSearchError(`"${city}" adında bir konum bulunamadı. Lütfen yazımı kontrol edin.`);
      }
    }
    setLoading(false);
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      setCurrentScreen('details');
      setIsUserLocation(true);
      setSearchError(""); 
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const data = await fetchWeather(latitude, longitude);
          setWeatherData(data);
          
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=tr`);
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            
            const province = addr.province || addr.city || addr.state || "";
            const district = addr.town || addr.county || addr.city_district || addr.suburb || "";
            
            let locationName = "";
            if (district && province && district !== province) {
              locationName = `${district}, ${province}`; 
            } else if (district || province) {
              locationName = district || province;
            } else {
              locationName = "Bilinmeyen Konum";
            }
            
            setDisplayTitle(locationName);
          } catch (error) {
            setDisplayTitle("Bulunduğunuz Konum"); 
          }
          
          setLoading(false);
        },
        () => {
          setLoading(false);
          setCurrentScreen('home');
          setSearchError("Konum izni alınamadı veya konum bulunamadı.");
        }
      );
    } else {
      setSearchError("Cihazınız konum özelliğini desteklemiyor.");
    }
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      getWeatherData(searchTerm);
      setSearchTerm("");
    }
  };

  const toggleFavorite = () => {
    if (favorites.includes(displayTitle)) {
      setFavorites(favorites.filter(f => f !== displayTitle));
    } else {
      setFavorites([...favorites, displayTitle]);
    }
  };

  const removeFavorite = (cityToRemove) => {
    setFavorites(favorites.filter(f => f !== cityToRemove));
  };

  const handleDragStart = (e, position) => { dragItem.current = position; };
  const handleDragEnter = (e, position) => { dragOverItem.current = position; };
  const handleDrop = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const copyListItems = [...favorites];
      const dragItemContent = copyListItems[dragItem.current];
      copyListItems.splice(dragItem.current, 1);
      copyListItems.splice(dragOverItem.current, 0, dragItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      setFavorites(copyListItems);
    }
  };

  const handleTouchStart = (e, index) => { dragItem.current = index; };
  const handleTouchMove = (e) => {
    if (dragItem.current === null) return;
    const touchLocation = e.targetTouches[0];
    const element = document.elementFromPoint(touchLocation.clientX, touchLocation.clientY);
    if (!element) return;
    const card = element.closest('.fav-card');
    if (card) {
      const targetIndex = parseInt(card.getAttribute('data-index'), 10);
      if (!isNaN(targetIndex) && targetIndex !== dragItem.current) {
        const copyListItems = [...favorites];
        const dragItemContent = copyListItems[dragItem.current];
        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(targetIndex, 0, dragItemContent);
        dragItem.current = targetIndex;
        setFavorites(copyListItems);
      }
    }
  };
  const handleTouchEnd = () => { dragItem.current = null; };

  const { current, daily, hourly } = weatherData || {};
  const details = weatherData ? getWeatherDetails(current, daily) : null;
  
  const bgClass = currentScreen === 'home' 
    ? "bg-gradient-to-br from-slate-900 via-slate-800 to-black" 
    : (details ? details.bgStyle : "bg-slate-900");

  return (
    <div className={`min-h-screen flex flex-col items-center p-6 ${bgClass} font-sans overflow-x-hidden transition-colors duration-1000 selection:bg-white/30`}>
      
      {/* MARKA LOGOSU */}
      <div className="w-full max-w-md flex justify-center mb-6 z-10 mt-4">
        <button onClick={() => setCurrentScreen('home')} className="text-white/90 text-[13px] font-black tracking-[0.4em] uppercase drop-shadow-lg hover:text-white transition-colors">
          skymood
        </button>
      </div>

      {/* 2. ANA EKRAN (ARAMA VE FAVORİLER) */}
      {currentScreen === 'home' && (
        <div className="w-full max-w-md pb-12 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-500">
          
          <div className="w-full flex gap-3 mb-2">
            <div className="relative flex-1 bg-black/20 backdrop-blur-xl rounded-[1.5rem] shadow-lg border border-white/10 flex items-center px-5 py-4 focus-within:bg-black/30 transition-all">
              <input 
                type="text" 
                placeholder="Şehir veya ilçe arayın..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (searchError) setSearchError(""); // Yazmaya başlayınca hatayı temizle
                }}
                onKeyDown={handleSearch}
                className="w-full bg-transparent outline-none text-white placeholder-white/60 text-[16px] font-semibold"
              />
              <button onClick={() => {if(searchTerm.trim() !== "") getWeatherData(searchTerm); setSearchTerm("");}} className="text-white/80 hover:text-white transition-colors">
                <Search size={24} strokeWidth={2.5} />
              </button>
            </div>
            <button onClick={handleGetLocation} className="w-[60px] h-[60px] bg-black/20 backdrop-blur-xl rounded-[1.5rem] shadow-lg border border-white/10 flex items-center justify-center text-white/90 hover:bg-black/30 transition-colors hover:scale-105 active:scale-95 shrink-0">
              <MapPin size={26} strokeWidth={2.5} />
            </button>
          </div>

          {/* YENİ: ARAMA HATASI MESAJI KUTUSU */}
          {searchError && (
            <div className="w-full bg-red-900/40 backdrop-blur-md border border-red-500/30 text-white/90 px-5 py-3 rounded-[1.25rem] text-[14px] font-medium flex items-center text-center shadow-lg animate-in fade-in zoom-in-95 duration-300 mb-2">
              <span className="w-full leading-relaxed drop-shadow-md">{searchError}</span>
            </div>
          )}

          <p className="text-[14px] font-bold tracking-[0.15em] text-white/90 mb-1 uppercase drop-shadow-md px-2 mt-4">
            Favori Konumlar
          </p>

          {favorites.length > 0 ? (
            favorites.map((city, index) => (
              <FavoriteCard 
                key={city} 
                city={city} 
                index={index}
                onClick={getWeatherData} 
                onRemove={removeFavorite}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDrop}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            ))
          ) : (
            <div className="text-center bg-black/20 border border-white/10 rounded-[1.5rem] p-10 flex flex-col items-center shadow-inner mt-2">
              <Star size={40} className="mb-4 text-white/30" />
              <p className="text-[15px] text-white/70 font-semibold leading-relaxed">Henüz favori şehriniz yok.<br/>Yukarıdan arayıp yıldızlayabilirsiniz.</p>
            </div>
          )}
        </div>
      )}

      {/* 3. YÜKLENİYOR DURUMU */}
      {currentScreen === 'details' && loading && (
        <div className="flex-1 flex items-center justify-center text-white/90 tracking-widest text-[16px] uppercase drop-shadow-md font-bold">
          YÜKLENİYOR...
        </div>
      )}

      {/* 4. HAVA DURUMU DETAY EKRANI */}
      {currentScreen === 'details' && !loading && weatherData && (
        <div className="w-full max-w-md pb-12 flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex justify-between items-center mb-1 px-1">
            <button onClick={() => setCurrentScreen('home')} className="text-white/90 hover:text-white transition-all p-2 -ml-2 hover:-translate-x-1">
              <ArrowLeft size={30} strokeWidth={2.5} />
            </button>
            
            <div className="flex flex-col items-center justify-center flex-1">
              {isUserLocation && (
                <span className="text-[10px] font-black tracking-[0.25em] text-yellow-400 uppercase mb-0.5 drop-shadow-md">
                  Konumunuz
                </span>
              )}
              <span className="text-[16px] font-black tracking-[0.1em] text-white uppercase drop-shadow-lg text-center leading-snug px-2">
                {displayTitle}
              </span>
            </div>

            <button onClick={toggleFavorite} className={`transition-all p-2 -mr-2 hover:scale-110 ${favorites.includes(displayTitle) ? 'text-yellow-400' : 'text-white/90 hover:text-white'}`}>
              <Star size={30} strokeWidth={2.5} className={favorites.includes(displayTitle) ? "fill-yellow-400 drop-shadow-md" : ""} />
            </button>
          </div>

          <div className="rounded-[2.5rem] bg-black/20 backdrop-blur-3xl shadow-2xl border border-white/10 p-8 flex flex-col items-center text-center">
            <details.Icon size={110} strokeWidth={1.5} className={`mb-3 drop-shadow-2xl ${details.iconColor}`} />
            <h1 className="text-[7rem] leading-none font-light text-white mb-2 tracking-tighter drop-shadow-xl">{Math.round(current.temperature_2m)}°</h1>
            <p className="text-[26px] text-white font-bold mb-2 drop-shadow-md">{details.condition}</p>
            
            <p className="text-[16px] text-white font-semibold mb-4 drop-shadow-md">
              Y: {details.todayMax}° <span className="mx-2 opacity-40">|</span> D: {details.todayMin}° <span className="mx-2 opacity-40">|</span> Hissedilen: {Math.round(current.apparent_temperature)}°
            </p>

            <p className="text-[16px] text-white/95 font-semibold leading-relaxed max-w-[280px] mb-8 drop-shadow-sm">
              {details.comparisonText} <br/>
              <span className="text-[14px] text-white/60 font-medium">{details.comparisonDetail}</span>
            </p>

            <div className="flex w-full justify-between px-1 gap-3 mb-8">
              <div className="flex flex-col items-center bg-black/30 rounded-[1.25rem] py-4 w-1/3 border border-white/5 shadow-inner">
                <span className="text-[12px] font-bold tracking-widest text-white/70 uppercase mb-1 drop-shadow-sm">Nem</span>
                <span className="text-[17px] font-bold text-white drop-shadow-md">%{current.relative_humidity_2m}</span>
              </div>
              <div className="flex flex-col items-center bg-black/30 rounded-[1.25rem] py-4 w-1/3 border border-white/5 shadow-inner">
                <span className="text-[12px] font-bold tracking-widest text-white/70 uppercase mb-1 drop-shadow-sm">Rüzgar</span>
                <span className="text-[17px] font-bold text-white drop-shadow-md">{Math.round(current.wind_speed_10m)} <span className="text-[11px]">km/s</span></span>
              </div>
              <div className="flex flex-col items-center bg-black/30 rounded-[1.25rem] py-4 w-1/3 border border-white/5 shadow-inner">
                <span className="text-[12px] font-bold tracking-widest text-white/70 uppercase mb-1 drop-shadow-sm">Yağış</span>
                <span className="text-[17px] font-bold text-white drop-shadow-md">%{daily.precipitation_probability_max[7] || 0}</span>
              </div>
            </div>

            <div className="w-full flex items-center gap-4 bg-black/30 rounded-[1.5rem] p-5 border border-white/5 text-left shadow-inner">
              <details.AdviceIcon size={32} className="text-white/95 shrink-0 drop-shadow-lg" />
              <p className="text-[15px] text-white font-bold leading-relaxed drop-shadow-md">{details.advice}</p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-black/20 backdrop-blur-2xl border border-white/10 p-6 flex flex-col shadow-xl">
            <p className="text-[13px] font-bold tracking-[0.15em] text-white/90 mb-3 uppercase drop-shadow-md px-1">Saatlik Tahmin</p>
            
            <div className="flex overflow-x-auto pb-2 gap-3 hide-scrollbar mt-1">
              {hourly.time.slice(hourly.time.findIndex(time => new Date(time) >= new Date()), hourly.time.findIndex(time => new Date(time) >= new Date()) + 24).map((time, index) => {
                const currentHourIndex = hourly.time.findIndex(t => new Date(t) >= new Date());
                const hourPrecip = hourly.precipitation_probability[currentHourIndex + index];
                const hourWmo = getWMOInfo(hourly.weather_code[currentHourIndex + index], hourly.is_day[currentHourIndex + index]);
                const isRainOrSnow = /Yağmur|Sağanak|Kar|Çiseleyen/i.test(hourWmo.label);
                
                return (
                  <div key={index} className="flex flex-col items-center justify-between bg-black/30 border border-white/5 rounded-[1.25rem] min-w-[80px] py-4 shadow-inner transition-transform hover:scale-105">
                    <span className="text-[15px] font-bold text-white mb-3 drop-shadow-sm">{new Date(time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <hourWmo.Icon size={32} strokeWidth={2} className={`mb-1 drop-shadow-lg ${hourWmo.color}`} />
                    <div className="h-4 mb-1">
                      {(isRainOrSnow && hourPrecip >= 10) && <span className="text-[12px] font-bold text-cyan-300 drop-shadow-md">%{hourPrecip}</span>}
                    </div>
                    <span className="text-[19px] font-bold text-white drop-shadow-lg">{Math.round(hourly.temperature_2m[currentHourIndex + index])}°</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] bg-black/20 backdrop-blur-2xl border border-white/10 p-6 flex flex-col shadow-xl">
            <p className="text-[13px] font-bold tracking-[0.15em] text-white/90 mb-4 uppercase drop-shadow-md px-1">7 Günlük Tahmin</p>
            
            <div className="flex flex-col gap-2">
              {daily.time.slice(7, 14).map((time, index) => {
                const dayWmo = getWMOInfo(daily.weather_code[7 + index], 1);
                const dayPrecip = daily.precipitation_probability_max[7 + index];
                const isRainOrSnow = /Yağmur|Sağanak|Kar|Çiseleyen/i.test(dayWmo.label);
                
                return (
                  <div key={index} className="flex items-center justify-between bg-black/30 border border-white/5 rounded-[1.25rem] px-5 py-4 shadow-inner hover:bg-black/40 transition-colors">
                    <span className="text-[16px] font-bold text-white w-1/3 drop-shadow-md">{getDayName(time, index === 0)}</span>
                    <div className="w-1/3 flex flex-col items-center justify-center">
                      <dayWmo.Icon size={28} strokeWidth={2} className={`drop-shadow-lg ${dayWmo.color}`} />
                      {(isRainOrSnow && dayPrecip >= 10) && <span className="text-[12px] font-bold text-cyan-300 mt-1 drop-shadow-md">%{dayPrecip}</span>}
                    </div>
                    <span className="text-[18px] font-bold text-white w-1/3 text-right drop-shadow-lg">
                      {Math.round(daily.temperature_2m_max[7 + index])}° <span className="text-white/60 font-semibold">/ {Math.round(daily.temperature_2m_min[7 + index])}°</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;