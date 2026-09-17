package com.example.translate.harness;

import lombok.Data;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * Agent 会话上下文 —— 跨状态共享
 */
@Data
public class AgentSession {

    private final String sessionId;
    private String currentState;
    private String skillId;

    /** 已填充的槽位 key → value */
    private final Map<String, Object> slots = new HashMap<>();

    /** 临时内存（坐标、搜索结果等） */
    private final Map<String, Object> memory = new HashMap<>();

    /** 消息历史（用于前端渲染） */
    private final List<AgentEvent> history = new ArrayList<>();

    /** SSE 事件队列：状态机向此队列写入，SSE 线程从此读取推送给前端 */
    private final BlockingQueue<AgentEvent> eventQueue = new LinkedBlockingQueue<>();

    /** 等待 HIL 回答的阻塞队列（每次 HIL 只有一个问题在等） */
    private final BlockingQueue<String> hilAnswerQueue = new LinkedBlockingQueue<>(1);

    /** 是否已结束 */
    private volatile boolean finished = false;

    public AgentSession(String sessionId) {
        this.sessionId = sessionId;
    }

    // ── 便捷方法 ──────────────────────────────────

    public void setSlot(String key, Object value) {
        slots.put(key, value);
    }

    public Object getSlot(String key) {
        return slots.get(key);
    }

    public String getSlotStr(String key) {
        Object v = slots.get(key);
        return v == null ? null : v.toString();
    }

    public void setMemory(String key, Object value) {
        memory.put(key, value);
    }

    @SuppressWarnings("unchecked")
    public <T> T getMemory(String key) {
        return (T) memory.get(key);
    }

    /** 推送事件到 SSE 队列，同时记入历史 */
    public void emit(AgentEvent event) {
        history.add(event);
        eventQueue.offer(event);
    }

    /** 等待用户 HIL 回答（阻塞，最多等60秒） */
    public String waitHilAnswer() throws InterruptedException {
        return hilAnswerQueue.poll(60, java.util.concurrent.TimeUnit.SECONDS);
    }

    /** 用户提交 HIL 回答 */
    public void submitHilAnswer(String answer) {
        hilAnswerQueue.offer(answer);
    }
}
