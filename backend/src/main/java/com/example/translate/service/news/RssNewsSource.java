package com.example.translate.service.news;

import com.example.translate.model.NewsItem;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class RssNewsSource {

    @Autowired
    private NewsClassifier classifier;

    private static final List<String[]> RSS_SOURCES = Arrays.asList(
            // 科技 - IT之家
            new String[]{"IT之家", "https://www.ithome.com/rss/", "tech"},
            // 科技 - 少数派
            new String[]{"少数派", "https://sspai.com/feed", "tech"},
            // 科技 - Hacker News
            new String[]{"HackerNews", "https://hnrss.org/frontpage", "tech"},
            // 科技 - 纽约时报科技
            new String[]{"NYT 科技", "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", "tech"},
            // 科学 - ScienceDaily
            new String[]{"ScienceDaily", "https://www.sciencedaily.com/rss/all.xml", "science"},
            // 国际 - NPR World
            new String[]{"NPR World", "https://feeds.npr.org/1004/rss.xml", "international"},
            // 科学 - NASA
            new String[]{"NASA", "https://www.nasa.gov/news-release/feed/", "science"},
            // NBA - ESPN（官方实时新闻）
            new String[]{"ESPN NBA", "https://www.espn.com/espn/rss/nba/news", "nba"},
            // NBA - Yahoo Sports（纯 NBA 内容，更新频繁）
            new String[]{"Yahoo NBA", "https://sports.yahoo.com/nba/rss/", "nba"},
            // 社会 - 中新网滚动新闻（中文实时社会/民生新闻）
            new String[]{"中新网", "https://www.chinanews.com.cn/rss/scroll-news.xml", "society"}
    );

    /** RSS 源数量（供统计展示） */
    public int sourceCount() {
        return RSS_SOURCES.size();
    }

    public List<NewsItem> fetchAll() {
        List<NewsItem> result = new ArrayList<>();
        for (String[] source : RSS_SOURCES) {
            try {
                List<NewsItem> items = fetchRss(source[0], source[1], source[2]);
                result.addAll(items);
                log.info("Fetched {} items from {}", items.size(), source[0]);
            } catch (Exception e) {
                log.warn("Failed to fetch RSS from {}: {}", source[0], e.getMessage());
            }
        }
        return result;
    }

    private List<NewsItem> fetchRss(String sourceName, String rssUrl, String defaultCategory) {
        List<NewsItem> items = new ArrayList<>();
        try {
            // Set User-Agent to avoid 403 blocks
            java.net.URLConnection conn = new URL(rssUrl).openConnection();
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(10000);

            SyndFeedInput input = new SyndFeedInput();
            SyndFeed feed = input.build(new XmlReader(conn.getInputStream()));

            for (SyndEntry entry : feed.getEntries()) {
                String title = entry.getTitle() != null ? entry.getTitle().trim() : "";
                String summary = entry.getDescription() != null
                        ? stripHtml(entry.getDescription().getValue()) : "";
                if (title.isEmpty()) continue;
                // Skip entries that look like navigation/homepage links (too short or no summary)
                if (title.length() < 10 && summary.isEmpty()) continue;

                // 关键词匹配不到时，按源自身的主题归档（源的分类是确定的）
                String category = classifier.classify(title, summary);
                if (category == null) category = defaultCategory;

                String importance = classifier.detectImportance(title);

                LocalDateTime pubTime = LocalDateTime.now();
                Date pubDate = entry.getPublishedDate();
                if (pubDate != null) {
                    pubTime = pubDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
                }

                // Try to extract image from content
                String imageUrl = extractImage(entry, category);

                NewsItem item = NewsItem.builder()
                        .id("rss-" + UUID.randomUUID().toString().substring(0, 8))
                        .title(title)
                        .summary(summary.length() > 200 ? summary.substring(0, 200) + "..." : summary)
                        .category(category)
                        .importance(importance)
                        .source(sourceName)
                        .imageUrl(imageUrl)
                        .link(entry.getLink())
                        .publishTime(pubTime)
                        .tags(Collections.singletonList(sourceName))
                        .build();
                items.add(item);
            }
        } catch (Exception e) {
            log.error("RSS parse error for {}: {}", rssUrl, e.getMessage());
        }
        return items;
    }

    private String extractImage(SyndEntry entry, String category) {
        // Try media:thumbnail or enclosure
        try {
            if (entry.getEnclosures() != null && !entry.getEnclosures().isEmpty()) {
                String url = entry.getEnclosures().get(0).getUrl();
                if (url != null && (url.contains(".jpg") || url.contains(".png") || url.contains(".jpeg") || url.contains(".webp"))) {
                    return url;
                }
            }
            // Try to extract from description HTML
            if (entry.getDescription() != null) {
                String desc = entry.getDescription().getValue();
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("src=[\"'](https?://[^\"']+\\.(jpg|jpeg|png|webp))[\"']").matcher(desc);
                if (m.find()) return m.group(1);
            }
        } catch (Exception ignored) {}
        return getDefaultImage(category);
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]+>", "").trim();
    }

    private String getDefaultImage(String category) {
        switch (category) {
            case "ai": return "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80";
            case "tech": return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80";
            case "finance": return "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80";
            case "science": return "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80";
            case "international": return "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&q=80";
            case "nba": return "https://images.unsplash.com/photo-1546519638405-a4c2ac78ebb9?w=400&q=80";
            default: return "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80";
        }
    }
}
