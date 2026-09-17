import React, { useEffect } from 'react'
import { Select } from 'antd'
import { useTranslateStore } from '../store/useTranslateStore'
import { getModels } from '../api/models'

const ModelSelector: React.FC = () => {
  const { selectedModel, setSelectedModel, modelGroups, setModelGroups } = useTranslateStore()

  useEffect(() => {
    getModels().then((res) => {
      setModelGroups(res.data.data)
    }).catch(() => {
      // fallback to default models if backend is not ready
      setModelGroups([
        {
          provider: 'DeepSeek',
          models: [
            { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)' },
            { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)' },
          ],
        },
        {
          provider: 'OpenAI',
          models: [
            { id: 'gpt-4o', name: 'GPT-4o' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
          ],
        },
      ])
    })
  }, [setModelGroups])

  const options = modelGroups.map((group) => ({
    label: group.provider,
    options: group.models.map((m) => ({ value: m.id, label: m.name })),
  }))

  return (
    <Select
      value={selectedModel}
      onChange={setSelectedModel}
      options={options}
      style={{ width: '100%' }}
      size="middle"
      placeholder="选择模型"
    />
  )
}

export default ModelSelector
