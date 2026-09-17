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
public class FoodResponse {
    private String city;
    private String district;
    private Integer total;
    private List<ShopVO> list;
}
