package com.example.translate.service.news;

import com.example.translate.model.NewsItem;
import com.example.translate.model.NewsResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class NewsAggregatorService {

    @Autowired
    private MockNewsSource mockNewsSource;

    @Autowired
    private RssNewsSource rssNewsSource;

    // In-memory store updated by scheduler
    private volatile List<NewsItem> cachedNews = new ArrayList<>();
    private volatile LocalDateTime lastUpdate = LocalDateTime.now();
    private volatile int activeSourceCount = 0;

    /** 新闻新鲜度窗口：超过 30 天的旧闻直接丢弃，避免陈年数据污染列表 */
    private static final int FRESHNESS_DAYS = 30;

    @PostConstruct
    public void init() {
        refresh();
    }

    @Scheduled(fixedRate = 600_000) // every 10 minutes
    @CacheEvict(value = "news", allEntries = true)
    public void refresh() {
        log.info("Refreshing news data...");
        List<NewsItem> merged = new ArrayList<>();

        // 1. Try RSS sources
        int rssCount = 0;
        try {
            List<NewsItem> rssItems = rssNewsSource.fetchAll();
            merged.addAll(rssItems);
            rssCount = rssItems.size();
            log.info("RSS fetched {} items", rssItems.size());
        } catch (Exception e) {
            log.warn("RSS fetch failed: {}", e.getMessage());
        }

        // 2. RSS 全部失败时才用 mock 数据兑底，避免一年前的假旧闻常年霸占列表
        if (rssCount == 0) {
            List<NewsItem> mockItems = mockNewsSource.getNews();
            merged.addAll(mockItems);
            log.warn("RSS empty, falling back to {} mock items", mockItems.size());
        }

        // 3. 过滤太久远的旧闻，只保留 FRESHNESS_DAYS 天内的实时新闻
        LocalDateTime freshnessLimit = LocalDateTime.now().minusDays(FRESHNESS_DAYS);
        merged.removeIf(item -> item.getPublishTime() != null
                && item.getPublishTime().isBefore(freshnessLimit));

        // 3. Deduplicate by title similarity (simple)
        Set<String> seen = new java.util.HashSet<>();
        List<NewsItem> deduped = new ArrayList<>();
        for (NewsItem item : merged) {
            String key = item.getTitle().substring(0, Math.min(item.getTitle().length(), 20));
            if (seen.add(key)) {
                deduped.add(item);
            }
        }

        // 4. Sort by publish time descending
        deduped.sort(Comparator.comparing(NewsItem::getPublishTime, Comparator.nullsLast(Comparator.reverseOrder())));

        cachedNews = deduped;
        lastUpdate = LocalDateTime.now();
        activeSourceCount = (int) deduped.stream()
                .map(NewsItem::getSource)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .count();
        log.info("News cache updated with {} items from {} sources", cachedNews.size(), activeSourceCount);
    }

    @Cacheable("news")
    public NewsResponse getNews(String category, String keyword, String sort, int page, int size) {
        List<NewsItem> filtered = cachedNews.stream()
                .filter(item -> category == null || "all".equals(category) || category.equals(item.getCategory()))
                .filter(item -> {
                    if (keyword == null || keyword.trim().isEmpty()) return true;
                    String kw = keyword.toLowerCase();
                    return item.getTitle().toLowerCase().contains(kw)
                            || (item.getSummary() != null && item.getSummary().toLowerCase().contains(kw));
                })
                .collect(Collectors.toList());

        // Sort
        if ("important".equals(sort)) {
            filtered.sort(Comparator.comparing(
                    (NewsItem i) -> "major".equals(i.getImportance()) ? 0 : 1
            ).thenComparing(Comparator.comparing(NewsItem::getPublishTime,
                    Comparator.nullsLast(Comparator.reverseOrder()))));
        }

        // Paginate
        int total = filtered.size();
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, total);
        List<NewsItem> paged = fromIndex >= total ? new ArrayList<>() : filtered.subList(fromIndex, toIndex);

        // Stats
        Map<String, Integer> categoryCount = new HashMap<>();
        cachedNews.forEach(item -> categoryCount.merge(item.getCategory(), 1, Integer::sum));

        long todayCount = cachedNews.stream()
                .filter(item -> item.getPublishTime() != null
                        && item.getPublishTime().toLocalDate().equals(LocalDateTime.now().toLocalDate()))
                .count();

        return NewsResponse.builder()
                .items(paged)
                .categoryCount(categoryCount)
                .totalToday((int) todayCount)
                .sourceCount(activeSourceCount)
                .lastUpdate(lastUpdate)
                .build();
    }

    public Map<String, Object> getStats() {
        Map<String, Integer> categoryCount = new HashMap<>();
        cachedNews.forEach(item -> categoryCount.merge(item.getCategory(), 1, Integer::sum));

        long todayCount = cachedNews.stream()
                .filter(item -> item.getPublishTime() != null
                        && item.getPublishTime().toLocalDate().equals(LocalDateTime.now().toLocalDate()))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalToday", (int) todayCount);
        stats.put("total", cachedNews.size());
        stats.put("lastUpdate", lastUpdate);
        stats.put("sourceCount", activeSourceCount);
        stats.put("categoryCount", categoryCount);
        return stats;
    }
}
