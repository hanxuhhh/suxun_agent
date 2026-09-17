package com.example.translate.harness;

/**
 * Skill 接口 —— 所有 Skill 必须实现
 */
public interface ISkill {

    /** Skill 唯一 ID */
    String getId();

    /** Skill 名称（展示用） */
    String getName();

    /** 初始状态 ID */
    String getInitialState();

    /**
     * 执行下一步。
     * @param session  当前会话上下文
     * @param userInput 用户本次输入（首次启动时为 null 或初始意图文本）
     * @return 下一个状态 ID，"END" 表示结束
     */
    String execute(AgentSession session, String userInput) throws Exception;
}
