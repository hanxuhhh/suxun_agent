import request from '../utils/request'

export interface NewsItem {
  id: string
  title: string
  summary: string
  category: string
  importance: 'major' | 'normal'
  source: string
  imageUrl: string
  link: string
  publishTime: string
  tags: string[]
}

export interface NewsResponse {
  items: NewsItem[]
  categoryCount: Record<string, number>
  totalToday: number
  sourceCount: number
  lastUpdate: string
}

export interface NewsStats {
  totalToday: number
  total: number
  lastUpdate: string
  sourceCount: number
  categoryCount: Record<string, number>
}

export interface NewsListParams {
  category?: string
  keyword?: string
  sort?: 'latest' | 'important'
  page?: number
  size?: number
}

export const getNewsList = async (params: NewsListParams): Promise<NewsResponse> => {
  const res = await request.get('/api/news/list', { params })
  return (res as any).data.data
}

export const getNewsStats = async (): Promise<NewsStats> => {
  const res = await request.get('/api/news/stats')
  return (res as any).data.data
}

export const refreshNews = () => request.post('/api/news/refresh')
