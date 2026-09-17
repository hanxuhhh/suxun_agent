import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReadingArticle, getArticles } from '../../api/reading'
import { speakWord } from '../../api/vocab'
import { useVocabStore } from '../../store/useVocabStore'
import request from '../../utils/request'

/** 点词卡片：直接 AI 翻译（不走词库） */
interface WordCard {
  word: string
  translation: string
  loading: boolean
}

/** 段落视图：句子 + 每句中文翻译 */
interface ParaView {
  sentences: string[]
  translations: (string | null)[]
  loading: boolean
  done: boolean
}

function fmtTime(t: string): string {
  const d = new Date(t)
  if (isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 英文段落 → 句子数组 */
function splitSentences(p: string): string[] {
  return p
    .replace(/(["'])/g, '"')
    .split(/(?<=[.!?])\s+(?=[A-Z"“(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
}

/** 可点查的单词流 */
const WordFlow: React.FC<{ text: string; onWord: (w: string) => void }> = ({ text, onWord }) => {
  const tokens = text.split(/([a-zA-Z][a-zA-Z'-]*)/)
  return (
    <>
      {tokens.map((t, i) =>
        /^[a-zA-Z][a-zA-Z'-]*$/.test(t) ? (
          <span
            key={i}
            className="underline decoration-gray-300 dark:decoration-gray-600 decoration-dotted underline-offset-2 hover:text-indigo-500 touch-active"
            onClick={(e) => { e.stopPropagation(); onWord(t) }}
          >
            {t}
          </span>
        ) : (
          <span key={i}>{t}</span>
        )
      )}
    </>
  )
}

const ReadingPage: React.FC = () => {
  const navigate = useNavigate()
  const { starWords, toggleStar } = useVocabStore()

  /* ── 列表态 ── */
  const [articles, setArticles] = useState<ReadingArticle[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  /* ── 详情态 ── */
  const [detail, setDetail] = useState<ReadingArticle | null>(null)
  const [paras, setParas] = useState<ParaView[]>([])
  const [contentLoading, setContentLoading] = useState(false)
  const [translatingAll, setTranslatingAll] = useState(false)

  /* ── 点词卡 ── */
  const [card, setCard] = useState<WordCard | null>(null)

  useEffect(() => {
    setLoading(true)
    getArticles(0, 10)
      .then((d) => {
        setArticles(d.items)
        setTotal(d.total)
        setPage(0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const loadMore = () => {
    if (loading) return
    setLoading(true)
    getArticles(page + 1, 10)
      .then((d) => {
        setArticles((prev) => [...prev, ...d.items])
        setTotal(d.total)
        setPage((p) => p + 1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  /** 打开详情：加载正文全文（不跳转） */
  const openDetail = (a: ReadingArticle) => {
    setDetail(a)
    setParas([])
    setCard(null)
    window.scrollTo(0, 0)
    setContentLoading(true)
    request
      .get(`/api/reading/content/${a.id}`)
      .then((res: any) => {
        const list: string[] = res.data?.data?.paragraphs || []
        setParas(list.map((p) => ({ sentences: splitSentences(p), translations: [], loading: false, done: false })))
      })
      .catch(() => {
        // 兜底：用摘要
        setParas(a.summary ? [{ sentences: splitSentences(a.summary), translations: [], loading: false, done: false }] : [])
      })
      .finally(() => setContentLoading(false))
  }

  /** 翻译某一段：AI 逐句翻译 */
  const translatePara = async (index: number) => {
    const para = paras[index]
    if (!para || para.loading || para.done || para.sentences.length === 0) return
    setParas((prev) => prev.map((p, i) => (i === index ? { ...p, loading: true } : p)))
    try {
      const res = await request.post('/api/reading/translate/sentences', { sentences: para.sentences })
      const translations: string[] = (res as any).data?.data?.translations || []
      setParas((prev) =>
        prev.map((p, i) =>
          i === index
            ? {
                ...p,
                translations: p.sentences.map((_, si) => translations[si] ?? null),
                loading: false,
                done: true,
              }
            : p
        )
      )
    } catch {
      setParas((prev) => prev.map((p, i) => (i === index ? { ...p, loading: false } : p)))
      alert('本段翻译失败，可点击重试')
    }
  }

  /** 逐段串行翻译全文（控制 AI 调用频率） */
  const translateAll = async () => {
    if (translatingAll) return
    setTranslatingAll(true)
    for (let i = 0; i < paras.length; i++) {
      if (!paras[i].done) await translatePara(i)
    }
    setTranslatingAll(false)
  }

  /** 点词 → 直接 AI 翻译 */
  const lookup = async (raw: string) => {
    const word = raw.replace(/[^a-zA-Z'-]/g, '')
    if (!word) return
    speakWord(word)
    setCard({ word, translation: '', loading: true })
    try {
      const res = await request.post('/api/translate', {
        text: word,
        sourceLang: 'en',
        targetLang: 'zh',
        model: 'openai/gpt-oss-120b',
        style: 'colloquial',
      })
      const cn = (res as any).data?.data?.translatedText || '暂无释义'
      setCard({ word, translation: cn, loading: false })
    } catch {
      setCard({ word, translation: '查询失败，请重试', loading: false })
    }
  }

  const translatedCount = paras.filter((p) => p.done).length

  /* ══════════ 文章列表 ══════════ */
  if (!detail) {
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
          <div className="flex-1 text-center font-semibold text-gray-800 dark:text-gray-100 pr-10">商务阅读 · 实时更新</div>
        </div>

        <div className="px-4 pt-3">
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3 py-2.5 text-xs text-orange-600 dark:text-orange-400">
            📰 BBC / NPR / 纽约时报商务版实时聚合 · 共 {total} 篇 · 全文直接阅读，逐句 AI 翻译，点词即查
          </div>
        </div>

        {/* 文章卡片流 */}
        <div className="px-4 mt-3 space-y-4">
          {articles.map((a) => (
            <div
              key={a.id}
              onClick={() => openDetail(a)}
              className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm touch-active"
            >
              {a.imageUrl && (
                <img
                  src={a.imageUrl}
                  alt={a.title}
                  className="w-full h-40 object-cover bg-gray-100 dark:bg-gray-800"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <div className="p-4">
                <div className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">{a.title}</div>
                <div className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{a.summary}</div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-500">{a.source}</span>
                  <span className="text-[10px] text-gray-300">{fmtTime(a.publishTime)}</span>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            </div>
          )}

          {!loading && articles.length < total && (
            <button onClick={loadMore} className="w-full py-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-sm text-gray-500 touch-active">
              加载更多（剩余 {total - articles.length} 篇）
            </button>
          )}
          {!loading && articles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-4xl mb-3">📰</div>
              <div className="text-sm text-gray-400">文章加载中，请稍后刷新</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ══════════ 文章详情：全文直接展示 + 逐句翻译 ══════════ */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16">
      {/* 顶栏 */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-100 dark:border-gray-800 flex items-center px-3 py-2" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top))' }}>
        <button onClick={() => { setDetail(null); window.scrollTo(0, 0) }} aria-label="返回列表" className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 touch-active text-lg">←</button>
        <div className="flex-1 text-center text-sm font-medium text-gray-700 dark:text-gray-200 truncate pr-10">{detail.source}</div>
      </div>

      <div style={{ paddingTop: 'calc(64px + env(safe-area-inset-top))' }}>
        {/* 头图 */}
        {detail.imageUrl && (
          <img
            src={detail.imageUrl}
            alt={detail.title}
            className="w-full h-52 object-cover bg-gray-100 dark:bg-gray-800"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}

        <div className="px-4 py-4">
          {/* 标题 */}
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 leading-snug" onClick={() => speakWord(detail.title, 1)}>
            <WordFlow text={detail.title} onWord={lookup} />
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-500">{detail.source}</span>
            <span className="text-[10px] text-gray-300">{fmtTime(detail.publishTime)}</span>
            <button onClick={() => speakWord(detail.title, 1)} className="ml-auto text-xs text-indigo-500 touch-active">🔊 朗读标题</button>
          </div>

          {/* 逐句翻译全文按钮 */}
          {!contentLoading && paras.length > 0 && (
            <button
              onClick={translateAll}
              disabled={translatingAll || translatedCount === paras.length}
              className={`mt-4 w-full py-3.5 rounded-2xl font-semibold text-sm shadow-md touch-active active:scale-[0.98] transition-transform ${
                translatedCount === paras.length
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-100'
              }`}
            >
              {translatedCount === paras.length
                ? `✅ 全部段落已翻译（${paras.length} 段）`
                : translatingAll
                  ? `⏳ 逐句翻译中... ${translatedCount}/${paras.length} 段`
                  : `🌐 逐句翻译全文（共 ${paras.length} 段）`}
            </button>
          )}

          {/* 正文：全文直接展示，每句下跟中文翻译 */}
          <div className="mt-5 space-y-4">
            {contentLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                <div className="text-xs text-gray-400 mt-3">正在抓取原文全文...</div>
              </div>
            )}

            {paras.map((para, pi) => (
              <div key={pi} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                {/* 句子逐条展示 */}
                <div className="space-y-3" onClick={() => !para.done && translatePara(pi)}>
                  {para.sentences.map((s, si) => (
                    <div key={si}>
                      <div className="text-[15px] text-gray-800 dark:text-gray-100 leading-relaxed">
                        <WordFlow text={s} onWord={lookup} />
                      </div>
                      {para.translations[si] != null && (
                        <div className="text-[13px] text-gray-400 dark:text-gray-500 mt-1 pl-2 border-l-2 border-orange-200 dark:border-orange-800">
                          {para.translations[si]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 段落操作行 */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] text-gray-300">第 {pi + 1} 段</span>
                  {para.loading ? (
                    <span className="text-[10px] text-orange-400 flex items-center gap-1">
                      <span className="w-3 h-3 border border-orange-300 border-t-orange-500 rounded-full animate-spin inline-block" />
                      AI 翻译中...
                    </span>
                  ) : para.done ? (
                    <span className="text-[10px] text-emerald-400">✅ 已翻译</span>
                  ) : (
                    <button onClick={() => translatePara(pi)} className="text-[10px] text-orange-500 touch-active underline">
                      翻译本段 →
                    </button>
                  )}
                </div>
              </div>
            ))}

            {!contentLoading && paras.length === 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 text-sm text-gray-400 text-center py-8">
                原文全文抓取失败，可尝试刷新或选择其他文章
              </div>
            )}
          </div>

          {/* 出处信息（非跳转展示） */}
          <div className="mt-4 text-center text-[10px] text-gray-300 pb-4">
            内容来源：{detail.source} · 由 AI 实时翻译 · 仅供英语学习使用
          </div>
        </div>
      </div>

      {/* ═══ 点词查询卡片（AI 直接翻译） ═══ */}
      {card && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setCard(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-white dark:bg-gray-900 rounded-t-3xl p-5 max-h-[60vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">{card.word}</span>
              <button onClick={() => speakWord(card.word)} className="w-8 h-8 flex items-center justify-center rounded-lg text-indigo-400 touch-active">🔊</button>
              <button
                onClick={() => toggleStar(card.word)}
                className={`ml-auto w-9 h-9 rounded-full flex items-center justify-center text-xl touch-active ${starWords.includes(card.word) ? 'text-amber-400' : 'text-gray-300'}`}
              >
                {starWords.includes(card.word) ? '★' : '☆'}
              </button>
            </div>

            <div className="mt-4">
              {card.loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                  <span className="text-indigo-500 font-medium">AI 释义：</span>
                  {card.translation}
                </div>
              )}
              <div className="text-[10px] text-gray-300 text-center mt-4">AI 实时翻译 · 可点 ★ 收藏到生词本</div>
            </div>

            <button onClick={() => setCard(null)} className="w-full mt-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm touch-active">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReadingPage
