package com.example.translate.dto.vocab;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * BEC 词条详情
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VocabWord {

    private String word;
    private String ukPhone;
    private String usPhone;
    /** 释义（含中英） */
    private List<Translation> translations;
    /** 例句（中英对照） */
    private List<Sentence> sentences;
    /** 常用短语 */
    private List<Phrase> phrases;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Translation {
        /** 词性，如 n. / v. */
        private String pos;
        /** 中文释义 */
        private String cn;
        /** 英文释义 */
        private String en;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Sentence {
        private String en;
        private String cn;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Phrase {
        private String en;
        private String cn;
    }
}
