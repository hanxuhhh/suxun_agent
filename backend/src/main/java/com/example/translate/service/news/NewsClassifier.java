package com.example.translate.service.news;

import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class NewsClassifier {

    private static final Map<String, List<String>> CATEGORY_KEYWORDS = new HashMap<>();
    private static final List<String> MAJOR_KEYWORDS = Arrays.asList(
            "重大", "突发", "紧急", "重磅", "震惊", "历史", "首次", "破纪录", "里程碑",
            "major", "breaking", "urgent", "record", "historic"
    );

    static {
        CATEGORY_KEYWORDS.put("ai", Arrays.asList(
                "AI", "人工智能", "大模型", "ChatGPT", "GPT", "Claude", "Llama",
                "深度学习", "机器学习", "神经网络", "自然语言", "图像识别",
                "OpenAI", "Anthropic", "DeepMind", "文心", "通义", "讯飞"
        ));
        CATEGORY_KEYWORDS.put("tech", Arrays.asList(
                "苹果", "谷歌", "微软", "Meta", "亚马逊", "华为", "小米", "三星",
                "芯片", "半导体", "5G", "云计算", "区块链", "元宇宙", "VR", "AR",
                "iPhone", "Android", "Windows", "Linux", "GitHub", "特斯拉", "机器人"
        ));
        CATEGORY_KEYWORDS.put("finance", Arrays.asList(
                "股市", "A股", "股价", "基金", "债券", "利率", "降息", "加息",
                "美元", "人民币", "日元", "欧元", "汇率", "GDP", "通胀",
                "美联储", "央行", "银行", "比特币", "加密货币", "ETF",
                "上证", "深证", "纳斯达克", "道指", "财经"
        ));
        CATEGORY_KEYWORDS.put("international", Arrays.asList(
                "美国", "欧盟", "英国", "日本", "俄罗斯", "印度", "中东",
                "G7", "G20", "联合国", "北约", "峰会", "外交", "制裁",
                "战争", "冲突", "条约", "贸易战", "关税", "国际"
        ));
        CATEGORY_KEYWORDS.put("science", Arrays.asList(
                "科学", "研究", "发现", "实验", "宇宙", "太空", "NASA", "SpaceX",
                "医学", "医疗", "基因", "蛋白质", "气候", "环境", "能源",
                "物理", "化学", "生物", "天文", "量子", "核聚变"
        ));
        CATEGORY_KEYWORDS.put("nba", Arrays.asList(
                "NBA", "篮球", "勒布朗", "库里", "杜兰特", "字母哥", "詹姆斯",
                "湖人", "勇士", "凯尔特人", "热火", "公牛", "马刺", "快船",
                "总冠军", "季后赛", "选秀", "交易截止", "全明星", "MVP",
                "东部", "西部", "总决赛", "三分", "扣篮", "得分王"
        ));
        CATEGORY_KEYWORDS.put("society", Arrays.asList(
                "社会", "民生", "教育", "就业", "生育", "老龄", "医保",
                "住房", "房价", "交通", "食品", "安全", "环境污染"
        ));
    }

    public String classify(String title, String summary) {
        String text = (title + " " + summary).toLowerCase();
        Map<String, Integer> scores = new HashMap<>();

        for (Map.Entry<String, List<String>> entry : CATEGORY_KEYWORDS.entrySet()) {
            int score = 0;
            for (String keyword : entry.getValue()) {
                if (text.contains(keyword.toLowerCase())) {
                    score++;
                }
            }
            scores.put(entry.getKey(), score);
        }

        return scores.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .filter(e -> e.getValue() > 0)
                .map(Map.Entry::getKey)
                .orElse("society");
    }

    public String detectImportance(String title) {
        for (String keyword : MAJOR_KEYWORDS) {
            if (title.contains(keyword)) {
                return "major";
            }
        }
        return "normal";
    }
}
