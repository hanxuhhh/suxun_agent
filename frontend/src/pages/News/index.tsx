import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Spin, Button, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import HeroSection from './components/HeroSection'
import StatsCard from './components/StatsCard'
import CategoryTabs from './components/CategoryTabs'
import SearchSortBar from './components/SearchSortBar'
import NewsCard from './components/NewsCard'
import { getNewsList, getNewsStats, refreshNews, NewsItem, NewsStats } from '../../api/news'
import Header from '../../components/Header'

const PAGE_SIZE = 20

const NewsPage: React.FC = () => {
  const [category, setCategory] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState<'latest' | 'important'>('latest')
  const [page, setPage] = useState(0)
  const [newsList, setNewsList] = useState<NewsItem[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [stats, setStats] = useState<NewsStats | null>(null)
  const [categoryCount, setCategoryCount] = useState<Record<string, number>>({})
  const [refreshing, setRefreshing] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  const fetchStats = async () => {
    try {
      const data = await getNewsStats()
      setStats(data)
    } catch (_) {}
  }

  const fetchNews = useCallback(
    async (reset = false) => {
      const currentPage = reset ? 0 : page
      if (loading) return
      setLoading(true)
      try {
        const data = await getNewsList({ category, keyword, sort, page: currentPage, size: PAGE_SIZE })
        const { items, categoryCount: cc } = data
        if (reset) {
          setNewsList(items)
          setPage(1)
        } else {
          setNewsList((prev) => [...prev, ...items])
          setPage((p) => p + 1)
        }
        setCategoryCount(cc || {})
        setHasMore(items.length === PAGE_SIZE)
      } catch (_) {
      } finally {
        setLoading(false)
        setInitialLoading(false)
      }
    },
    [category, keyword, sort, page, loading]
  )

  // Reset on filter change
  useEffect(() => {
    setPage(0)
    setNewsList([])
    setHasMore(true)
    setInitialLoading(true)
    fetchNews(true)
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, keyword, sort])

  // Infinite scroll observer
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchNews(false)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, fetchNews])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshNews()
      message.success('刷新成功')
      setPage(0)
      setNewsList([])
      setHasMore(true)
      await fetchNews(true)
      await fetchStats()
    } catch (_) {
      message.error('刷新失败')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 tab-page">
      <Header />
      <HeroSection />
      <StatsCard stats={stats} />

      <div className="max-w-3xl mx-auto">
        <CategoryTabs current={category} onChange={setCategory} categoryCount={categoryCount} />
        <SearchSortBar
          keyword={keyword}
          sort={sort}
          onKeywordChange={setKeyword}
          onSortChange={setSort}
        />

        {/* Refresh button */}
        <div className="flex justify-end px-4 py-2">
          <Button
            icon={<ReloadOutlined spin={refreshing} />}
            size="small"
            onClick={handleRefresh}
            loading={refreshing}
            className="text-gray-400"
            type="text"
          >
            手动刷新
          </Button>
        </div>

        {/* News list */}
        {initialLoading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
            <span className="ml-3 text-gray-400">加载新闻中...</span>
          </div>
        ) : newsList.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <div>暂无相关新闻</div>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-900 shadow-sm">
              {newsList.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={loaderRef} className="flex justify-center py-6">
              {loading && <Spin />}
              {!hasMore && !loading && (
                <span className="text-gray-400 text-sm">— 已加载全部新闻 —</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default NewsPage
