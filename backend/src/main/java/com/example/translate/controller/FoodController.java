package com.example.translate.controller;

import com.example.translate.common.Result;
import com.example.translate.config.AmapConfig;
import com.example.translate.dto.food.FoodRequest;
import com.example.translate.dto.food.FoodResponse;
import com.example.translate.dto.food.ShopVO;
import com.example.translate.service.food.FoodService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Tag(name = "美食接口")
@Slf4j
@RestController
@RequestMapping("/api/food")
public class FoodController {

    @Autowired
    private FoodService foodService;

    @Autowired
    private AmapConfig amapConfig;

    @Operation(summary = "获取附近美食商家")
    @GetMapping("/nearby")
    public Result<FoodResponse> nearby(
            @RequestParam Double lng,
            @RequestParam Double lat,
            @RequestParam(required = false, defaultValue = "all") String category,
            @RequestParam(required = false, defaultValue = "3000") Integer radius,
            @RequestParam(required = false, defaultValue = "distance") String sortBy,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer pageSize
    ) {
        FoodRequest request = new FoodRequest();
        request.setLng(lng);
        request.setLat(lat);
        request.setCategory(category);
        request.setRadius(radius);
        request.setSortBy(sortBy);
        request.setPage(page);
        request.setPageSize(pageSize);
        return Result.success(foodService.getNearbyFood(request));
    }

    @Operation(summary = "获取美食分类列表")
    @GetMapping("/categories")
    public Result<List<Map<String, String>>> categories() {
        List<Map<String, String>> list = Arrays.asList(
                Map.of("id", "all",       "name", "全部",    "amapType", "050000"),
                Map.of("id", "hotpot",    "name", "🍲 火锅",  "amapType", "050100"),
                Map.of("id", "sichuan",   "name", "🌶️ 川菜",  "amapType", "050118"),
                Map.of("id", "cantonese", "name", "🥟 粤菜",  "amapType", "050107"),
                Map.of("id", "japanese",  "name", "🍣 日料",  "amapType", "050200"),
                Map.of("id", "western",   "name", "🥩 西餐",  "amapType", "050201"),
                Map.of("id", "coffee",    "name", "☕ 咖啡",  "amapType", "050500"),
                Map.of("id", "bbq",       "name", "🔥 烧烤",  "amapType", "050115"),
                Map.of("id", "fastfood",  "name", "🍜 快餐",  "amapType", "050300")
        );
        return Result.success(list);
    }

    @Operation(summary = "地理编码（地址→坐标）")
    @GetMapping("/geocode")
    public Result<Map<String, Double>> geocode(@RequestParam String address) {
        try {
            String encodedAddress = java.net.URLEncoder.encode(address, "UTF-8");
            String urlStr = "https://restapi.amap.com/v3/geocode/geo"
                    + "?key=" + amapConfig.getKey()
                    + "&address=" + encodedAddress;

            java.net.URL url = new java.net.URL(urlStr);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            java.io.InputStream is = conn.getInputStream();
            String response = new String(is.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
            conn.disconnect();

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(response);
            if ("1".equals(node.path("status").asText())) {
                com.fasterxml.jackson.databind.JsonNode geocodes = node.path("geocodes");
                if (geocodes.isArray() && geocodes.size() > 0) {
                    String location = geocodes.get(0).path("location").asText();
                    String[] parts = location.split(",");
                    Map<String, Double> coord = new java.util.HashMap<>();
                    coord.put("lng", Double.parseDouble(parts[0]));
                    coord.put("lat", Double.parseDouble(parts[1]));
                    return Result.success(coord);
                }
            }
            log.warn("geocode failed for address: {}, response: {}", address, response);
        } catch (Exception e) {
            log.error("geocode error: {}", e.getMessage());
        }
        return Result.error("地理编码失败");
    }
    public Result<ShopVO> detail(@PathVariable String id) {
        ShopVO shop = foodService.getShopDetail(id);
        if (shop == null) {
            return Result.error(404, "店铺不存在");
        }
        return Result.success(shop);
    }
}
