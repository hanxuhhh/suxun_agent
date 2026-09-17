package com.example.translate.skills.food;

import com.example.translate.client.AmapClient;
import com.example.translate.harness.AgentEvent;
import com.example.translate.harness.AgentSession;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

/**
 * State 3: 调用高德 API 搜索餐厅
 */
@Slf4j
public class SearchFoodState {

    private final AmapClient amapClient;

    public SearchFoodState(AmapClient amapClient) {
        this.amapClient = amapClient;
    }

    public String execute(AgentSession session) throws Exception {
        double lng = (double) session.getMemory("lng");
        double lat = (double) session.getMemory("lat");
        String cuisine = session.getSlotStr("cuisine");
        String scene   = session.getSlotStr("scene");
        String distance = session.getSlotStr("distance");

        int radius = parseRadius(distance);
        int page   = session.getMemory("searchPage") != null ? (int) session.getMemory("searchPage") : 1;

        String keywords = CuisineMap.buildKeywords(cuisine, scene);
        String types    = CuisineMap.getType(cuisine);
        String location = lng + "," + lat;

        session.emit(AgentEvent.builder()
                .type(AgentEvent.EventType.TEXT)
                .text("🔍 正在搜索" + cuisine + "餐厅，范围 " + distance + "...")
                .build());

        JsonNode result = amapClient.searchAround(location, keywords, types, radius, page, 10);
        List<RestaurantCard> cards = parseResults(result, lng, lat);

        session.setMemory("searchResults", cards);
        session.setMemory("searchPage", page);
        return "renderResults";
    }

    private int parseRadius(String distance) {
        if (distance == null) return 2000;
        if (distance.contains("500")) return 500;
        if (distance.contains("1"))   return 1000;
        if (distance.contains("5"))   return 5000;
        return 2000; // default 2km
    }

    private List<RestaurantCard> parseResults(JsonNode result, double userLng, double userLat) {
        List<RestaurantCard> cards = new ArrayList<>();
        if (result == null) return cards;

        JsonNode pois = result.path("pois");
        if (!pois.isArray()) return cards;

        for (JsonNode poi : pois) {
            try {
                String locationStr = poi.path("location").asText();
                double poiLng = 0, poiLat = 0;
                if (locationStr.contains(",")) {
                    String[] parts = locationStr.split(",");
                    poiLng = Double.parseDouble(parts[0]);
                    poiLat = Double.parseDouble(parts[1]);
                }

                // 计算距离（米）
                int distM = calcDistance(userLat, userLng, poiLat, poiLng);
                String distStr = distM < 1000 ? distM + "m" : String.format("%.1fkm", distM / 1000.0);

                // 高德导航链接
                String naviUrl = "https://uri.amap.com/navigation?to=" + poiLng + "," + poiLat +
                        "," + java.net.URLEncoder.encode(poi.path("name").asText(), "UTF-8") +
                        "&callnative=0";

                RestaurantCard card = RestaurantCard.builder()
                        .id(poi.path("id").asText())
                        .name(poi.path("name").asText())
                        .address(poi.path("address").asText())
                        .distance(distStr)
                        .rating(poi.path("biz_ext").path("rating").asText("暂无"))
                        .cuisine(poi.path("type").asText())
                        .businessHours(poi.path("biz_ext").path("open_time").asText(""))
                        .tel(poi.path("tel").asText(""))
                        .avgPrice(poi.path("biz_ext").path("cost").asText(""))
                        .lng(poiLng)
                        .lat(poiLat)
                        .naviUrl(naviUrl)
                        .build();
                cards.add(card);
            } catch (Exception e) {
                log.warn("parse poi error: {}", e.getMessage());
            }
        }
        return cards;
    }

    /** Haversine 公式计算两点距离（米） */
    private int calcDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return (int) (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }
}
