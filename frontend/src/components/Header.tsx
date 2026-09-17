import React from 'react'
import { Link } from 'react-router-dom'
import { SwapOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons'
import { useTranslateStore } from '../store/useTranslateStore'

const Header: React.FC = () => {
  const { darkMode, toggleDarkMode, swapLanguages } = useTranslateStore()

  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
      <Link to="/" className="flex items-center gap-2 no-underline">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
          AI
        </div>
        <span className="text-base font-bold text-gray-800 dark:text-white">
          苏寻的 AI 工坊
        </span>
      </Link>

      <div className="flex items-center gap-1">
        <button
          aria-label="左右语言互换"
          onClick={swapLanguages}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 touch-active"
        >
          <SwapOutlined />
        </button>
        <button
          aria-label="切换深色模式"
          onClick={toggleDarkMode}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 touch-active"
        >
          {darkMode ? <SunOutlined /> : <MoonOutlined />}
        </button>
      </div>
    </header>
  )
}

export default Header
