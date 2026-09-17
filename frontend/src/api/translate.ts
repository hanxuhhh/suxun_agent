import request from '../utils/request'
import type { TranslateRequest, TranslateResult, ApiResponse } from '../types/translate'

export function translateText(data: TranslateRequest) {
  return request.post<ApiResponse<TranslateResult>>('/api/translate', data)
}
