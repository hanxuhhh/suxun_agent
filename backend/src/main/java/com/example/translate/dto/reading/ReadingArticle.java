package com.example.translate.dto.reading;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 阅读板块文章（商务英语向 RSS 聚合）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingArticle {

    private String id;
    private String title;
    /** 摘要（较新闻模块更长，适合阅读） */
    private String summary;
    private String source;
    private String imageUrl;
    private String link;
    private LocalDateTime publishTime;
    private String category;
}
