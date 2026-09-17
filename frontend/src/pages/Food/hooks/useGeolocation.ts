import { useState, useEffect } from 'react'

interface GeoState {
  lng: number | null
  lat: number | null
  error: string | null
  loading: boolean
  method: 'gps' | 'ip' | 'manual' | null
}

// Common Chinese cities for manual selection
export const CITY_PRESETS = [
  { name: '北京', lng: 116.4074, lat: 39.9042 },
  { name: '上海', lng: 121.4737, lat: 31.2304 },
  { name: '深圳', lng: 114.0579, lat: 22.5431 },
  { name: '广州', lng: 113.2644, lat: 23.1291 },
  { name: '杭州', lng: 120.1536, lat: 30.2658 },
  { name: '成都', lng: 104.0668, lat: 30.5728 },
  { name: '武汉', lng: 114.3054, lat: 30.5931 },
  { name: '西安', lng: 108.9398, lat: 34.3416 },
  { name: '南京', lng: 118.7969, lat: 32.0603 },
  { name: '重庆', lng: 106.5516, lat: 29.5630 },
  { name: '苏州', lng: 120.5853, lat: 31.2990 },
  { name: '天津', lng: 117.1902, lat: 39.1256 },
]

async function getLocationByIP(): Promise<{ lng: number; lat: number; city?: string }> {
  // ip-api.com HTTP endpoint (accessible in China)
  const res = await fetch('http://ip-api.com/json/?lang=zh-CN&fields=status,lat,lon,city', {
    signal: AbortSignal.timeout(6000),
  })
  const data = await res.json()
  if (data.status === 'success' && data.lat && data.lon) {
    return { lng: data.lon, lat: data.lat, city: data.city }
  }
  throw new Error('IP location failed')
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    lng: null, lat: null, error: null, loading: false, method: null,
  })

  const locate = async () => {
    setState(s => ({ ...s, loading: true, error: null }))

    // 1. Try GPS first
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            enableHighAccuracy: false,
          })
        })
        setState({
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
          error: null,
          loading: false,
          method: 'gps',
        })
        return
      } catch {
        // GPS failed or denied, fall through to IP
      }
    }

    // 2. Fallback to IP location
    try {
      const { lng, lat } = await getLocationByIP()
      setState({ lng, lat, error: null, loading: false, method: 'ip' })
      return
    } catch {
      // IP also failed
    }

    setState({
      lng: null, lat: null,
      error: '自动定位失败，请手动选择城市',
      loading: false,
      method: null,
    })
  }

  const setManual = (lng: number, lat: number) => {
    setState({ lng, lat, error: null, loading: false, method: 'manual' })
  }

  useEffect(() => { locate() }, [])

  return { ...state, locate, setManual }
}
