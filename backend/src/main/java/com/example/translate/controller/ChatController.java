package com.example.translate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@Tag(name = "聊天接口")
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ObjectMapper objectMapper;

    @Value("${ai.groq.api-key:}")
    private String groqApiKey;

    @Value("${ai.groq.base-url:https://api.groq.com/openai}")
    private String groqBaseUrl;

    @Value("${ai.deepseek.api-key:}")
    private String deepseekApiKey;

    @Value("${ai.openai.api-key:}")
    private String openaiApiKey;

    public ChatController(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Operation(summary = "流式聊天 (SSE)")
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatStream(@RequestBody Map<String, Object> body) {
        String model = (String) body.getOrDefault("model", "openai/gpt-oss-120b");
        @SuppressWarnings("unchecked")
        List<Map<String, String>> messages = (List<Map<String, String>>) body.get("messages");

        String apiUrl = resolveApiUrl(model);
        String apiKey = resolveApiKey(model);
        String actualModel = resolveActualModel(model);

        ObjectNode reqBody = objectMapper.createObjectNode();
        reqBody.put("model", actualModel);
        reqBody.put("stream", true);
        ArrayNode msgArray = reqBody.putArray("messages");
        if (messages != null) {
            for (Map<String, String> m : messages) {
                ObjectNode msg = msgArray.addObject();
                msg.put("role", m.getOrDefault("role", "user"));
                msg.put("content", m.getOrDefault("content", ""));
            }
        }

        final String requestJson;
        try {
            requestJson = objectMapper.writeValueAsString(reqBody);
        } catch (Exception e) {
            return Flux.just("[DONE]");
        }

        return Flux.create(sink -> {
            Thread thread = new Thread(() -> {
                try {
                    URL url = new URL(apiUrl);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setDoOutput(true);
                    conn.setConnectTimeout(10000);
                    conn.setReadTimeout(60000);
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("Authorization", "Bearer " + apiKey);
                    conn.setRequestProperty("Accept", "text/event-stream");

                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(requestJson.getBytes(StandardCharsets.UTF_8));
                    }

                    try (BufferedReader reader = new BufferedReader(
                            new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            if (line.startsWith("data: ")) {
                                String data = line.substring(6).trim();
                                if (!data.isEmpty()) {
                                    sink.next(data);
                                }
                            }
                        }
                    }
                    conn.disconnect();
                    sink.complete();
                } catch (Exception e) {
                    log.warn("chat stream error: {}", e.getMessage());
                    sink.next("[DONE]");
                    sink.complete();
                }
            });
            thread.setDaemon(true);
            thread.start();
        }, FluxSink.OverflowStrategy.BUFFER);
    }

    private String resolveApiUrl(String model) {
        if (model.startsWith("gpt")) return "https://api.openai.com/v1/chat/completions";
        if (model.startsWith("deepseek")) return "https://api.deepseek.com/chat/completions";
        return groqBaseUrl + "/v1/chat/completions";
    }

    private String resolveApiKey(String model) {
        if (model.startsWith("gpt")) return openaiApiKey;
        if (model.startsWith("deepseek")) return deepseekApiKey;
        return groqApiKey;
    }

    private String resolveActualModel(String model) {
        if ("deepseek-chat".equals(model) || "deepseek-v3".equals(model)) return "deepseek-chat";
        if ("deepseek-reasoner".equals(model)) return "deepseek-reasoner";
        return model;
    }
}
