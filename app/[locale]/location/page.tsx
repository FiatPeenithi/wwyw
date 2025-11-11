'use client'

import MainLayout from "@/app/components/main-layout"
import ListSkeleton from "@/app/components/skeletons/list-skeleton"
import { MapPin, Navigation, X, Search, Crosshair, Loader2, ChevronLeft } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// ---- Utility types ----
type StoredLocation = {
  lat: number
  lng: number
  name?: string
  source: 'current' | 'pin' | 'search'
  savedAt: number
}

const STORAGE_KEY = 'startLocation'

// ---- Helper to load Leaflet & CSS on-demand (no SSR issues, no react-leaflet needed) ----
async function ensureLeaflet() {
  // load CSS once
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link')
    link.id = 'leaflet-css'
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }
  // dynamic import leaflet JS
  const L = await import('leaflet')
  // default icons
  // @ts-ignore
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
  return L
}

// ---- Geocoding helpers (OpenStreetMap Nominatim, locale-aware) ----
async function reverseGeocode(lat: number, lng: number, locale: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept': 'application/json', 'Accept-Language': locale } }
    )
    const data = await res.json()
    return data?.display_name as string | undefined
  } catch {
    return undefined
  }
}

async function geocodeSearch(q: string, locale: string): Promise<Array<{ display_name: string; lat: string; lon: string }>> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(q)}`,
    { headers: { 'Accept': 'application/json', 'Accept-Language': locale } }
  )
  const data = await res.json()
  return data || []
}

// ---- Modal: Pin on Map (Leaflet) with Calibrate ----
function MapPickerModal({
  open,
  initial,
  onClose,
  onConfirm,
}: {
  open: boolean
  initial?: { lat: number; lng: number }
  onClose: () => void
  onConfirm: (loc: StoredLocation) => void
}) {
  const t = useTranslations('Location')
  const locale = useLocale()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const [calibrating, setCalibrating] = useState(false)
  const [calibrateError, setCalibrateError] = useState<string | null>(null)

  // build / teardown the map when modal opens
  useEffect(() => {
    let L: any

    async function setup() {
      if (!open || !containerRef.current) return
      L = await ensureLeaflet()
      leafletRef.current = L

      // custom pin icon
      const pinIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/2776/2776067.png",
        iconRetinaUrl: "https://cdn-icons-png.flaticon.com/512/2776/2776067.png",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      })

      const center = initial ?? { lat: 13.7563, lng: 100.5018 } // Bangkok

      mapRef.current = L.map(containerRef.current).setView([center.lat, center.lng], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current)

      markerRef.current = L.marker([center.lat, center.lng], { draggable: true, icon: pinIcon }).addTo(mapRef.current)

      // click to set marker
      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        markerRef.current.setLatLng([lat, lng])
      })

      setTimeout(() => mapRef.current?.invalidateSize?.(), 50)
    }

    setup()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      markerRef.current = null
      circleRef.current = null
    }
  }, [open, initial])

  const calibrate = async () => {
    setCalibrateError(null)
    if (!('geolocation' in navigator) || !mapRef.current) {
      setCalibrateError(t('geoNotSupported'))
      return
    }
    setCalibrating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        mapRef.current.setView([lat, lng], 17, { animate: true })
        markerRef.current?.setLatLng([lat, lng])

        if (circleRef.current) {
          circleRef.current.remove()
          circleRef.current = null
        }
        // show accuracy circle
        const L = leafletRef.current
        circleRef.current = L.circle([lat, lng], {
          radius: Math.max(accuracy, 10),
          color: '#f59e0b', // amber-500 line
          weight: 1.5,
          opacity: 0.7,
          fillOpacity: 0.12,
        }).addTo(mapRef.current)
        setCalibrating(false)
      },
      (err) => {
        setCalibrateError(err?.message || t('geoFailed'))
        setCalibrating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const handleConfirm = async () => {
    if (!markerRef.current) return
    const { lat, lng } = markerRef.current.getLatLng()
    const name = await reverseGeocode(lat, lng, locale)
    onConfirm({ lat, lng, name, source: 'pin', savedAt: Date.now() })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-[61] mx-3 w-full max-w-[720px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-800">{t('pinLocation')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={calibrate}
              disabled={calibrating}
              aria-busy={calibrating}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              {calibrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
              {calibrating ? t('gettingLocation') : t('calibrate')}
            </button>
            <button aria-label={t('close')} onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-300">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="relative h-[60vh] bg-white">
          {/* map container */}
          <div ref={containerRef} className="absolute inset-0" />
          {/* top-right calibrating badge */}
          {calibrating && (
            <div className="absolute right-3 top-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full border text-xs flex items-center gap-2 shadow-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{t('gettingLocation')}</span>
            </div>
          )}
          {/* error toast (non-blocking) */}
          {calibrateError && (
            <div className="absolute left-3 bottom-3 bg-red-50 text-red-700 border border-red-200 text-xs px-3 py-2 rounded-lg shadow-sm">
              {calibrateError}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2 bg-white">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300">{t('cancel')}</button>
          <button onClick={handleConfirm} className="px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300">
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Modal: Search place (Nominatim) ----
function SearchPlaceModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (loc: StoredLocation) => void
}) {
  const t = useTranslations('Location')
  const locale = useLocale()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  const onSearch = useCallback(async () => {
    if (!query.trim()) return
    try {
      setSearching(true)
      const data = await geocodeSearch(query, locale)
      setResults(data)
    } catch (e) {
      console.error(e)
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [query, locale])

  const pick = (r: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    onConfirm({ lat, lng, name: r.display_name, source: 'search', savedAt: Date.now() })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-[61] mx-3 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-800">{t('search')}</h3>
          </div>
          <button aria-label={t('close')} onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-300">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-3 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <button
            onClick={onSearch}
            className="px-4 py-3 rounded-2xl border border-slate-300 hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-300"
            disabled={searching}
          >
            {searching ? t('searching') : t('search')}
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">{t('noResults')}</div>
          ) : (
            <ul className="divide-y">
              {results.map((r, i) => (
                <li
                  key={i}
                  className="p-4 hover:bg-slate-50 cursor-pointer active:bg-slate-100 transition"
                  onClick={() => pick(r)}
                >
                  <div className="text-sm font-medium text-slate-800">{r.display_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{Number(r.lat).toFixed(5)}, {Number(r.lon).toFixed(5)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function Page() {
  const [loading, setLoading] = useState(false);
  const t = useTranslations('Location')
  const locale = useLocale()

  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [saved, setSaved] = useState<StoredLocation | null>(null)
  const [geoBusy, setGeoBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter();

  // restore saved on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSaved(JSON.parse(raw))
    } catch { }
  }, [])

  // Use current location -> reverse geocode (locale) -> save
  const handleUseCurrent = async () => {
    setError(null)
    if (!('geolocation' in navigator)) {
      setError(t('geoNotSupported'))
      return
    }
    setGeoBusy(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const name = await reverseGeocode(lat, lng, locale)
        const data: StoredLocation = { lat, lng, name, source: 'current', savedAt: Date.now() }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        setSaved(data)
        setGeoBusy(false)
      },
      (err) => {
        setError(err.message || t('geoFailed'))
        setGeoBusy(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  // Confirm from either modal -> save
  const handleConfirm = (loc: StoredLocation) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
    setSaved(loc)
  }

  return (
    <MainLayout loading={loading} loadingSlot={<ListSkeleton />}>
      {/* Header - mobile first */}
      <div className="px-4 pt-4 mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
        <button onClick={() => router.push(`/${locale}/category`)} className="bg-slate-100 shadow p-2 mt-4 flex items-center mx-auto text-sm rounded-lg gap-2">
          <ChevronLeft />
          {locale === 'en' ? "Select Wish" : "เลือกคำอธิษฐาน"}
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-28 grid gap-4">
        {/* Saved card */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-700">{t("startLocation")}</p>
          <p className="text-slate-600 mt-1 line-clamp-2">{saved?.name || t("noSetup")}</p>

          {/* meta badges */}
          {saved && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 text-xs">
                {saved.source === 'current' ? t('currentLocation') : saved.source === 'pin' ? t('pinLocation') : t('search')}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 text-xs">
                {new Date(saved.savedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Actions - as large tappable cards */}
        <button
          onClick={handleUseCurrent}
          className="flex gap-3 p-4 bg-white rounded-2xl border border-slate-200 items-center text-left hover:shadow-sm hover:border-slate-300 active:scale-[0.99] transition"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
            {geoBusy ? <Loader2 className="w-5 h-5 animate-spin text-amber-700" /> : <Navigation className="w-5 h-5 text-amber-700" />}
          </span>
          <div className="flex-1">
            <p className="font-medium text-slate-900">{t("currentLocation")}</p>
            <p className="text-xs text-slate-500 mt-1">
              {geoBusy ? t('gettingLocation') : t('tapToUseCurrent')}
            </p>
          </div>
        </button>

        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex gap-3 p-4 bg-white rounded-2xl border border-slate-200 items-center text-left hover:shadow-sm hover:border-slate-300 active:scale-[0.99] transition"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
            <Search className="w-5 h-5 text-amber-700" />
          </span>
          <div className="flex-1">
            <p className="font-medium text-slate-900">{t("search")}</p>
            <p className="text-xs text-slate-500 mt-1">
              {t('searchPlaceholder')}
            </p>
          </div>
        </button>

        <button
          onClick={() => setPinModalOpen(true)}
          className="flex gap-3 p-4 bg-white rounded-2xl border border-slate-200 items-center text-left hover:shadow-sm hover:border-slate-300 active:scale-[0.99] transition"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
            <MapPin className="w-5 h-5 text-amber-700" />
          </span>
          <div className="flex-1">
            <p className="font-medium text-slate-900">{t("pinLocation")}</p>
            <p className="text-xs text-slate-500 mt-1">
              {t('pinOrSearch')}
            </p>
          </div>
        </button>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Sticky bottom actions */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-screen-sm px-4 py-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setSaved(null);
            }}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-slate-800 hover:bg-slate-50 active:scale-[0.99] transition font-medium"
          >
            {t("clearBtn")}
          </button>
          <button
            type="button"
            disabled={!saved}
            onClick={() => router.push('/trip')}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-3 font-semibold active:scale-[0.99] transition focus:outline-none focus:ring-2 focus:ring-amber-300 ${saved
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-slate-200 text-slate-500 cursor-not-allowed"
              }`}
          >
            {t("btnNext")}
          </button>
        </div>
      </div>

      {/* Modals */}
      <MapPickerModal
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onConfirm={handleConfirm}
      />

      <SearchPlaceModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </MainLayout>
  )
}

export default Page
