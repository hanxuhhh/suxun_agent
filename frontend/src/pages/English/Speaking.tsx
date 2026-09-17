import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import {
  Scenario, getScenarios, getSentences, transcribe, evaluate, practice,
} from '../../api/speaking'
import { speakWord } from '../../api/vocab'

marked.setOptions({ breaks: true, gfm: true } as any)

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }
function renderMd(text: string): string { try { return marked.parse(text) as string } catch { return text } }

interface Msg { id: string; role: 'user' | 'assistant'; content: string }

const DIFF = ['', '入门', '进阶', '挑战']

const SpeakingPage: React.FC = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'scene' | 'shadow'>('scene')

  /* ────────── 场景对话 ────────── */
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const streamRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const msgsRef = useRef<Msg[]>([])
  msgsRef.current = msgs

  /* ────────── 跟读打分 ────────── */
  const [sentences, setSentences] = useState<string[]>([])
  const [curSentence, setCurSentence] = useState(0)
  const [recording, setRecording] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<{ overall: number; accuracy: number; fluency: number; feedback: string; heard: string } | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef2 = useRef<MediaStream | null>(null)

  useEffect(() => {
    getScenarios().then(setScenarios).catch(() => {})
    getSentences(5).then(setSentences).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length])

  const send = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || streamRef.current) return
    setInput('')
    const userMsg: Msg = { id: uid(), role: 'user', content }
    const asstMsg: Msg = { id: uid(), role: 'assistant', content: '' }
    const history = [...msgsRef.current, userMsg]
    setMsgs([...history, asstMsg])
    setStreaming(true)
    streamRef.current = true
    try {
      let acc = ''
      await practice(scenario?.id || 'interview',
        history.map((m) => ({ role: m.role, content: m.content })),
        (delta) => {
          acc += delta
          const snap = acc
          setMsgs((prev) => prev.map((m) => (m.id === asstMsg.id ? { ...m, content: snap } : m)))
        })
      // 完成后自动播放考官台词
      if (acc) speakWord(acc, 1)
    } catch {
      setMsgs((prev) => prev.map((m) => (m.id === asstMsg.id ? { ...m, content: '⚠️ 请求失败，请重试' } : m)))
    } finally {
      streamRef.current = false
      setStreaming(false)
    }
  }

  /* ────────── 录音 ────────── */
  const startRecord = async () => {
    setResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef2.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const rec = new MediaRecorder(stream, { mimeType: mime })
      const chunks: Blob[] = []
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: mime })
        setAnalyzing(true)
        try {
          const heard = await transcribe(blob)
          const r = await evaluate(sentences[curSentence], heard)
          setResult({ ...r, heard })
        } catch (e: any) {
          alert(e?.message || '评测失败，请重试')
        } finally {
          setAnalyzing(false)
        }
      }
      recorderRef.current = rec
      rec.start()
      setRecording(true)
    } catch {
      alert('无法访问麦克风，请检查浏览器权限')
    }
  }

  const stopRecord = () => {
    recorderRef.current?.stop()
    setRecording(false)
  }

  const nextSentence = () => {
    if (curSentence + 1 < sentences.length) {
      setCurSentence(curSentence + 1)
      setResult(null)
    }
  }

  const sentence = sentences[curSentence]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* 顶栏 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-3 py-2" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top))' }}>
        <button
          onClick={() => navigate('/english')}
          aria-label="返回"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 touch-active text-lg"
        >
          ←
        </button>
        <div className="flex-1 text-center font-semibold text-gray-800 dark:text-gray-100 pr-10">口语练习 · BEC</div>
      </div>

      {/* 模式页签 */}
      <div className="px-4 pt-3">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex">
          <button
            onClick={() => setTab('scene')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'scene' ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm' : 'text-gray-400'}`}
          >
            💬 场景对话
          </button>
          <button
            onClick={() => setTab('shadow')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'shadow' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-sm' : 'text-gray-400'}`}
          >
            🎙️ 跟读打分
          </button>
        </div>
      </div>

      {/* ══════ 场景对话模式 ══════ */}
      {tab === 'scene' && (
        <>
          {!scenario ? (
            <div className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
              <div className="text-xs text-gray-400 mb-3">选择一个商务场景，AI 考官将用英文与你对话</div>
              <div className="space-y-3">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setScenario(s); setMsgs([]) }}
                    className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 text-left touch-active flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-lg">💼</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{s.name}</div>
                      <div className="text-xs text-gray-400 truncate">{s.description}</div>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
                      {DIFF[s.difficulty]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-2">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                  <span>当前场景：{scenario.name} · 考官回复自动朗读</span>
                  <button onClick={() => { setScenario(null); setMsgs([]) }} className="touch-active underline">
                    换场景
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {msgs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-4xl mb-3">🤵</div>
                    <div className="text-sm text-gray-500 dark:text-gray-300 mb-1">AI 考官已就位</div>
                    <div className="text-xs text-gray-400">发送一句英文开场白开始对话</div>
                    <button onClick={() => send('Good morning! Nice to meet you.')} className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium touch-active">
                      用开场白开始 →
                    </button>
                  </div>
                )}
                {msgs.map((m) => (
                  <div key={m.id} className={`flex gap-2.5 mb-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${m.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white'}`}>
                      {m.role === 'user' ? '你' : '考'}
                    </div>
                    <div className={`max-w-[80%] flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-emerald-500 text-white rounded-tr-sm' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-sm shadow-sm'}`}>
                        {m.role === 'assistant' && m.content
                          ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMd(m.content) }} />
                          : m.role === 'assistant'
                            ? <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse rounded-sm" />
                            : m.content}
                      </div>
                      {m.role === 'assistant' && m.content && (
                        <button onClick={() => speakWord(m.content, 1)} className="text-[10px] text-indigo-400 touch-active self-start">
                          🔊 重新朗读
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="px-3 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-bottom">
                <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2.5">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                    placeholder="Type in English..."
                    rows={1}
                    disabled={streaming}
                    className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-100 placeholder-gray-400 outline-none resize-none max-h-32"
                    style={{ minHeight: '1.5rem' }}
                  />
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || streaming}
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${input.trim() && !streaming ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'} touch-active`}
                  >
                    ➤
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ══════ 跟读打分模式 ══════ */}
      {tab === 'shadow' && (
        <div className="flex-1 px-4 py-4 pb-24">
          {!sentence ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-md border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400">第 {curSentence + 1} / {sentences.length} 句</span>
                <button
                  onClick={() => { getSentences(5).then((s) => { setSentences(s); setCurSentence(0); setResult(null) }) }}
                  className="text-xs text-indigo-500 touch-active"
                >
                  换一批
                </button>
              </div>

              <div className="text-lg font-medium text-gray-900 dark:text-gray-50 leading-relaxed text-center" onClick={() => speakWord(sentence, 0.85)}>
                {sentence}
              </div>
              <button onClick={() => speakWord(sentence, 0.85)} className="mt-4 mx-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium touch-active">
                🔊 听标准发音
              </button>

              {/* 录音按钮 */}
              <div className="flex justify-center mt-6">
                {recording ? (
                  <button onClick={stopRecord} className="w-20 h-20 rounded-full bg-rose-500 text-white flex flex-col items-center justify-center shadow-lg shadow-rose-200 touch-active active:scale-95 transition-transform">
                    <span className="text-2xl">⏹</span>
                    <span className="text-[10px] mt-1">停止</span>
                  </button>
                ) : (
                  <button
                    onClick={startRecord}
                    disabled={analyzing}
                    className={`w-20 h-20 rounded-full text-white flex flex-col items-center justify-center shadow-lg touch-active active:scale-95 transition-transform ${analyzing ? 'bg-gray-300' : 'bg-indigo-600 shadow-indigo-200'}`}
                  >
                    {analyzing ? (
                      <span className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="text-2xl">🎙️</span>
                        <span className="text-[10px] mt-1">跟读</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="text-center text-xs text-gray-400 mt-3">
                {recording ? '录音中... 读完点击停止' : analyzing ? '识别评测中...' : '点击麦克风，大声跟读上面的句子'}
              </div>

              {/* 评测结果 */}
              {result && (
                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${result.overall >= 75 ? 'text-emerald-500' : result.overall >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>{result.overall}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">总分</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-indigo-500">{result.accuracy}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">准确度</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-indigo-500">{result.fluency}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">流利度</div>
                    </div>
                  </div>
                  {result.heard && (
                    <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-xs text-gray-400">🎤 你说的：{result.heard}</span>
                    </div>
                  )}
                  {result.feedback && (
                    <div className="mt-3 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">💡 {result.feedback}</div>
                  )}
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => { setResult(null); speakWord(sentence, 0.85) }}
                      className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium touch-active"
                    >
                      再读一遍
                    </button>
                    <button
                      onClick={nextSentence}
                      disabled={curSentence + 1 >= sentences.length}
                      className={`flex-1 py-3 rounded-xl text-white text-sm font-semibold touch-active ${curSentence + 1 >= sentences.length ? 'bg-gray-300' : 'bg-indigo-600'}`}
                    >
                      下一句 →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SpeakingPage
