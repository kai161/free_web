# T006 · Wave 1 母语与 SERP 验证

状态：in_progress

## 已完成

- 10 个 MVP 工具 × BR/JP/KR/ID/VN 的 50 个核心查询公开结果样本。
- 每个组合记录 query intent、competition strength、localization gap、代表 URL 与观察结论。
- 建立独立 `SERP Research Score`，不冒充 Evidence Score。
- 3 个 WhatsApp 非本地核心词标记 `REJECT_INTENT`。
- 韩国、越南发票核心词标记 `RECHECK_INTENT`。
- 审计进入 SQLite、CSV、Excel 和研究报告。

## 待完成

- 当地母语人员复核 47 个保留核心词。
- 使用固定 locale/device 的真实 Google 前 10 结果深审。
- 获取真实搜索量、CPC、广告竞争和 SEO difficulty。
- 修正韩国、越南发票词，再重新审计。

## 验证证据

- `data/keyword-factory/wave1-serp-audit.csv`：50 行。
- `outputs/keyword-factory-v1/global-tool-opportunities-v1.sqlite3`：`serp_assessments=50`。
- `outputs/keyword-factory-v1/global-tool-opportunities-v1.xlsx`：`SERP Audit` sheet。
- `docs/keyword-factory/wave1-serp-audit-2026-07-17.md`。
