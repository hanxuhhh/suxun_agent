import React from 'react'
import { NewsStats } from '../../../api/news'
import { FileTextOutlined, ClockCircleOutlined, DatabaseOutlined } from '@ant-design/icons'

interface Props {
  stats: NewsStats | null
}

const StatsCard: React.FC<Props> = ({ stats }) => {
  const items = [
    {
      icon: <FileTextOutlined className="text-purple-400 text-xl" />,
      label: '今日新闻',
      value: stats?.totalToday ?? '--',
      unit: '条',
    },
    {
      icon: <ClockCircleOutlined className="text-blue-400 text-xl" />,
      label: '最近更新',
      value: stats?.lastUpdate
        ? (() => {
            const d = new Date(stats.lastUpdate)
            const diff = Math.floor((Date.now() - d.getTime()) / 60000)
            return diff < 60 ? diff : Math.floor(diff / 60)
          })()
        : '--',
      unit: stats?.lastUpdate
        ? (() => {
            const diff = Math.floor((Date.now() - new Date(stats.lastUpdate).getTime()) / 60000)
            return diff < 60 ? '分钟前' : '小时前'
          })()
        : '',
    },
    {
      icon: <DatabaseOutlined className="text-green-400 text-xl" />,
      label: '数据来源',
      value: stats?.sourceCount ?? '--',
      unit: '个',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 px-3 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"
        >
          {item.icon}
          <div className="mt-1 text-lg font-bold text-gray-800 dark:text-white">
            {item.value}
            <span className="text-xs font-normal text-gray-400 ml-0.5">{item.unit}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export default StatsCard
