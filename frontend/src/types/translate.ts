export interface TranslateRequest {
  text: string
  sourceLang: 'zh' | 'en'
  targetLang: 'zh' | 'en'
  model: string
  style: string
}

export interface TranslateResult {
  translatedText: string
  model: string
  duration: number
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface ModelItem {
  id: string
  name: string
}

export interface ModelGroup {
  provider: string
  models: ModelItem[]
}
