import React from 'react'
import { Button, Tabs } from 'antd'
import { ClearOutlined } from '@ant-design/icons'
import { useTranslateStore } from '../store/useTranslateStore'

const MAX_LENGTH = 5000

const TranslateInput: React.FC = () => {
  const { sourceText, sourceLang, setSourceText, setTargetText, clearSource } = useTranslateStore()

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    if (val.length <= MAX_LENGTH) {
      setSourceText(val)
      setTargetText('')
    }
  }

  const langLabel = sourceLang === 'zh' ? '中文' : 'English'

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
      <Tabs
        activeKey={sourceLang}
        items={[
          { key: 'zh', label: '中文' },
          { key: 'en', label: 'English' },
        ]}
        className="px-4 pt-2 border-b border-gray-100 dark:border-gray-700"
        tabBarStyle={{ marginBottom: 0 }}
      />
      <textarea
        className="flex-1 resize-none p-4 text-base outline-none bg-transparent dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        placeholder={`请输入${langLabel}文本…`}
        value={sourceText}
        onChange={handleTextChange}
        maxLength={MAX_LENGTH}
      />
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700">
        <span className="text-xs text-gray-400">
          {sourceText.length} / {MAX_LENGTH}
        </span>
        <Button
          type="text"
          icon={<ClearOutlined />}
          size="small"
          onClick={clearSource}
          className="text-gray-400 hover:text-red-400"
        >
          清空
        </Button>
      </div>
    </div>
  )
}

export default TranslateInput
