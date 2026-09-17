package com.example.translate.skills.food;

import com.example.translate.harness.AgentEvent;
import com.example.translate.harness.AgentSession;
import com.example.translate.harness.HILQuestion;

import java.util.Arrays;
import java.util.List;

/**
 * State 2: HIL 多轮槽位填充
 * 收集：菜系(必填) / 场景 / 预算 / 距离
 */
public class CollectPrefsState {

    public String execute(AgentSession session) throws Exception {
        // 如果槽位已全部填好（来自二次搜索，如"换口味"），直接跳过
        if (session.getSlot("cuisine") != null && session.getSlot("_prefsDone") != null) {
            return "searchFood";
        }

        String city = session.getMemory("city");
        session.emit(AgentEvent.builder()
                .type(AgentEvent.EventType.TEXT)
                .text("好的，我来帮你在" + (city != null ? city : "附近") + "找餐厅 🍜\n请告诉我你的偏好：")
                .build());

        // ── 菜系（必填）──────────────────────────────────
        if (session.getSlot("cuisine") == null) {
            HILQuestion cuisineQ = HILQuestion.builder()
                    .id("cuisine")
                    .type(HILQuestion.QuestionType.SELECT)
                    .prompt("🍽️ 想吃什么菜系？（必选）")
                    .options(buildOptions("不限", "川湘", "粤菜", "日韩", "西餐", "火锅", "烧烤", "素食", "快餐"))
                    .required(true)
                    .build();

            session.emit(AgentEvent.builder()
                    .type(AgentEvent.EventType.HIL)
                    .question(cuisineQ)
                    .build());

            String answer = session.waitHilAnswer();
            session.setSlot("cuisine", answer != null ? answer.trim() : "不限");
        }

        // ── 用餐场景（可选）──────────────────────────────
        if (session.getSlot("scene") == null) {
            HILQuestion sceneQ = HILQuestion.builder()
                    .id("scene")
                    .type(HILQuestion.QuestionType.SELECT)
                    .prompt("👥 用餐场景是？（可跳过）")
                    .options(buildOptions("不限", "朋友聚会", "约会", "家庭", "商务", "快速解决"))
                    .required(false)
                    .build();

            session.emit(AgentEvent.builder()
                    .type(AgentEvent.EventType.HIL)
                    .question(sceneQ)
                    .build());

            String answer = session.waitHilAnswer();
            session.setSlot("scene", answer != null ? answer.trim() : "不限");
        }

        // ── 人均预算（可选）──────────────────────────────
        if (session.getSlot("budget") == null) {
            HILQuestion budgetQ = HILQuestion.builder()
                    .id("budget")
                    .type(HILQuestion.QuestionType.SELECT)
                    .prompt("💰 人均预算？（可跳过）")
                    .options(buildOptions("不限", "¥50以下", "¥50-100", "¥100-200", "¥200以上"))
                    .required(false)
                    .build();

            session.emit(AgentEvent.builder()
                    .type(AgentEvent.EventType.HIL)
                    .question(budgetQ)
                    .build());

            String answer = session.waitHilAnswer();
            session.setSlot("budget", answer != null ? answer.trim() : "不限");
        }

        // ── 距离范围（可选，默认2km）──────────────────────
        if (session.getSlot("distance") == null) {
            HILQuestion distQ = HILQuestion.builder()
                    .id("distance")
                    .type(HILQuestion.QuestionType.SELECT)
                    .prompt("📍 距离范围？（默认2km）")
                    .options(buildOptions("500m", "1km", "2km", "5km"))
                    .required(false)
                    .build();

            session.emit(AgentEvent.builder()
                    .type(AgentEvent.EventType.HIL)
                    .question(distQ)
                    .build());

            String answer = session.waitHilAnswer();
            session.setSlot("distance", answer != null && !answer.trim().isEmpty() ? answer.trim() : "2km");
        }

        session.setSlot("_prefsDone", true);
        return "searchFood";
    }

    private List<HILQuestion.Option> buildOptions(String... labels) {
        return Arrays.stream(labels)
                .map(l -> HILQuestion.Option.builder().label(l).value(l).build())
                .collect(java.util.stream.Collectors.toList());
    }
}
