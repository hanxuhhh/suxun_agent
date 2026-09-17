package com.example.translate.service.news;

import com.example.translate.model.NewsItem;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class MockNewsSource {

    private List<NewsItem> mockData = Collections.emptyList();

    @PostConstruct
    public void load() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            InputStream is = new ClassPathResource("mock/news-mock.json").getInputStream();
            mockData = mapper.readValue(is, new TypeReference<List<NewsItem>>() {});
            log.info("Loaded {} mock news items", mockData.size());
        } catch (Exception e) {
            log.error("Failed to load mock news data", e);
        }
    }

    public List<NewsItem> getNews() {
        return mockData;
    }
}
