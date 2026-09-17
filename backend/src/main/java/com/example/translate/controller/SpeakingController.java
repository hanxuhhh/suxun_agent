package com.example.translate.controller;

import com.example.translate.common.Result;
import com.example.translate.service.groq.GroqClient;
import com.example.translate.service.speaking.SpeakingService;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Tag(name = "口语练习接口")
@RestController
@RequestMapping("/api/speaking")
public class SpeakingController {

    @Autowired
    private SpeakingService speakingService;

    @Autowired
    private GroqClient groqClient;

    @Operation(summary = "口语场景列表（BEC 商务场景）")
    @GetMapping("/scenarios")
    public Result<List<Map<String, Object>>> scenarios() {
        return Result.success(speakingService.listScenarios());
    }

    @Operation(summary = "跟读句子（随机抽取）")
    @GetMapping("/sentences")
    public Result<List<String>> sentences(@RequestParam(defaultValue = "5") int count) {
        return Result.success(speakingService.randomSentences(count));
    }

    /**
     * 场景对话（SSE 流式）。body: { scenarioId, messages: [{role, content}] }
     * AI 扮演 BEC 口语考官/商务对手，前端 TTS 播放考官台词。
     */
    @Operation(summary = "场景对话（SSE 流式，AI 扮演考官）")
    @PostMapping(value = "/practice", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> practice(@RequestBody Map<String, Object> body) {
        String scenarioId = (String) body.getOrDefault("scenarioId", "interview");
        Map<String, Object> scenario = speakingService.getScenario(scenarioId);
        String systemPrompt = scenario != null
                ? (String) scenario.get("systemPrompt")
                : (String) speakingService.getScenario("interview").get("systemPrompt");

        @SuppressWarnings("unchecked")
        List<Map<String, String>> messages = (List<Map<String, String>>) body.get("messages");

        return groqClient.chatStream(systemPrompt, messages, SpeakingService.MODEL);
    }

    /**
     * 语音转写。multipart 音频文件（webm/ogg/mp3/wav/m4a），
     * 返回 Whisper 识别文本，供前端跟读打分使用。
     */
    @Operation(summary = "语音转写（Whisper）")
    @PostMapping("/transcribe")
    public Result<Map<String, String>> transcribe(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return Result.error(400, "音频文件不能为空");
        }
        try {
            String filename = file.getOriginalFilename();
            if (filename == null || !filename.contains(".")) {
                filename = "audio.webm";
            }
            String text = groqClient.transcribe(file.getBytes(), filename);
            Map<String, String> data = new HashMap<>();
            data.put("text", text);
            return Result.success(data);
        } catch (Exception e) {
            log.warn("transcribe failed: {}", e.getMessage());
            return Result.error(500, "语音转写失败: " + e.getMessage());
        }
    }

    /**
     * 跟读评测。body: { sentence, transcription }
     * 返回 accuracy/fluency/overall 分数 + 中文点评。
     */
    @Operation(summary = "跟读评测（对比原句打分）")
    @PostMapping("/evaluate")
    public Result<Map<String, Object>> evaluate(@RequestBody Map<String, String> body) {
        String sentence = body.get("sentence");
        String transcription = body.get("transcription");
        if (sentence == null || sentence.trim().isEmpty() || transcription == null || transcription.trim().isEmpty()) {
            return Result.error(400, "sentence 和 transcription 不能为空");
        }

        String userContent = "Original sentence: \"" + sentence + "\"\n"
                + "Candidate's spoken transcription: \"" + transcription + "\"";
        JsonNode result = groqClient.chatJson(
                speakingService.evaluateSystemPrompt(), userContent, SpeakingService.MODEL);

        if (result == null || !result.has("overall")) {
            return Result.error(500, "评测失败，请重试");
        }
        Map<String, Object> data = new HashMap<>();
        data.put("accuracy", clampScore(result.path("accuracy").asInt(0)));
        data.put("fluency", clampScore(result.path("fluency").asInt(0)));
        data.put("overall", clampScore(result.path("overall").asInt(0)));
        data.put("feedback", result.path("feedback").asText(""));
        return Result.success(data);
    }

    private int clampScore(int v) {
        return Math.max(0, Math.min(100, v));
    }
}
