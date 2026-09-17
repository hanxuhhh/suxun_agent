import request from '../utils/request'
import type { ModelGroup, ApiResponse } from '../types/translate'

export function getModels() {
  return request.get<ApiResponse<ModelGroup[]>>('/api/models')
}
