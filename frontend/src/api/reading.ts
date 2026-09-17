import { apiUrl } from '../utils/apiBase'
import request from '../utils/request'

export interface ReadingArticle {
  id: string
  title: string
  summary: string
  source: string
  imageUrl: string
  link: string
  publishTime: string
  category: string
}

/** 商务文章流（图文，分页） */
export const getArticles = async (page = 0, size = 10): Promise<{ items: ReadingArticle[]; total: number }> => {
  const res = await request.get('/api/reading/articles', { params: { page, size } })
  return (res as any).data.data
}

/** 文章详情 */
export const getArticle = async (id: string): Promise<ReadingArticle> => {
  const res = await request.get(`/api/reading/article/${id}`)
  return (res as any).data.data
}

/** SSE 流式翻译整篇文章，onDelta 逐段回调 */
export async function translateStream(articleId: string, onDelta: (text: string) => void): Promise<void> {
  const resp = await fetch(apiUrl('/api/reading/translate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleId }),
  })
  if (!resp.body) throw new Error('no body')
  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      const t = line.trim()
      if (!t || !t.startsWith('data:')) continue
      const json = t.slice(5).trim()
      if (!json || json === '[DONE]') continue
      try {
        const delta = JSON.parse(json)?.choices?.[0]?.delta?.content
        if (typeof delta === 'string' && delta) onDelta(delta)
      } catch {
        /* skip */
      }
    }
  }
}
