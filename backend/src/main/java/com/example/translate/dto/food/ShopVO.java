package com.example.translate.dto.food;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopVO {
    private String id;
    private String name;
    private String category;
    private String address;
    private Double lng;
    private Double lat;
    private Integer distance;       // 米
    private Double rating;          // 评分
    private Integer avgCost;        // 人均消费
    private String businessArea;    // 商圈
    private String tel;
    private List<String> photos;
    private String openStatus;      // 营业中 / 已打烊
    private String aiDescription;   // AI生成描述
    private String amapUrl;         // 高德导航链接
}
