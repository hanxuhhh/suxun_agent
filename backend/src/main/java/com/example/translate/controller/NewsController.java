package com.example.translate.controller;

import com.example.translate.common.Result;
import com.example.translate.model.NewsResponse;
import com.example.translate.service.news.NewsAggregatorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "新闻接口")
@RestController
@RequestMapping("/api/news")
public class NewsController {

    @Autowired
    private NewsAggregatorService aggregatorService;

    @Operation(summary = "获取新闻列表")
    @GetMapping("/list")
    public Result<NewsResponse> list(
            @RequestParam(required = false, defaultValue = "all") String category,
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "latest") String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        NewsResponse response = aggregatorService.getNews(category, keyword, sort, page, size);
        return Result.success(response);
    }

    @Operation(summary = "获取统计数据")
    @GetMapping("/stats")
    public Result<Map<String, Object>> stats() {
        return Result.success(aggregatorService.getStats());
    }

    @Operation(summary = "手动刷新新闻缓存")
    @PostMapping("/refresh")
    public Result<String> refresh() {
        aggregatorService.refresh();
        return Result.success("刷新成功");
    }
}
