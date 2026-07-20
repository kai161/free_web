# Evidence Matrix

| Claim | Evidence | Status | Freshness | Risk |
|---|---|---|---|---|
| 目标和数据边界已文件化 | `goal-contract.md`、`constraints.md` | pass | fresh | 后续用户变更需更新 |
| 当前仓库是 pt-BR 静态站 | 仓库文件名与页面内容；`reality-map.md` | pass | fresh | 尚未分析站点流量 |
| 已有 200 个候选工具 | `manifest.json` counts；构建测试 | pass | fresh | 编辑级属性仍需数据校准 |
| 已有 10 个市场 | `manifest.json` counts；Markets sheet | pass | fresh | 市场顺序是待验证假设 |
| 已有首批本地关键词 | 100 head terms；1,000 candidates；Keywords sheet | pass | fresh | 47 个核心词公开样本已复核，仍未 native verified |
| Wave 1 公开结果审计可复查 | `serp_assessments` 50 行；`SERP Audit` sheet；研究报告 | pass | 2026-07-17 | 代表 URL 不是精确 Google 排名 |
| 无付费平台时的查询信号可复查 | `public_query_signals` 16 行；`Public Signals` sheet；公开信号报告 | pass | 2026-07-17 | 自动补全是措辞/意图代理，不是搜索量 |
| 真实 SEO 指标未伪造 | metric snapshots=0；来源与空值约束测试 | pass | fresh | 真实指标仍缺失 |
| 数据库完整可查询 | SQLite integrity=ok；foreign_key_errors=0 | pass | fresh | 无外部数据库引擎复核 |
| 指标可安全增量导入 | 3 个 unittest；dry-run 默认模式 | pass | fresh | 尚无真实供应商样本 |
| Wave 1 数据请求范围可执行 | `wave1-keyword-metrics-request.xlsx`；89 个词；3 sheet 视觉检查；xlsx archive | pass | 2026-07-17 | 等待用户上传平台原始导出 |
| 工作簿可读且公式无误 | 10 sheet 渲染；公式错误 0；`unzip -t` | pass | fresh | 无 LibreOffice 重算验证 |
| 当前 checkpoint 验收 | `evidence/light-v-2026-07-17.md` | partial | fresh | 完整 V sub-agent 未返回，验收已降级 |
