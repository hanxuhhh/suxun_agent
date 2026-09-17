import React from 'react'
import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

interface Props {
  keyword: string
  sort: 'latest' | 'important'
  onKeywordChange: (v: string) => void
  onSortChange: (s: 'latest' | 'important') => void
}

const SearchSortBar: React.FC<Props> = ({ keyword, sort, onKeywordChange, onSortChange }) => {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="flex-1">
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="搜索新闻标题、关键词..."
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          className="rounded-lg"
          allowClear
        />
      </div>

      <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
        {(['latest', 'important'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onSortChange(s)}
            className={`px-3 py-2 text-sm transition-colors ${
              sort === s
                ? 'bg-purple-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {s === 'latest' ? '最新' : '重要'}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SearchSortBar
