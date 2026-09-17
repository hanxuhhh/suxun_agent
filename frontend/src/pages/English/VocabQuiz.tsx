import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getQuiz, getRandomWords, QuizQuestion, speakWord } from '../../api/vocab'
import { useVocabStore } from '../../store/useVocabStore'

const QuizPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionWords, setSessionWords } = useVocabStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [cur, setCur] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [wrongThisSession, setWrongThisSession] = useState<string[]>([])
  const [done, setDone] = useState(false)

  const autoStart = (location.state as any)?.autoStart

  useEffect(() => {
    let cancelled = false
    const build = async () => {
      setLoading(true)
      try {
        // 词源优先级：学习会话带入的词 > 随机 10 词
        let source = sessionWords.length > 0 ? sessionWords : []
        if (source.length === 0) {
          const random = await getRandomWords(10)
          source = random.map((w) => w.word)
        }
        const qs = await getQuiz(source.slice(0, 12))
        if (cancelled) return
        if (!qs || qs.length === 0) {
          setError('暂无可测验的单词')
        } else {
          setQuestions(qs)
        }
        setSessionWords([])
      } catch (e: any) {
        if (!cancelled) setError(e?.message || '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    build()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const q = questions[cur]

  const pick = (text: string) => {
    if (picked || !q) return
    setPicked(text)
    const correct = q.options.find((o) => o.correct)
    if (correct && text === correct.text) {
      setScore((s) => s + 1)
    } else {
      setWrongThisSession((w) => [...new Set([...w, q.word])])
    }
    // listen 类型播放单词（检验听音）
    if (q.type !== 'listen') return
  }

  const next = () => {
    setPicked(null)
    if (cur + 1 < questions.length) {
      setCur(cur + 1)
      const nq = questions[cur + 1]
      if (nq.type === 'listen') setTimeout(() => speakWord(nq.word), 400)
    } else {
      setDone(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-4xl mb-3">😖</div>
        <div className="text-gray-600 dark:text-gray-300 text-sm mb-6">{error}</div>
        <button onClick={() => navigate('/english/vocab')} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold touch-active">
          返回
        </button>
      </div>
    )
  }

  {/* 完成页 */}
  if (done) {
    const percent = Math.round((score / questions.length) * 100)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-6 text-center pb-10">
        <div className="text-6xl mb-3">{percent >= 80 ? '🏆' : percent >= 60 ? '💪' : '📚'}</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          {score} / {questions.length}
        </div>
        <div className="text-sm text-gray-400 mt-1 mb-2">
          正确率 {percent}%{autoStart ? ' · 本组词已完成测验' : ''}
        </div>
        {wrongThisSession.length > 0 && (
          <div className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 mt-4 border border-gray-100 dark:border-gray-800">
            <div className="text-xs text-gray-400 mb-2">已自动加入错词本 · 重点复习</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {wrongThisSession.map((w) => (
                <span key={w} className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-6 w-full">
          <button onClick={() => navigate('/english/vocab')} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium touch-active">
            返回词库
          </button>
          <button
            onClick={() => { setDone(false); setCur(0); setScore(0); setWrongThisSession([]); setPicked(null); const nq = questions[0]; if (nq.type === 'listen') speakWord(nq.word) }}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold touch-active"
          >
            再测一次
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* 顶栏 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-3 py-2" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top))' }}>
        <button
          onClick={() => navigate('/english/vocab')}
          aria-label="退出测验"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 touch-active text-lg"
        >
          ←
        </button>
        <div className="flex-1">
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mx-2">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${((cur + 1) / questions.length) * 100}%` }} />
          </div>
          <div className="text-center text-[11px] text-gray-400 mt-1">
            第 {cur + 1} / {questions.length} 题 · 已答对 {score}
          </div>
        </div>
      </div>

      {/* 题干 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-xs text-gray-400 mb-4">
          {q.type === 'cn2en' ? '📌 选出对应的英文单词' : q.type === 'en2cn' ? '📌 选出正确的中文释义' : '🎧 听发音，选出单词'}
        </div>

        {q.type === 'listen' ? (
          <button
            onClick={() => speakWord(q.word)}
            className="w-20 h-20 rounded-full bg-indigo-600 text-white text-3xl shadow-lg shadow-indigo-200 touch-active active:scale-95 transition-transform mb-6"
            aria-label="播放发音"
          >
            🔊
          </button>
        ) : (
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-50 text-center mb-6 leading-snug">{q.question}</div>
        )}

        {/* 选项 */}
        <div className="w-full space-y-3">
          {q.options.map((o, i) => {
            const isCorrect = o.correct
            const isPicked = picked === o.text
            let cls =
              'w-full py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-left px-5 text-[15px] touch-active transition-colors '
            if (picked !== null) {
              if (isCorrect) cls += '!bg-emerald-50 !border-emerald-400 !text-emerald-700 dark:!bg-emerald-900/40 dark:!text-emerald-300'
              else if (isPicked) cls += '!bg-rose-50 !border-rose-400 !text-rose-700 dark:!bg-rose-900/40 dark:!text-rose-300'
              else cls += 'opacity-50'
            }
            return (
              <button key={i} onClick={() => pick(o.text)} disabled={picked !== null} className={cls}>
                <span className="inline-block w-6 text-gray-400 mr-1">{String.fromCharCode(65 + i)}.</span>
                {o.text}
                {picked !== null && isCorrect && <span className="float-right">✅</span>}
                {picked !== null && isPicked && !isCorrect && <span className="float-right">❌</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="px-6 pb-6 safe-bottom">
        <button
          onClick={next}
          disabled={picked === null}
          className={`w-full py-3.5 rounded-2xl font-semibold transition-transform touch-active ${
            picked === null ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white active:scale-[0.98]'
          }`}
        >
          {cur + 1 === questions.length ? '查看成绩' : '下一题'}
        </button>
      </div>
    </div>
  )
}

export default QuizPage
