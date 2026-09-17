package com.example.translate.service.food;

import com.example.translate.client.AmapClient;
import com.example.translate.dto.food.FoodRequest;
import com.example.translate.dto.food.FoodResponse;
import com.example.translate.dto.food.ShopVO;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class FoodServiceImpl implements FoodService {

    @Autowired
    private AmapClient amapClient;

    @Autowired
    private WebClient webClient;

    @Value("${ai.groq.api-key:}")
    private String groqApiKey;

    // In-memory cache: poiId -> aiDescription
    private final Map<String, String> descriptionCache = new ConcurrentHashMap<>();

    // Category → AMap type code mapping
    private static final Map<String, String> CATEGORY_TYPE_MAP = new HashMap<>();
    static {
        CATEGORY_TYPE_MAP.put("all", "050000");
        CATEGORY_TYPE_MAP.put("hotpot", "050100");
        CATEGORY_TYPE_MAP.put("sichuan", "050118");
        CATEGORY_TYPE_MAP.put("cantonese", "050107");
        CATEGORY_TYPE_MAP.put("japanese", "050200");
        CATEGORY_TYPE_MAP.put("western", "050201");
        CATEGORY_TYPE_MAP.put("coffee", "050500");
        CATEGORY_TYPE_MAP.put("bbq", "050115");
        CATEGORY_TYPE_MAP.put("fastfood", "050300");
    }

    @Override
    public FoodResponse getNearbyFood(FoodRequest request) {
        String location = request.getLng() + "," + request.getLat();
        String types = CATEGORY_TYPE_MAP.getOrDefault(request.getCategory(), "050000");

        // Reverse geocode
        String city = "未知城市", district = "未知区域";
        JsonNode regeo = amapClient.regeocode(location);
        if (regeo != null && "1".equals(regeo.path("status").asText())) {
            JsonNode addr = regeo.path("regeocode").path("addressComponent");
            city = addr.path("city").asText("");
            if (city.isEmpty()) city = addr.path("province").asText("未知城市");
            district = addr.path("district").asText("未知区域");
        }

        // POI search
        JsonNode searchResult = amapClient.searchAround(
                location, "餐饮", types,
                request.getRadius(), request.getPage(), request.getPageSize()
        );

        List<ShopVO> shopList = new ArrayList<>();
        int total = 0;

        if (searchResult != null && "1".equals(searchResult.path("status").asText())) {
            total = searchResult.path("count").asInt(0);
            JsonNode pois = searchResult.path("pois");
            if (pois.isArray()) {
                for (JsonNode poi : pois) {
                    ShopVO shop = parsePoi(poi);
                    if (shop != null) {
                        // Generate AI description (cached)
                        String desc = generateDescription(shop);
                        shop.setAiDescription(desc);
                        shopList.add(shop);
                    }
                }
            }
        }

        // Sort
        if ("rating".equals(request.getSortBy())) {
            shopList.sort((a, b) -> Double.compare(
                    b.getRating() != null ? b.getRating() : 0,
                    a.getRating() != null ? a.getRating() : 0));
        }

        return FoodResponse.builder()
                .city(city)
                .district(district)
                .total(total)
                .list(shopList)
                .build();
    }

    @Override
    public ShopVO getShopDetail(String poiId) {
        JsonNode result = amapClient.searchDetail(poiId);
        if (result != null && "1".equals(result.path("status").asText())) {
            JsonNode pois = result.path("pois");
            if (pois.isArray() && pois.size() > 0) {
                ShopVO shop = parsePoi(pois.get(0));
                if (shop != null) {
                    shop.setAiDescription(generateDescription(shop));
                    return shop;
                }
            }
        }
        return null;
    }

    private ShopVO parsePoi(JsonNode poi) {
        try {
            String id = poi.path("id").asText();
            String name = poi.path("name").asText();
            if (name.isEmpty()) return null;

            String address = poi.path("address").asText("暂无地址");
            String typeName = poi.path("type").asText("餐饮");
            String tel = poi.path("tel").asText("");
            String businessArea = poi.path("business_area").asText("");
            int distance = poi.path("distance").asInt(0);

            // Location
            double lng = 0, lat = 0;
            String[] loc = poi.path("location").asText("0,0").split(",");
            if (loc.length == 2) {
                try { lng = Double.parseDouble(loc[0]); lat = Double.parseDouble(loc[1]); } catch (Exception ignored) {}
            }

            // Rating
            Double rating = null;
            String ratingStr = poi.path("biz_ext").path("rating").asText("");
            if (!ratingStr.isEmpty() && !ratingStr.equals("[]")) {
                try { rating = Double.parseDouble(ratingStr); } catch (Exception ignored) {}
            }

            // Average cost
            Integer avgCost = null;
            String costStr = poi.path("biz_ext").path("cost").asText("");
            if (!costStr.isEmpty() && !costStr.equals("[]")) {
                try { avgCost = Integer.parseInt(costStr); } catch (Exception ignored) {}
            }

            // Open status
            String openTime = poi.path("biz_ext").path("open_time").asText("");
            String openStatus = openTime.isEmpty() ? "营业中" : "营业中";

            // Photos
            List<String> photos = new ArrayList<>();
            JsonNode photoNodes = poi.path("photos");
            if (photoNodes.isArray()) {
                for (JsonNode p : photoNodes) {
                    String url = p.path("url").asText();
                    if (!url.isEmpty()) photos.add(url);
                    if (photos.size() >= 3) break;
                }
            }

            // AMap navigation URL
            String amapUrl = "https://uri.amap.com/marker?position=" + lng + "," + lat
                    + "&name=" + java.net.URLEncoder.encode(name, "UTF-8")
                    + "&src=myapp&coordinate=gaode&callnative=1";

            return ShopVO.builder()
                    .id(id)
                    .name(name)
                    .category(extractCategory(typeName))
                    .address(address)
                    .lng(lng)
                    .lat(lat)
                    .distance(distance)
                    .rating(rating)
                    .avgCost(avgCost)
                    .businessArea(businessArea)
                    .tel(tel)
                    .photos(photos)
                    .openStatus(openStatus)
                    .amapUrl(amapUrl)
                    .build();
        } catch (Exception e) {
            log.error("parsePoi error: {}", e.getMessage());
            return null;
        }
    }

    private String extractCategory(String typeName) {
        if (typeName.contains("火锅")) return "火锅";
        if (typeName.contains("川") || typeName.contains("湘")) return "川湘菜";
        if (typeName.contains("粤") || typeName.contains("广东")) return "粤菜";
        if (typeName.contains("日")) return "日料";
        if (typeName.contains("西餐") || typeName.contains("欧") || typeName.contains("美")) return "西餐";
        if (typeName.contains("咖啡")) return "咖啡";
        if (typeName.contains("烧烤")) return "烧烤";
        if (typeName.contains("快餐")) return "快餐";
        return "餐饮";
    }

    private String generateDescription(ShopVO shop) {
        String cached = descriptionCache.get(shop.getId());
        if (cached != null) return cached;

        try {
            String prompt = "你是美食点评专家。请基于以下店铺信息，生成一段50字以内的生动描述，"
                    + "突出特色菜、氛围、性价比。直接输出描述，不要解释。\n\n"
                    + "店铺信息：\n"
                    + "- 名称：" + shop.getName() + "\n"
                    + "- 类型：" + shop.getCategory() + "\n"
                    + (shop.getRating() != null ? "- 评分：" + shop.getRating() + "\n" : "")
                    + (shop.getAvgCost() != null ? "- 人均：" + shop.getAvgCost() + "元\n" : "")
                    + (shop.getBusinessArea() != null && !shop.getBusinessArea().isEmpty()
                        ? "- 商圈：" + shop.getBusinessArea() + "\n" : "");

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.node.ObjectNode body = mapper.createObjectNode();
            body.put("model", "llama-3.3-70b-versatile");
            body.put("max_tokens", 100);
            com.fasterxml.jackson.databind.node.ArrayNode messages = body.putArray("messages");
            com.fasterxml.jackson.databind.node.ObjectNode msg = messages.addObject();
            msg.put("role", "user");
            msg.put("content", prompt);

            String response = webClient.post()
                    .uri("https://api.groq.com/openai/v1/chat/completions")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode respNode = mapper.readTree(response);
            String description = respNode.path("choices").get(0).path("message").path("content").asText("").trim();
            if (!description.isEmpty()) {
                descriptionCache.put(shop.getId(), description);
                return description;
            }
        } catch (Exception e) {
            log.warn("AI description generation failed for {}: {}", shop.getName(), e.getMessage());
        }

        // Fallback description
        String fallback = shop.getName() + "，"
                + shop.getCategory() + "餐厅"
                + (shop.getRating() != null ? "，评分 " + shop.getRating() : "")
                + (shop.getAvgCost() != null ? "，人均约 " + shop.getAvgCost() + " 元" : "")
                + "。";
        descriptionCache.put(shop.getId(), fallback);
        return fallback;
    }
}
