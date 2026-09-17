import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Drawer } from 'antd'
import { MenuOutlined, PlusOutlined, HomeOutlined } from '@ant-design/icons'
import { marked } from 'marked'
import { apiUrl } from '../../utils/apiBase'

marked.setOptions({ breaks: true, gfm: true } as any)

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
}

interface Conversation {
  id: string
  title: string
  date: string
  messages: Message[]
}

const MODELS = [
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'Groq' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'Groq' },
  { id: 'groq/compound-mini', name: 'Compound Mini', provider: 'Groq' },
  { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B', provider: 'Groq' },
  { id: 'deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek' },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'DeepSeek' },
]

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }
function nowTime() { return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }
function nowDate() { return new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function makeConv(): Conversation { return { id: uid(), title: '新对话', date: nowDate(), messages: [] } }
function loadConvs(): Conversation[] { try { return JSON.parse(localStorage.getItem('suxun-convs') || '[]') } catch { return [] } }
function saveConvs(list: Conversation[]) { localStorage.setItem('suxun-convs', JSON.stringify(list)) }
function renderMd(text: string): string { try { return marked.parse(text) as string } catch { return text } }

const ChatPage: React.FC = () => {
  const location = useLocation()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [model, setModel] = useState('openai/gpt-oss-120b')
  const [convList, setConvList] = useState<Conversation[]>(() => {
    const stored = loadConvs()
    return stored.length > 0 ? stored : [makeConv()]
  })
  const [activeId, setActiveId] = useState<string>(() => {
    const stored = loadConvs()
    return stored.length > 0 ? stored[0].id : ''
  })
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const streamRef = useRef(false)

  const activeConv = convList.find(c => c.id === activeId) || convList[0] || null

  useEffect(() => {
    if (convList.length > 0 && !activeId) setActiveId(convList[0].id)
  }, [convList])

  useEffect(() => { saveConvs(convList) }, [convList])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeConv?.messages?.length])

  // Handle initial message passed from Home page
  const initHandled = useRef(false)
  useEffect(() => {
    const msg = location.state?.initialMessage as string | undefined
    if (msg && !initHandled.current && activeId) {
      initHandled.current = true
      window.history.replaceState({}, '')
      setTimeout(() => sendMessage(msg), 300)
    }
  }, [activeId])

  const createConv = () => {
    const c = makeConv()
    setConvList(prev => [c, ...prev])
    setActiveId(c.id)
  }

  const deleteConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = convList.filter(c => c.id !== id)
    if (next.length === 0) {
      const c = makeConv()
      setConvList([c])
      setActiveId(c.id)
    } else {
      setConvList(next)
      if (activeId === id) setActiveId(next[0].id)
    }
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streamRef.current) return
    const targetId = activeId || convList[0]?.id
    if (!targetId) return

    const currentConv = convList.find(c => c.id === targetId)
    if (!currentConv) return

    const userMsgId = uid()
    const asstMsgId = uid()
    const isFirst = currentConv.messages.length === 0

    const userMsg: Message = { id: userMsgId, role: 'user', content: text.trim(), time: nowTime() }
    const asstMsg: Message = { id: asstMsgId, role: 'assistant', content: '', time: nowTime() }

    setConvList(prev => prev.map(c =>
      c.id === targetId
        ? { ...c, title: isFirst ? text.trim().slice(0, 18) : c.title, messages: [...c.messages, userMsg, asstMsg] }
        : c
    ))
    setInput('')
    streamRef.current = true
    setStreaming(true)

    const apiMessages = [...currentConv.messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text.trim() }]

    try {
      const resp = await fetch(apiUrl('/api/chat/stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: apiMessages }),
      })
      if (!resp.body) throw new Error('no body')

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        // Process complete lines
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          const t = line.trim()
          if (!t) continue
          // Backend sends: "data:{JSON}" or "data: {JSON}" — strip prefix
          const json = t.startsWith('data:') ? t.slice(5).trim() : t
          if (!json || json === '[DONE]') continue
          try {
            const delta = JSON.parse(json)?.choices?.[0]?.delta?.content
            if (typeof delta === 'string' && delta) {
              acc += delta
              const snap = acc
              setConvList(prev => prev.map(c =>
                c.id !== targetId ? c : {
                  ...c,
                  messages: c.messages.map(m => m.id === asstMsgId ? { ...m, content: snap } : m),
                }
              ))
            }
          } catch { /* not JSON, skip */ }
        }
      }
    } catch {
      setConvList(prev => prev.map(c =>
        c.id !== targetId ? c : {
          ...c,
          messages: c.messages.map(m => m.id === asstMsgId ? { ...m, content: '⚠️ 请求失败，请重试' } : m),
        }
      ))
    } finally {
      streamRef.current = false
      setStreaming(false)
    }
  }, [activeId, convList, model])

  const handleSend = () => sendMessage(input)
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* ── 顶栏：菜单 + 模型选择 ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top))' }}>
        <button
          aria-label="打开历史对话"
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 touch-active"
        >
          <MenuOutlined style={{ fontSize: 20 }} />
        </button>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="flex-1 min-w-0 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-lg px-2 py-2 bg-white text-gray-700 focus:outline-none focus:border-purple-400"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.provider} · {m.name}
            </option>
          ))}
        </select>
        <Link
          to="/"
          aria-label="回首页"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 touch-active"
        >
          <HomeOutlined style={{ fontSize: 20 }} />
        </Link>
      </div>

      {/* ── 历史对话抽屉（原 PC 侧边栏） ── */}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width="78%"
        styles={{ body: { padding: 0 } }}
      >
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
          <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
            <Link to="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 no-underline">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">S</div>
              <div>
                <div className="text-sm font-bold text-gray-800 dark:text-white">苏寻Chat</div>
                <div className="text-xs text-gray-400">AI ASSISTANT</div>
              </div>
            </Link>
          </div>
          <div className="px-3 py-3">
            <button
              onClick={() => { createConv(); setDrawerOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded-lg text-sm text-gray-700 touch-active"
            >
              <PlusOutlined /> 新对话
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            <div className="text-xs text-gray-400 font-medium mb-2">历史对话</div>
            {convList.map((c) => (
              <div
                key={c.id}
                onClick={() => { setActiveId(c.id); setDrawerOpen(false) }}
                className={`relative px-3 py-3 rounded-lg cursor-pointer mb-1 ${
                  c.id === activeId
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate pr-6">{c.title}</div>
                <div className="text-xs text-gray-400">{c.date}</div>
                <button
                  onClick={(e) => deleteConv(c.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500 text-sm px-1"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-2 flex gap-1">
            {[
              { to: '/', icon: '🏠', label: '首页' },
              { to: '/translate', icon: '🌐', label: '翻译' },
              { to: '/food', icon: '🍜', label: '美食' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex-1 flex flex-col items-center py-1.5 rounded text-xs text-gray-400 hover:text-gray-600 no-underline"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </Drawer>

      {/* ── 消息区 ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!activeConv || activeConv.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">你好，我是苏寻 AI</h2>
            <p className="text-gray-400 text-sm">有什么可以帮你的？</p>
          </div>
        ) : (
          activeConv.messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === 'user' ? 'bg-purple-500 text-white' : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white'}`}>
                {msg.role === 'user' ? '你' : 'AI'}
              </div>
              <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-purple-500 text-white rounded-tr-sm' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-sm shadow-sm'}`}>
                  {msg.role === 'assistant'
                    ? msg.content
                      ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }} />
                      : <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse rounded-sm" />
                    : msg.content}
                </div>
                <span className="text-xs text-gray-400 px-1">{msg.time}</span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── 输入区 ── */}
      <div className="px-3 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-bottom">
        <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2.5 focus-within:border-purple-300">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="在此输入消息..."
            rows={1}
            disabled={streaming}
            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-100 placeholder-gray-400 outline-none resize-none max-h-32"
            style={{ minHeight: '1.5rem' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              input.trim() && !streaming
                ? 'bg-gray-800 dark:bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {streaming ? (
              <span className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
