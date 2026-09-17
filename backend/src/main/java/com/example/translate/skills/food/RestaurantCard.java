package com.example.translate.skills.food;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 餐厅结果卡片 VO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantCard {
    private String id;
    private String name;
    private String address;
    private String distance;    // 如 "320m"
    private String rating;      // 如 "4.8"
    private String cuisine;
    private String businessHours;
    private String tel;
    private String avgPrice;    // 人均
    private double lng;
    private double lat;
    private String naviUrl;     // 高德导航链接
}
