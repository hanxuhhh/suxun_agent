import React, { useState, useMemo } from 'react'
// @ts-ignore
import areaData from 'china-area-data'
import { apiUrl } from '../../../utils/apiBase'

interface AreaItem {
  code: string
  name: string
}

interface Props {
  onConfirm: (lng: number, lat: number, label: string) => void
  onCancel?: () => void
}

const ProvinceDistrictPicker: React.FC<Props> = ({ onConfirm, onCancel }) => {
  const [province, setProvince] = useState<AreaItem | null>(null)
  const [cityItem, setCityItem] = useState<AreaItem | null>(null)
  const [district, setDistrict] = useState<AreaItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Province list
  const provinces = useMemo<AreaItem[]>(() => {
    return Object.entries(areaData['86'] as Record<string, string>).map(
      ([code, name]) => ({ code, name: name as string })
    )
  }, [])

  // City list for selected province
  const cities = useMemo<AreaItem[]>(() => {
    if (!province) return []
    const data = areaData[province.code]
    if (!data) return []
    return Object.entries(data as Record<string, string>).map(
      ([code, name]) => ({ code, name: name as string })
    )
  }, [province])

  // District list for selected city
  const districts = useMemo<AreaItem[]>(() => {
    if (!cityItem) return []
    const data = areaData[cityItem.code]
    if (!data) return []
    return Object.entries(data as Record<string, string>).map(
      ([code, name]) => ({ code, name: name as string })
    )
  }, [cityItem])

  const handleConfirm = async () => {
    if (!province) return
    setLoading(true)
    setError(null)

    // Build address string for geocoding
    const address = [province.name, cityItem?.name, district?.name]
      .filter(Boolean).join('')
    const label = [province.name, cityItem?.name, district?.name]
      .filter(Boolean).join(' ')

    try {
      const res = await fetch(
        apiUrl(`/api/food/geocode?address=${encodeURIComponent(address)}`)
      )
      const json = await res.json()
      if (json.code === 0 && json.data) {
        onConfirm(json.data.lng, json.data.lat, label)
      } else {
        setError('获取坐标失败，请重试')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {/* Province */}
        <div>
          <div className="text-xs text-gray-400 mb-1.5 font-medium">省/直辖市</div>
          <div className="h-44 overflow-y-auto border border-gray-200 rounded-lg">
            {provinces.map(p => (
              <div
                key={p.code}
                onClick={() => { setProvince(p); setCityItem(null); setDistrict(null) }}
                className={`px-2 py-2 text-xs cursor-pointer transition-colors ${
                  province?.code === p.code
                    ? 'bg-orange-500 text-white font-medium'
                    : 'hover:bg-orange-50 text-gray-700'
                }`}
              >
                {p.name}
              </div>
            ))}
          </div>
        </div>

        {/* City */}
        <div>
          <div className="text-xs text-gray-400 mb-1.5 font-medium">市</div>
          <div className="h-44 overflow-y-auto border border-gray-200 rounded-lg">
            {cities.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-300">先选省份</div>
            ) : cities.map(c => (
              <div
                key={c.code}
                onClick={() => { setCityItem(c); setDistrict(null) }}
                className={`px-2 py-2 text-xs cursor-pointer transition-colors ${
                  cityItem?.code === c.code
                    ? 'bg-orange-500 text-white font-medium'
                    : 'hover:bg-orange-50 text-gray-700'
                }`}
              >
                {c.name}
              </div>
            ))}
          </div>
        </div>

        {/* District */}
        <div>
          <div className="text-xs text-gray-400 mb-1.5 font-medium">区/县</div>
          <div className="h-44 overflow-y-auto border border-gray-200 rounded-lg">
            {districts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-300">先选城市</div>
            ) : districts.map(d => (
              <div
                key={d.code}
                onClick={() => setDistrict(d)}
                className={`px-2 py-2 text-xs cursor-pointer transition-colors ${
                  district?.code === d.code
                    ? 'bg-orange-500 text-white font-medium'
                    : 'hover:bg-orange-50 text-gray-700'
                }`}
              >
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected path */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm">
        <span className="text-gray-400 text-xs">已选：</span>
        <span className="text-orange-500 font-medium">
          {[province?.name, cityItem?.name, district?.name].filter(Boolean).join(' > ') || '请选择省份'}
        </span>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Buttons */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={!province || loading}
          className={`px-5 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            province && !loading
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? '定位中...' : '确认位置'}
        </button>
      </div>
    </div>
  )
}

export default ProvinceDistrictPicker
