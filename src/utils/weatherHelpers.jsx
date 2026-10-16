import { 
  Sun, Moon, Cloud, CloudRain, Snowflake, CloudLightning, 
  CloudFog, Umbrella, CloudSun, CloudMoon, CloudDrizzle, Droplets
} from "lucide-react";

export const getWMOInfo = (code, isDay = 1) => {
  const isDayTime = isDay === 1;
  
  if (code === 0) return { label: "Açık", Icon: isDayTime ? Sun : Moon, color: isDayTime ? "text-yellow-400" : "text-blue-300" };
  if (code === 1 || code === 2) return { label: "Parçalı Bulutlu", Icon: isDayTime ? CloudSun : CloudMoon, color: "text-slate-100" };
  if (code === 3) return { label: "Çok Bulutlu", Icon: Cloud, color: "text-slate-200" };
  if (code === 45 || code === 48) return { label: "Sisli", Icon: CloudFog, color: "text-slate-300" };
  if (code >= 51 && code <= 57) return { label: "Çiseleyen Yağmur", Icon: CloudDrizzle, color: "text-blue-300" };
  if (code >= 61 && code <= 67) return { label: "Sağanak Yağış", Icon: CloudRain, color: "text-blue-500" };
  if (code >= 71 && code <= 77) return { label: "Karlı", Icon: Snowflake, color: "text-white" };
  if (code >= 80 && code <= 82) return { label: "Sürekli Yağmur", Icon: CloudRain, color: "text-blue-400" };
  if (code >= 85 && code <= 86) return { label: "Kar Sağanağı", Icon: Snowflake, color: "text-slate-100" };
  if (code >= 95 && code <= 99) return { label: "Fırtına", Icon: CloudLightning, color: "text-purple-400" };
  
  return { label: "Bilinmeyen", Icon: Cloud, color: "text-white" };
};

// Apple tarzı dinamik arka planları üreten fonksiyon
export const getDynamicBackground = (code, isDay) => {
  if (isDay === 0) {
    // GECE TEMALARI
    if (code === 0 || code === 1) return "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"; // Açık Gece
    if (code >= 51 && code <= 82) return "bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950"; // Yağmurlu Gece
    return "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800"; // Bulutlu Gece
  } else {
    // GÜNDÜZ TEMALARI
    if (code === 0 || code === 1) return "bg-gradient-to-br from-sky-400 via-blue-400 to-sky-300"; // Pırıl Pırıl
    if (code === 2 || code === 3) return "bg-gradient-to-br from-blue-300 via-slate-300 to-slate-400"; // Bulutlu
    if (code >= 51 && code <= 82) return "bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600"; // Yağmurlu
    if (code >= 71 && code <= 77) return "bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200"; // Karlı
    return "bg-gradient-to-br from-sky-300 via-blue-200 to-pink-200"; // Varsayılan Pastel
  }
};

export const getWeatherDetails = (current, daily) => {
  if (!current || !daily) return null;

  const currentTemp = Math.round(current.temperature_2m);
  const wmoInfo = getWMOInfo(current.weather_code, current.is_day);
  const bgStyle = getDynamicBackground(current.weather_code, current.is_day);

  const yesterdayMin = Math.round(daily.temperature_2m_min[6]);
  const yesterdayMax = Math.round(daily.temperature_2m_max[6]);
  const lastWeekMin = Math.round(daily.temperature_2m_min[0]);
  const lastWeekMax = Math.round(daily.temperature_2m_max[0]);
  const todayMin = Math.round(daily.temperature_2m_min[7]);
  const todayMax = Math.round(daily.temperature_2m_max[7]);

  const diffYesterday = currentTemp - Math.round((yesterdayMax + yesterdayMin) / 2);
  const formatDiff = (diff) => {
    if (diff > 0) return `${Math.abs(diff)}° daha sıcak`;
    if (diff < 0) return `${Math.abs(diff)}° daha serin`;
    return "hemen hemen aynı";
  };
  const comparisonText = `Düne göre ${formatDiff(diffYesterday)} (dün ${yesterdayMin}–${yesterdayMax}°)`;

  // AKILLI VE TUTARLI TAVSİYE MANTIĞI
  let advice = "";
  let AdviceIcon = Sun;
  const isRaining = current.weather_code >= 51 && current.weather_code <= 82;
  const isSnowing = current.weather_code >= 71 && current.weather_code <= 77 || current.weather_code >= 85 && current.weather_code <= 86;

  if (currentTemp < 10) {
    if (isRaining) { advice = "Hava oldukça soğuk ve yağışlı. Kalın bir mont giyin ve şemsiyenizi kesinlikle unutmayın."; AdviceIcon = Umbrella; }
    else if (isSnowing) { advice = "Dondurucu soğuk ve kar var. Atkı, bere ve eldivenlerinizi takmadan dışarı çıkmayın."; AdviceIcon = Snowflake; }
    else { advice = "Hava oldukça serin. Dışarı çıkarken yanınıza kalın bir kaban almayı ihmal etmeyin."; AdviceIcon = Cloud; }
  } else if (currentTemp >= 10 && currentTemp < 20) {
    if (isRaining) { advice = "Ilık ama yağmurlu bir hava. İnce bir ceket giyin fakat yağmurluğunuzu veya şemsiyenizi yanınızdan ayırmayın."; AdviceIcon = Umbrella; }
    else { advice = "Hava tam kararında, ne çok sıcak ne çok soğuk. İnce bir kazak veya ceket yeterli olacaktır."; AdviceIcon = CloudSun; }
  } else {
    if (isRaining) { advice = "Hava sıcak ama yaz yağmuru var. İnce ve rahat kıyafetler tercih edin, şemsiyenizi de yanınıza alın."; AdviceIcon = Umbrella; }
    else { advice = "Hava oldukça sıcak ve güzel. İnce giyinin, bol su içmeyi ve güneş kremi sürmeyi unutmayın."; AdviceIcon = Sun; }
  }

  return { 
    condition: wmoInfo.label, Icon: wmoInfo.Icon, iconColor: wmoInfo.color, 
    advice, AdviceIcon, comparisonText, bgStyle, todayMin, todayMax
  };
};

export const getDayName = (dateString, isToday) => {
  if (isToday) return "Bugün";
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { weekday: 'long' });
};
// Önümüzdeki 12 saatlik duruma bakarak kısa bir özet cümlesi çıkarır
export const getHourlySummary = (nextHours) => {
  const rainHours = nextHours.slice(0, 12).filter(h => h.wmo.label.includes("Yağmur") || h.wmo.label.includes("Sağanak"));
  const snowHours = nextHours.slice(0, 12).filter(h => h.wmo.label.includes("Kar"));
  
  if (snowHours.length > 0) return "Önümüzdeki saatlerde kar yağışı bekleniyor.";
  if (rainHours.length > 2) return "Önümüzdeki saatlerde yağmur bekleniyor.";
  if (rainHours.length > 0) return "Yakın saatlerde kısa süreli yağış geçişleri olabilir.";
  
  const temps = nextHours.slice(0, 12).map(h => h.temp);
  const tempDiff = temps[11] - temps[0];
  
  if (tempDiff < -3) return "İlerleyen saatlerde hava giderek soğuyacak.";
  if (tempDiff > 3) return "Önümüzdeki saatlerde hava ısınacak.";
  return "Önümüzdeki saatlerde hava durumunda belirgin bir değişiklik beklenmiyor.";
};

// Önümüzdeki 7 günlük duruma bakarak haftalık özet cümlesi çıkarır
export const getDailySummary = (nextDays) => {
  const rainDays = nextDays.filter(d => d.wmo.label.includes("Yağmur") || d.wmo.label.includes("Sağanak"));
  const snowDays = nextDays.filter(d => d.wmo.label.includes("Kar"));
  
  const firstDayTemp = nextDays[0].maxTemp;
  const lastDayTemp = nextDays[nextDays.length - 1].maxTemp;
  const tempTrend = lastDayTemp - firstDayTemp > 2 ? "günler ısınacak" : (lastDayTemp - firstDayTemp < -2 ? "sıcaklıklar düşecek" : "sıcaklıklar mevsim normallerinde seyredecek");

  if (snowDays.length > 0) return `Önümüzdeki günlerde kar yağışı var, ${tempTrend}.`;
  if (rainDays.length > 3) return `Hafta boyunca çoğunlukla yağışlı geçecek, ${tempTrend}.`;
  if (rainDays.length > 0) return `Hafta içinde birkaç gün yağışlı, ${tempTrend}.`;
  
  return `Önümüzdeki günlerde yağış beklenmiyor, ${tempTrend}.`;
};