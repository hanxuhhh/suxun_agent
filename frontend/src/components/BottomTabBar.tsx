import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const TABS = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/chat', label: '对话', icon: '💬' },
  { to: '/english', label: '英语', icon: '🎓' },
  { to: '/food', label: '美食', icon: '🍜' },
  { to: '/news', label: '新闻', icon: '📰' },
]

const BottomTabBar: React.FC = () => {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around
        bg-white/95 dark:bg-gray-900/95 backdrop-blur
        border-t border-gray-200 dark:border-gray-800"
      style={{ height: 'calc(56px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.to
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5
              no-underline touch-active ${active ? '' : 'opacity-60'}`}
          >
            <span
              className={`text-xl leading-none ${active ? 'scale-110' : ''}`}
              style={{ transition: 'transform 0.15s' }}
            >
              {tab.icon}
            </span>
            <span
              className={`text-[10px] leading-none ${
                active
                  ? 'text-purple-600 dark:text-purple-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export default BottomTabBar
