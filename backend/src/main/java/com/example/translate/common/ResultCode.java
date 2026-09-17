package com.example.translate.common;

import lombok.Getter;

@Getter
public enum ResultCode {
    SUCCESS(0, "success"),
    PARAM_ERROR(400, "参数错误"),
    INTERNAL_ERROR(500, "服务器内部错误"),
    AI_SERVICE_ERROR(502, "AI服务调用失败");

    private final int code;
    private final String message;

    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
