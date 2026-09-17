import React from 'react'
import { Button, Tabs, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { useTranslateStore } from '../store/useTranslateStore'

const TranslateOutput: React.FC = () => {
  const { targetText, targetLang, loading } = useTranslateStore()

  const handleCopy = async () => {
    if (!targetText) return
    try {
      await navigator.clipboard.writeText(targetText)
      message.success('已复制到剪贴板')
    } catch {
      message.error('复制失败，请手动复制')
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
      <Tabs
        activeKey={targetLang}
        items={[
          { key: 'en', label: 'English' },
          { key: 'zh', label: '中文' },
        ]}
        className="px-4 pt-2 border-b border-gray-100 dark:border-gray-700"
        tabBarStyle={{ marginBottom: 0 }}
      />
      <div className="flex-1 p-4 overflow-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-purple-500">
            <span className="animate-spin text-xl">⚙️</span>
            <span className="text-sm">翻译中…</span>
          </div>
        ) : targetText ? (
          <p className="text-base leading-relaxed whitespace-pre-wrap dark:text-gray-100 m-0">{targetText}</p>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 text-sm m-0">翻译结果将显示在此处</p>
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700">
        <span />
        <Button
          type="text"
          icon={<CopyOutlined />}
          size="small"
          onClick={handleCopy}
          disabled={!targetText}
          className="text-gray-400 hover:text-purple-500"
        >
          复制
        </Button>
      </div>
    </div>
  )
}

export default TranslateOutput
