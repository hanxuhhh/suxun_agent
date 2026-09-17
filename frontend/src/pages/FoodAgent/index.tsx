import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { apiUrl } from '../../utils/apiBase'

// ── 类型 ──────────────────────────────────────────────
interface HILOption { label: string; value: string }
interface HILQuestion {
  id: string
  type: 'SELECT' | 'MULTI_SELECT' | 'TEXT' | 'CONFIRM'
  prompt: string
  options?: HILOption[]
  required: boolean
}
interface RestaurantCard {
  id: string; name: string; address: string; distance: string
  rating: string; cuisine: string; businessHours: string
  tel: string; avgPrice: string; lng: number; lat: number; naviUrl: string
}
type EventType = 'TEXT' | 'HIL' | 'CARD' | 'ACTIONS' | 'ERROR' | 'DONE'
interface AgentEvent {
  type: EventType
  text?: string
  question?: HILQuestion
  cards?: RestaurantCard[]
  actions?: string[]
}
interface ChatItem {
  id: string
  source: 'agent' | 'user'
  event: AgentEvent
}

// ── 餐厅卡片组件 ──────────────────────────────────────
const RestCard: React.FC<{ card: RestaurantCard }> = ({ card }) => (
  <div style={{
    border: '1px solid #f0f0f0', borderRadius: 12, padding: '14px 16px',
    background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column', gap: 6,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{card.name}</span>
      {card.rating && card.rating !== '暂无' && (
        <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>⭐ {card.rating}</span>
      )}
    </div>
    <div style={{ fontSize: 13, color: '#666', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <span>📍 {card.distance}</span>
      {card.avgPrice && <span>💰 人均¥{card.avgPrice}</span>}
      {card.businessHours && <span>🕐 {card.businessHours}</span>}
    </div>
    {card.address && (
      <div style={{ fontSize: 12, color: '#999' }}>📮 {card.address}</div>
    )}
    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
      <a href={card.naviUrl} target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: '#f97316', color: '#fff', textDecoration: 'none' }}>
        🧭 导航
      </a>
      {card.tel && (
        <a href={`tel:${card.tel}`}
          style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: '#f0f0f0', color: '#555', textDecoration: 'none' }}>
          📞 {card.tel}
        </a>
      )}
    </div>
  </div>
)

