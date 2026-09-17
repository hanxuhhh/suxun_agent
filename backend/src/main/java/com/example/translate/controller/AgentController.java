package com.example.translate.controller;

import com.example.translate.common.Result;
import com.example.translate.harness.AgentEngine;
import com.example.translate.harness.AgentEvent;
import com.example.translate.harness.AgentSession;
import com.example.translate.harness.ISkill;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Tag(name = "Harness Agent 接口")
@RestController
@RequestMapping("/api/agent")
public class AgentController {

    @Autowired
    private AgentEngine agentEngine;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** sessionId → SseEmitter */
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    // ── 1. 获取可用 Skill 列表 ──────────────────────────────

    @Operation(summary = "获取 Skill 列表")
    @GetMapping("/skills")
    public Result<List<Map<String, String>>> listSkills() {
        List<Map<String, String>> list = agentEngine.listSkills().stream()
                .map(s -> Map.of("id", s.getId(), "name", s.getName()))
                .collect(Collectors.toList());
        return Result.success(list);
    }

    // ── 2. 启动 Agent 会话 ──────────────────────────────────

    @Operation(summary = "启动 Agent 会话")
    @PostMapping("/start")
    public Result<Map<String, String>> start(@RequestBody Map<String, String> body) {
        String skillId   = body.getOrDefault("skillId", "food-recommendation");
        String userInput = body.get("userInput"); // 可为 null

        String sessionId = agentEngine.startSession(skillId, userInput);
        return Result.success(Map.of("sessionId", sessionId));
    }

    // ── 3. SSE 事件流 ───────────────────────────────────────

    @Operation(summary = "SSE 事件流（订阅 Agent 输出）")
    @GetMapping(value = "/stream/{sessionId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable String sessionId) {
        SseEmitter emitter = new SseEmitter(120_000L); // 2分钟超时
        emitters.put(sessionId, emitter);

        emitter.onCompletion(() -> emitters.remove(sessionId));
        emitter.onTimeout(() -> emitters.remove(sessionId));
        emitter.onError(e -> emitters.remove(sessionId));

        // 启动一个线程从队列读事件推送 SSE
        AgentSession session;
        try {
            session = agentEngine.getSession(sessionId);
        } catch (Exception e) {
            emitter.completeWithError(e);
            return emitter;
        }

        Thread thread = new Thread(() -> {
            try {
                while (true) {
                    // 从队列取事件（阻塞最多100秒）
                    AgentEvent event = session.getEventQueue().poll(100, java.util.concurrent.TimeUnit.SECONDS);
                    if (event == null) {
                        emitter.complete();
                        break;
                    }
                    pushEvent(emitter, event);
                    if (event.getType() == AgentEvent.EventType.DONE) {
                        emitter.complete();
                        break;
                    }
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                emitter.complete();
            } catch (Exception e) {
                log.error("SSE stream error [{}]: {}", sessionId, e.getMessage());
                emitter.completeWithError(e);
            }
        });
        thread.setDaemon(true);
        thread.setName("sse-" + sessionId);
        thread.start();

        return emitter;
    }

    // ── 4. 接收用户消息 ─────────────────────────────────────

    @Operation(summary = "发送用户消息（HIL 回答或追问）")
    @PostMapping("/message")
    public Result<String> message(@RequestBody Map<String, String> body) {
        String sessionId = body.get("sessionId");
        String content   = body.get("content");
        if (sessionId == null || content == null) {
            return Result.error(400, "sessionId 和 content 不能为空");
        }
        agentEngine.sendMessage(sessionId, content);
        return Result.success("ok");
    }

    // ── 内部工具 ─────────────────────────────────────────────

    private void pushEvent(SseEmitter emitter, AgentEvent event) {
        try {
            String json = objectMapper.writeValueAsString(event);
            emitter.send(SseEmitter.event()
                    .name(event.getType().name().toLowerCase())
                    .data(json));
        } catch (IOException e) {
            log.warn("push SSE event failed: {}", e.getMessage());
        }
    }
}
