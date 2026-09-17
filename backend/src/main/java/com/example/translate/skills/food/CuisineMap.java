package com.example.translate.skills.food;

import java.util.HashMap;
import java.util.Map;

/**
 * 菜系 → 高德搜索关键词 + 类型码映射
 */
public class CuisineMap {

    /** 菜系 value → 高德 keywords */
    public static final Map<String, String> KEYWORDS = new HashMap<>();

    /** 菜系 value → 高德 types（POI 类型码） */
    public static final Map<String, String> TYPES = new HashMap<>();

    static {
        KEYWORDS.put("川湘",  "川菜 湘菜");
        KEYWORDS.put("粤菜",  "粤菜 广东菜");
        KEYWORDS.put("日韩",  "日料 韩餐");
        KEYWORDS.put("西餐",  "西餐 牛排");
        KEYWORDS.put("火锅",  "火锅");
        KEYWORDS.put("烧烤",  "烧烤 串串");
        KEYWORDS.put("素食",  "素食 素菜");
        KEYWORDS.put("快餐",  "快餐");
        KEYWORDS.put("不限",  "餐厅");

        TYPES.put("川湘",  "050118");
        TYPES.put("粤菜",  "050107");
        TYPES.put("日韩",  "050200");
        TYPES.put("西餐",  "050201");
        TYPES.put("火锅",  "050100");
        TYPES.put("烧烤",  "050115");
        TYPES.put("素食",  "050113");
        TYPES.put("快餐",  "050300");
        TYPES.put("不限",  "050000");
    }

    /** 场景追加关键词 */
    public static final Map<String, String> SCENE_SUFFIX = new HashMap<>();
    static {
        SCENE_SUFFIX.put("约会",   " 环境好");
        SCENE_SUFFIX.put("家庭",   " 家常菜");
        SCENE_SUFFIX.put("商务",   " 包厢");
        SCENE_SUFFIX.put("朋友聚会", "");
        SCENE_SUFFIX.put("快速解决", " 快餐");
    }

    public static String buildKeywords(String cuisine, String scene) {
        String kw = KEYWORDS.getOrDefault(cuisine, "餐厅");
        String suffix = scene != null ? SCENE_SUFFIX.getOrDefault(scene, "") : "";
        return kw + suffix;
    }

    public static String getType(String cuisine) {
        return TYPES.getOrDefault(cuisine, "050000");
    }
}
