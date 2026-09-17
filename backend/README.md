# AI 翻译平台 - 后端

Spring Boot 3.x 后端服务，端口 8080。

## 快速启动

```bash
# 设置 DeepSeek API Key（必须）
export DEEPSEEK_API_KEY=your-api-key

# 编译并运行
mvn spring-boot:run
```

## 接口文档

启动后访问：http://localhost:8080/doc.html

## 测试接口

```bash
# 测试翻译
curl -X POST http://localhost:8080/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"你好世界","sourceLang":"zh","targetLang":"en","model":"deepseek-chat","style":"colloquial"}'

# 获取模型列表
curl http://localhost:8080/api/models
```

## 获取 DeepSeek API Key

访问 https://platform.deepseek.com/ 注册并获取 API Key。
