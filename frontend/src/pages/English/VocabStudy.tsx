import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWordPack, VocabWord, speakWord } from '../../api/vocab'
import { useVocabStore } from '../../store/useVocabStore'

const PACK_SIZE = 10

const StudyPage: React.FC = () => {
  const navigate = useNavigate()
  const { learnedCount, addLearned, starWords, toggleStar } = useVocabStore()

  const [words, setWords] = useState<VocabWord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cur, setCur] = useState(0)
  const [showDetail, setShowDetail] = useState(false)
  /** 本会话掌握情况：word → 'known' | 'fuzzy' | 'unknown' */
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    setLoading(true)
    getWordPack(learnedCount, PACK_SIZE)
      .then((list) => {
        if (!list || list.length === 0) {
          setFinished(true)
        } else {
          setWords(list)
          // 进入词条自动读一遍
          setTimeout(() => speakWord(list[0].word), 300)
        }
      })
      .catch((e) => setError(e?.message || '加载失败，请稍后重试'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const word = words[cur]
  const weak = Object.entries(marks)
    .filter(([, m]) => m !== 'known')
    .map(([w]) => w)

  const mark = (level: 'known' | 'fuzzy' | 'unknown') => {
    if (!word) return
    setMarks((prev) => ({ ...prev, [word.word]: level }))
    if (cur + 1 < words.length) {
      setCur(cur + 1)
      setShowDetail(false)
      speakWord(words[cur + 1].word)
    } else {
      // 完成 → 记录进度并进入测验
      const sessionWords = words.map((w) => w.word)
      const sessionWeak = [...new Set([...weak, ...(level !== 'known' ? [word.word] : [])])]
      addLearned(words.length, sessionWords, sessionWeak)
      navigate('/english/vocab/quiz', { state: { autoStart: true } })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <div className="text-lg font-bold text-gray-800 dark:text-gray-100">词库已全部学完！</div>
        <div className="text-sm text-gray-400 mt-2 mb-6">2825 个 BEC 核心词汇已通关，接下来可以在词库中反复巩固</div>
        <button
          onClick={() => navigate('/english/vocab')}
          className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold touch-active"
        >
          返回
        </button>
      </div>
    )
  }

  if (error || !word) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-4xl mb-3">😖</div>
        <div className="text-gray-600 dark:text-gray-300 text-sm mb-6">{error || '没有更多单词了'}</div>
        <button onClick={() => navigate('/english/vocab')} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold touch-active">
          返回
        </button>
      </div>
    )
  }

  const t0 = word.translations[0]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* 顶栏 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-3 py-2" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top))' }}>
        <button
          onClick={() => navigate('/english/vocab')}
          aria-label="退出学习"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 touch-active text-lg"
        >
          ←
        </button>
        <div className="flex-1">
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mx-2">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${((cur + 1) / words.length) * 100}%` }} />
          </div>
          <div className="text-center text-[11px] text-gray-400 mt-1">
            {cur + 1} / {words.length}
          </div>
        </div>
      </div>

      {/* 词条卡片 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6">
        <div
          className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-md border border-gray-100 dark:border-gray-800 p-6 text-center"
          onClick={() => speakWord(word.word)}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-gray-50">{word.word}</span>
            <span className="text-2xl text-indigo-400 touch-active" onClick={(e) => { e.stopPropagation(); speakWord(word.word) }}>
              🔊
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {word.ukPhone && <span className="mr-3">英 /{word.ukPhone}/</span>}
            {word.usPhone && <span>美 /{word.usPhone}/</span>}
          </div>

          {/* 收藏生词 */}
          <div className="flex justify-center mb-3">
            <button
              onClick={() => toggleStar(word.word)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xl touch-active transition-transform active:scale-90 ${
                starWords.includes(word.word) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
              }`}
              aria-label="收藏生词"
            >
              {starWords.includes(word.word) ? '★' : '☆'}
            </button>
          </div>

          {/* 释义（学习页始终显示首条，点击展开全部） */}
          <div className="mt-1 text-[15px] leading-relaxed text-gray-700 dark:text-gray-200">
            {t0 && (
              <div>
                {t0.pos && <span className="text-indigo-500 mr-1.5 font-medium">{t0.pos}.</span>}
                {t0.cn}
              </div>
            )}
          </div>

          {showDetail && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-left space-y-3">
              {word.translations.slice(1).map((t, i) => (
                <div key={i} className="text-sm text-gray-600 dark:text-gray-300">
                  {t.pos && <span className="text-indigo-500 mr-1.5 font-medium">{t.pos}.</span>}
                  {t.cn}
                  {t.en && <div className="text-xs text-gray-400 mt-0.5">{t.en}</div>}
                </div>
              ))}
              {word.sentences.map((s, i) => (
                <div key={i} className="text-sm bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <div className="text-gray-700 dark:text-gray-200">{s.en}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.cn}</div>
                </div>
              ))}
              {word.phrases.length > 0 && (
                <div className="text-sm">
                  {word.phrases.map((p, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-dashed border-gray-100 dark:border-gray-800 last:border-0">
                      <span className="text-gray-700 dark:text-gray-200">{p.en}</span>
                      <span className="text-gray-400 text-xs">{p.cn}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); setShowDetail(!showDetail) }}
            className="mt-4 text-xs text-indigo-500 touch-active"
          >
            {showDetail ? '收起详情 ▲' : '展开释义 · 例句 · 短语 ▼'}
          </button>
        </div>
      </div>

      {/* 掌握按钮 */}
      <div className="px-4 pb-6 safe-bottom">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => mark('unknown')}
            className="py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-medium text-sm touch-active active:scale-95 transition-transform border border-rose-100 dark:border-rose-900/50"
          >
            😵 不认识
          </button>
          <button
            onClick={() => mark('fuzzy')}
            className="py-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium text-sm touch-active active:scale-95 transition-transform border border-amber-100 dark:border-amber-900/50"
          >
            🤔 模糊
          </button>
          <button
            onClick={() => mark('known')}
            className="py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium text-sm touch-active active:scale-95 transition-transform border border-emerald-100 dark:border-emerald-900/50"
          >
            😎 认识
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudyPage
