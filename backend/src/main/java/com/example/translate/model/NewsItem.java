package com.example.translate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsItem {
    private String id;
    private String title;
    private String summary;
    private String category;      // tech / finance / international / society / ai / science
    private String importance;    // major / normal
    private String source;
    private String imageUrl;
    private String link;
    private LocalDateTime publishTime;
    private List<String> tags;
}
