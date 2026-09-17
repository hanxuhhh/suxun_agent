package com.example.translate.controller;

import com.example.translate.common.Result;
import com.example.translate.service.groq.GroqClient;
import com.example.translate.service.writing.WritingService;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Tag(name = "写作练习接口")
@RestController
@RequestMapping("/api/writing")
public class WritingController {

    @Autowired
    private WritingService writingService;

    @Autowired
    private GroqClient groqClient;

    @Operation(summary = "写作题库（BEC 商务写作题型）")
    @GetMapping("/topics")
    public Result<List<Map<String, Object>>> topics() {
        return Result.success(writingService.listTopics());
    }

    @Operation(summary = "题目详情")
    @GetMapping("/topics/{id}")
    public Result<Map<String, Object>> topic(@PathVariable String id) {
        Map<String, Object> t = writingService.getTopic(id);
        if (t == null) return Result.error(404, "题目不存在");
        return Result.success(t);
    }

    /**
     * 作文批改。body: { topicId, content }
     * 返回内容/语言/组织三维度分数 + 点评 + 改写示例 + 建议。
     */
    @Operation(summary = "提交作文 AI 批改（BEC 评分标准）")
    @PostMapping("/evaluate")
    public Result<Map<String, Object>> evaluate(@RequestBody Map<String, String> body) {
        String topicId = body.get("topicId");
        String content = body.get("content");
        if (topicId == null || content == null || content.trim().isEmpty()) {
            return Result.error(400, "topicId 和 content 不能为空");
        }
        Map<String, Object> topic = writingService.getTopic(topicId);
        if (topic == null) return Result.error(404, "题目不存在");

        int wordCount = content.trim().split("\\s+").length;
        if (wordCount < 20) {
            return Result.error(400, "作文太短（少于 20 词），请认真作答后再提交");
        }

        String userContent = "Writing task (" + topic.get("typeName") + "):\n" + topic.get("prompt")
                + "\nSuggested word limit: around " + topic.get("wordLimit") + " words."
                + "\n\nCandidate's writing:\n" + content;

        JsonNode result = groqClient.chatJson(
                writingService.evaluateSystemPrompt(), userContent, WritingService.MODEL);

        if (result == null || !result.has("overall")) {
            return Result.error(500, "批改失败，请重试");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("content", dim(result.path("content")));
        data.put("language", dim(result.path("language")));
        data.put("organization", dim(result.path("organization")));
        data.put("overall", clampScore(result.path("overall").asInt(0)));
        data.put("improved", result.path("improved").asText(""));
        List<String> suggestions = new ArrayList<>();
        if (result.path("suggestions").isArray()) {
            result.path("suggestions").forEach(n -> suggestions.add(n.asText()));
        }
        data.put("suggestions", suggestions);
        data.put("wordCount", wordCount);
        return Result.success(data);
    }

    private Map<String, Object> dim(JsonNode node) {
        Map<String, Object> m = new HashMap<>();
        m.put("score", clampScore(node.path("score").asInt(0)));
        m.put("comment", node.path("comment").asText(""));
        return m;
    }

    private int clampScore(int v) {
        return Math.max(0, Math.min(100, v));
    }
}
