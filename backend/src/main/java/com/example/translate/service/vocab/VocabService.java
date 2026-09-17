package com.example.translate.service.vocab;

import com.example.translate.dto.vocab.QuizQuestion;
import com.example.translate.dto.vocab.VocabWord;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * BEC 商务英语词库服务
 * 数据来源：开源词库 kajweb/dict（BEC 两册合并，2825 词），
 * 一次性打包在 resources/vocab/bec.json，完全离线、零外部依赖。
 */
@Slf4j
@Service
public class VocabService {

    private static final String RESOURCE = "/vocab/bec.json";
    private static final Random RANDOM = new Random();

    private final List<VocabWord> words = new ArrayList<>();
    private final Map<String, VocabWord> index = new HashMap<>();

    @PostConstruct
    public void init() {
        try (InputStream is = getClass().getResourceAsStream(RESOURCE)) {
            if (is == null) {
                log.error("BEC vocab resource not found: {}", RESOURCE);
                return;
            }
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(is);
            for (JsonNode n : root) {
                VocabWord w = VocabWord.builder()
                        .word(n.path("w").asText(""))
                        .ukPhone(n.path("uk").asText(""))
                        .usPhone(n.path("us").asText(""))
                        .translations(toList(n.path("t"), t -> VocabWord.Translation.builder()
                                .pos(t.path("pos").asText(""))
                                .cn(t.path("cn").asText(""))
                                .en(t.path("en").asText(""))
                                .build()))
                        .sentences(toList(n.path("s"), s -> VocabWord.Sentence.builder()
                                .en(s.path("en").asText(""))
                                .cn(s.path("cn").asText(""))
                                .build()))
                        .phrases(toList(n.path("p"), p -> VocabWord.Phrase.builder()
                                .en(p.path("en").asText(""))
                                .cn(p.path("cn").asText(""))
                                .build()))
                        .build();
                if (w.getWord().isEmpty() || w.getTranslations().isEmpty()) continue;
                words.add(w);
                index.put(w.getWord().toLowerCase(), w);
            }
            log.info("Loaded {} BEC vocab words", words.size());
        } catch (Exception e) {
            log.error("Failed to load BEC vocab: {}", e.getMessage());
        }
    }

    private interface NodeMapper<T> { T map(JsonNode n); }

    private <T> List<T> toList(JsonNode arr, NodeMapper<T> mapper) {
        List<T> list = new ArrayList<>();
        if (arr != null && arr.isArray()) {
            for (JsonNode n : arr) list.add(mapper.map(n));
        }
        return list;
    }

    /** 词书元信息 */
    public Map<String, Object> getBookMeta() {
        Map<String, Object> meta = new HashMap<>();
        meta.put("id", "bec");
        meta.put("name", "BEC 商务英语核心词汇");
        meta.put("description", "对标剑桥 BEC 考纲，涵盖商务场景核心词汇");
        meta.put("totalWords", words.size());
        meta.put("unitCount", (words.size() + 29) / 30);
        return meta;
    }

    /** 分页取词（按字母序，前端用 offset 记录学习进度） */
    public List<VocabWord> getWords(int offset, int count) {
        if (offset < 0) offset = 0;
        if (count <= 0 || count > 100) count = 10;
        int to = Math.min(offset + count, words.size());
        if (offset >= words.size()) return new ArrayList<>();
        return new ArrayList<>(words.subList(offset, to));
    }

    /** 按词查详情 */
    public VocabWord getWord(String word) {
        return word == null ? null : index.get(word.toLowerCase());
    }

    /** 全库随机抽词（用于搜索/发现） */
    public List<VocabWord> randomWords(int count) {
        if (words.isEmpty()) return new ArrayList<>();
        List<VocabWord> pool = new ArrayList<>(words);
        Collections.shuffle(pool, RANDOM);
        return pool.subList(0, Math.min(count, pool.size()));
    }

    /**
     * 为指定单词生成四选一测验题。
     * 干扰项从词库内随机抽取，不依赖 AI，毫秒级返回。
     */
    public List<QuizQuestion> generateQuiz(List<String> wordList) {
        List<QuizQuestion> questions = new ArrayList<>();
        String[] types = {"cn2en", "en2cn", "listen"};
        for (String w : wordList) {
            VocabWord target = index.get(w.toLowerCase());
            if (target == null) continue;
            String type = types[RANDOM.nextInt(types.length)];

            String question;
            String correctText;
            java.util.function.Function<VocabWord, String> distractorFn;

            switch (type) {
                case "cn2en":
                    question = firstCn(target);
                    correctText = target.getWord();
                    distractorFn = VocabWord::getWord;
                    break;
                case "en2cn":
                    question = target.getWord();
                    correctText = firstCn(target);
                    distractorFn = this::firstCn;
                    break;
                default: // listen
                    question = "";
                    correctText = target.getWord();
                    distractorFn = VocabWord::getWord;
                    break;
            }
            if (question == null) continue;

            Set<String> optionTexts = new HashSet<>();
            optionTexts.add(correctText);
            int guard = 0;
            while (optionTexts.size() < 4 && guard++ < 50) {
                VocabWord cand = words.get(RANDOM.nextInt(words.size()));
                String text = distractorFn.apply(cand);
                if (text != null && !text.isEmpty() && !target.getWord().equalsIgnoreCase(cand.getWord())) {
                    optionTexts.add(text);
                }
            }
            List<String> shuffled = new ArrayList<>(optionTexts);
            Collections.shuffle(shuffled, RANDOM);

            List<QuizQuestion.Option> options = shuffled.stream()
                    .map(text -> QuizQuestion.Option.builder()
                            .text(text)
                            .correct(text.equals(correctText))
                            .build())
                    .collect(Collectors.toList());

            questions.add(QuizQuestion.builder()
                    .type(type)
                    .word(target.getWord())
                    .question(question)
                    .options(options)
                    .build());
        }
        // 打乱题型分布后再洗一次题目顺序
        Collections.shuffle(questions, RANDOM);
        return questions;
    }

    private String firstCn(VocabWord w) {
        VocabWord.Translation t = w.getTranslations().get(0);
        String pos = t.getPos().isEmpty() ? "" : t.getPos() + ". ";
        return pos + t.getCn();
    }

    /** 解析逗号分隔的词列表参数 */
    public List<String> parseWordList(String wordsParam) {
        if (wordsParam == null || wordsParam.trim().isEmpty()) return new ArrayList<>();
        return Arrays.stream(wordsParam.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .limit(30)
                .collect(Collectors.toList());
    }
}
