package com.example.translate.controller;

import com.example.translate.common.Result;
import com.example.translate.dto.reading.ReadingArticle;
import com.example.translate.service.groq.GroqClient;
import com.example.translate.service.reading.ReadingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Collections;

@Tag(name = "阅读练习接口")
@RestController
@RequestMapping("/api/reading")
public class ReadingController {

    private static final String MODEL = "openai/gpt-oss-120b";

    @Autowired
    private ReadingService readingService;

    @Autowired
    private GroqClient groqClient;

    @Operation(summary = "商务文章流（图文，分页）")
    @GetMapping("/articles")
    public Result<Map<String, Object>> articles(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int size) {
        Map<String, Object> data = new HashMap<>();
        data.put("items", readingService.list(page, size));
        data.put("total", readingService.total());
        return Result.success(data);
    }

    @Operation(summary = "文章详情")
    @GetMapping("/article/{id}")
    public Result<ReadingArticle> article(@PathVariable String id) {
        ReadingArticle a = readingService.get(id);
        if (a == null) return Result.error(404, "文章不存在或已过期");
        return Result.success(a);
    }

    /**
     * 文章正文段落（抓取原文网页提取，在详情页直接展示，无需跳转）。
     */
    @Operation(summary = "文章正文段落（直接展示，不跳转）")
    @GetMapping("/content/{id}")
    public Result<Map<String, Object>> content(@PathVariable String id) {
        ReadingArticle a = readingService.get(id);
        if (a == null) return Result.error(404, "文章不存在或已过期");
        List<String> paragraphs = readingService.getContent(id);
        // 抓取失败时回退 RSS 摘要
        if (paragraphs.isEmpty() && a.getSummary() != null && !a.getSummary().isEmpty()) {
            paragraphs = java.util.Collections.singletonList(a.getSummary());
        }
        Map<String, Object> data = new HashMap<>();
        data.put("paragraphs", paragraphs);
        data.put("fetchedFrom", paragraphs.isEmpty() ? "none" : "fulltext");
        return Result.success(data);
    }

    /**
     * 逐句 AI 翻译。body: { sentences: ["...", "..."] }
     * 返回 { translations: ["译文1", ...] }，与输入同序同数量。
     */
    @Operation(summary = "逐句 AI 翻译")
    @PostMapping("/translate/sentences")
    public Result<Map<String, Object>> translateSentences(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> sentences = (List<String>) body.get("sentences");
        if (sentences == null || sentences.isEmpty()) {
            return Result.error(400, "sentences 不能为空");
        }
        if (sentences.size() > 12) sentences = sentences.subList(0, 12);

        String userContent;
        try {
            userContent = new com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(java.util.Collections.singletonMap("sentences", sentences));
        } catch (Exception e) {
            return Result.error(500, "参数序列化失败");
        }

        com.fasterxml.jackson.databind.JsonNode result = groqClient.chatJson(
                readingService.sentencesSystemPrompt(), userContent, MODEL);

        List<String> translations = new ArrayList<>();
        if (result != null && result.path("translations").isArray()) {
            result.path("translations").forEach(n -> translations.add(n.asText("")));
        }
        // 数量兜底：AI 返回不齐时补空串，保证下标对齐
        while (translations.size() < sentences.size()) translations.add("");

        Map<String, Object> data = new HashMap<>();
        data.put("translations", translations);
        return Result.success(data);
    }

    /**
     * SSE 流式翻译整篇文章（标题+正文 → 中文）。
     * body: { articleId }
     */
    @Operation(summary = "实时翻译文章（SSE 流式）")
    @PostMapping(value = "/translate", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> translate(@RequestBody Map<String, String> body) {
        String articleId = body.get("articleId");
        ReadingArticle a = readingService.get(articleId);
        if (a == null) return Flux.just("[DONE]");

        return groqClient.chatStream(
                readingService.translateSystemPrompt(),
                java.util.Collections.singletonList(
                        new HashMap<String, String>() {{
                            put("role", "user");
                            put("content", readingService.articleText(a));
                        }}),
                MODEL);
    }
}
