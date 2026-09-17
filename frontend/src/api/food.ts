import request from '../utils/request'
import { FoodResponse, FoodCategory, ShopVO, FoodParams } from '../types/food'

export const getNearbyFood = async (params: FoodParams): Promise<FoodResponse> => {
  const res = await request.get('/api/food/nearby', { params })
  return (res as any).data.data
}

export const getFoodCategories = async (): Promise<FoodCategory[]> => {
  const res = await request.get('/api/food/categories')
  return (res as any).data.data
}

export const getShopDetail = async (id: string): Promise<ShopVO> => {
  const res = await request.get(`/api/food/detail/${id}`)
  return (res as any).data.data
}
