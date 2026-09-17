package com.example.translate.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import lombok.Data;

@Data
public class TranslateRequest {

    @NotBlank(message = "翻译文本不能为空")
    @Size(min = 1, max = 5000, message = "翻译文本长度必须在 1-5000 字之间")
    private String text;

    private String sourceLang = "zh";

    private String targetLang = "en";

    private String model = "deepseek-chat";

    private String style = "colloquial";
}
