import React, { useEffect, useCallback, useState } from 'react'
import { Spin, Empty, Button, Modal } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import Header from '../../components/Header'
import LocationBar from './components/LocationBar'
import CategoryFilter from './components/CategoryFilter'
import ShopCard from './components/ShopCard'
import ProvinceDistrictPicker from './components/ProvinceDistrictPicker'
import { useGeolocation } from './hooks/useGeolocation'
import { useFoodStore } from '../../store/useFoodStore'
import { getNearbyFood, getFoodCategories } from '../../api/food'

const FoodPage: React.FC = () => {
  const geo = useGeolocation()
  const [cityModalOpen, setCityModalOpen] = useState(false)
  const {
    lng, lat, city, district,
    category, radius, sortBy,
    shops, categories, total, loading, page,
    setLocation, setLocationError, setCategory, setRadius, setSortBy,
    setShops, setCategories, setLoading,
  } = useFoodStore()

  // Sync geolocation → store; auto-show city picker if IP gave foreign location
  useEffect(() => {
    if (geo.lng && geo.lat) {
      // Detect clearly non-China coordinates (rough bounding box)
      const inChina = geo.lat > 18 && geo.lat < 54 && geo.lng > 73 && geo.lng < 136
      if (!inChina && geo.method === 'ip') {
        // Foreign IP — show city picker automatically
        setCityModalOpen(true)
        return
      }
      setLocation(geo.lng, geo.lat)
    }
    if (geo.error) {
      setLocationError(geo.error)
      setCityModalOpen(true)
    }
  }, [geo.lng, geo.lat, geo.error, geo.method])

  // Load categories once
  useEffect(() => {
    getFoodCategories().then(setCategories).catch(() => {})
  }, [])

  // Fetch shops when location or filters change
  const fetchShops = useCallback(async () => {
    if (!lng || !lat) return
    setLoading(true)
    try {
      const data = await getNearbyFood({ lng, lat, category, radius, sortBy, page, pageSize: 20 })
      setShops(data.list, data.total, data.city, data.district)
    } catch (e) {
      // error handled by axios interceptor
    } finally {
      setLoading(false)
    }
  }, [lng, lat, category, radius, sortBy, page])

  useEffect(() => {
    if (lng && lat) fetchShops()
  }, [lng, lat, category, radius, sortBy, page])

  const handleManual = (mLng: number, mLat: number) => {
    geo.setManual(mLng, mLat)
    setLocation(mLng, mLat)
    setCityModalOpen(false)
  }

  // Default categories if backend not loaded yet
  const displayCategories = categories.length > 0 ? categories : [
    { id: 'all', name: '全部', amapType: '050000' },
    { id: 'hotpot', name: '🍲 火锅', amapType: '050100' },
    { id: 'sichuan', name: '🌶️ 川菜', amapType: '050118' },
    { id: 'cantonese', name: '🥟 粤菜', amapType: '050107' },
    { id: 'japanese', name: '🍣 日料', amapType: '050200' },
    { id: 'western', name: '🥩 西餐', amapType: '050201' },
    { id: 'coffee', name: '☕ 咖啡', amapType: '050500' },
    { id: 'bbq', name: '🔥 烧烤', amapType: '050115' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 tab-page">
      <Header />

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-6 text-center text-white">
        <div className="text-3xl mb-1">🍜</div>
        <h1 className="text-xl font-bold mb-1">周边美食推荐</h1>
        <p className="text-orange-100 text-xs">基于你的位置，AI 为你精选附近好店</p>
        {(city || district) && (
          <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
            📍 {city}{district}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto">
        <LocationBar
          city={city}
          district={district}
          loading={geo.loading}
          error={geo.error}
          method={geo.method}
          onRelocate={geo.locate}
          onManual={handleManual}
          onOpenCityPicker={() => setCityModalOpen(true)}
        />

        <CategoryFilter
          categories={displayCategories}
          current={category}
          radius={radius}
          sortBy={sortBy}
          onCategoryChange={setCategory}
          onRadiusChange={setRadius}
          onSortChange={setSortBy}
        />

        {/* Stats bar */}
        {!loading && shops.length > 0 && (
          <div className="px-4 py-2 text-xs text-gray-400 flex items-center justify-between">
            <span>共找到 <span className="text-orange-500 font-semibold">{total}</span> 家餐厅</span>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={fetchShops}
              className="text-gray-400 text-xs"
            >
              刷新
            </Button>
          </div>
        )}

        {/* Content */}
        {!lng && !geo.loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📍</div>
            <p className="text-base mb-1">请先选择您的城市</p>
            <Button
              type="primary"
              onClick={() => setCityModalOpen(true)}
              className="bg-orange-500 border-orange-500 hover:bg-orange-600 mt-3"
            >
              选择城市
            </Button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Spin size="large" />
            <p className="text-sm">正在搜索附近美食...</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="py-20">
            <Empty description="附近暂无找到餐厅，试试扩大搜索范围" />
          </div>
        ) : (
          <div className="p-3.5 grid grid-cols-1 gap-3.5">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </div>

      {/* City picker modal - Province/City/District cascade */}
      <Modal
        title="📍 请选择您的位置"
        open={cityModalOpen}
        onCancel={() => setCityModalOpen(false)}
        footer={null}
        closable
        maskClosable
        centered
        width="92%"
        style={{ maxWidth: 480 }}
      >
        <ProvinceDistrictPicker
          onConfirm={(mLng, mLat) => {
            handleManual(mLng, mLat)
            setCityModalOpen(false)
          }}
          onCancel={() => setCityModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

export default FoodPage
