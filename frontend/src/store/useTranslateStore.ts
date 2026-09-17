import { create } from 'zustand'
import type { ModelGroup } from '../types/translate'

interface TranslateStore {
  // config
  selectedModel: string
  selectedStyle: string
  modelGroups: ModelGroup[]
  // content
  sourceText: string
  targetText: string
  sourceLang: 'zh' | 'en'
  targetLang: 'zh' | 'en'
  // ui state
  loading: boolean
  // dark mode
  darkMode: boolean

  setSelectedModel: (model: string) => void
  setSelectedStyle: (style: string) => void
  setModelGroups: (groups: ModelGroup[]) => void
  setSourceText: (text: string) => void
  setTargetText: (text: string) => void
  setLoading: (loading: boolean) => void
  swapLanguages: () => void
  clearSource: () => void
  toggleDarkMode: () => void
}

export const useTranslateStore = create<TranslateStore>((set) => ({
  selectedModel: 'openai/gpt-oss-120b',
  selectedStyle: 'colloquial',
  modelGroups: [],
  sourceText: '',
  targetText: '',
  sourceLang: 'zh',
  targetLang: 'en',
  loading: false,
  darkMode: false,

  setSelectedModel: (model) => set({ selectedModel: model }),
  setSelectedStyle: (style) => set({ selectedStyle: style }),
  setModelGroups: (groups) => set({ modelGroups: groups }),
  setSourceText: (text) => set({ sourceText: text }),
  setTargetText: (text) => set({ targetText: text }),
  setLoading: (loading) => set({ loading }),
  swapLanguages: () =>
    set((state) => ({
      sourceLang: state.targetLang,
      targetLang: state.sourceLang,
      sourceText: '',
      targetText: '',
    })),
  clearSource: () => set({ sourceText: '', targetText: '' }),
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode
      if (next) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return { darkMode: next }
    }),
}))
