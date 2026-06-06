/**
 * Design: "Coastal Luminance" — Soft Modernism
 * Bilingual: English (en) & Traditional Chinese (tc) via context
 * Data: HKO Open Data API with lang parameter support
 */

import { useEffect, useState, useCallback } from "react";
import {
  Wind,
  Droplets,
  Thermometer,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CloudRain,
  Info,
  Globe,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TempValue {
  value: number;
  unit: string;
}

interface DayForecast {
  forecastDate: string;
  week: string;
  forecastWind: string;
  forecastWeather: string;
  forecastMaxtemp: TempValue;
  forecastMintemp: TempValue;
  forecastMaxrh: TempValue;
  forecastMinrh: TempValue;
  ForecastIcon: number;
  PSR: string;
}

interface ForecastData {
  generalSituation: string;
  weatherForecast: DayForecast[];
  updateTime?: string;
}

interface CurrentWeather {
  temperature?: { data: Array<{ place: string; value: number; unit: string }> };
  humidity?: { data: Array<{ place: string; value: number; unit: string }> };
  uvindex?: { data: Array<{ place: string; value: number; desc: string }> };
  specialWxTips?: string[];
  tcmessage?: string[];
  icon?: number[];
  updateTime?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HKO_ICON_BASE = "https://www.hko.gov.hk/images/HKOWxIconOutline/pic";
const API_BASE = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php";
const HERO_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663736699459/GnACGjpNJoabtSvp5JuCLc/hk-skyline-hero-b6Rk27tuFnwJYHJMqSDbgf.webp";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const y = parseInt(dateStr.slice(0, 4));
  const m = parseInt(dateStr.slice(4, 6)) - 1;
  const d = parseInt(dateStr.slice(6, 8));
  const date = new Date(y, m, d);
  return {
    day: date.getDate(),
    month: date.toLocaleString("en-US", { month: "short" }),
    year: date.getFullYear(),
    fullDate: date.toLocaleDateString("en-HK", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

function isToday(dateStr: string): boolean {
  const now = new Date();
  const y = parseInt(dateStr.slice(0, 4));
  const m = parseInt(dateStr.slice(4, 6)) - 1;
  const d = parseInt(dateStr.slice(6, 8));
  return now.getFullYear() === y && now.getMonth() === m && now.getDate() === d;
}

function formatUpdateTime(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-HK", {
      timeZone: "Asia/Hong_Kong",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function getPSRStyle(psr: string): { cls: string; label: string } {
  const p = psr.toLowerCase();
  if (p === "high")
    return { cls: "bg-red-50 text-red-600 border border-red-200", label: "High" };
  if (p === "medium high")
    return { cls: "bg-orange-50 text-orange-600 border border-orange-200", label: "Med-High" };
  if (p === "medium" || p === "moderate")
    return { cls: "bg-amber-50 text-amber-600 border border-amber-200", label: "Medium" };
  if (p === "medium low")
    return { cls: "bg-yellow-50 text-yellow-600 border border-yellow-200", label: "Med-Low" };
  return { cls: "bg-green-50 text-green-600 border border-green-200", label: "Low" };
}

function getTempGradient(max: number): string {
  if (max >= 33) return "linear-gradient(90deg, #fbbf24, #ef4444)";
  if (max >= 29) return "linear-gradient(90deg, #60a5fa, #f59e0b)";
  if (max >= 24) return "linear-gradient(90deg, #34d399, #60a5fa)";
  return "linear-gradient(90deg, #93c5fd, #34d399)";
}

// ─── WeatherIcon ──────────────────────────────────────────────────────────────

function WeatherIcon({
  iconCode,
  size = 64,
  className = "",
}: {
  iconCode: number;
  size?: number;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-sky-100 text-sky-400 ${className}`}
        style={{ width: size, height: size }}
      >
        <CloudRain size={size * 0.45} />
      </div>
    );
  }
  return (
    <img
      src={`${HKO_ICON_BASE}${iconCode}.png`}
      alt={`Weather condition ${iconCode}`}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      onError={() => setErr(true)}
    />
  );
}

// ─── DayCard ──────────────────────────────────────────────────────────────────

function DayCard({
  forecast,
  index,
  selected,
  onClick,
}: {
  forecast: DayForecast;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const today = isToday(forecast.forecastDate);
  const { day, month } = formatDate(forecast.forecastDate);
  const psr = getPSRStyle(forecast.PSR);
  const { t } = useLanguage();

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col gap-2 p-4 rounded-2xl cursor-pointer
        transition-all duration-200 ease-out select-none
        ${selected
          ? "bg-sky-500 text-white shadow-lg shadow-sky-200 scale-[1.02]"
          : "bg-white hover:bg-sky-50 hover:shadow-md hover:-translate-y-1 shadow-sm"
        }
        ${today && !selected ? "ring-2 ring-sky-400 ring-offset-1" : ""}
      `}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      {today && (
        <span
          className={`absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider
            ${selected ? "bg-white/20 text-white" : "bg-sky-400 text-white"}`}
        >
          {t("forecast.today")}
        </span>
      )}

      {/* Day label */}
      <div>
        <p className={`text-[11px] font-bold uppercase tracking-widest ${selected ? "text-sky-100" : "text-slate-400"}`}>
          {forecast.week.slice(0, 3)}
        </p>
        <p className={`text-base font-black leading-tight ${selected ? "text-white" : "text-slate-700"}`}>
          {day}{" "}
          <span className={`text-xs font-semibold ${selected ? "text-sky-200" : "text-slate-400"}`}>
            {month}
          </span>
        </p>
      </div>

      {/* Icon */}
      <div className="flex justify-center py-0.5">
        <WeatherIcon
          iconCode={forecast.ForecastIcon}
          size={52}
          className={selected ? "brightness-0 invert" : ""}
        />
      </div>

      {/* Temperatures */}
      <div className="flex items-baseline justify-between">
        <span className={`font-mono-data text-xl font-bold ${selected ? "text-white" : "text-slate-800"}`}>
          {forecast.forecastMaxtemp.value}°
        </span>
        <span className={`font-mono-data text-sm ${selected ? "text-sky-200" : "text-slate-400"}`}>
          {forecast.forecastMintemp.value}°
        </span>
      </div>

      {/* Temp bar */}
      <div className={`h-1 rounded-full overflow-hidden ${selected ? "bg-white/20" : "bg-slate-100"}`}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.max(25, ((forecast.forecastMaxtemp.value - 15) / 25) * 100))}%`,
            background: selected
              ? "rgba(255,255,255,0.6)"
              : getTempGradient(forecast.forecastMaxtemp.value),
          }}
        />
      </div>

      {/* Humidity */}
      <div className={`flex items-center gap-1 text-[11px] ${selected ? "text-sky-100" : "text-slate-500"}`}>
        <Droplets size={10} />
        <span className="font-semibold">
          {forecast.forecastMinrh.value}–{forecast.forecastMaxrh.value}%
        </span>
      </div>

      {/* PSR */}
      <div
        className={`text-[9px] font-black px-2 py-0.5 rounded-full self-start uppercase tracking-wide
          ${selected ? "bg-white/20 text-white" : psr.cls}`}
      >
        ☔ {psr.label}
      </div>
    </div>
  );
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────

function DetailPanel({ forecast }: { forecast: DayForecast }) {
  const { fullDate } = formatDate(forecast.forecastDate);
  const psr = getPSRStyle(forecast.PSR);
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Icon + Temp */}
        <div className="flex sm:flex-col items-center gap-4 sm:gap-2 sm:min-w-[130px]">
          <WeatherIcon iconCode={forecast.ForecastIcon} size={88} />
          <div className="text-center">
            <div className="font-mono-data text-4xl font-bold text-slate-800">
              {forecast.forecastMaxtemp.value}
              <span className="text-xl text-slate-400">°C</span>
            </div>
            <div className="font-mono-data text-base text-slate-400 font-medium">
              {t("detail.temperature")} {forecast.forecastMintemp.value}°C
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-black text-lg text-slate-800 leading-tight">{fullDate}</h3>
            <p className="text-slate-600 mt-1.5 leading-relaxed text-sm">{forecast.forecastWeather}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              {
                icon: <Wind size={14} className="text-sky-500" />,
                label: t("detail.wind"),
                value: forecast.forecastWind,
                bg: "bg-sky-50",
                labelColor: "text-sky-600",
              },
              {
                icon: <Droplets size={14} className="text-blue-500" />,
                label: t("detail.humidity"),
                value: `${forecast.forecastMinrh.value}–${forecast.forecastMaxrh.value}%`,
                bg: "bg-blue-50",
                labelColor: "text-blue-600",
              },
              {
                icon: <Thermometer size={14} className="text-amber-500" />,
                label: t("detail.temperature"),
                value: `${forecast.forecastMintemp.value}°–${forecast.forecastMaxtemp.value}°C`,
                bg: "bg-amber-50",
                labelColor: "text-amber-600",
              },
              {
                icon: <CloudRain size={14} className="text-rose-400" />,
                label: t("detail.rainChance"),
                value: forecast.PSR,
                bg: "bg-rose-50",
                labelColor: "text-rose-500",
                badge: psr,
              },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-xl p-3 flex flex-col gap-1`}>
                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${item.labelColor}`}>
                  {item.icon}
                  {item.label}
                </div>
                {item.badge ? (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full self-start ${item.badge.cls}`}>
                    {item.badge.label}
                  </span>
                ) : (
                  <p className="text-xs text-slate-700 font-semibold leading-snug">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayForecast | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");

  const langParam = language === "tc" ? "tc" : "en";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fndRes, rhrRes] = await Promise.allSettled([
        fetch(`${API_BASE}?dataType=fnd&lang=${langParam}`),
        fetch(`${API_BASE}?dataType=rhrread&lang=${langParam}`),
      ]);

      if (fndRes.status === "fulfilled" && fndRes.value.ok) {
        const data: ForecastData = await fndRes.value.json();
        setForecastData(data);
        const todayForecast = data.weatherForecast.find((d) => isToday(d.forecastDate));
        setSelectedDay(todayForecast ?? data.weatherForecast[0]);
        setLastUpdated(formatUpdateTime(data.updateTime));
      } else {
        throw new Error("Failed to load forecast data from HKO");
      }

      if (rhrRes.status === "fulfilled" && rhrRes.value.ok) {
        setCurrentWeather(await rhrRes.value.json());
      }
    } catch (err) {
      setError(t("error.message"));
    } finally {
      setLoading(false);
    }
  }, [langParam, t]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const centralTemp = currentWeather?.temperature?.data?.find(
    (d) => d.place === "Hong Kong Observatory" || d.place === "香港天文台"
  );
  const centralHumidity = currentWeather?.humidity?.data?.[0];
  const uvIndex = currentWeather?.uvindex?.data?.[0];
  const specialTip = currentWeather?.specialWxTips?.[0];
  const tcMessage = currentWeather?.tcmessage?.[0];
  const currentIcon = currentWeather?.icon?.[0];

  return (
    <div className="min-h-screen sky-gradient">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-100/80 shadow-sm">
        <div className="container">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-[10px] font-black tracking-tight">
                  {t("header.hko")}
                </span>
              </div>
              <div>
                <h1 className="font-black text-slate-800 text-sm leading-tight">
                  {t("header.title")}
                </h1>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {t("header.subtitle")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="hidden md:block text-[11px] text-slate-400 font-medium">
                  {t("updated")} {lastUpdated}
                </span>
              )}

              {/* Language Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    language === "en"
                      ? "bg-white text-sky-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage("tc")}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    language === "tc"
                      ? "bg-white text-sky-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  中文
                </button>
              </div>

              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700
                  bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50
                  active:scale-95"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{t("header.refresh")}</span>
              </button>
              <a
                href="https://www.hko.gov.hk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-500 transition-colors px-2 py-1.5"
              >
                <ExternalLink size={12} />
                <span className="hidden sm:inline font-medium">HKO</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── Special Weather Tips Banner ── */}
      {(specialTip || tcMessage) && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container py-2.5">
            <div className="flex items-start gap-2 text-sm text-amber-800">
              <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                {specialTip && <p className="text-xs font-medium leading-relaxed">{specialTip}</p>}
                {tcMessage && (
                  <p className="text-xs font-semibold text-orange-700">{tcMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[320px] sm:min-h-[380px]">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Hong Kong Victoria Harbour skyline"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/65 via-slate-800/45 to-[#f0f7ff]/95" />
        </div>

        <div className="relative container py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 sm:gap-10">
            {/* Left: Current conditions */}
            <div className="flex-1 text-white animate-slide-up">
              <p className="text-sky-200 text-xs font-bold uppercase tracking-[0.2em] mb-1">
                {t("hero.label")}
              </p>
              <div className="flex items-end gap-5 mb-3">
                {loading ? (
                  <div className="skeleton h-20 w-40 rounded-xl" />
                ) : centralTemp ? (
                  <div className="font-mono-data text-7xl sm:text-8xl font-bold text-white leading-none">
                    {centralTemp.value}
                    <span className="text-3xl text-sky-200 font-semibold">°C</span>
                  </div>
                ) : (
                  <div className="font-mono-data text-6xl font-bold text-white/60">—°C</div>
                )}

                <div className="flex flex-col gap-1.5 mb-2">
                  {centralHumidity && (
                    <div className="flex items-center gap-1.5 text-sky-200">
                      <Droplets size={14} />
                      <span className="font-mono-data text-lg font-semibold">
                        {centralHumidity.value}%
                      </span>
                    </div>
                  )}
                  {uvIndex && (
                    <div className="flex items-center gap-1.5 text-amber-200">
                      <span className="text-xs font-bold">{t("uv")}</span>
                      <span className="font-mono-data text-sm font-semibold">
                        {uvIndex.value} · {uvIndex.desc}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedDay && !loading && (
                <p className="text-sky-100 text-sm leading-relaxed max-w-sm opacity-90">
                  {selectedDay.forecastWeather}
                </p>
              )}
            </div>

            {/* Right: Current icon */}
            {(currentIcon || selectedDay) && !loading && (
              <div
                className="flex flex-col items-center gap-2 animate-slide-up shrink-0"
                style={{ animationDelay: "120ms" }}
              >
                <WeatherIcon
                  iconCode={currentIcon ?? selectedDay!.ForecastIcon}
                  size={110}
                  className="drop-shadow-2xl brightness-0 invert opacity-90"
                />
                {selectedDay && (
                  <div className="text-center text-white">
                    <div className="font-mono-data text-xl font-bold">
                      {selectedDay.forecastMaxtemp.value}° /{" "}
                      {selectedDay.forecastMintemp.value}°C
                    </div>
                    <div className="text-sky-200 text-xs font-semibold">
                      {selectedDay.week}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="container py-8 space-y-8">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">{error}</p>
              <button onClick={fetchData} className="text-xs underline mt-0.5 opacity-70 hover:opacity-100">
                {t("error.retry")}
              </button>
            </div>
          </div>
        )}

        {/* 7-Day Forecast Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-800">{t("forecast.title")}</h2>
            <span className="text-xs text-slate-400 font-medium hidden sm:block">
              {t("forecast.subtitle")}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 space-y-2 shadow-sm">
                  <div className="skeleton h-3 w-10 rounded" />
                  <div className="skeleton h-12 w-12 rounded-full mx-auto" />
                  <div className="skeleton h-5 w-14 rounded" />
                  <div className="skeleton h-1 w-full rounded-full" />
                  <div className="skeleton h-3 w-12 rounded" />
                </div>
              ))}
            </div>
          ) : forecastData ? (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
              {forecastData.weatherForecast.slice(0, 7).map((day, i) => (
                <div key={day.forecastDate} className="animate-slide-up" style={{ animationDelay: `${i * 55}ms` }}>
                  <DayCard
                    forecast={day}
                    index={i}
                    selected={selectedDay?.forecastDate === day.forecastDate}
                    onClick={() => setSelectedDay(day)}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* Detail Panel */}
        {selectedDay && !loading && (
          <section>
            <h2 className="text-xl font-black text-slate-800 mb-4">{t("detail.title")}</h2>
            <DetailPanel forecast={selectedDay} />
          </section>
        )}

        {/* Temperature Chart */}
        {forecastData && !loading && (
          <section>
            <h2 className="text-xl font-black text-slate-800 mb-4">{t("chart.title")}</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 animate-slide-up"
              style={{ animationDelay: "180ms" }}>
              <div className="space-y-3">
                {forecastData.weatherForecast.slice(0, 7).map((day) => {
                  const { day: d, month } = formatDate(day.forecastDate);
                  const today = isToday(day.forecastDate);
                  const maxBar = Math.min(100, Math.max(20, ((day.forecastMaxtemp.value - 15) / 25) * 100));
                  const minBar = Math.min(100, Math.max(10, ((day.forecastMintemp.value - 15) / 25) * 100));

                  return (
                    <div
                      key={day.forecastDate}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setSelectedDay(day)}
                    >
                      <div className="w-20 sm:w-24 shrink-0">
                        <span className={`text-xs font-bold ${today ? "text-sky-500" : "text-slate-500"}`}>
                          {today ? t("forecast.today") : day.week.slice(0, 3)}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">
                          {d} {month}
                        </span>
                      </div>
                      <WeatherIcon iconCode={day.ForecastIcon} size={22} />
                      <div className="flex-1 relative h-4 bg-slate-100 rounded-full overflow-hidden group-hover:bg-slate-200 transition-colors">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full opacity-30 transition-all duration-500"
                          style={{ width: `${minBar}%`, background: getTempGradient(day.forecastMaxtemp.value) }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{ width: `${maxBar}%`, background: getTempGradient(day.forecastMaxtemp.value), opacity: 0.65 }}
                        />
                      </div>
                      <div className="w-16 sm:w-20 shrink-0 text-right">
                        <span className="font-mono-data text-sm font-bold text-slate-700">
                          {day.forecastMaxtemp.value}°
                        </span>
                        <span className="font-mono-data text-xs text-slate-400 ml-1">
                          / {day.forecastMintemp.value}°
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* General Situation */}
        {forecastData?.generalSituation && !loading && (
          <section>
            <h2 className="text-xl font-black text-slate-800 mb-4">{t("situation.title")}</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 animate-slide-up"
              style={{ animationDelay: "220ms" }}>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Info size={16} className="text-sky-500" />
                </div>
                <p className="text-slate-600 leading-relaxed text-sm">{forecastData.generalSituation}</p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white/60 backdrop-blur-sm mt-8">
        <div className="container py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>
              {t("footer.credit")}{" "}
              <a
                href="https://www.hko.gov.hk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500 hover:text-sky-600 font-bold transition-colors"
              >
                Hong Kong Observatory
              </a>{" "}
              {t("footer.api")}
            </p>
            <p className="font-medium">{t("footer.update")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
