package com.example.translate.skills.food;

import com.example.translate.harness.AgentEvent;
import com.example.translate.harness.AgentSession;

import java.util.Arrays;
import java.util.List;

/**
 * State 4: 结果排序 + 卡片化渲染
 */
public class RenderResultsState {

    public String execute(AgentSession session) throws Exception {
        List<RestaurantCard> cards = session.getMemory("searchResults");

        if (cards == null || cards.isEmpty()) {
            session.emit(AgentEvent.builder()
                    .type(AgentEvent.EventType.TEXT)
                    .text("😔 附近没找到符合条件的餐厅，试试扩大距离范围或换个菜系？")
                    .build());
            session.emit(AgentEvent.builder()
                    .type(AgentEvent.EventType.ACTIONS)
                    .actions(Arrays.asList("换个菜系", "扩大范围", "重新开始"))
                    .build());
            return "followUp";
        }

        // 按评分+距离简单排序（有评分优先，距离近优先）
        cards.sort((a, b) -> {
            double ratingA = parseRating(a.getRating());
            double ratingB = parseRating(b.getRating());
            if (Math.abs(ratingA - ratingB) > 0.1) return Double.compare(ratingB, ratingA);
            return parseDistM(a.getDistance()) - parseDistM(b.getDistance());
        });

        // 只取前 5 条
        List<RestaurantCard> top5 = cards.size() > 5 ? cards.subList(0, 5) : cards;

        String cuisine = session.getSlotStr("cuisine");
        String city = session.getMemory("city");
        session.emit(AgentEvent.builder()
                .type(AgentEvent.EventType.TEXT)
                .text("🎉 为你找到 " + cards.size() + " 家" +
                        (!"不限".equals(cuisine) ? cuisine : "") + "餐厅" +
                        (city != null ? "（" + city + "）" : "") +
                        "，以下是精选 TOP " + top5.size() + "：")
                .build());

        session.emit(AgentEvent.builder()
                .type(AgentEvent.EventType.CARD)
                .cards(top5)
                .build());

        session.emit(AgentEvent.builder()
                .type(AgentEvent.EventType.ACTIONS)
                .actions(Arrays.asList("换一批", "换个菜系", "扩大范围", "结束"))
                .build());

        return "followUp";
    }

    private double parseRating(String r) {
        try { return Double.parseDouble(r); } catch (Exception e) { return 0; }
    }

    private int parseDistM(String d) {
        if (d == null) return 999999;
        try {
            if (d.endsWith("km")) return (int) (Double.parseDouble(d.replace("km", "")) * 1000);
            if (d.endsWith("k"))  return (int) (Double.parseDouble(d.replace("k", "")) * 1000);
            if (d.endsWith("m"))  return Integer.parseInt(d.replace("m", ""));
            // 纯数字，单位视为米
            return (int) Double.parseDouble(d);
        } catch (Exception e) {
            return 999999;
        }
    }
}
