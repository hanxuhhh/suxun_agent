import { apiUrl } from '../utils/apiBase'
import request from '../utils/request'

export interface Scenario {
  id: string
  name: string
  description: string
  difficulty: number
}

export interface EvaluateResult {
  accuracy: number
  fluency: number
  overall: number
  feedback: string
}

/** 场景列表 */
export const getScenarios = async (): Promise<Scenario[]> => {
  const res = await request.get('/api/speaking/scenarios')
  return (res as any).data.data
}

/** 跟读句子 */
export const getSentences = async (count = 5): Promise<string[]> => {
  const res = await request.get('/api/speaking/sentences', { params: { count } })
  return (res as any).data.data
}

/** 语音转写（Whisper） */
export const transcribe = async (blob: Blob): Promise<string> => {
  const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm'
  const form = new FormData()
  form.append('file', blob, `audio.${ext}`)
  const resp = await fetch(apiUrl('/api/speaking/transcribe'), { method: 'POST', body: form })
  const json = await resp.json()
  if (json.code !== 0) throw new Error(json.message || '转写失败')
  return json.data.text as string
}

/** 跟读评测 */
export const evaluate = async (sentence: string, transcription: string): Promise<EvaluateResult> => {
  const res = await request.post('/api/speaking/evaluate', { sentence, transcription })
  return (res as any).data.data
}

/** 场景对话（SSE），onDelta 逐段回调 */
export async function practice(
  scenarioId: string,
  messages: { role: string; content: string }[],
  onDelta: (text: string) => void
): Promise<void> {
  const resp = await fetch(apiUrl('/api/speaking/practice'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId, messages }),
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
