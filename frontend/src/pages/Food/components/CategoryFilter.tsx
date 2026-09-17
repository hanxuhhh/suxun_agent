import React from 'react'
import { FoodCategory } from '../../../types/food'

interface Props {
  categories: FoodCategory[]
  current: string
  radius: number
  sortBy: string
  onCategoryChange: (c: string) => void
  onRadiusChange: (r: number) => void
  onSortChange: (s: 'distance' | 'rating' | 'popular') => void
}

const RADIUS_OPTIONS = [
  { value: 500, label: '500m' },
  { value: 1000, label: '1km' },
  { value: 3000, label: '3km' },
  { value: 5000, label: '5km' },
]

const SORT_OPTIONS = [
  { value: 'distance', label: '距离最近' },
  { value: 'rating', label: '评分最高' },
]

const CategoryFilter: React.FC<Props> = ({
  categories, current, radius, sortBy,
  onCategoryChange, onRadiusChange, onSortChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto px-4 pt-3 pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm transition-all ${
              current === cat.id
                ? 'bg-orange-500 text-white font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Radius + Sort */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onRadiusChange(opt.value)}
              className={`px-2.5 py-1 transition-colors ${
                radius === opt.value
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value as any)}
              className={`px-2.5 py-1 transition-colors ${
                sortBy === opt.value
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CategoryFilter
