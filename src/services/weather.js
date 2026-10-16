// 1. Şehir adından koordinat bulma servisi
export const fetchCoordinates = async (cityName) => {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=tr`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    // Eğer şehir bulunduysa ilk sonucu döndür
    if (data.results && data.results.length > 0) {
      return data.results[0]; // İçinde latitude, longitude ve name var
    }
    return null;
  } catch (error) {
    console.error("Şehir aranırken hata oluştu:", error);
    return null;
  }
};

// 2. Dinamik koordinatlarla hava durumu çekme servisi
export const fetchWeather = async (latitude, longitude) => {
  // Yağış ihtimalleri (precipitation_probability) eklendi
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,is_day,weather_code,relative_humidity_2m,wind_speed_10m&hourly=temperature_2m,weather_code,is_day,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&past_days=7&timezone=auto`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Hava durumu çekilirken hata oluştu:", error);
    return null;
  }
};
// 3. Koordinatlardan şehir adını bulma servisi (Reverse Geocoding)
export const fetchCityNameFromCoords = async (latitude, longitude) => {
  // BigDataCloud'un ücretsiz, anahtarsız reverse geocoding servisi
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=tr`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    // API'den gelen il (city) veya ilçe (locality) bilgisini döndür
    return data.city || data.locality || "Mevcut Konum";
  } catch (error) {
    console.error("Şehir adı bulunamadı:", error);
    return "Mevcut Konum";
  }
};