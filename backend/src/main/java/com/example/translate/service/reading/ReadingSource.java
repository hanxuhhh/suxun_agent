package com.example.translate.service.reading;

import com.example.translate.dto.reading.ReadingArticle;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;
import org.jdom2.Element;

import java.net.URL;
import java.net.URLConnection;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

/**
 * 商务英语阅读 RSS 源（BBC/NPR/NYT Business，均已实测可达）
 */
@Slf4j
@Component
public class ReadingSource {

    private static final List<String[]> SOURCES = Arrays.asList(
            new String[]{"BBC Business", "https://feeds.bbci.co.uk/news/business/rss.xml", "business"},
            new String[]{"NPR Business", "https://feeds.npr.org/1006/rss.xml", "business"},
            new String[]{"NYT Business", "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", "business"}
    );

    public List<ReadingArticle> fetchAll() {
        List<ReadingArticle> result = new ArrayList<>();
        for (String[] source : SOURCES) {
            try {
                List<ReadingArticle> items = fetchRss(source[0], source[1]);
                result.addAll(items);
                log.info("Reading: fetched {} items from {}", items.size(), source[0]);
            } catch (Exception e) {
                log.warn("Reading: failed to fetch {}: {}", source[0], e.getMessage());
            }
        }
        return result;
    }

    private List<ReadingArticle> fetchRss(String sourceName, String rssUrl) {
        List<ReadingArticle> items = new ArrayList<>();
        try {
            URLConnection conn = new URL(rssUrl).openConnection();
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(10000);

            SyndFeed feed = new SyndFeedInput().build(new XmlReader(conn.getInputStream()));
            for (SyndEntry entry : feed.getEntries()) {
                String title = entry.getTitle() != null ? entry.getTitle().trim() : "";
                if (title.isEmpty()) continue;
                String summary = entry.getDescription() != null
                        ? stripHtml(entry.getDescription().getValue()) : "";
                if (summary.length() > 600) summary = summary.substring(0, 600) + "...";

                LocalDateTime pubTime = LocalDateTime.now();
                Date pubDate = entry.getPublishedDate();
                if (pubDate != null) {
                    pubTime = pubDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
                }

                items.add(ReadingArticle.builder()
                        .id("rd-" + Math.abs((sourceName + ":" + title).hashCode()))
                        .title(title)
                        .summary(summary)
                        .source(sourceName)
                        .imageUrl(extractImage(entry))
                        .link(entry.getLink())
                        .publishTime(pubTime)
                        .category("business")
                        .build());
            }
        } catch (Exception e) {
            log.error("Reading: RSS parse error for {}: {}", rssUrl, e.getMessage());
        }
        return items;
    }

    /**
     * 图片提取优先级：
     * 1. media:thumbnail / media:content（BBC 等使用，ROME foreignMarkup 可读取）
     * 2. enclosure
     * 3. 描述 HTML 中的 <img src>
     * 4. 默认商务配图
     */
    private String extractImage(SyndEntry entry) {
        try {
            // 1. media rss 命名空间（BBC 等使用）
            for (Element el : entry.getForeignMarkup()) {
                String url = mediaUrl(el);
                if (url != null) return url;
                // 部分源嵌套在 media:group 中
                for (Element child : el.getChildren()) {
                    url = mediaUrl(child);
                    if (url != null) return url;
                }
            }
            // 2. enclosure
            if (entry.getEnclosures() != null && !entry.getEnclosures().isEmpty()) {
                String url = entry.getEnclosures().get(0).getUrl();
                if (url != null && isImageUrl(url)) return url;
            }
            // 3. 描述里的图片
            if (entry.getDescription() != null) {
                java.util.regex.Matcher m = java.util.regex.Pattern
                        .compile("src=[\"'](https?://[^\"']+)[\"']")
                        .matcher(entry.getDescription().getValue());
                if (m.find() && isImageUrl(m.group(1))) return m.group(1);
            }
        } catch (Exception ignored) {
        }
        return "https://images.unsplash.com/photo-1486406146926-c627a2adba79?w=800&q=80";
    }

    /** media:thumbnail / media:content 的 url 属性，不匹配返回 null */
    private String mediaUrl(Element el) {
        String name = el.getName();
        if ("thumbnail".equals(name) || "content".equals(name)) {
            String url = el.getAttributeValue("url");
            if (url != null && !url.isEmpty() && isImageUrl(url)) return url;
        }
        return null;
    }

    private boolean isImageUrl(String url) {
        String u = url.toLowerCase();
        return u.endsWith(".jpg") || u.endsWith(".jpeg") || u.endsWith(".png")
                || u.endsWith(".webp") || u.contains("ichef.bbci.co.uk") || u.contains("media.npr.org");
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]+>", "").trim();
    }

    /**
     * 抓取文章原文网页并提取正文段落（在详情页内直接展示，无需跳转）。
     * 提取策略：优先 article/main 正文容器内的 <p>，兜底 body 全部 <p>，
     * 过滤导航/广告等短文本，合并相邻碎段。
     */
    public List<String> fetchContent(String articleUrl) {
        List<String> paragraphs = new ArrayList<>();
        try {
            Document doc = Jsoup.connect(articleUrl)
                    .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36")
                    .referrer("https://www.google.com")
                    .timeout(12000)
                    .maxBodySize(3_000_000)
                    .get();

            // 依次尝试常见正文容器
            Elements ps = doc.select("article p, [data-testid=card-top-wrapper] ~ div p");
            if (ps.isEmpty()) ps = doc.select("article p");
            if (ps.isEmpty()) ps = doc.select("main p");
            if (ps.isEmpty()) ps = doc.select("body p");

            for (org.jsoup.nodes.Element p : ps) {
                String text = p.text().trim();
                // 过滤太短的段落（导航、版权、广告、订阅提示等）
                if (text.length() < 50) continue;
                // 过滤明显的噪音
                String lower = text.toLowerCase();
                if (lower.startsWith("copyright") || lower.contains("all rights reserved")
                        || lower.contains("cookie") || lower.contains("sign up")
                        || lower.contains("subscribe to") || lower.contains("read more:")
                        || lower.startsWith("advertisement")) continue;
                paragraphs.add(text);
                if (paragraphs.size() >= 30) break;
            }
            log.info("Reading: extracted {} paragraphs from {}", paragraphs.size(), articleUrl);
        } catch (Exception e) {
            log.warn("Reading: fetch content failed for {}: {}", articleUrl, e.getMessage());
        }
        return paragraphs;
    }
}
