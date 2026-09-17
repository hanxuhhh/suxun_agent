import React from 'react'

interface Props {
  current: string
  onChange: (cat: string) => void
  categoryCount: Record<string, number>
}

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'ai', label: '🤖 AI' },
  { key: 'tech', label: '💻 科技' },
  { key: 'finance', label: '📈 财经' },
  { key: 'international', label: '🌍 国际' },
  { key: 'nba', label: '🏀 NBA' },
  { key: 'science', label: '🔬 科学' },
  { key: 'society', label: '🏙️ 社会' },
]

const CategoryTabs: React.FC<Props> = ({ current, onChange, categoryCount }) => {
  return (
    <div className="flex gap-1 overflow-x-auto px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 scrollbar-hide">
      {CATEGORIES.map((cat) => {
        const count = cat.key === 'all'
          ? Object.values(categoryCount).reduce((a, b) => a + b, 0)
          : (categoryCount[cat.key] ?? 0)
        const active = current === cat.key

        return (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
              active
                ? 'bg-purple-600 text-white font-medium shadow-sm shadow-purple-200 dark:shadow-purple-900'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {cat.label}
            {count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryTabs
