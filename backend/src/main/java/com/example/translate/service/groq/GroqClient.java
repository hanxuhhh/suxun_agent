package com.example.translate.service.groq;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
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

/**
 * Groq API 通用客户端：
 * 1. chatStream   — SSE 流式对话（口语考官等）
 * 2. chatJson     — 同步对话并解析 JSON 结果（写作批改/跟读评分）
 * 3. transcribe   — Whisper 语音转写（multipart 音频上传）
 */
@Slf4j
@Component
public class GroqClient {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.groq.api-key:}")
    private String apiKey;

    @Value("${ai.groq.base-url:https://api.groq.com/openai}")
    private String baseUrl;

    /** SSE 流式对话。sink 逐条推送 data 原文（不含 "data:" 前缀）。 */
    public Flux<String> chatStream(String systemPrompt, List<Map<String, String>> messages, String model) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        body.put("stream", true);
        ArrayNode arr = body.putArray("messages");
        if (systemPrompt != null && !systemPrompt.isEmpty()) {
            arr.addObject().put("role", "system").put("content", systemPrompt);
        }
        if (messages != null) {
            for (Map<String, String> m : messages) {
                arr.addObject()
                        .put("role", m.getOrDefault("role", "user"))
                        .put("content", m.getOrDefault("content", ""));
            }
        }
        final String requestJson;
        try {
            requestJson = objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            return Flux.just("[DONE]");
        }

        return Flux.create(sink -> {
            Thread thread = new Thread(() -> streamChat(requestJson, sink));
            thread.setDaemon(true);
            thread.start();
        }, FluxSink.OverflowStrategy.BUFFER);
    }

    private void streamChat(String requestJson, FluxSink<String> sink) {
        try {
            HttpURLConnection conn = openPost(baseUrl + "/v1/chat/completions");
            conn.setRequestProperty("Accept", "text/event-stream");
            try (OutputStream os = conn.getOutputStream()) {
                os.write(requestJson.getBytes(StandardCharsets.UTF_8));
            }
            readSseLines(conn, sink);
        } catch (Exception e) {
            log.warn("Groq chat stream error: {}", e.getMessage());
            sink.next("[DONE]");
        } finally {
            sink.complete();
        }
    }

    private void readSseLines(HttpURLConnection conn, FluxSink<String> sink) throws Exception {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.startsWith("data:")) {
                    String data = line.substring(5).trim();
                    if (!data.isEmpty()) sink.next(data);
                }
            }
        }
    }

    /** 同步对话，返回完整回答文本（非流式）。 */
    public String chatCompletion(String systemPrompt, String userContent, String model) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            ArrayNode arr = body.putArray("messages");
            arr.addObject().put("role", "system").put("content", systemPrompt == null ? "" : systemPrompt);
            arr.addObject().put("role", "user").put("content", userContent);
            HttpURLConnection conn = openPost(baseUrl + "/v1/chat/completions");
            try (OutputStream os = conn.getOutputStream()) {
                os.write(objectMapper.writeValueAsBytes(body));
            }
            String resp = readAll(conn);
            JsonNode root = objectMapper.readTree(resp);
            return root.path("choices").path(0).path("message").path("content").asText("");
        } catch (Exception e) {
            log.warn("Groq chat completion error: {}", e.getMessage());
            throw new RuntimeException("AI 调用失败: " + e.getMessage());
        }
    }

    /** 同步对话并解析为 JSON（容忍 ```json 围栏）。失败时返回 null。 */
    public JsonNode chatJson(String systemPrompt, String userContent, String model) {
        try {
            String text = chatCompletion(systemPrompt, userContent, model);
            return parseJson(text);
        } catch (Exception e) {
            log.warn("Groq chat json error: {}", e.getMessage());
            return null;
        }
    }

    private JsonNode parseJson(String text) {
        if (text == null || text.isEmpty()) return null;
        String t = text.trim();
        // 去掉 ```json ... ``` 围栏
        if (t.startsWith("```")) {
            int s = t.indexOf('\n');
            int e = t.lastIndexOf("```");
            if (s > 0 && e > s) t = t.substring(s + 1, e).trim();
        }
        try {
            return objectMapper.readTree(t);
        } catch (Exception e) {
            // 截取首个 { 到最后一个 } 之间再试
            int a = t.indexOf('{');
            int b = t.lastIndexOf('}');
            if (a >= 0 && b > a) {
                try {
                    return objectMapper.readTree(t.substring(a, b + 1));
                } catch (Exception ignored) {
                }
            }
            return null;
        }
    }

    /**
     * Whisper 语音转写。audio: 音频字节；filename/form-data 里的文件名（含扩展名）。
     * 支持 webm/ogg/mp3/wav/m4a 等浏览器 MediaRecorder 常见输出。
     */
    public String transcribe(byte[] audio, String filename) {
        String boundary = "----groq" + System.currentTimeMillis();
        try {
            HttpURLConnection conn = (HttpURLConnection) new URL(baseUrl + "/v1/audio/transcriptions").openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(60000);
            conn.setRequestProperty("Authorization", "Bearer " + apiKey);
            conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);

            String header = "--" + boundary + "\r\n"
                    + "Content-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\n"
                    + "Content-Type: application/octet-stream\r\n\r\n";
            String fileField = "--" + boundary + "\r\n"
                    + "Content-Disposition: form-data; name=\"model\"\r\n\r\n"
                    + "whisper-large-v3\r\n";
            String end = "--" + boundary + "--\r\n";

            try (OutputStream os = conn.getOutputStream()) {
                os.write(header.getBytes(StandardCharsets.UTF_8));
                os.write(audio);
                os.write("\r\n".getBytes(StandardCharsets.UTF_8));
                os.write(fileField.getBytes(StandardCharsets.UTF_8));
                os.write(end.getBytes(StandardCharsets.UTF_8));
            }

            String resp = readAll(conn);
            JsonNode root = objectMapper.readTree(resp);
            return root.path("text").asText("");
        } catch (Exception e) {
            log.warn("Groq transcribe error: {}", e.getMessage());
            throw new RuntimeException("语音转写失败: " + e.getMessage());
        }
    }

    private HttpURLConnection openPost(String urlStr) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(90000);
        conn.setRequestProperty("Content-Type", MediaType.APPLICATION_JSON_VALUE);
        conn.setRequestProperty("Authorization", "Bearer " + apiKey);
        return conn;
    }

    private String readAll(HttpURLConnection conn) throws Exception {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append('\n');
            }
            return sb.toString();
        }
    }
}
