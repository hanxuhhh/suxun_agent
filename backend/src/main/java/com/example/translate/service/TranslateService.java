package com.example.translate.service;

import com.example.translate.dto.TranslateRequest;
import com.example.translate.dto.TranslateResponse;

public interface TranslateService {
    TranslateResponse translate(TranslateRequest request);
}
