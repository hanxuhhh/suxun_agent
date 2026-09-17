package com.example.translate.service.reading;

import com.example.translate.dto.reading.ReadingArticle;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 阅读文章聚合服务：每 10 分钟刷新商务英语文章缓存
 */
@Slf4j
@Service
public class ReadingService {

    @Autowired
    private ReadingSource readingSource;

    private volatile List<ReadingArticle> cached = new ArrayList<>();

    /** 正文缓存：articleId → 段落列表（避免重复抓取原网页） */
    private final Map<String, List<String>> contentCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        refresh();
    }

    @Scheduled(fixedRate = 600_000)
    public void refresh() {
        try {
            List<ReadingArticle> merged = readingSource.fetchAll();
            // 标题去重
            Set<String> seen = new HashSet<>();
            List<ReadingArticle> deduped = new ArrayList<>();
            for (ReadingArticle a : merged) {
                String key = a.getTitle().substring(0, Math.min(a.getTitle().length(), 30));
                if (seen.add(key)) deduped.add(a);
            }
            // 按时间倒序
            deduped.sort(Comparator.comparing(ReadingArticle::getPublishTime,
                    Comparator.nullsLast(Comparator.reverseOrder())));
            cached = deduped;
            log.info("Reading: cache updated with {} articles", cached.size());
        } catch (Exception e) {
            log.warn("Reading: refresh failed: {}", e.getMessage());
        }
    }

    public List<ReadingArticle> list(int page, int size) {
        int from = Math.max(0, page) * size;
        if (from >= cached.size()) return new ArrayList<>();
        int to = Math.min(from + size, cached.size());
        return new ArrayList<>(cached.subList(from, to));
    }

    public int total() {
        return cached.size();
    }

    public ReadingArticle get(String id) {
        return cached.stream().filter(a -> a.getId().equals(id)).findFirst().orElse(null);
    }

    /** 翻译系统提示（保留段落结构，商务语境） */
    public String translateSystemPrompt() {
        return "You are a professional business English translator for BEC learners. "
                + "Translate the given English news article (title and body) into natural, fluent Chinese. "
                + "Preserve paragraph structure: output the translated title first (prefix 【标题】), "
                + "then the translated body (prefix 【正文】). "
                + "Keep business terminology accurate. Output ONLY the translation, no explanations.";
    }

    /** 逐句翻译系统提示：输入句子数组，输出同序同数量的中文译文数组 */
    public String sentencesSystemPrompt() {
        return "You are a professional business English translator. You will receive a JSON object like "
                + "{\"sentences\":[\"sentence 1\",\"sentence 2\"]}. "
                + "Translate EVERY English sentence into natural, fluent Chinese, keeping business terminology accurate. "
                + "Respond with ONLY a JSON object in this exact format: "
                + "{\"translations\":[\"译文1\",\"译文2\"]} — same order, same count, no extra text.";
    }

    /** 获取正文段落（首次抓取后缓存） */
    public List<String> getContent(String id) {
        List<String> hit = contentCache.get(id);
        if (hit != null) return hit;
        ReadingArticle a = get(id);
        if (a == null || a.getLink() == null) return new ArrayList<>();
        List<String> paragraphs = readingSource.fetchContent(a.getLink());
        if (contentCache.size() > 300) contentCache.clear();
        if (!paragraphs.isEmpty()) contentCache.put(id, paragraphs);
        return paragraphs;
    }

    /** 拼接待翻译原文 */
    public String articleText(ReadingArticle a) {
        return "Title: " + a.getTitle() + "\n\nBody: " + (a.getSummary() == null ? "" : a.getSummary());
    }
}
