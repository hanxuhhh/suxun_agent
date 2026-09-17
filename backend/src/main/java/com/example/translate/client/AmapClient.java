package com.example.translate.client;

import com.example.translate.config.AmapConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class AmapClient {

    @Autowired
    private AmapConfig amapConfig;

    @Autowired
    private WebClient webClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 周边搜索（POI around search）
     */
    public JsonNode searchAround(String location, String keywords, String types,
                                  int radius, int page, int pageSize) {
        try {
            String url = amapConfig.getBaseUrl() + "/place/around"
                    + "?key=" + amapConfig.getKey()
                    + "&location=" + location
                    + "&keywords=" + (keywords != null ? keywords : "")
                    + "&types=" + (types != null ? types : "050000")
                    + "&radius=" + radius
                    + "&offset=" + pageSize
                    + "&page=" + page
                    + "&extensions=all";

            String response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return objectMapper.readTree(response);
        } catch (Exception e) {
            log.error("Amap searchAround error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 逆地理编码（经纬度 → 地址）
     */
    public JsonNode regeocode(String location) {
        try {
            String url = amapConfig.getBaseUrl() + "/geocode/regeo"
                    + "?key=" + amapConfig.getKey()
                    + "&location=" + location
                    + "&extensions=base";

            String response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return objectMapper.readTree(response);
        } catch (Exception e) {
            log.error("Amap regeocode error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 获取 POI 详情
     */
    public JsonNode searchDetail(String poiId) {
        try {
            String url = amapConfig.getBaseUrl() + "/place/detail"
                    + "?key=" + amapConfig.getKey()
                    + "&id=" + poiId
                    + "&extensions=all";

            String response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return objectMapper.readTree(response);
        } catch (Exception e) {
            log.error("Amap searchDetail error: {}", e.getMessage());
            return null;
        }
    }
}
