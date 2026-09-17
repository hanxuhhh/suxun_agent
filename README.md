# 苏寻的 AI 工坊（suxun_agent）

一个全栈 AI 应用：多元翻译 · AI 对话 · 周边美食推荐 · 实时新闻聚合（H5 移动端优先）。

## 项目结构

```
suxun_agent/
├── frontend/   # React 18 + TS + Vite + Tailwind + antd（H5 移动端）
└── backend/    # Spring Boot 3 + WebFlux（AI 服务聚合、高德、新闻抓取）
```

## 功能模块

| 模块 | 前端 | 后端 |
|---|---|---|
| 多元翻译（风格化） | `/translate` | DeepSeek / OpenAI / Groq |
| AI 对话（流式） | `/chat` | SSE 流式转发，多模型切换 |
| AI 美食推荐 Agent | `/food-agent` | 多轮对话 + 高德 POI 搜索 |
| 周边美食 | `/food` | 高德周边搜索 + IP/GPS 定位 |
| 实时新闻 | `/news` | 多源抓取 + AI 分类精选 |

## 快速启动

### 后端（端口 8080）

```bash
cd backend
# 先配置密钥（二选一）：
#   方式一：创建 src/main/resources/application-dev.yml（参考 application.yml，本文件不入库）
#   方式二：导出环境变量 DEEPSEEK_API_KEY / OPENAI_API_KEY / GROQ_API_KEY / AMAP_KEY
./mvnw spring-boot:run   # 或 mvn spring-boot:run
```

接口文档：启动后访问 http://localhost:8080/doc.html（Knife4j）

### 前端（端口 5173）

```bash
cd frontend
pnpm install
pnpm dev
```

- Base URL 由 `VITE_API_BASE` 环境变量控制（默认走 Vite 代理，详见 `frontend/.env`）
- 手机真机体验：电脑与手机连同一 Wi-Fi，访问 `http://<电脑局域网IP>:5173`

## 技术栈

**前端**：React 18 · TypeScript · Vite 5 · Tailwind CSS 3 · antd 6 · Zustand · React Router 7

**后端**：Spring Boot · WebFlux · Knife4j (OpenAPI 3) · DeepSeek / OpenAI / Groq API · 高德开放平台
