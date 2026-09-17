package com.example.translate.controller;

import com.example.translate.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "模型接口")
@RestController
@RequestMapping("/api")
public class ModelController {

    @Operation(summary = "获取支持的模型列表")
    @GetMapping("/models")
    public Result<List<Map<String, Object>>> getModels() {
        List<Map<String, Object>> models = List.of(
                Map.of(
                        "provider", "Groq (免费)",
                        "models", List.of(
                                Map.of("id", "openai/gpt-oss-120b", "name", "GPT-OSS 120B (推荐)"),
                                Map.of("id", "openai/gpt-oss-20b", "name", "GPT-OSS 20B (极速)"),
                                Map.of("id", "groq/compound-mini", "name", "Compound Mini"),
                                Map.of("id", "qwen/qwen3.8-27b", "name", "Qwen 3.8 27B")
                        )
                ),
                Map.of(
                        "provider", "DeepSeek",
                        "models", List.of(
                                Map.of("id", "deepseek-chat", "name", "DeepSeek V3 (Chat)"),
                                Map.of("id", "deepseek-reasoner", "name", "DeepSeek R1 (Reasoner)")
                        )
                ),
                Map.of(
                        "provider", "OpenAI",
                        "models", List.of(
                                Map.of("id", "gpt-4o", "name", "GPT-4o"),
                                Map.of("id", "gpt-4o-mini", "name", "GPT-4o Mini"),
                                Map.of("id", "gpt-3.5-turbo", "name", "GPT-3.5 Turbo")
                        )
                )
        );
        return Result.success(models);
    }

    @GetMapping("/hello")
    public String hello() {
        return "Hello World from AI Translation Platform!";
    }
}
