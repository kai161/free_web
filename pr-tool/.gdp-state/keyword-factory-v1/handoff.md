# Handoff

## 当前目标

建立全球工具站机会数据库 v1，并先交付可运行的基础设施和首批 MVP 数据。

## 当前 task

T005：指标导入机制已完成，等待真实指标数据；T006 已完成 50 个核心查询的公开结果样本，母语复核与真实 Google 排名数据仍待完成。

## 最近证据

- SQLite：200 tools、10 markets、2,000 localizations、1,000 candidates、50 SERP assessments，integrity=ok。
- 自动化测试：3/3 pass。
- 工作簿：9 个 sheet，全部视觉检查通过，公式错误 0，xlsx archive 正常。
- SERP 研究队列：5 R0、38 R1、2 R2、2 RECHECK_INTENT、3 REJECT_INTENT。
- 当前两个 MVP 假设：越南隐私型实用工具簇；印尼业务型 QR 工具。
- 真实指标：0 行，符合禁止伪造约束。
- 验收：轻 V `partial / locally_verified`；完整 V sub-agent 未返回，已记录降级风险。

## 未完成事项

- T005 真实数据导入、T006 Wave 1 母语复核与真实排名深审、T007 20k 扩展。

## 下一步建议

优先获取 Google Ads Keyword Ideas 或可信 SEO 工具导出：先覆盖 5 个 R0、越南/印尼 JSON 与 Password 变体，以及韩国/越南发票修正词；dry-run 后再决定是否扩大到 500 个候选。

## 已知风险

生成型关键词只能作为候选，不等于有真实需求；真实指标和当地意图验证是发布 gate。
