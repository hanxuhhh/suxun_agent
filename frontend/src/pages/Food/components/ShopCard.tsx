import React, { useState } from 'react'
import { ShopVO } from '../../../types/food'
import { EnvironmentOutlined, PhoneOutlined, StarFilled } from '@ant-design/icons'

interface Props {
  shop: ShopVO
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
]

function getDefaultImg(id: string) {
  const idx = id.charCodeAt(0) % DEFAULT_IMAGES.length
  return DEFAULT_IMAGES[idx]
}

function formatDistance(m: number) {
  if (!m) return ''
  return m >= 1000 ? (m / 1000).toFixed(1) + 'km' : m + 'm'
}

const ShopCard: React.FC<Props> = ({ shop }) => {
  const [imgError, setImgError] = useState(false)
  const imgSrc = !imgError && shop.photos && shop.photos.length > 0
    ? shop.photos[0]
    : getDefaultImg(shop.id)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={imgSrc}
          alt={shop.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="px-2 py-0.5 text-xs bg-black/50 text-white rounded-full backdrop-blur-sm">
            {shop.category}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded-full backdrop-blur-sm ${
            shop.openStatus === '营业中'
              ? 'bg-green-500/80 text-white'
              : 'bg-gray-500/80 text-white'
          }`}>
            {shop.openStatus}
          </span>
        </div>
        {shop.distance > 0 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-orange-500/90 text-white rounded-full">
            {formatDistance(shop.distance)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-snug line-clamp-1 flex-1">
            {shop.name}
          </h3>
          {shop.rating && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <StarFilled className="text-yellow-400 text-xs" />
              <span className="text-xs font-bold text-orange-500">{shop.rating}</span>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
          {shop.avgCost && <span>人均 ¥{shop.avgCost}</span>}
          {shop.businessArea && <span>{shop.businessArea}</span>}
        </div>

        {/* AI Description */}
        {shop.aiDescription && (
          <p className="text-xs text-gray-500 dark:text-gray-400 bg-orange-50 dark:bg-orange-950/20 rounded-lg px-2.5 py-2 mb-3 leading-relaxed line-clamp-3">
            ✨ {shop.aiDescription}
          </p>
        )}

        {/* Address + Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-start gap-1 min-w-0">
            <EnvironmentOutlined className="text-gray-300 text-xs mt-0.5 flex-shrink-0" />
            <span className="text-xs text-gray-400 line-clamp-1">{shop.address}</span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {shop.tel && (
              <a
                href={`tel:${shop.tel}`}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
                onClick={(e) => e.stopPropagation()}
              >
                <PhoneOutlined />
              </a>
            )}
            <a
              href={shop.amapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              导航
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShopCard
