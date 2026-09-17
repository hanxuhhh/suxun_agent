package com.example.translate.dto.food;

import lombok.Data;

@Data
public class FoodRequest {
    private Double lng;
    private Double lat;
    private String category;   // all / hotpot / sichuan / ...
    private Integer radius = 3000;
    private String sortBy = "distance";  // distance / rating / popular
    private Integer page = 1;
    private Integer pageSize = 20;
}
