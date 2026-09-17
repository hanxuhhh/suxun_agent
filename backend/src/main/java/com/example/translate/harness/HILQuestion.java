package com.example.translate.harness;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * HIL（Human-in-Loop）问题事件，后端推给前端
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HILQuestion {

    public enum QuestionType { SELECT, MULTI_SELECT, TEXT, CONFIRM }

    private String id;          // 问题唯一 ID，前端回传时携带
    private QuestionType type;
    private String prompt;      // 问题文本
    private List<Option> options; // SELECT / MULTI_SELECT 时的选项
    private boolean required;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Option {
        private String label;
        private String value;
    }
}
