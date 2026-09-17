package com.example.translate.service.writing;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * BEC 写作题库：对标 BEC 中/高级写作题型（备忘录/邮件/报告/建议书）
 */
@Service
public class WritingService {

    public static final String MODEL = "openai/gpt-oss-120b";

    private static final List<Map<String, Object>> TOPICS = buildTopics();

    private static List<Map<String, Object>> buildTopics() {
        List<Map<String, Object>> list = new ArrayList<>();
        // ── Part 1 邮件/便条（40-50 词）──
        list.add(topic("t1", "email", "询价邮件",
                "Write an email to a supplier asking for their latest catalogue and price list for office furniture. Mention that your company is planning to refurbish the office.",
                50, Arrays.asList("说明来意", "索取产品目录和价格单", "提及办公室翻新计划", "期待回复")));
        list.add(topic("t2", "email", "投诉邮件",
                "Write an email to a logistics company complaining about a delayed shipment of goods that was supposed to arrive last week. Ask for an explanation and a guaranteed delivery date.",
                50, Arrays.asList("说明订单情况", "表达不满", "要求解释和确切送达时间")));
        list.add(topic("t3", "email", "道歉邮件",
                "You have to cancel a scheduled business meeting with an important client due to an urgent overseas trip. Write an email of apology and suggest rearranging the meeting.",
                50, Arrays.asList("说明取消原因", "表达歉意", "提议改期")));
        list.add(topic("t4", "memo", "内部备忘录",
                "Write a memo to all staff informing them of a change to the company's travel expense policy, effective from next month. Mention the key changes and where to find the full policy.",
                45, Arrays.asList("说明政策变更", "生效时间", "主要变化", "查询完整政策的方式")));
        list.add(topic("t5", "memo", "会议通知备忘录",
                "Write a memo to your department about an upcoming quarterly review meeting. Include the date, time, venue, required preparation and confirmation deadline.",
                45, Arrays.asList("会议时间地点", "参会人员", "需要准备的材料", "回复确认截止时间")));
        // ── Part 2 报告/建议书（120-140 词）──
        list.add(topic("t6", "report", "员工满意度调查报告",
                "Your company recently conducted a staff satisfaction survey. Write a report for the management summarising the findings (salary, workload, career development), and give two recommendations for improvement.",
                140, Arrays.asList("调查背景简介", "三方面调查结果概括", "两条改进建议", "语言正式客观")));
        list.add(topic("t7", "report", "销售业绩分析报告",
                "Write a report analysing your regional sales performance this year: overall revenue, best-selling product lines, and underperforming areas. Conclude with one action point.",
                140, Arrays.asList("总体营收概况", "畅销产品线", "表现不佳的区域", "一个行动要点")));
        list.add(topic("t8", "proposal", "团建活动建议书",
                "Write a proposal to the HR Director suggesting a team-building activity for your department of 20 people. Cover the activity, budget estimate, expected benefits and timeline.",
                140, Arrays.asList("活动内容", "预算估算", "预期收益", "时间安排")));
        list.add(topic("t9", "proposal", "远程办公试点建议",
                "Write a proposal to senior management recommending a three-month remote work pilot scheme. Include the reasons, the scope of the trial, success metrics and cost implications.",
                140, Arrays.asList("试点原因", "试点范围", "成功衡量指标", "成本影响")));
        list.add(topic("t10", "email", "合作邀请邮件",
                "Write an email to a potential business partner inviting their company to a product launch event your company is hosting next month. Provide event details and ask for confirmation of attendance.",
                60, Arrays.asList("活动介绍", "时间地点", "邀请对方出席", "请求回复确认")));
        return list;
    }

    private static Map<String, Object> topic(String id, String type, String title, String prompt,
                                             int wordLimit, List<String> points) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("type", type);
        m.put("typeName", typeName(type));
        m.put("title", title);
        m.put("prompt", prompt);
        m.put("wordLimit", wordLimit);
        m.put("keyPoints", points);
        return m;
    }

    private static String typeName(String type) {
        switch (type) {
            case "email": return "Email 商务邮件";
            case "memo": return "Memo 内部备忘录";
            case "report": return "Report 商务报告";
            default: return "Proposal 建议书";
        }
    }

    public List<Map<String, Object>> listTopics() {
        return TOPICS;
    }

    public Map<String, Object> getTopic(String id) {
        return TOPICS.stream().filter(t -> t.get("id").equals(id)).findFirst().orElse(null);
    }

    /** 批改考官 system prompt（BEC 写作评分标准） */
    public String evaluateSystemPrompt() {
        return "You are an experienced BEC (Business English Certificate) writing examiner. "
                + "Evaluate the candidate's business writing strictly against BEC writing criteria. "
                + "Respond with ONLY a JSON object, no markdown, in this exact format: "
                + "{\"content\": {\"score\": 0-100, \"comment\": \"中文点评：内容是否切题、要点覆盖情况\"}, "
                + "\"language\": {\"score\": 0-100, \"comment\": \"中文点评：语法、词汇、商务用语准确性\"}, "
                + "\"organization\": {\"score\": 0-100, \"comment\": \"中文点评：结构是否清晰、是否符合该文体格式\"}, "
                + "\"overall\": 0-100, "
                + "\"improved\": \"考生作文的一段地道英文改写示例（不超过原文长度+20%）\", "
                + "\"suggestions\": [\"中文改进建议1\", \"中文改进建议2\", \"中文改进建议3\"]}. "
                + "Scoring guidance: 90+ excellent (BEC A/B grade level), 75+ good, 60+ adequate (pass level), "
                + "below 60 needs improvement. Be strict but constructive.";
    }
}
