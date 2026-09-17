import React from 'react'
import { Button, Spin } from 'antd'
import { EnvironmentOutlined, ReloadOutlined, DownOutlined } from '@ant-design/icons'

interface Props {
  city: string
  district: string
  loading: boolean
  error: string | null
  method: 'gps' | 'ip' | 'manual' | null
  onRelocate: () => void
  onManual: (lng: number, lat: number) => void
  onOpenCityPicker: () => void
}

const LocationBar: React.FC<Props> = ({
  city, district, loading, error, method, onRelocate, onOpenCityPicker
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2">
        <EnvironmentOutlined className="text-orange-500 text-lg" />
        {loading ? (
          <span className="flex items-center gap-2 text-gray-400 text-sm">
            <Spin size="small" /> 定位中...
          </span>
        ) : error ? (
          <span className="text-red-400 text-sm">{error}</span>
        ) : (
          <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">
            {city || '未知位置'}{district && district !== city ? district : ''}
            {method === 'ip' && <span className="ml-1 text-xs text-gray-400">（IP定位）</span>}
            {method === 'manual' && <span className="ml-1 text-xs text-orange-400">（手动选择）</span>}
            {method === 'gps' && <span className="ml-1 text-xs text-green-400">（GPS）</span>}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="text"
          size="small"
          icon={<DownOutlined />}
          onClick={onOpenCityPicker}
          className="text-orange-500 text-xs"
        >
          切换城市
        </Button>
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={onRelocate}
          className="text-gray-400 text-xs"
        >
          重定位
        </Button>
      </div>
    </div>
  )
}

export default LocationBar
