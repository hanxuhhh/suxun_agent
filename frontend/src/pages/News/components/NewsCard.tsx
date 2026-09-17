import React from 'react'
import { NewsItem } from '../../../api/news'

interface Props {
  item: NewsItem
}

const CATEGORY_LABELS: Record<string, string> = {
  ai: 'AI',
  tech: '科技',
  finance: '财经',
  international: '国际',
  nba: 'NBA',
  science: '科学',
  society: '社会',
}

const CATEGORY_COLORS: Record<string, string> = {
  ai: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  tech: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  finance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  international: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  nba: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  science: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  society: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr.replace(' ', 'T'))
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return `${diff}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${Math.floor(diff / 86400)}天前`
}

const NewsCard: React.FC<Props> = ({ item }) => {
  const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.society
  const catLabel = CATEGORY_LABELS[item.category] || item.category

  return (
    <a
      href={item.link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors border-b border-gray-100 dark:border-gray-800 no-underline"
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {item.importance === 'major' && (
            <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-500 text-white">重大</span>
          )}
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${catColor}`}>
            {catLabel}
          </span>
          <span className="text-xs text-gray-400">
            {item.source} · {item.publishTime ? timeAgo(item.publishTime) : ''}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-100 leading-snug mb-1.5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
          {item.title}
        </h3>

        {/* Summary */}
        {item.summary && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {item.summary}
          </p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs text-gray-400 dark:text-gray-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image */}
      {item.imageUrl && (
        <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
    </a>
  )
}

export default NewsCard
