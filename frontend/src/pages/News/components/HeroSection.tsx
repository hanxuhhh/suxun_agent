import React from 'react'
import PulseSphere from './PulseSphere'

const HeroSection: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-purple-950 to-indigo-950 px-4 py-8 md:py-12">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6">
        {/* Left text */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            实时数据流 · AI 精选
          </div>

          <h1 className="text-2xl md:text-5xl font-bold leading-tight mb-3">
            <span className="bg-gradient-to-r from-red-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              今天，世界
            </span>
            <br />
            <span className="text-white">正在发生什么</span>
          </h1>

          <p className="text-gray-400 text-sm md:text-lg max-w-md">
            聚合全球顶级新闻源，AI 智能分类精选，实时掌握科技、财经、国际最新动态
          </p>

          <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
            {['BBC', 'Reuters', 'TechCrunch', 'Bloomberg', 'AI精选'].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right sphere —— 手机上隐藏，省空间 */}
        <div className="hidden md:flex flex-shrink-0 items-center justify-center">
          <PulseSphere />
        </div>
      </div>
    </div>
  )
}

export default HeroSection
