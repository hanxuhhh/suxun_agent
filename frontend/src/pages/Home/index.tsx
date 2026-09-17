import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const BG_URL = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80'

const TYPING_TEXTS = [
  'hi 我是苏寻，欢迎来到我的 AI 工坊',
  '和全球顶尖 AI 聊点什么...',
  '多元翻译 · 周边美食 · 实时新闻',
]

function useTypingEffect(texts: string[]) {
  const [displayed, setDisplayed] = React.useState('')
  const [textIdx, setTextIdx] = React.useState(0)
  const [charIdx, setCharIdx] = React.useState(0)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    const current = texts[textIdx]
    const delay = deleting ? 30 : charIdx === current.length ? 2000 : 60
    const timer = setTimeout(() => {
      if (!deleting && charIdx < current.length) {
        setDisplayed(current.slice(0, charIdx + 1))
        setCharIdx(c => c + 1)
      } else if (!deleting && charIdx === current.length) {
        setDeleting(true)
      } else if (deleting && charIdx > 0) {
        setDisplayed(current.slice(0, charIdx - 1))
        setCharIdx(c => c - 1)
      } else {
        setDeleting(false)
        setTextIdx(i => (i + 1) % texts.length)
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [charIdx, deleting, textIdx, texts])

  return displayed
}

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const typing = useTypingEffect(TYPING_TEXTS)

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    navigate('/chat', { state: { initialMessage: text } })
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* 背景图 —— 最底层，不接受点击 */}
      <img
        src={BG_URL}
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
      {/* 半透明遮罩 —— 不接受点击 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        pointerEvents: 'none',
      }} />

      {/* ── 顶部标题栏（导航由底部 TabBar 承担） ── */}
      <div style={{
        position: 'relative', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px 16px 0',
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
      }}>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>
          苏寻的 AI 工坊
        </span>
      </div>

      {/* ── 中间内容 ── */}
      <div style={{
        position: 'relative', zIndex: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: 'calc(100vh - 96px)',
        padding: '0 16px 56px',
      }}>
        {/* 打字标题 */}
        <h1 style={{
          color: '#fff', fontSize: 20, fontWeight: 300,
          marginBottom: 32, minHeight: '2rem', textAlign: 'center', letterSpacing: 1,
        }}>
          {typing}
          <span style={{ animation: 'blink 1s step-end infinite' }}>|</span>
        </h1>

        {/* 输入框 */}
        <div style={{ width: '100%', maxWidth: 600 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 999,
            padding: '10px 16px',
          }}>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>💬</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="✦ 和全球顶尖 AI 聊点什么..."
              style={{
                flex: 1, background: 'transparent',
                color: '#fff', outline: 'none', border: 'none',
                fontSize: 16,
              }}
            />
            <button
              onClick={handleSend}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: '#7c3aed', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          {/* 快捷提示 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            {['帮我写一封邮件', '解释量子纠缠', '给我讲个故事', '代码 review'].map(t => (
              <button
                key={t}
                onClick={() => { setInput(t); inputRef.current?.focus() }}
                style={{
                  padding: '8px 14px', fontSize: 12,
                  color: 'rgba(255,255,255,0.6)',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 999, cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  )
}

export default HomePage
