package com.example.translate.controller;

import com.example.translate.common.Result;
import com.example.translate.dto.vocab.QuizQuestion;
import com.example.translate.dto.vocab.VocabWord;
import com.example.translate.service.vocab.VocabService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "背单词接口")
@RestController
@RequestMapping("/api/vocab")
public class VocabController {

    @Autowired
    private VocabService vocabService;

    @Operation(summary = "词书信息（总词数等）")
    @GetMapping("/books")
    public Result<Map<String, Object>> books() {
        return Result.success(vocabService.getBookMeta());
    }

    @Operation(summary = "每日词包（分页取词，offset 记录学习进度）")
    @GetMapping("/words")
    public Result<List<VocabWord>> words(
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "10") int count) {
        return Result.success(vocabService.getWords(offset, count));
    }

    @Operation(summary = "查询单个词条详情")
    @GetMapping("/word/{word}")
    public Result<VocabWord> word(@PathVariable String word) {
        VocabWord w = vocabService.getWord(word);
        if (w == null) {
            return Result.error(404, "词库中未收录: " + word);
        }
        return Result.success(w);
    }

    @Operation(summary = "随机词包（发现/复习用）")
    @GetMapping("/random")
    public Result<List<VocabWord>> random(@RequestParam(defaultValue = "10") int count) {
        return Result.success(vocabService.randomWords(count));
    }

    @Operation(summary = "生成测验题（四选一，含中译英/英译中/听音辨词）")
    @GetMapping("/quiz")
    public Result<List<QuizQuestion>> quiz(@RequestParam String words) {
        List<String> wordList = vocabService.parseWordList(words);
        if (wordList.isEmpty()) {
            return Result.error(400, "words 参数不能为空，如: invoice,negotiate,merger");
        }
        return Result.success(vocabService.generateQuiz(wordList));
    }
}
