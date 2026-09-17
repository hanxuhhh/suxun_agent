import request from '../utils/request'

export interface WritingTopic {
  id: string
  type: string
  typeName: string
  title: string
  prompt: string
  wordLimit: number
  keyPoints: string[]
}

export interface WritingDim {
  score: number
  comment: string
}

export interface WritingResult {
  content: WritingDim
  language: WritingDim
  organization: WritingDim
  overall: number
  improved: string
  suggestions: string[]
  wordCount: number
}

/** 写作题库 */
export const getTopics = async (): Promise<WritingTopic[]> => {
  const res = await request.get('/api/writing/topics')
  return (res as any).data.data
}

/** 提交批改 */
export const submitWriting = async (topicId: string, content: string): Promise<WritingResult> => {
  const res = await request.post('/api/writing/evaluate', { topicId, content })
  return (res as any).data.data
}
