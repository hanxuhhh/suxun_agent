package com.example.translate.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TranslateResponse {
    private String translatedText;
    private String model;
    private long duration;
}
