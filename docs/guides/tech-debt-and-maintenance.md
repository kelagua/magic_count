# 项目技术债与维护清单 (Tech Debt & Maintenance Log)

本档记录 magic_count (LiteNote) 项目中的技术债、架构演进记录和待维护事项，供团队随时查阅变更背景和优先级。

---

## 1. 架构演进记录 (Architecture Evolution)

### Phase 1 — 基础架构 (已完成)
- **技术选型**：NestJS + Prisma + PostgreSQL + React Native
- **核心模块**：Auth, Bills, Categories, Accounts, Budgets, FinancialGoals, AI, AppVersion
- **AI 架构**：多模型适配器（Claude / OpenAI / DeepSeek / Qwen）+ SSE 流式响应 + Tool Calling
- **数据库**：PostgreSQL，Prisma ORM，基础模型（User, Bill, Category, Account, Budget, FinancialGoal, AIModelConfig, ChatSession, ChatMessage）

### Phase 2 — 商户管理升级 (已完成)
- **Schema 演进**：新增 Customer 模型、Bill 增加 credit 类型、批量结算字段
- **新增模块**：Customers（CRUD + 客户账单历史 + 未结清赊账查询）
- **Bills 模块更新**：credit 类型支持、批量结算 API（`POST /bills/settle-batch`）、首页统计 API
- **AI 工具更新**：赊账/客户/结算工具 + 农资场景系统 Prompt

### Phase 3 — Web 商户管理后台 (已完成)
- **技术选型**：React + Vite + TypeScript + Ant Design
- **核心页面**：登录、首页仪表盘、账单管理、客户管理、统计分析
- **特色功能**：赊账批量结算、客户详情页、图表展示（recharts）

### 移动端迭代 (已完成)
- **赊账/还款**：客户管理页面、CustomerPicker、批量结算
- **TTS 语音播报**：记账/结算成功播报
- **农资场景 AI 适配**：赊账概览仪表盘

---

## 2. 当前技术债 (Active Tech Debt)

### 🔴 高优先级

| 编号 | 描述 | 影响 | 建议方案 | 来源 |
|------|------|------|----------|------|
| TD-001 | GitHub 推送权限未配置 | 代码无法同步到远程仓库，团队协作受阻 | 配置 GitHub Personal Access Token | — |
| TD-002 | AI 创建账单为"确认制"（不直接入库） | `executeCreateBills` 只做数据丰富，不持久化 | 这是设计决策，需确保前端确认流程健壮 | — |
| TD-003 | AI 删除账单为"直接执行" | `executeDeleteBills` 直接删除，无确认步骤 | 建议增加删除确认机制，防止误删 | — |
| TD-012 | JWT 密钥硬编码默认值 | 生产环境漏配则任何人可伪造 token | 启动时强制要求 JWT_SECRET 环境变量，缺失则拒绝启动 | @Code-Reviewer |
| TD-013 | 硬编码测试用户密码（生产后门） | `ensureUserExists()` 自动创建 testuser/123456 | 彻底移除，用户创建仅通过注册流程 | @Code-Reviewer |
| TD-014 | CORS `origin: '*'` 跨域完全开放 | 任何域都可以向 API 发起带凭据请求 | 限制为已知前端域名列表 | @Code-Reviewer |
| TD-015 | 批量结算缺少事务保护 | settleBatch() 验证/更新/查询三步无事务包裹，故障时数据不一致 | 使用 `prisma.$transaction()` 包裹 | @Code-Reviewer |
| TD-016 | JWT Token 明文存储在 localStorage | 易受 XSS 攻击窃取 token | 使用 HttpOnly Cookie 或内存存储 + refresh token 机制 | @Code-Reviewer |
| TD-017 | 移动端 Token 存储不加密 | AsyncStorage + SharedPreferences 均不加密 | 使用 Keychain (iOS) / EncryptedSharedPreferences (Android) | @Code-Reviewer |
| TD-018 | 批量结算无二次确认和金额校验 | SettleBatchModal 直接执行结算，无确认步骤 | 财务操作必须有金额核对和二次确认 | @Code-Reviewer |
| TD-019 | 移动端完全没有 Error Boundary | 未捕获错误导致应用崩溃且无法恢复 | 添加全局 Error Boundary | @Code-Reviewer |
| TD-020 | API 默认 URL 使用 HTTP | 生产环境必须强制 HTTPS | 生产构建强制 HTTPS | @Code-Reviewer |

### 🟡 中优先级

