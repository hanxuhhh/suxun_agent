package com.example.translate.harness;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * SSE 事件，后端 → 前端
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentEvent {

    public enum EventType {
        TEXT,       // 普通文本消息
        HIL,        // Human-in-Loop 问题，等待用户回答
        CARD,       // 结构化卡片数据（餐厅列表等）
        ACTIONS,    // 可选后续操作按钮
        ERROR,      // 错误信息
        DONE        // 本轮结束
    }

    private EventType type;
    private String text;            // TEXT / ERROR 时使用
    private HILQuestion question;   // HIL 时使用
    private List<?> cards;          // CARD 时使用
    private List<String> actions;   // ACTIONS 时使用
}
