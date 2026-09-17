package com.example.translate.service.food;

import com.example.translate.dto.food.FoodRequest;
import com.example.translate.dto.food.FoodResponse;
import com.example.translate.dto.food.ShopVO;

public interface FoodService {
    FoodResponse getNearbyFood(FoodRequest request);
    ShopVO getShopDetail(String poiId);
}
