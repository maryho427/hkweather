import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "tc";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    "header.title": "Hong Kong Weather",
    "header.subtitle": "Live data · Hong Kong Observatory",
    "header.refresh": "Refresh",
    "header.hko": "HKO",
    "hero.label": "Current Conditions · Hong Kong",
    "hero.weather": "Weather",
    "forecast.title": "7-Day Forecast",
    "forecast.subtitle": "Select a day for details",
    "forecast.today": "Today",
    "forecast.rain": "Rain Chance",
    "detail.title": "Detailed Forecast",
    "detail.wind": "Wind",
    "detail.humidity": "Humidity",
    "detail.temperature": "Temperature",
    "detail.rainChance": "Rain Chance",
    "chart.title": "Temperature Overview",
    "situation.title": "General Weather Situation",
    "footer.credit": "Weather data provided by",
    "footer.api": "Open Data API",
    "footer.update": "Updates twice daily and when changes occur",
    "error.message": "Unable to load weather data. Please check your connection and try again.",
    "error.retry": "Try again",
    "loading": "Loading...",
    "updated": "Updated",
    "uv": "UV",
    "moderate": "Moderate",
    "high": "High",
    "med-high": "Med-High",
    "medium": "Medium",
    "med-low": "Med-Low",
    "low": "Low",
  },
  tc: {
    "header.title": "香港天氣",
    "header.subtitle": "即時數據 · 香港天文台",
    "header.refresh": "重新整理",
    "header.hko": "天文台",
    "hero.label": "目前天氣 · 香港",
    "hero.weather": "天氣",
    "forecast.title": "7日預報",
    "forecast.subtitle": "選擇一天查看詳情",
    "forecast.today": "今天",
    "forecast.rain": "降雨機會",
    "detail.title": "詳細預報",
    "detail.wind": "風力",
    "detail.humidity": "濕度",
    "detail.temperature": "溫度",
    "detail.rainChance": "降雨機會",
    "chart.title": "溫度概覽",
    "situation.title": "一般天氣情況",
    "footer.credit": "天氣數據由",
    "footer.api": "開放數據 API",
    "footer.update": "每日更新兩次，如有變化會即時更新",
    "error.message": "無法載入天氣數據。請檢查您的連接並重試。",
    "error.retry": "重試",
    "loading": "載入中...",
    "updated": "更新於",
    "uv": "紫外線",
    "moderate": "中等",
    "high": "高",
    "med-high": "中高",
    "medium": "中等",
    "med-low": "中低",
    "low": "低",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hk-weather-lang") as Language | null;
      return saved || "en";
    }
    return "en";
  });

  useEffect(() => {
    localStorage.setItem("hk-weather-lang", language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageState, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
