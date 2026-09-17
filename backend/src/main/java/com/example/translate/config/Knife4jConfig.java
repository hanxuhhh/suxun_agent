package com.example.translate.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class Knife4jConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AI 翻译平台 API")
                        .description("AI Translation Platform - 支持 DeepSeek / OpenAI 等多种模型")
                        .version("1.0.0"));
    }
}
