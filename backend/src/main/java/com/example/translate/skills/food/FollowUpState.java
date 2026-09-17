package com.example.translate.skills.food;

import com.example.translate.harness.AgentEvent;
import com.example.translate.harness.AgentSession;
import com.example.translate.harness.HILQuestion;

import java.util.Arrays;
import java.util.Collections;

/**
 * State 5: 二次交互（换一批 / 换口味 / 扩大范围 / 结束）
 */
public class FollowUpState {

    public String execute(AgentSession session) throws Exception {
        // 等待用户操作
        HILQuestion q = HILQuestion.builder()
                .id("followup")
                .type(HILQuestion.QuestionType.SELECT)
                .prompt("还需要什么帮助？")
                .options(Arrays.asList(
                        HILQuestion.Option.builder().label("换一批").value("next_page").build(),
                        HILQuestion.Option.builder().label("换个菜系").value("change_cuisine").build(),
                        HILQuestion.Option.builder().label("扩大范围").value("expand_range").build(),
                        HILQuestion.Option.builder().label("结束").value("end").build()
                ))
                .required(false)
                .build();

        session.emit(AgentEvent.builder()
                .type(AgentEvent.EventType.HIL)
                .question(q)
                .build());

        String answer = session.waitHilAnswer();
        if (answer == null || "end".equals(answer) || "结束".equals(answer)) {
            session.emit(AgentEvent.builder()
                    .type(AgentEvent.EventType.TEXT)
                    .text("好的，祝你用餐愉快！🍽️")
                    .build());
            return "END";
        }

        switch (answer) {
            case "next_page":
            case "换一批":
                Integer page = session.getMemory("searchPage");
                session.setMemory("searchPage", (page == null ? 1 : page) + 1);
                return "searchFood";

            case "change_cuisine":
            case "换个菜系":
                session.setSlot("cuisine", null);
                session.setSlot("scene", null);
                session.setSlot("budget", null);
                session.setSlot("_prefsDone", null);
                session.setMemory("searchPage", 1);
                return "collectPrefs";

            case "expand_range":
            case "扩大范围":
                String cur = session.getSlotStr("distance");
                session.setSlot("distance", expandDistance(cur));
                session.setMemory("searchPage", 1);
                session.emit(AgentEvent.builder()
                        .type(AgentEvent.EventType.TEXT)
                        .text("好的，已扩大搜索范围到 " + session.getSlotStr("distance"))
                        .build());
                return "searchFood";

            default:
                // 自然语言兜底：把用户输入当追问，直接重搜
                session.emit(AgentEvent.builder()
                        .type(AgentEvent.EventType.TEXT)
                        .text("好的，重新为你搜索...")
                        .build());
                session.setMemory("searchPage", 1);
                return "searchFood";
        }
    }

    private String expandDistance(String cur) {
        if (cur == null) return "5km";
        if (cur.contains("500")) return "1km";
        if (cur.contains("1km")) return "2km";
        if (cur.contains("2km")) return "5km";
        return "5km";
    }
}
