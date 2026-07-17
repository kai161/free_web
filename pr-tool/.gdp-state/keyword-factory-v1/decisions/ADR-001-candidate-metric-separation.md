# ADR-001 候选词与真实指标分层存储

## 状态

accepted — 2026-07-17

## 背景

第一轮可以快速生成大量本地关键词候选，但搜索量、CPC、SEO 难度和 SERP 竞争必须来自外部数据。把两者放在同一行并预填估算值，会让“未知”与“真实为 0”无法区分。

## 决策

- `keyword_candidates` 只存候选文本、意图、验证状态和明确标注的启发式研究分。
- 真实指标按 provider + collected_at 存入 `keyword_metric_snapshots`，允许多供应商、多时间点共存。
- 最新快照只通过 view 展示，不覆盖历史。
- 无真实指标时保持 SQL `NULL`，不使用 0 或模型估算填充。

## 后果

- 可以审计指标来源与新鲜度，也能比较供应商口径。
- 在真实数据导入前，工作簿只能显示 Research Priority，不能产生 Evidence Priority。
- 后续页面生成器必须检查 metric 与 validation gate，不能只读取候选表。

