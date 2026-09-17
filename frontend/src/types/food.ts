export interface ShopLocation {
  lng: number
  lat: number
}

export interface ShopVO {
  id: string
  name: string
  category: string
  address: string
  lng: number
  lat: number
  distance: number
  rating: number | null
  avgCost: number | null
  businessArea: string
  tel: string
  photos: string[]
  openStatus: string
  aiDescription: string
  amapUrl: string
}

export interface FoodResponse {
  city: string
  district: string
  total: number
  list: ShopVO[]
}

export interface FoodCategory {
  id: string
  name: string
  amapType: string
}

export interface FoodParams {
  lng: number
  lat: number
  category?: string
  radius?: number
  sortBy?: 'distance' | 'rating' | 'popular'
  page?: number
  pageSize?: number
}
