import React from 'react'
import { Button } from 'antd'
import { SwapOutlined } from '@ant-design/icons'
import { translateText } from '../api/translate'
import { useTranslateStore } from '../store/useTranslateStore'
import Header from '../components/Header'
import ModelSelector from '../components/ModelSelector'
import StyleSelector from '../components/StyleSelector'
import TranslateInput from '../components/TranslateInput'
import TranslateOutput from '../components/TranslateOutput'

const Translator: React.FC = () => {
  const {
    sourceText,
    targetText: _targetText,
    sourceLang,
    targetLang,
    selectedModel,
    selectedStyle,
    loading,
    setLoading,
    setTargetText,
    swapLanguages,
  } = useTranslateStore()

  const handleTranslate = async () => {
    if (!sourceText.trim()) return
    setLoading(true)
    try {
      const res = await translateText({
        text: sourceText,
        sourceLang,
        targetLang,
        model: selectedModel,
        style: selectedStyle,
      })
      setTargetText(res.data.data.translatedText)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col tab-page">
      <Header />

      <main className="flex-1 flex flex-col w-full mx-auto px-4 py-4 gap-3">
        {/* Config bar —— 手机上两行堆叠，选择器占满整行 */}
        <div className="flex flex-col gap-2.5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm px-4 py-3.5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium flex-shrink-0 w-16">AI 模型</span>
            <div className="flex-1 min-w-0">
              <ModelSelector />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium flex-shrink-0 w-16">翻译风格</span>
            <div className="flex-1 min-w-0">
              <StyleSelector />
            </div>
          </div>
        </div>

        {/* Translation area —— 竖向堆叠：输入 → 互换 → 输出 */}
        <div className="flex flex-col gap-3" style={{ minHeight: 300 }}>
          {/* 输入 */}
          <div className="min-w-0" style={{ minHeight: 150 }}>
            <TranslateInput />
          </div>

          {/* 互换按钮（居中，上下排列时可旋转90°） */}
          <div className="flex items-center justify-center">
            <Button
              type="default"
              shape="circle"
              icon={<SwapOutlined />}
              onClick={swapLanguages}
              className="border-purple-200 text-purple-500 shadow-sm"
              size="large"
            />
          </div>

          {/* 输出 */}
          <div className="min-w-0 flex-1" style={{ minHeight: 150 }}>
            <TranslateOutput />
          </div>
        </div>

        {/* 翻译按钮 —— 全宽，大拇指热区 */}
        <div className="pb-2">
          <Button
            type="primary"
            size="large"
            block
            loading={loading}
            disabled={!sourceText.trim()}
            onClick={handleTranslate}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              border: 'none',
              borderRadius: 12,
              height: 50,
              fontSize: 16,
              fontWeight: 600,
              boxShadow: '0 4px 24px 0 rgba(124,58,237,0.35)',
            }}
          >
            {loading ? '翻译中…' : '翻 译'}
          </Button>
        </div>
      </main>
    </div>
  )
}

export default Translator
