import React from 'react'
import { Select } from 'antd'
import { useTranslateStore } from '../store/useTranslateStore'

const STYLES = [
  { value: 'colloquial', label: '🗣️ 地道口语' },
  { value: 'business', label: '💼 商务正式' },
  { value: 'literary', label: '📚 文学优美' },
  { value: 'academic', label: '🔬 学术严谨' },
]

const StyleSelector: React.FC = () => {
  const { selectedStyle, setSelectedStyle } = useTranslateStore()

  return (
    <Select
      value={selectedStyle}
      onChange={setSelectedStyle}
      options={STYLES}
      style={{ width: '100%' }}
      size="middle"
    />
  )
}

export default StyleSelector
