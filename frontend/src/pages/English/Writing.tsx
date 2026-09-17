import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WritingTopic, WritingResult, getTopics, submitWriting } from '../../api/writing'

const TYPE_COLOR: Record<string, string> = {
  email: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600',
  memo: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600',
  report: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600',
  proposal: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600',
}

function scoreColor(v: number) {
  return v >= 75 ? 'text-emerald-500' : v >= 60 ? 'text-amber-500' : 'text-rose-500'
}

const WritingPage: React.FC = () => {
  const navigate = useNavigate()
  const [topics, setTopics] = useState<WritingTopic[]>([])
  const [topic, setTopic] = useState<WritingTopic | null>(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<WritingResult | null>(null)

  useEffect(() => {
    getTopics().then(setTopics).catch(() => {})
  }, [])

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  const submit = async () => {
    if (!topic || wordCount < 20 || submitting) return
    setSubmitting(true)
    setResult(null)
    try {
      const r = await submitWriting(topic.id, content)
      setResult(r)
    } catch (e: any) {
      alert(e?.message || '批改失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* 顶栏 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-3 py-2" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top))' }}>
        <button
          onClick={() => (topic && !result ? setTopic(null) : navigate('/english'))}
          aria-label="返回"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 touch-active text-lg"
        >
          ←
        </button>
        <div className="flex-1 text-center font-semibold text-gray-800 dark:text-gray-100 pr-10">写作练习 · BEC</div>
      </div>

      {/* ── 题目列表 ── */}
      {!topic && (
        <div className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
          <div className="text-xs text-gray-400 mb-3">选择题目，AI 考官将按 BEC 写作标准三维度批改</div>
          <div className="space-y-3">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTopic(t); setContent(''); setResult(null) }}
                className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 text-left touch-active"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg ${TYPE_COLOR[t.type] || 'bg-gray-100 text-gray-500'}`}>{t.typeName}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{t.title}</span>
                </div>
                <div className="text-xs text-gray-400 leading-relaxed line-clamp-2">{t.prompt}</div>
                <div className="text-[10px] text-gray-300 mt-2">建议 {t.wordLimit} 词左右</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 作答/结果 ── */}
      {topic && !result && (
        <>
          <div className="px-4 pt-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-lg ${TYPE_COLOR[topic.type]}`}>{topic.typeName}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{topic.title}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{topic.prompt}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {topic.keyPoints.map((p, i) => (
                  <span key={i} className="text-[11px] px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">✓ {p}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 mt-3 flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your answer in English here..."
              className="w-full h-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-800 dark:text-gray-100 leading-relaxed outline-none focus:border-indigo-300 resize-none"
            />
            <div className="flex justify-between items-center mt-2 mb-4">
              <span className={`text-xs ${Math.abs(wordCount - topic.wordLimit) <= topic.wordLimit * 0.3 ? 'text-emerald-500' : 'text-gray-400'}`}>
                {wordCount} / 建议 {topic.wordLimit} 词
              </span>
              {wordCount > 0 && (
                <button onClick={() => setContent('')} className="text-xs text-gray-400 touch-active">
                  清空
                </button>
              )}
            </div>
          </div>

          <div className="px-4 pb-6 safe-bottom">
            <button
              onClick={submit}
              disabled={wordCount < 20 || submitting}
              className={`w-full py-4 rounded-2xl font-semibold text-white transition-transform touch-active ${wordCount < 20 || submitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 active:scale-[0.98] shadow-md shadow-indigo-200'}`}
            >
              {submitting ? 'AI 考官批改中...' : wordCount < 20 ? `至少写 20 词（当前 ${wordCount}）` : '提交批改 ✍️'}
            </button>
          </div>
        </>
      )}

      {/* ── 批改结果 ── */}
      {topic && result && (
        <div className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
          {/* 总分 */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white text-center shadow-md">
            <div className="text-xs text-white/70 mb-1">{topic.typeName} · {topic.title} · {result.wordCount} 词</div>
            <div className="text-5xl font-bold">{result.overall}</div>
            <div className="text-xs text-white/70 mt-1">
              {result.overall >= 90 ? '优秀 · 相当于 BEC 高分档' : result.overall >= 75 ? '良好' : result.overall >= 60 ? '合格' : '还需努力'}
            </div>
          </div>

          {/* 三维度 */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mt-4 border border-gray-100 dark:border-gray-800 space-y-4">
            {([['内容', result.content], ['语言', result.language], ['组织', result.organization]] as [string, { score: number; comment: string }][]).map(([label, dim]) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
                  <span className={`text-lg font-bold ${scoreColor(dim.score)}`}>{dim.score}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dim.score >= 75 ? 'bg-emerald-500' : dim.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1.5 leading-relaxed">{dim.comment}</div>
              </div>
            ))}
          </div>

          {/* 改进建议 */}
          {result.suggestions.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mt-3 border border-gray-100 dark:border-gray-800">
              <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-2.5">📌 改进建议</div>
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex gap-2">
                    <span className="text-indigo-400">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 改写示例 */}
          {result.improved && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mt-3 border border-gray-100 dark:border-gray-800">
              <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-2.5">✨ 地道改写示例</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                {result.improved}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button onClick={() => { setResult(null); setContent('') }} className="flex-1 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium text-sm touch-active">
              重写本题
            </button>
            <button onClick={() => { setTopic(null); setResult(null) }} className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm touch-active">
              换个题目
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WritingPage
