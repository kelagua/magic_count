# AI 工具与指令交互指南 (AI Tooling & Interaction Guide)

本档详细记录 magic_count (LiteNote) 系统中 AI Tool Calling 的定义、入参规范和交互逻辑，是 Web 端和移动端集成 AI 对话界面的核心参考文档。

---

## 1. AI 架构概览

### 双轨设计

系统包含两条 AI 入口路径：

| 路径 | 入口 | 用途 | 状态 |
|------|------|------|------|
| **对话式 (ChatService)** | `POST /ai/chat` / `POST /ai/chat/stream` | 多轮对话 + Tool Calling | ✅ 主推 |
| **单次解析 (AIService)** | `POST /ai/parse-bills` | 单次文本/图片解析 | ⚠️ 旧版，逐步废弃 |

### 多模型适配器

| Provider | 适配器文件 | 支持功能 |
|----------|-----------|----------|
| Claude | `claude.adapter.ts` | 文本 + 图片 (Vision) + Tool Calling + Streaming |
| OpenAI | `openai.adapter.ts` | 文本 + 图片 (Vision) + Tool Calling + Streaming |
| DeepSeek | `deepseek.adapter.ts` | 文本 + Tool Calling + Streaming |
| Qwen | `qwen.adapter.ts` | 文本 + Tool Calling + Streaming |

所有适配器继承 `AIAdapter` 接口（`base.adapter.ts`），统一 `chat()` / `chatStream()` / `parseBills()` / `testConnection()` 方法签名。

---

## 2. Tool Calling 定义

### 2.1 `create_bills` — 创建账单

**触发条件**：用户提到赊账、还款、收入/支出，且信息足够（至少有金额）。

**入参定义**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `bills` | Array | ✅ | 账单数组，每项包含以下字段 |
| `bills[].amount` | Number | ✅ | 金额（正数） |
| `bills[].type` | String | ✅ | 类型：`income` / `expense` / `credit` |
| `bills[].description` | String | ✅ | 描述（最多 10 字） |
| `bills[].categoryName` | String | ❌ | 分类名称（需匹配用户已有分类） |
| `bills[].date` | String | ❌ | 日期（YYYY-MM-DD，默认今天） |

**重要行为**：
- ⚠️ **不直接入库**：`executeCreateBills` 只做数据丰富（补充 categoryId、icon），返回给前端展示确认
- 前端确认后才真正保存到数据库
- 如未指定 `categoryName`，AI 自动推断分类
- 如未指定 `date`，默认使用当天日期

**交互示例**：
```
用户: "老王赊了三袋复合肥，一共 450"
AI: 调用 create_bills → [{ amount: 450, type: "credit", description: "三袋复合肥", categoryName: "化肥", date: "2026-05-03" }]
系统: 返回丰富后的数据 → 前端展示确认 → 用户确认 → 入库
```

### 2.2 `query_bills` — 查询账单

**触发条件**：用户想查看、搜索或了解某段时间的账目。

**入参定义**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `startDate` | String | ❌ | 开始日期（YYYY-MM-DD） |
| `endDate` | String | ❌ | 结束日期（YYYY-MM-DD） |
| `type` | String | ❌ | 类型过滤：`income` / `expense` / `credit` |
| `categoryName` | String | ❌ | 分类名称过滤 |
| `limit` | Number | ❌ | 返回条数（默认 20，最大 50） |

**交互示例**：
```
用户: "本月化肥赊了多少？"
AI: 调用 query_bills → { startDate: "2026-05-01", endDate: "2026-05-31", type: "credit", categoryName: "化肥" }
系统: 返回匹配的账单列表
AI: 汇总回复 "本月化肥赊账共 5 笔，合计 2,350 元"
```

### 2.3 `delete_bills` — 删除账单

**触发条件**：用户明确要求删除账单。

**入参定义**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `billIds` | Array\<Number\> | ✅ | 要删除的账单 ID 列表 |

**重要行为**：
- ⚠️ **直接删除**：`executeDeleteBills` 直接从数据库删除，无确认步骤
- 支持部分成功：如某些 ID 删除失败，返回每项的成功/失败状态
- 建议：AI 应先通过 `query_bills` 查询并展示待删除项，让用户确认后再调用

**交互示例**：
```
用户: "把昨天那笔 200 块的记错了，删掉"
AI: 先调用 query_bills 查询昨天的账单 → 展示给用户确认
用户: "对，就是这笔"
AI: 调用 delete_bills → { billIds: [42] }
```

### 2.4 `get_statistics` — 获取统计

**触发条件**：用户想了解账目统计、趋势分析。

**入参定义**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `startDate` | String | ❌ | 开始日期（YYYY-MM-DD） |
| `endDate` | String | ❌ | 结束日期（YYYY-MM-DD） |

**返回数据**：
- 总收入、总支出、总赊账
- 分类统计（各品类的金额占比）
- 趋势数据（日/月维度的收支变化）

**交互示例**：
```
用户: "帮我分析本月客户回款情况"
AI: 调用 get_statistics → { startDate: "2026-05-01", endDate: "2026-05-31" }
系统: 返回统计数据
AI: "本月回款总计 8,500 元，其中微信 5,000、现金 3,500。赊账余额较上月减少 30%。"
```

---

## 3. 扩展工具定义 (Phase 2+)

### 3.1 `findCustomer` — 查找客户

**用途**：根据姓名或手机号查询农户档案。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | String | ❌ | 客户姓名（模糊匹配） |
| `phone` | String | ❌ | 手机号（精确匹配） |

### 3.2 `createCustomer` — 新建客户

