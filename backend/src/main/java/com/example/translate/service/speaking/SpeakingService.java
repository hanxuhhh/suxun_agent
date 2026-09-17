package com.example.translate.service.speaking;

import com.example.translate.service.groq.GroqClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * BEC 口语场景服务：内置商务场景 + 考官人设 Prompt
 */
@Slf4j
@Service
public class SpeakingService {

    public static final String MODEL = "openai/gpt-oss-120b";

    @Autowired
    private GroqClient groqClient;

    /** 内置 BEC 商务口语场景 */
    private static final List<Map<String, Object>> SCENARIOS = buildScenarios();

    private static List<Map<String, Object>> buildScenarios() {
        List<Map<String, Object>> list = new ArrayList<>();
        list.add(scenario("interview", "求职面试", "HR 就商务岗位进行英文面试", 1,
                "You are a professional HR interviewer conducting a business English job interview. " +
                        "Greet the candidate warmly and start by asking them to introduce themselves and their work experience. " +
                        "Ask ONE question at a time. Keep questions relevant to business contexts (marketing, sales, finance, management). " +
                        "Respond in concise, natural business English (1-3 sentences). If the candidate replies in Chinese, gently encourage them to try English."));
        list.add(scenario("meeting", "产品会议", "向团队介绍新产品并推进讨论", 2,
                "You are a senior product manager facilitating an English business meeting about a new product launch. " +
                        "Open the meeting by asking the participant (a team member) for their opinion on the launch plan. " +
                        "Ask ONE focused question at a time about marketing, pricing, or target customers. Keep responses concise (1-3 sentences)."));
        list.add(scenario("negotiation", "商务谈判", "就采购价格与供应商谈判", 3,
                "You are a supplier's sales director negotiating a bulk purchase contract in English. " +
                        "Your initial quote is slightly high; the participant (the buyer) will try to get a better deal. " +
                        "Defend your price professionally but show flexibility if they give good reasons. One message at a time, concise business English."));
        list.add(scenario("reception", "客户接待", "机场/公司接待来访客户并寒暄", 1,
                "You are a visiting international client who just arrived at the company. " +
                        "The participant (the host) should welcome you. Make small talk about the trip, the city, and the upcoming meetings. " +
                        "Be friendly and natural, one short question at a time."));
        list.add(scenario("phone", "电话沟通", "处理客户投诉电话", 2,
                "You are an unhappy business customer calling to complain about a delayed order. " +
                        "Explain your problem clearly (polite but firm) and see how the participant (customer service) handles it. " +
                        "Escalate mildly if unsatisfied, appreciate good service. One message at a time."));
        list.add(scenario("exhibition", "展会交流", "在展会上向访客介绍公司产品", 2,
                "You are a visitor at a trade show who is interested in the participant's company booth. " +
                        "Ask about their products, services, pricing and business cooperation. " +
                        "Behave like a potential business partner, one question at a time, concise English."));
        list.add(scenario("report", "工作汇报", "向外国上司汇报项目进展", 2,
                "You are a department head in a multinational company. Ask the participant (your subordinate) " +
                        "to report on their current project progress, challenges, and next steps. " +
                        "Ask ONE clarifying question at a time, respond briefly and professionally."));
        list.add(scenario("travel", "出差安排", "与同事协调出差行程安排", 1,
                "You are a colleague coordinating an upcoming business trip with the participant. " +
                        "Discuss flight preferences, hotel, schedule and meetings abroad. " +
                        "Ask short, practical questions one at a time in business English."));
        return list;
    }

    private static Map<String, Object> scenario(String id, String name, String desc, int difficulty, String systemPrompt) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("description", desc);
        m.put("difficulty", difficulty);
        m.put("systemPrompt", systemPrompt);
        return m;
    }

    public List<Map<String, Object>> listScenarios() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> s : SCENARIOS) {
            // 不下发 systemPrompt 给前端
            out.add(new LinkedHashMap<>(s) {{ remove("systemPrompt"); }});
        }
        return out;
    }

    public Map<String, Object> getScenario(String id) {
        return SCENARIOS.stream().filter(s -> s.get("id").equals(id)).findFirst().orElse(null);
    }

    /** 跟读句子池（BEC 口语常考表达） */
    private static final List<String> SENTENCES = Arrays.asList(
            "I'd like to schedule a meeting to discuss the quarterly sales report.",
            "Could you walk me through the main points of your proposal?",
            "We're considering a partnership with your company on this project.",
            "The delivery has been delayed due to unforeseen circumstances.",
            "Let me get back to you with a firm offer by the end of the day.",
            "Our team has achieved a fifteen percent increase in revenue this quarter.",
            "I appreciate your patience while we resolve this issue.",
            "Would it be possible to arrange a site visit next week?",
            "The contract terms need to be reviewed by our legal department.",
            "We look forward to a long-term business relationship with you.",
            "I'm calling to inquire about the pricing of your new product line.",
            "Based on the market research, we decided to target younger consumers.",
            "Please find attached the agenda for tomorrow's board meeting.",
            "The training session will cover negotiation skills and business writing.",
            "Our company has been specializing in international trade for over a decade."
    );

    /** 随机抽 N 条跟读句子 */
    public List<String> randomSentences(int count) {
        List<String> pool = new ArrayList<>(SENTENCES);
        java.util.Collections.shuffle(pool, new Random());
        return pool.subList(0, Math.min(count, pool.size()));
    }

    /** 跟读评测 prompt 前缀 */
    public String evaluateSystemPrompt() {
        return "You are an experienced BEC (Business English Certificate) oral examiner. " +
                "You will be given an original sentence and the transcription of a candidate's spoken attempt. " +
                "Score strictly but fairly. Respond with ONLY a JSON object, no markdown, in this exact format: " +
                "{\"accuracy\": 0-100, \"fluency\": 0-100, \"overall\": 0-100, \"feedback\": \"一句中文点评，指出发音/表达的最大问题和改进建议\"}. " +
                "accuracy reflects how close the transcription is to the original (word errors, omissions); " +
                "fluency reflects completeness and naturalness of the attempt.";
    }
}
