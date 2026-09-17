import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getBookMeta, BookMeta } from '../../api/vocab'
import { useVocabStore } from '../../store/useVocabStore'

const VocabHubPage: React.FC = () => {
  const navigate = useNavigate()
  const [meta, setMeta] = useState<BookMeta | null>(null)
  const { learnedCount, starWords, wrongWords, streakDays, setSessionWords } = useVocabStore()

  useEffect(() => {
    getBookMeta().then(setMeta).catch(() => {})
  }, [])

  const total = meta?.totalWords ?? 2825
  const percent = Math.min(100, Math.round((learnedCount / total) * 100))

  const startStudy = () => {
    // 测验页使用本次学习会话的词；从 hub 进入则清空会话
    setSessionWords([])
    navigate('/english/vocab/study')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* 顶栏 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-3 py-2" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top))' }}>
        <button
          onClick={() => navigate('/english')}
          aria-label="返回"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 touch-active text-lg"
        >
          ←
        </button>
        <div className="flex-1 text-center font-semibold text-gray-800 dark:text-gray-100 pr-10">背单词 · BEC</div>
      </div>

      {/* 进度卡片 */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-sm text-white/80">{meta?.name || 'BEC 商务英语核心词汇'}</div>
              <div className="text-3xl font-bold mt-1">
                {learnedCount}
                <span className="text-base font-normal text-white/70"> / {total} 词</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">🔥 {streakDays}</div>
              <div className="text-[11px] text-white/70">连续天数</div>
            </div>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] text-white/70">
            <span>已掌握 {percent}%</span>
            <span>剩余 {total - learnedCount} 词</span>
          </div>
        </div>
      </div>

      {/* 主行动按钮 */}
      <div className="px-4 mt-4">
        <button
          onClick={startStudy}
          className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-semibold text-base shadow-md shadow-indigo-200 touch-active active:scale-[0.98] transition-transform"
        >
          {learnedCount === 0 ? '开始学习今日词包' : '继续学习'}
        </button>
      </div>

      {/* 数据卡 */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <Link to="/english/vocab/book" className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 no-underline touch-active">
          <div className="text-xl">⭐</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{starWords.length}</div>
          <div className="text-xs text-gray-400">生词本</div>
        </Link>
        <Link to="/english/vocab/book?tab=wrong" className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 no-underline touch-active">
          <div className="text-xl">📝</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{wrongWords.length}</div>
          <div className="text-xs text-gray-400">错词本</div>
        </Link>
      </div>

      {/* 二级入口 */}
      <div className="px-4 mt-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          <button
            onClick={() => navigate('/english/vocab/quiz')}
            className="w-full flex items-center gap-3 px-4 py-4 touch-active text-left"
          >
            <span className="text-xl">🎯</span>
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">快速测验（随机 10 词）</span>
            <span className="text-gray-300">›</span>
          </button>
          <Link to="/english/vocab/book" className="flex items-center gap-3 px-4 py-4 no-underline touch-active">
            <span className="text-xl">📚</span>
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">我的词库（生词 + 错词）</span>
            <span className="text-gray-300">›</span>
          </Link>
        </div>
      </div>

      {/* 词书说明 */}
      <div className="px-4 mt-4">
        <div className="text-xs text-gray-400 leading-relaxed">
          {meta?.description || '对标剑桥 BEC 考纲，涵盖商务场景核心词汇'} · 每日词包 10 词，学习后自动进入测验巩固。
        </div>
      </div>
    </div>
  )
}

export default VocabHubPage
