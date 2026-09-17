import { create } from 'zustand'

/** localStorage 持久化的学习进度 */
interface PersistData {
  /** 已学词数（= 下次取词的 offset） */
  learnedCount: number
  /** 生词本（学习时手动收藏） */
  starWords: string[]
  /** 错词本（测验答错 / 学习时标记"不认识"） */
  wrongWords: string[]
  /** 连续学习天数 */
  streakDays: number
  /** 最近一次学习日期 yyyy-MM-dd */
  lastStudyDate: string
}

const KEY = 'vocab-progress'

function load(): PersistData {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return {
      learnedCount: Number(raw.learnedCount) || 0,
      starWords: Array.isArray(raw.starWords) ? raw.starWords : [],
      wrongWords: Array.isArray(raw.wrongWords) ? raw.wrongWords : [],
      streakDays: Number(raw.streakDays) || 0,
      lastStudyDate: raw.lastStudyDate || '',
    }
  } catch {
    return { learnedCount: 0, starWords: [], wrongWords: [], streakDays: 0, lastStudyDate: '' }
  }
}

function persist(d: PersistData) {
  localStorage.setItem(KEY, JSON.stringify(d))
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface VocabStore extends PersistData {
  /** 本次学习会话的词（用于测验） */
  sessionWords: string[]
  addLearned: (count: number, words: string[], weak: string[]) => void
  setSessionWords: (words: string[]) => void
  toggleStar: (word: string) => void
  removeWrong: (word: string) => void
  clearWrong: () => void
}

const base = load()

export const useVocabStore = create<VocabStore>((set, get) => ({
  ...base,
  sessionWords: [],

  addLearned: (count, words, weak) => {
    const prev = get()
    const t = today()
    const isNewDay = prev.lastStudyDate !== t
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const streak = isNewDay
      ? (prev.lastStudyDate === yesterday ? prev.streakDays + 1 : 1)
      : Math.max(prev.streakDays, 1)
    const next: PersistData = {
      learnedCount: prev.learnedCount + count,
      starWords: prev.starWords,
      wrongWords: [...new Set([...prev.wrongWords, ...weak])],
      streakDays: streak,
      lastStudyDate: t,
    }
    persist(next)
    set(next)
    // sessionWords 供测验使用
    set({ sessionWords: [...new Set([...get().sessionWords, ...words])] })
  },

  setSessionWords: (words) => set({ sessionWords: words }),

  toggleStar: (word) => {
    const prev = get()
    const starWords = prev.starWords.includes(word)
      ? prev.starWords.filter((w) => w !== word)
      : [...prev.starWords, word]
    const next = { ...prev, starWords }
    persist(next)
    set(next)
  },

  removeWrong: (word) => {
    const prev = get()
    const next = { ...prev, wrongWords: prev.wrongWords.filter((w) => w !== word) }
    persist(next)
    set(next)
  },

  clearWrong: () => {
    const prev = get()
    const next = { ...prev, wrongWords: [] }
    persist(next)
    set(next)
  },
}))
