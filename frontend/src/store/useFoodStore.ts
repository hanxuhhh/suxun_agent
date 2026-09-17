import { create } from 'zustand'
import { ShopVO, FoodCategory } from '../types/food'

interface FoodStore {
  // Location
  lng: number | null
  lat: number | null
  city: string
  district: string
  locationError: string | null

  // Filters
  category: string
  radius: number
  sortBy: 'distance' | 'rating' | 'popular'

  // Data
  shops: ShopVO[]
  categories: FoodCategory[]
  total: number
  loading: boolean
  page: number

  // Actions
  setLocation: (lng: number, lat: number, city?: string, district?: string) => void
  setLocationError: (err: string | null) => void
  setCategory: (cat: string) => void
  setRadius: (r: number) => void
  setSortBy: (s: 'distance' | 'rating' | 'popular') => void
  setShops: (shops: ShopVO[], total: number, city: string, district: string) => void
  setCategories: (cats: FoodCategory[]) => void
  setLoading: (v: boolean) => void
  setPage: (p: number) => void
}

export const useFoodStore = create<FoodStore>((set) => ({
  lng: null,
  lat: null,
  city: '',
  district: '',
  locationError: null,
  category: 'all',
  radius: 3000,
  sortBy: 'distance',
  shops: [],
  categories: [],
  total: 0,
  loading: false,
  page: 1,

  setLocation: (lng, lat, city = '', district = '') => set({ lng, lat, city, district, locationError: null }),
  setLocationError: (err) => set({ locationError: err }),
  setCategory: (cat) => set({ category: cat, page: 1 }),
  setRadius: (r) => set({ radius: r, page: 1 }),
  setSortBy: (s) => set({ sortBy: s }),
  setShops: (shops, total, city, district) => set({ shops, total, city, district }),
  setCategories: (cats) => set({ categories: cats }),
  setLoading: (v) => set({ loading: v }),
  setPage: (p) => set({ page: p }),
}))
