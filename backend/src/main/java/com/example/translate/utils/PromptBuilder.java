package com.example.translate.utils;

import org.springframework.stereotype.Component;

@Component
public class PromptBuilder {

    public String build(String text, String sourceLang, String targetLang, String style) {
        String sourceLangName = "zh".equals(sourceLang) ? "中文" : "英文";
        String targetLangName = "zh".equals(targetLang) ? "中文" : "英文";
        String styleDesc = getStyleDescription(style);

        return String.format(
                "你是一名专业翻译。请将以下%s翻译成%s，要求风格：%s。\n只返回翻译结果，不要解释，不要添加任何额外内容。\n\n待翻译文本：\n%s",
                sourceLangName, targetLangName, styleDesc, text
        );
    }

    private String getStyleDescription(String style) {
        switch (style) {
            case "business": return "商务正式，措辞专业、规范，适合商业场景";
            case "literary": return "文学优美，语言流畅、优雅，富有文学色彩";
            case "academic": return "学术严谨，用词精准、客观，符合学术规范";
            default: return "地道口语，自然流畅，符合母语者日常表达习惯";
        }
    }
}
