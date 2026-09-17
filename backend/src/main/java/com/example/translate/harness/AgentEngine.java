package com.example.translate.harness;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Harness Agent 引擎
 * - 管理所有会话（SessionStore）
 * - 路由到对应 Skill 并在后台线程执行状态机
 */
@Slf4j
@Component
public class AgentEngine {

    /** 会话存储（生产环境可替换为 Redis） */
    private final Map<String, AgentSession> sessions = new ConcurrentHashMap<>();

    /** 所有注册的 Skill（Spring 自动注入） */
    @Autowired
    private List<ISkill> skills;

    // ── 公开 API ──────────────────────────────────────────────

    /**
     * 创建新会话并异步启动 Skill 状态机
     * @param skillId    使用哪个 Skill
     * @param userInput  用户初始输入（可为 null）
     * @return sessionId
     */
    public String startSession(String skillId, String userInput) {
        ISkill skill = findSkill(skillId);
        if (skill == null) throw new IllegalArgumentException("Skill not found: " + skillId);

        String sessionId = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        AgentSession session = new AgentSession(sessionId);
        session.setSkillId(skillId);
        session.setCurrentState(skill.getInitialState());
        sessions.put(sessionId, session);

        // 在独立线程运行状态机，不阻塞 HTTP 线程
        Thread thread = new Thread(() -> runStateMachine(session, skill, userInput));
        thread.setDaemon(true);
        thread.setName("agent-" + sessionId);
        thread.start();

        return sessionId;
    }

    /**
     * 接收用户消息（HIL 回答 或 普通追问）
     */
    public void sendMessage(String sessionId, String userInput) {
        AgentSession session = getSession(sessionId);
        if (session.isFinished()) {
            // 会话已结束，重新启动（二次追问）
            ISkill skill = findSkill(session.getSkillId());
            session.setFinished(false);
            Thread thread = new Thread(() -> runStateMachine(session, skill, userInput));
            thread.setDaemon(true);
            thread.start();
        } else {
            // 会话进行中，作为 HIL 回答
            session.submitHilAnswer(userInput);
        }
    }

    public AgentSession getSession(String sessionId) {
        AgentSession session = sessions.get(sessionId);
        if (session == null) throw new IllegalArgumentException("Session not found: " + sessionId);
        return session;
    }

    public List<ISkill> listSkills() {
        return skills;
    }

    // ── 内部方法 ──────────────────────────────────────────────

    private void runStateMachine(AgentSession session, ISkill skill, String userInput) {
        try {
            String nextState = skill.execute(session, userInput);
            while (!"END".equals(nextState)) {
                session.setCurrentState(nextState);
                nextState = skill.execute(session, null);
            }
        } catch (Exception e) {
            log.error("Agent state machine error [{}]: {}", session.getSessionId(), e.getMessage(), e);
            session.emit(AgentEvent.builder()
                    .type(AgentEvent.EventType.ERROR)
                    .text("系统错误：" + e.getMessage())
                    .build());
        } finally {
            session.setFinished(true);
            session.emit(AgentEvent.builder()
                    .type(AgentEvent.EventType.DONE)
                    .build());
        }
    }

    private ISkill findSkill(String skillId) {
        return skills.stream().filter(s -> s.getId().equals(skillId)).findFirst().orElse(null);
    }
}
