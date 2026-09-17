import request from '../utils/request'

export interface VocabTranslation {
  pos: string
  cn: string
  en: string
}

export interface VocabSentence {
  en: string
  cn: string
}

export interface VocabPhrase {
  en: string
  cn: string
}

export interface VocabWord {
  word: string
  ukPhone: string
  usPhone: string
  translations: VocabTranslation[]
  sentences: VocabSentence[]
  phrases: VocabPhrase[]
}

export interface QuizOption {
  text: string
  correct: boolean
}

export interface QuizQuestion {
  type: 'cn2en' | 'en2cn' | 'listen'
  word: string
  question: string
  options: QuizOption[]
}

export interface BookMeta {
  id: string
  name: string
  description: string
  totalWords: number
  unitCount: number
}

/** 词书信息（总词数等） */
export const getBookMeta = async (): Promise<BookMeta> => {
  const res = await request.get('/api/vocab/books')
  return (res as any).data.data
}

/** 每日词包（offset 为学习进度） */
export const getWordPack = async (offset: number, count = 10): Promise<VocabWord[]> => {
  const res = await request.get('/api/vocab/words', { params: { offset, count } })
  return (res as any).data.data
}

/** 随机词包（复习/兜底） */
export const getRandomWords = async (count = 10): Promise<VocabWord[]> => {
  const res = await request.get('/api/vocab/random', { params: { count } })
  return (res as any).data.data
}

/** 词条详情 */
export const getWordDetail = async (word: string): Promise<VocabWord> => {
  const res = await request.get(`/api/vocab/word/${encodeURIComponent(word)}`)
  return (res as any).data.data
}

/** 生成测验题 */
export const getQuiz = async (words: string[]): Promise<QuizQuestion[]> => {
  const res = await request.get('/api/vocab/quiz', { params: { words: words.join(',') } })
  return (res as any).data.data
}

/** TTS 发音（浏览器原生，免费） */
export function speakWord(word: string, rate = 0.9) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(word)
  u.lang = 'en-US'
  u.rate = rate
  window.speechSynthesis.speak(u)
}
