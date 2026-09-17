package com.example.translate.service.impl;

import com.example.translate.common.BusinessException;
import com.example.translate.dto.TranslateRequest;
import com.example.translate.dto.TranslateResponse;
import com.example.translate.service.TranslateService;
import com.example.translate.utils.PromptBuilder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class TranslateServiceImpl implements TranslateService {

    private final WebClient webClient;
    private final PromptBuilder promptBuilder;
    private final ObjectMapper objectMapper;

    @Value("${ai.deepseek.api-key}")
    private String deepseekApiKey;

    @Value("${ai.deepseek.base-url}")
    private String deepseekBaseUrl;

    @Value("${ai.openai.api-key:}")
    private String openaiApiKey;

    @Value("${ai.openai.base-url:https://api.openai.com}")
    private String openaiBaseUrl;

    @Value("${ai.groq.api-key:}")
    private String groqApiKey;

    @Value("${ai.groq.base-url:https://api.groq.com/openai}")
    private String groqBaseUrl;

    @Override
    public TranslateResponse translate(TranslateRequest request) {
        long startTime = System.currentTimeMillis();
        String prompt = promptBuilder.build(
                request.getText(),
                request.getSourceLang(),
                request.getTargetLang(),
                request.getStyle()
        );

        String modelId = request.getModel();
        String translatedText;

        try {
            // Groq 的模型 ID 以 "openai/"（如 openai/gpt-oss-120b）或厂商前缀开头，走 Groq；
            // 仅 "gpt-xxx"（无斜杠）才是真正的 OpenAI 官方模型
            if (modelId.startsWith("openai/") || modelId.startsWith("llama") || modelId.startsWith("mixtral")
                    || modelId.startsWith("gemma") || modelId.startsWith("groq") || modelId.startsWith("qwen")
                    || modelId.startsWith("allam")) {
                translatedText = callGroq(prompt, modelId);
            } else if (modelId.startsWith("gpt")) {
                translatedText = callOpenAI(prompt, modelId);
            } else {
                // default: DeepSeek
                translatedText = callDeepSeek(prompt, modelId);
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("翻译调用失败", e);
            throw new BusinessException(502, "AI 服务调用失败: " + e.getMessage());
        }

        long duration = System.currentTimeMillis() - startTime;
        return TranslateResponse.builder()
                .translatedText(translatedText)
                .model(modelId)
                .duration(duration)
                .build();
    }

    private String callDeepSeek(String prompt, String model) {
        String actualModel = model;
        // map friendly names to actual API model names
        if ("deepseek-v4-flash".equals(model) || "deepseek-chat".equals(model)) {
            actualModel = "deepseek-chat";
        } else if ("deepseek-v4-pro".equals(model) || "deepseek-reasoner".equals(model)) {
            actualModel = "deepseek-reasoner";
        }

        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", actualModel);
        ArrayNode messages = requestBody.putArray("messages");
        ObjectNode msg = messages.addObject();
        msg.put("role", "user");
        msg.put("content", prompt);
        requestBody.put("stream", false);

        String responseBody = webClient.post()
                .uri(deepseekBaseUrl + "/chat/completions")
                .header("Authorization", "Bearer " + deepseekApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return parseOpenAIResponse(responseBody);
    }

    private String callOpenAI(String prompt, String model) {
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", model);
        ArrayNode messages = requestBody.putArray("messages");
        ObjectNode msg = messages.addObject();
        msg.put("role", "user");
        msg.put("content", prompt);

        String responseBody = webClient.post()
                .uri(openaiBaseUrl + "/v1/chat/completions")
                .header("Authorization", "Bearer " + openaiApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return parseOpenAIResponse(responseBody);
    }

    private String callGroq(String prompt, String model) {
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", model);
        ArrayNode messages = requestBody.putArray("messages");
        ObjectNode msg = messages.addObject();
        msg.put("role", "user");
        msg.put("content", prompt);

        String responseBody = webClient.post()
                .uri(groqBaseUrl + "/v1/chat/completions")
                .header("Authorization", "Bearer " + groqApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return parseOpenAIResponse(responseBody);
    }

    private String parseOpenAIResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            if (root.has("error")) {
                String errorMsg = root.path("error").path("message").asText("未知错误");
                throw new BusinessException(502, "AI 接口错误: " + errorMsg);
            }
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("解析 AI 响应失败, body={}", responseBody, e);
            throw new BusinessException(502, "解析 AI 响应失败");
        }
    }
}