**用途**：当赊账对象不在系统中时，新建客户档案。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | String | ✅ | 客户姓名 |
| `phone` | String | ❌ | 联系方式 |
| `address` | String | ❌ | 地址 |

### 3.3 `getCustomerStatement` — 客户对账单

**用途**：获取指定客户的欠款清单。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `customerId` | String | ✅ | 客户 ID |

### 3.4 `batchSettleBills` — 批量结清

**用途**：当用户说"把老王去年的账都结了"时，批量结清指定客户的赊账。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `billIds` | Array\<Number\> | ✅ | 要结清的账单 ID 列表 |
| `paymentMethod` | String | ✅ | 支付方式：WECHAT / ALIPAY / CASH |
| `settledAt` | String | ❌ | **结算时间**（ISO-8601，默认当前时间） |

### 3.5 `queryProductPrice` — 查询商品价格

**用途**：帮助 AI 在记账时核对农药/化肥的单价，避免人工输入错误。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | String | ✅ | 商品名称（支持模糊匹配） |

---

## 4. 典型交互序列 (Interaction Sequences)

### 4.1 赊账记账

```
用户: "老王赊了三袋 15-15-15 的复合肥"
  ↓
AI 解析: { customer: "老王", product: "复合肥", spec: "15-15-15", qty: 3, action: "credit" }
  ↓
AI 调用: findCustomer("老王") → 匹配到客户 ID
  ↓
AI 调用: queryProductPrice("15-15-15 复合肥") → 单价 150 元/袋
  ↓
AI 调用: create_bills([{ amount: 450, type: "credit", description: "三袋复合肥", categoryName: "化肥" }])
  ↓
系统: 返回丰富后的数据（含 categoryId, icon）
  ↓
前端: 展示确认卡片 "老王 赊账 450元 三袋复合肥"
  ↓
用户: 确认 → 入库
```

### 4.2 批量结清

```
用户: "把老王去年的账都结了，微信转的"
  ↓
AI 解析: { customer: "老王", period: "去年", method: "WECHAT", action: "settle" }
  ↓
AI 调用: findCustomer("老王") → 匹配到客户 ID
  ↓
AI 调用: getCustomerStatement(customerId) → 获取未结清账单列表
  ↓
AI 展示: "老王去年有 5 笔未结清赊账，共 2,350 元"
  ↓
用户: "结了吧"
  ↓
AI 调用: batchSettleBills({ billIds: [1,2,3,4,5], paymentMethod: "WECHAT", settledAt: "2026-05-03T19:30:00Z" })
  ↓
系统: 批量更新 isSettled=true, settledAt, paymentMethod
  ↓
AI 回复: "已结清老王 5 笔赊账，共 2,350 元，微信支付"
```

### 4.3 统计查询

```
用户: "本月化肥赊了多少？"
  ↓
AI 调用: get_statistics({ startDate: "2026-05-01", endDate: "2026-05-31" })
  ↓
系统: 返回统计数据
  ↓
AI 回复: "本月化肥赊账共 5 笔，合计 2,350 元，较上月增长 15%"
```

### 4.4 语音记账

```
用户: [按住录音] "李大爷拿了两袋尿素，240 块，先记账上"
  ↓
ASR: 语音转文字 → "李大爷拿了两袋尿素，240块，先记账上"
  ↓
AI 解析: { customer: "李大爷", product: "尿素", qty: 2, amount: 240, action: "credit" }
  ↓
AI 调用: create_bills([{ amount: 240, type: "credit", description: "两袋尿素", categoryName: "化肥" }])
  ↓
前端: 展示确认 + TTS 播报 "已记录李大爷赊账240元"
```

---

## 5. System Prompt 结构

AI 的 System Prompt 由 `ChatService.buildSystemPrompt()` 动态构建，包含以下部分：

1. **角色定义**：农资店专业记账助手
2. **当前日期**：注入当天日期（含星期）
3. **用户分类列表**：动态获取用户的收入/支出分类
4. **工具使用规则**：
   - 信息充分时调用 `create_bills`
   - 信息不足时追问
   - 查询调用 `query_bills`
   - 删除需先查询再调用 `delete_bills`
   - 统计调用 `get_statistics`
   - 闲聊不调用工具
5. **约束条件**：
   - 默认使用当天日期
   - 分类必须从列表中选择
   - 金额必须为正数
   - 回复简洁，使用中文

---

## 6. 流式响应事件 (SSE Stream Events)

客户端通过 SSE 接收的流式事件类型：

| 事件类型 | 含义 | 数据 |
|----------|------|------|
| `session_created` | 会话创建成功 | sessionId |
| `thinking` | AI 开始新一轮思考 | — |
| `thinking_delta` | 思考内容增量 | text |
| `text_delta` | 文本输出增量 | text |
| `tool_call_start` | 工具调用开始 | toolName |
| `tool_result` | 工具执行结果 | { success, data, message } |
| `done` | 对话完成 | { duration } |
| `error` | 发生错误 | message |

---

## 7. 会话管理

### 上下文窗口
- **最大上下文消息数**：30 条
- **摘要压缩阈值**：20 条未摘要消息
- **压缩策略**：保留最近 10 条消息，更早的消息由 AI 生成 200 字摘要
- **最大工具调用轮次**：5 轮

### 会话操作
- 创建会话：首次发消息自动创建
- 重命名会话：`PUT /ai/sessions/:id/rename`
- 置顶会话：`PUT /ai/sessions/:id/pin`
- 删除会话：`DELETE /ai/sessions/:id`
- 查询会话列表：`GET /ai/sessions`

---

*本文档由 Doc-Writer 维护，最后更新：2026-05-03*
