package com.example.translate.skills.food;

import com.example.translate.harness.AgentEvent;
import com.example.translate.harness.AgentSession;
import com.example.translate.harness.HILQuestion;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

/**
 * State 1: 获取位置
 * 策略：IP 定位 → 失败则 HIL 询问城市
 */
@Slf4j
public class GetLocationState {

    private static final String IP_API = "http://ip-api.com/json/?lang=zh-CN&fields=status,lat,lon,city";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public String execute(AgentSession session) throws Exception {
        // 已有坐标则跳过
        if (session.getMemory("lng") != null) {
            return "collectPrefs";
        }

        session.emit(AgentEvent.builder()
                .type(AgentEvent.EventType.TEXT)
                .text("📍 正在获取你的位置...")
                .build());

        // 1. IP 定位
        try {
            String json = httpGet(IP_API);
            JsonNode node = MAPPER.readTree(json);
            if ("success".equals(node.path("status").asText())) {
                double lat = node.path("lat").asDouble();
                double lon = node.path("lon").asDouble();
                String city = node.path("city").asText("未知城市");

                // 粗略判断是否国内坐标
                boolean inChina = lat > 18 && lat < 54 && lon > 73 && lon < 136;
                if (inChina) {
                    session.setMemory("lng", lon);
                    session.setMemory("lat", lat);
                    session.setMemory("city", city);
                    session.emit(AgentEvent.builder()
                            .type(AgentEvent.EventType.TEXT)
                            .text("✅ 已定位到：" + city)
                            .build());
                    return "collectPrefs";
                }
            }
        } catch (Exception e) {
            log.warn("IP location failed: {}", e.getMessage());
        }

        // 2. IP 定位失败，HIL 询问城市
        session.emit(AgentEvent.builder()
                .type(AgentEvent.EventType.TEXT)
                .text("无法自动获取位置，请告诉我你在哪个城市？（例如：北京朝阳区）")
                .build());

        HILQuestion question = HILQuestion.builder()
                .id("location")
                .type(HILQuestion.QuestionType.TEXT)
                .prompt("请输入你的城市或地区")
                .required(true)
                .build();

        session.emit(AgentEvent.builder()
                .type(AgentEvent.EventType.HIL)
                .question(question)
                .build());

        String answer = session.waitHilAnswer();
        if (answer == null || answer.trim().isEmpty()) {
            session.emit(AgentEvent.builder()
                    .type(AgentEvent.EventType.ERROR)
                    .text("未收到位置信息，请重新开始")
                    .build());
            return "END";
        }

        // 地理编码
        try {
            String geoUrl = "https://restapi.amap.com/v3/geocode/geo?key=" +
                    session.getMemory("amapKey") + "&address=" +
                    java.net.URLEncoder.encode(answer.trim(), "UTF-8");
            String geoJson = httpGet(geoUrl);
            JsonNode geo = MAPPER.readTree(geoJson);
            if ("1".equals(geo.path("status").asText())) {
                JsonNode geocodes = geo.path("geocodes");
                if (geocodes.isArray() && geocodes.size() > 0) {
                    String location = geocodes.get(0).path("location").asText();
                    String[] parts = location.split(",");
                    session.setMemory("lng", Double.parseDouble(parts[0]));
                    session.setMemory("lat", Double.parseDouble(parts[1]));
                    session.setMemory("city", answer.trim());
                    session.emit(AgentEvent.builder()
                            .type(AgentEvent.EventType.TEXT)
                            .text("✅ 已定位到：" + answer.trim())
                            .build());
                    return "collectPrefs";
                }
            }
        } catch (Exception e) {
            log.warn("Geocode failed: {}", e.getMessage());
        }

        session.emit(AgentEvent.builder()
                .type(AgentEvent.EventType.ERROR)
                .text("无法解析该地址，请重新开始并输入更具体的城市名")
                .build());
        return "END";
    }

    private String httpGet(String urlStr) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);
        conn.setRequestProperty("User-Agent", "Mozilla/5.0");
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            return reader.lines().collect(Collectors.joining());
        } finally {
            conn.disconnect();
        }
    }
}
