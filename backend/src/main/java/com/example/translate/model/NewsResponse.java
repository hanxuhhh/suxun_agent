package com.example.translate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsResponse {
    private List<NewsItem> items;
    private Map<String, Integer> categoryCount;
    private Integer totalToday;
    private Integer sourceCount;
    private LocalDateTime lastUpdate;
}
