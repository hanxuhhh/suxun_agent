package com.example.translate.skills.food;

import com.example.translate.client.AmapClient;
import com.example.translate.config.AmapConfig;
import com.example.translate.harness.AgentSession;
import com.example.translate.harness.ISkill;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 周边美食对话推荐 Skill
 * 实现 ISkill，被 AgentEngine 自动发现和注册
 */
@Component
public class FoodRecommendationSkill implements ISkill {

    @Autowired
    private AmapClient amapClient;

    @Autowired
    private AmapConfig amapConfig;

    private final GetLocationState  getLocationState  = new GetLocationState();
    private final CollectPrefsState collectPrefsState = new CollectPrefsState();
    private final RenderResultsState renderResultsState = new RenderResultsState();
    private final FollowUpState     followUpState     = new FollowUpState();

    @Override
    public String getId() { return "food-recommendation"; }

    @Override
    public String getName() { return "周边美食推荐"; }

    @Override
    public String getInitialState() { return "getLocation"; }

    @Override
    public String execute(AgentSession session, String userInput) throws Exception {
        // 注入 Amap Key 到 memory（GetLocationState 需要）
        session.setMemory("amapKey", amapConfig.getKey());

        String state = session.getCurrentState();
        switch (state) {
            case "getLocation":
                return getLocationState.execute(session);
            case "collectPrefs":
                return collectPrefsState.execute(session);
            case "searchFood":
                return new SearchFoodState(amapClient).execute(session);
            case "renderResults":
                return renderResultsState.execute(session);
            case "followUp":
                return followUpState.execute(session);
            default:
                return "END";
        }
    }
}
