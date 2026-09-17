import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getWordDetail, speakWord, VocabWord } from '../../api/vocab'
import { useVocabStore } from '../../store/useVocabStore'

const WordbookPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { starWords, wrongWords, toggleStar, removeWrong, clearWrong } = useVocabStore()

  const initialTab = new URLSearchParams(location.search).get('tab') === 'wrong' ? 'wrong' : 'star'
  const [tab, setTab] = useState<'star' | 'wrong'>(initialTab)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [details, setDetails] = useState<Record<string, VocabWord>>({})
  const [loadingWord, setLoadingWord] = useState('')

  const list = tab === 'star' ? starWords : wrongWords

  useEffect(() => {
    // 切换页签时收起展开态
    setExpanded(null)
  }, [tab])

  const expand = async (word: string) => {
    if (expanded === word) {
      setExpanded(null)
      return
    }
    setExpanded(word)
    speakWord(word)
    if (!details[word]) {
      setLoadingWord(word)
      try {
        const d = await getWordDetail(word)
        setDetails((prev) => ({ ...prev, [word]: d }))
      } catch {
        /* 词库未收录则仅显示单词 */
      } finally {
        setLoadingWord('')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* 顶栏 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-3 py-2" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top))' }}>
        <button
          onClick={() => navigate('/english/vocab')}
          aria-label="返回"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 touch-active text-lg"
        >
          ←
        </button>
        <div className="flex-1 text-center font-semibold text-gray-800 dark:text-gray-100 pr-10">我的词库</div>
      </div>

      {/* 页签 */}
      <div className="px-4 pt-3">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex">
          <button
            onClick={() => setTab('star')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'star' ? 'bg-white dark:bg-gray-900 text-amber-600 shadow-sm' : 'text-gray-400'
            }`}
          >
            ⭐ 生词本 {starWords.length}
          </button>
          <button
            onClick={() => setTab('wrong')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'wrong' ? 'bg-white dark:bg-gray-900 text-rose-600 shadow-sm' : 'text-gray-400'
            }`}
          >
            📝 错词本 {wrongWords.length}
          </button>
        </div>
      </div>

      {/* 列表 */}
      <div className="px-4 mt-3">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">{tab === 'star' ? '⭐' : '📝'}</div>
            <div className="text-sm text-gray-400">
              {tab === 'star' ? '还没有收藏生词，学习时点击星标收藏' : '还没有错词，去测验挑战一下吧'}
            </div>
            <Link to="/english/vocab" className="mt-5 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium no-underline touch-active">
              去学习
            </Link>
          </div>
        ) : (
          <>
            {tab === 'wrong' && list.length > 0 && (
              <div className="flex justify-end mb-2">
                <button onClick={clearWrong} className="text-xs text-gray-400 touch-active">
                  清空错词本
                </button>
              </div>
            )}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
              {list.map((w) => {
                const d = details[w]
                const isOpen = expanded === w
                return (
                  <div key={w}>
                    <div className="flex items-center px-4 py-3.5 touch-active" onClick={() => expand(w)}>
                      <span className="flex-1 text-[15px] font-medium text-gray-800 dark:text-gray-100">{w}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); speakWord(w) }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-indigo-400 touch-active"
                        aria-label="发音"
                      >
                        🔊
                      </button>
                      {tab === 'star' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleStar(w) }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-400 touch-active"
                          aria-label="取消收藏"
                        >
                          ★
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeWrong(w) }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 touch-active"
                          aria-label="移出错词本"
                        >
                          ✓
                        </button>
                      )}
                    </div>
                    {isOpen && (
                      <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800/50">
                        {loadingWord === w && !d ? (
                          <div className="text-xs text-gray-400 py-2">加载释义中...</div>
                        ) : d ? (
                          <div className="space-y-2 pt-2">
                            {(d.ukPhone || d.usPhone) && (
                              <div className="text-xs text-gray-400">
                                {d.ukPhone && <span className="mr-3">英 /{d.ukPhone}/</span>}
                                {d.usPhone && <span>美 /{d.usPhone}/</span>}
                              </div>
                            )}
                            {d.translations.map((t, i) => (
                              <div key={i} className="text-sm text-gray-700 dark:text-gray-200">
                                {t.pos && <span className="text-indigo-500 mr-1">{t.pos}.</span>}
                                {t.cn}
                              </div>
                            ))}
                            {d.sentences.slice(0, 2).map((s, i) => (
                              <div key={i} className="text-xs bg-white dark:bg-gray-900 rounded-xl p-2.5 leading-relaxed">
                                <div className="text-gray-700 dark:text-gray-200">{s.en}</div>
                                <div className="text-gray-400 mt-1">{s.cn}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 pt-2">词库未收录详细释义</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default WordbookPage