| 编号 | 描述 | 影响 | 建议方案 | 来源 |
|------|------|------|----------|------|
| TD-004 | 旧版 AI 解析接口 (`AIService.parseBills`) 与新版对话接口 (`ChatService`) 并存 | 两套入口增加维护成本 | 逐步废弃旧接口，统一到 ChatService | — |
| TD-005 | BILL_PARSE_PROMPT 中硬编码了分类列表 | 新增分类后 Prompt 不会自动更新 | 已在新版 ChatService 中动态注入分类，旧接口需同步 | — |
| TD-006 | ChatSession 摘要压缩阈值固定 (20条) | 不同使用场景可能需要不同阈值 | 考虑做成可配置项 | — |
| TD-007 | 移动端 BillType 增加 credit 后的类型兼容 | 部分旧代码可能未处理 credit 类型 | 全面检查所有 BillType switch/if 分支 | — |
| TD-021 | Service 层统一抛 Error 而非 NestJS 异常类 | 所有错误都变 400，无法区分业务异常和系统错误 | 使用 NestJS HttpException 子类 | @Code-Reviewer |
| TD-022 | 删除客户时未检查关联赊账 | onDelete: SetNull 导致赊账变孤儿记录 | 删除前检查关联账单，或级联处理 | @Code-Reviewer |
| TD-023 | 分页未限制上限 | limit=999999 潜在 DoS | 设置合理上限（如 100） | @Code-Reviewer |
| TD-024 | 统计接口 credit 类型未纳入收支计算 | 赊账数据在统计中缺失 | 将 credit 类型纳入统计逻辑 | @Code-Reviewer |
| TD-025 | 日期处理有时区偏移风险 | UTC vs 本地时间不一致 | 统一时区处理策略 | @Code-Reviewer |
| TD-026 | Web 路由守卫仅检查 token 存在性 | 不验证 token 有效性，过期 token 仍可访问 | 添加 token 有效性验证 | @Code-Reviewer |
| TD-027 | 客户/赊账列表未使用 React Query | 每次进入页面重新请求，体验差 | 迁移到 React Query 缓存 | @Code-Reviewer |
| TD-028 | 大量 any 类型（约 70 处） | 类型安全缺失 | 逐步替换为具体类型 | @Code-Reviewer |
| TD-029 | 金额计算使用浮点数 | 财务应用精度问题 | 使用整数(分)运算 | @Code-Reviewer |
| TD-030 | 搜索无防抖(debounce) | 快速输入产生大量请求 | 添加 debounce | @Code-Reviewer |

### 🟢 低优先级

| 编号 | 描述 | 影响 | 建议方案 | 来源 |
|------|------|------|----------|------|
| TD-008 | 缺少 CONTRIBUTING.md | 社区贡献者无规范指引 | 编写贡献指南 | — |
| TD-009 | 缺少静态 API 文档 | 仅有 Swagger，离线查阅不便 | 生成 Markdown 格式 API 文档 | — |
| TD-010 | 缺少生产环境部署指南 | Docker Compose、Nginx 配置等未文档化 | 编写部署指南 | — |
| TD-011 | 测试覆盖率低 | 目前仅有 1 个测试套件 | 逐步补充单元测试和集成测试 | — |
| TD-031 | 响应格式双重包装 | Interceptor + Controller 手动包装，应选其一 | 统一为一种方式 | @Code-Reviewer |
| TD-032 | UpdateBillDto 允许改为 credit 但不强制关联客户 | 赊账类型无客户关联，数据不完整 | credit 类型强制要求 customerId | @Code-Reviewer |
| TD-033 | init-defaults 端点标记 @Public() | 无需认证即可调用，潜在滥用风险 | 评估是否需要认证保护 | @Code-Reviewer |
| TD-034 | Prisma schema BillType 使用 VarChar 而非 enum | 类型安全性差 | 迁移为 Prisma enum | @Code-Reviewer |
| TD-035 | Customer.phone 缺少唯一性约束 | 可能创建重复客户 | 添加唯一约束 | @Code-Reviewer |
| TD-036 | Customer.findAll 缺少分页 | 客户量大时性能问题 | 添加分页参数 | @Code-Reviewer |
| TD-037 | 移动端 API 端点硬编码 URL 字符串 | 维护困难，易出错 | 集中管理 API 端点 | @Code-Reviewer |
| TD-038 | 重复的 axios 实例和未使用的 BaseApiService | 代码冗余 | 统一 API 调用层 | @Code-Reviewer |
| TD-039 | TTS 播报可能泄露商业数据 | 公共场合播报金额和笔数 | 提供用户设置控制播报内容 | @Code-Reviewer |
| TD-040 | 移动端 HTTP 拦截器记录请求/响应体 | 生产配置错误时暴露敏感信息 | 生产环境禁用日志 | @Code-Reviewer |

---

## 3. 已知 Bug 与修复记录

| 日期 | 文件 | 问题 | 修复方式 | 修复者 |
|------|------|------|----------|--------|
| 2026-05-03 | `app.controller.spec.ts` | 测试断言与实际返回值不匹配 | 更新断言 | @test_man |
| 2026-05-03 | `useAssetsData.ts` | fallback 对象缺少 incomeCategoryStats/expenseCategoryStats | 补充字段 | @test_man |
| 2026-05-03 | `types/category.ts` | CategoryData.type 缺少 'credit' 类型 | 添加类型 | @test_man |
| 2026-05-03 | `services/api/categories.ts` | getCategories 参数类型缺少 'credit' | 扩展类型 | @test_man |
| 2026-05-03 | `lib/queryClient.ts` | QUERY_KEYS.categories.byType 参数类型缺少 'credit' | 扩展类型 | @test_man |
| 2026-05-03 | `components/business/index.ts` | 导出 BillData 应为 BillItemData | 修正导出 | @test_man |
| 2026-05-03 | `components/index.ts` | 同上 | 修正导出 | @test_man |
| 2026-05-03 | `screens/reports/DailyView.tsx` | 导入 BillData 应为 BillItemData | 修正导入 | @test_man |
| 2026-05-03 | `screens/dashboard/DashboardScreen.tsx` | navigation.navigate 类型断言问题 | 修正类型 | @test_man |
| 2026-05-03 | `hooks/useCategories.ts` | getCategories 调用类型不匹配 | 修正调用 | @test_man |
| 2026-05-03 | `components/modals/index.ts` | 重复导出 CustomerFormModal | 去重 | @test_man |

---

## 4. 数据库 Schema 变更追踪

### Phase 1 → Phase 2 变更

**新增模型**：
- `Customer` — 农户/客户档案（id, name, phone, address, notes, balance, userId）

**Bill 模型变更**：
- `type` 字段新增值：`credit`（赊账）
- 新增 `customerId` 字段：关联客户
- 新增 `paymentMethod` 字段：支付方式（WECHAT/ALIPAY/CASH/CREDIT）
- 新增 `settledAt` 字段：结算时间
- 新增 `isSettled` 字段：是否已结清

**新增 API 端点**：
- `POST /bills/settle-batch` — 批量结算
- `GET /bills/statistics/home` — 首页统计
- `GET/POST/PUT/DELETE /customers/*` — 客户管理 CRUD
- `GET /customers/:id/bills` — 客户账单历史
- `GET /customers/:id/unsettled-bills` — 客户未结清赊账

---

## 5. 依赖版本关注

| 依赖 | 当前版本 | 关注事项 |
|------|----------|----------|
| React Native | 0.81 | 关注新版本升级路径 |
| NestJS | 10 | 稳定版本，暂无升级需求 |
| Prisma | 6 | 关注 Schema 迁移兼容性 |
| React Query | 5 | TanStack Query v5 API 稳定 |
| Ant Design | 5.x | Web Dashboard 使用 |

---

## 6. 维护检查清单

### Critical（必须修复）
- [ ] 移除硬编码测试用户 + 强制 JWT_SECRET 环境变量（TD-012/013）
- [ ] 批量结算添加事务包裹（TD-015）
- [ ] CORS 限制为已知域名（TD-014）
- [ ] 移动端批量结算添加二次确认（TD-018）
- [ ] Token 存储加密（TD-017）
- [ ] 添加 Error Boundary（TD-019）
- [ ] 生产环境强制 HTTPS（TD-020）

### High（应该修复）
- [ ] 配置 GitHub push 权限（TD-001）
- [ ] JWT Token 存储改用 HttpOnly Cookie（TD-016）
- [ ] 全面检查 credit 类型兼容性（TD-007）

### Medium（建议修复）
- [ ] Service 层异常改用 NestJS HttpException（TD-021）
- [ ] 删除客户前检查关联赊账（TD-022）
- [ ] 分页限制上限（TD-023）
- [ ] 统计接口纳入 credit 类型（TD-024）
- [ ] 统一时区处理策略（TD-025）
- [ ] Web 路由守卫验证 token 有效性（TD-026）
- [ ] 客户/赊账列表迁移到 React Query（TD-027）
- [ ] 清理 any 类型（TD-028）
- [ ] 金额改用整数分运算（TD-029）
- [ ] 搜索添加防抖（TD-030）
- [ ] 评估旧版 AI 解析接口废弃时机（TD-004）
- [ ] ChatSession 压缩阈值可配置化（TD-006）

### Low（改进建议）
- [ ] 补充单元测试和集成测试（TD-011）
- [ ] 编写 CONTRIBUTING.md（TD-008）
- [ ] 生成静态 API 文档（TD-009）
- [ ] 编写生产环境部署指南（TD-010）
- [ ] Prisma BillType 迁移为 enum（TD-034）
- [ ] Customer.phone 添加唯一约束（TD-035）
- [ ] Customer.findAll 添加分页（TD-036）
- [ ] 移动端 API 端点集中管理（TD-037）
- [ ] TTS 播报内容用户可控（TD-039）
- [ ] 生产环境禁用请求/响应体日志（TD-040）

---

*本文档由 Doc-Writer 维护，最后更新：2026-05-03（已整合 @Code-Reviewer 审查报告）*
