import React from 'react'
import { Link } from 'react-router-dom'

/** 功能入口卡片 */
const FEATURES = [
  {
    title: '背单词',
    desc: 'BEC 商务词汇 · 2825 词',
    icon: '📖',
    to: '/english/vocab',
    color: 'from-blue-500 to-indigo-500',
    live: true,
  },
  {
    title: '翻译',
    desc: 'AI 双向翻译 · 多风格',
    icon: '🌐',
    to: '/translate',
    color: 'from-purple-500 to-pink-500',
    live: true,
  },
  {
    title: '口语',
    desc: '场景对话 · 跟读打分',
    icon: '🗣️',
    to: '/english/speaking',
    color: 'from-emerald-500 to-teal-500',
    live: true,
  },
  {
    title: '阅读',
    desc: '商务文章 · 实时翻译',
    icon: '📰',
    to: '/english/reading',
    color: 'from-orange-500 to-amber-500',
    live: true,
  },
  {
    title: '写作',
    desc: '商务写作 · AI 批改',
    icon: '✍️',
    to: '/english/writing',
    color: 'from-rose-500 to-red-500',
    live: true,
  },
  {
    title: '词典',
    desc: '即点即查 · 双语释义',
    icon: '🔍',
    to: '',
    color: 'from-cyan-500 to-sky-500',
    live: false,
  },
]

const EnglishPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* 顶部 Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
        <div className="px-5 pb-8 pt-4">
          <div className="text-2xl font-bold mb-1">英语学习</div>
          <div className="text-sm text-white/80">对标 BEC 商务英语 · 听说读写全面备战</div>

          <div className="mt-5 flex gap-3">
            <div className="flex-1 bg-white/15 rounded-xl px-3 py-2.5 backdrop-blur">
              <div className="text-[11px] text-white/70">词库规模</div>
              <div className="text-lg font-bold">2825 词</div>
            </div>
            <div className="flex-1 bg-white/15 rounded-xl px-3 py-2.5 backdrop-blur">
              <div className="text-[11px] text-white/70">已上线模块</div>
              <div className="text-lg font-bold">5 个</div>
            </div>
            <div className="flex-1 bg-white/15 rounded-xl px-3 py-2.5 backdrop-blur">
              <div className="text-[11px] text-white/70">费用</div>
              <div className="text-lg font-bold">免费</div>
            </div>
          </div>
        </div>
      </div>

      {/* 功能卡片 */}
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => {
            const inner = (
              <>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-xl shadow-md`}>
                  {f.icon}
                </div>
                <div className="mt-2.5 font-semibold text-gray-800 dark:text-gray-100 text-sm">{f.title}</div>
                <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">{f.desc}</div>
                {!f.live && (
                  <span className="inline-block mt-2 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-[10px]">
                    即将上线
                  </span>
                )}
              </>
            )
            const cls =
              'bg-white dark:bg-gray-900 rounded-2xl p-4 no-underline shadow-sm border border-gray-100 dark:border-gray-800 ' +
              (f.live ? 'touch-active' : 'opacity-60')
            return f.live ? (
              <Link key={f.title} to={f.to} className={cls}>
                {inner}
              </Link>
            ) : (
              <div key={f.title} className={cls}>
                {inner}
              </div>
            )
          })}
        </div>
      </div>

      {/* 学习建议 */}
      <div className="px-4 mt-5">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-2">💡 备考建议</div>
          <ul className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed list-disc pl-4">
            <li>BEC 核心词汇是阅读和听力的基础，建议每天 10 词坚持打卡</li>
            <li>测验答错的词会自动进入错词本，重点复习</li>
            <li>口语、写作模块已上线：场景对话支持考官自动朗读，跟读打分用麦克风即可</li>
            <li>阅读模块已上线：BBC/NPR/NYT 商务文章实时更新，支持流式翻译和点词查词</li>
            <li>词典模块即将上线，敬请期待</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default EnglishPage
