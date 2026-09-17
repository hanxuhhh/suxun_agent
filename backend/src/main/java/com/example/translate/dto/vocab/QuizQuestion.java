package com.example.translate.dto.vocab;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 单词测验题（四选一）
 * type: cn2en 看中文选英文 / en2cn 看英文选中文 / listen 听音选词
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestion {

    private String type;
    /** 目标单词 */
    private String word;
    /** 题干（listen 类型为空，由前端 TTS 播放 word） */
    private String question;
    private List<Option> options;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Option {
        /** 选项文本 */
        private String text;
        private boolean correct;
    }
}