// ── HIL 组件 ─────────────────────────────────────────
const HILWidget: React.FC<{
  question: HILQuestion
  onAnswer: (v: string) => void
  disabled: boolean
}> = ({ question, onAnswer, disabled }) => {
  const [text, setText] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  if (question.type === 'TEXT') {
    return (
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && text.trim() && onAnswer(text.trim())}
          placeholder={question.prompt}
          disabled={disabled}
          style={{
            flex: 1, border: '1px solid #e5e7eb', borderRadius: 20, padding: '8px 14px',
            fontSize: 14, outline: 'none',
          }}
        />
        <button onClick={() => text.trim() && onAnswer(text.trim())} disabled={disabled || !text.trim()}
          style={{ padding: '8px 16px', borderRadius: 20, background: '#f97316', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
          确认
        </button>
      </div>
    )
  }

  // SELECT
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{question.prompt}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {question.options?.map(opt => (
          <button
            key={opt.value}
            disabled={disabled}
            onClick={() => { setSelected(opt.value); onAnswer(opt.value) }}
            style={{
              padding: '7px 16px', borderRadius: 20, border: '1px solid',
              borderColor: selected === opt.value ? '#f97316' : '#e5e7eb',
              background: selected === opt.value ? '#fff7ed' : '#fafafa',
              color: selected === opt.value ? '#f97316' : '#555',
              cursor: disabled ? 'default' : 'pointer', fontSize: 13,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 主页面 ────────────────────────────────────────────
const FoodAgentPage: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [items, setItems] = useState<ChatItem[]>([])
  const [started, setStarted] = useState(false)
  const [, setWaitingHil] = useState(false)
  const [hilAnswered, setHilAnswered] = useState<Set<string>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)
  const idCounter = useRef(0)

  const nextId = () => `item-${Date.now()}-${idCounter.current++}`

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items])

  const addItem = useCallback((source: 'agent' | 'user', event: AgentEvent) => {
    setItems(prev => [...prev, { id: nextId(), source, event }])
  }, [])

  // 启动 SSE 订阅
  const subscribeSSE = useCallback((sid: string) => {
    const es = new EventSource(apiUrl(`/api/agent/stream/${sid}`))

    const handle = (e: MessageEvent) => {
      try {
        const event: AgentEvent = JSON.parse(e.data)
        addItem('agent', event)
        if (event.type === 'HIL') setWaitingHil(true)
        if (event.type === 'DONE') es.close()
      } catch { /* skip */ }
    }

    ;['text', 'hil', 'card', 'actions', 'error', 'done'].forEach(t => {
      es.addEventListener(t, handle as EventListener)
    })
    es.onerror = () => es.close()
    return es
  }, [addItem])

  // 开始对话
  const handleStart = async () => {
    setStarted(true)
    setItems([])
    const resp = await fetch(apiUrl('/api/agent/start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId: 'food-recommendation' }),
    })
    const json = await resp.json()
    const sid = json.data?.sessionId
    setSessionId(sid)
    subscribeSSE(sid)
  }

  // 发送消息（HIL 回答或 actions 按钮）
  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId) return
    addItem('user', { type: 'TEXT', text: content })
    setWaitingHil(false)
    await fetch(apiUrl('/api/agent/message'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, content }),
    })
  }, [sessionId, addItem])

  const handleHilAnswer = useCallback((itemId: string, value: string) => {
    if (hilAnswered.has(itemId)) return
    setHilAnswered(prev => new Set([...prev, itemId]))
    sendMessage(value)
  }, [hilAnswered, sendMessage])

  const handleAction = useCallback((itemId: string, action: string) => {
    if (hilAnswered.has(itemId + action)) return
    // 清空 HIL 已回答记录，允许新一轮的相同问题可以点击
    setHilAnswered(new Set([itemId + action]))
    sendMessage(action)
  }, [hilAnswered, sendMessage])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f9fafb' }}>
      {/* 顶部栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', height: 'calc(56px + env(safe-area-inset-top))',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #f97316, #ef4444)',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🍜</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>AI 美食推荐助手</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>Powered by Harness Agent</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
          <Link to="/food" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>周边美食</Link>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>首页</Link>
        </div>
      </div>

      {/* 消息区 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        {!started ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 16 }}>
            <div style={{ fontSize: 64 }}>🍜</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>周边美食对话推荐</h2>
            <p style={{ color: '#666', fontSize: 14, maxWidth: 320, lineHeight: 1.6, margin: 0 }}>
              通过多轮对话，AI 将根据你的口味偏好、用餐场景和预算，为你精准推荐附近餐厅
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320 }}>
              {['📍 自动定位', '🎯 偏好收集', '🔍 高德搜索', '🃏 卡片推荐'].map(t => (
                <span key={t} style={{ padding: '4px 12px', background: '#fff7ed', color: '#f97316', borderRadius: 20, fontSize: 12, border: '1px solid #fed7aa' }}>{t}</span>
              ))}
            </div>
            <button
              onClick={handleStart}
              style={{
                padding: '12px 36px', borderRadius: 30,
                background: 'linear-gradient(135deg, #f97316, #ef4444)',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: 16, fontWeight: 600, boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
              }}
            >
              开始 AI 推荐
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item) => {
              const { event } = item
              if (event.type === 'DONE') return null

              if (item.source === 'user') {
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ background: '#f97316', color: '#fff', borderRadius: '18px 18px 4px 18px', padding: '10px 16px', maxWidth: '75%', fontSize: 14 }}>
                      {event.text}
                    </div>
                  </div>
                )
              }

              // Agent 消息
              return (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(event.type === 'TEXT' || event.type === 'ERROR') && event.text && (
                    <div style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#ef4444)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🍜</div>
                      <div style={{
                        background: event.type === 'ERROR' ? '#fef2f2' : '#fff',
                        border: `1px solid ${event.type === 'ERROR' ? '#fca5a5' : '#f0f0f0'}`,
                        borderRadius: '18px 18px 18px 4px',
                        padding: '10px 16px', fontSize: 14, color: '#1a1a1a', maxWidth: '85%',
                        lineHeight: 1.6, whiteSpace: 'pre-wrap',
                      }}>
                        {event.text}
                      </div>
                    </div>
                  )}

                  {event.type === 'HIL' && event.question && (
                    <div style={{ paddingLeft: 42 }}>
                      <HILWidget
                        question={event.question}
                        disabled={hilAnswered.has(item.id)}
                        onAnswer={v => handleHilAnswer(item.id, v)}
                      />
                    </div>
                  )}

                  {event.type === 'CARD' && event.cards && (
                    <div style={{ paddingLeft: 42, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {event.cards.map(card => <RestCard key={card.id} card={card} />)}
                    </div>
                  )}

                  {event.type === 'ACTIONS' && event.actions && (
                    <div style={{ paddingLeft: 42, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {event.actions.map(a => (
                        <button key={a} onClick={() => !hilAnswered.has(item.id + a) && handleAction(item.id, a)}
                          style={{
                            padding: '7px 18px', borderRadius: 20, border: '1px solid #fed7aa',
                            background: hilAnswered.has(item.id + a) ? '#f5f5f5' : '#fff7ed',
                            color: hilAnswered.has(item.id + a) ? '#bbb' : '#f97316',
                            cursor: hilAnswered.has(item.id + a) ? 'default' : 'pointer', fontSize: 13,
                          }}>
                          {a}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  )
}

export default FoodAgentPage
