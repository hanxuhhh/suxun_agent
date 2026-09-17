package com.example.translate.controller;

import com.example.translate.common.Result;
import com.example.translate.dto.TranslateRequest;
import com.example.translate.dto.TranslateResponse;
import com.example.translate.service.TranslateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "翻译接口")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TranslateController {

    private final TranslateService translateService;

    @Operation(summary = "翻译文本")
    @PostMapping("/translate")
    public Result<TranslateResponse> translate(@Valid @RequestBody TranslateRequest request) {
        TranslateResponse response = translateService.translate(request);
        return Result.success(response);
    }
}
