package com.example.translate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class TranslateApplication {
    public static void main(String[] args) {
        SpringApplication.run(TranslateApplication.class, args);
    }
}
