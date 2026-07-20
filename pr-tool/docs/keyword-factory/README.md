# 全球工具站机会数据库 v1

这个目录描述 Keyword Factory 的数据口径、评分模型、研究流程和发布 gate。可执行数据库与工作簿由 `scripts/build_keyword_factory.py` 和 `scripts/build_keyword_workbook.mjs` 生成。

## 当前交付阶段

第一轮先交付：

- 200 个候选工具目录；
- 10 个目标市场；
- 10 个 MVP 工具在 10 个市场的本地化 head term；
- Wave 1（Brazil、Japan、South Korea、Indonesia、Vietnam）的首批关键词候选；
- SQLite、CSV 和 Excel 决策工作簿；
- Wave 1 的 50 个核心查询公开 SERP 样本与研究优先级；
- BR、ID、VN、KR 的 16 个焦点查询公开自动补全观察；
- 真实指标导入所需的来源、时间和状态字段。

这不是“20,000 个关键词已经完成调研”的声明。只有通过真实指标导入、当地意图与 SERP 复核的关键词，才允许进入页面生产。

## 数据分层

1. **Catalog**：工具与市场的稳定主数据。
2. **Localization**：工具在市场中的本地 head term，带翻译验证状态。
3. **Candidate**：由 head term 与当地意图模式扩展的关键词候选。
4. **Metrics**：来自 Google Ads、Ahrefs、Semrush、DataForSEO 等的指标快照。
5. **Validation**：母语、SERP 和发布 gate 状态；公开样本与真实 Google 排名必须区分。
6. **Decision**：可解释的机会评分与优先级。

## 构建与导入

重新构建数据库和 CSV：

```bash
python3 scripts/build_keyword_factory.py
```

生成真实指标导入模板：

```bash
python3 scripts/import_keyword_metrics.py \
  --write-template outputs/keyword-factory-v1/metric-import-template.csv
```

先 dry-run，再显式 apply：

```bash
python3 scripts/import_keyword_metrics.py \
  outputs/keyword-factory-v1/global-tool-opportunities-v1.sqlite3 \
  /path/to/metrics.csv

python3 scripts/import_keyword_metrics.py \
  outputs/keyword-factory-v1/global-tool-opportunities-v1.sqlite3 \
  /path/to/metrics.csv \
  --apply
```

`provider` 必须是 `sources` 表中已登记的 `source_id`。脚本会检查关键词+市场匹配、数值范围、`observed/no_data` 语义和重复快照。

## 可信度原则

- `search_volume`、`cpc`、`keyword_difficulty` 没有来源时必须为空。
- `heuristic_*` 字段只用于早期排序，不代表真实 SEO 数据。
- `serp_research_score` 只决定先补哪些数据，不代表成功概率。
- Google Trends 是相对兴趣指标，不等于绝对搜索量。
- 翻译或 AI 生成的本地词必须经过 `editor_reviewed`、`native_verified`、`serp_verified` 逐级验证。

## 资料来源

| 来源 | 用途 | URL |
|---|---|---|
| 用户提供的共享对话 | 战略方向与初始市场/规模假设 | https://chatgpt.com/share/6a59f54f-b9a0-83ec-98b9-79999c283241 |
| Google Ads Keyword Ideas | 地域/语言关键词与历史指标的首选官方来源 | https://developers.google.com/google-ads/api/docs/keyword-planning/generate-keyword-ideas |
| Google Trends Help | 跨语言、跨地区相对兴趣验证 | https://support.google.com/trends/answer/4359550 |
| Ahrefs Multilingual SEO | 地区 × 语言与本地意图方法论 | https://ahrefs.com/blog/multilingual-seo/ |

## 下一阶段 gate

当前 Wave 1 审计结论见 [wave1-serp-audit-2026-07-17.md](./wave1-serp-audit-2026-07-17.md)。

无付费平台时的公开信号验证与 MVP 收敛结论见 [wave1-public-signal-validation-2026-07-17.md](./wave1-public-signal-validation-2026-07-17.md)。

Wave 1 只有在以下条件同时满足后，才进入页面生产：

- 本地 head term 至少达到 `editor_reviewed`；
- 关键词有真实 search volume 或明确 `no_data` 结果；
- P0/P1 关键词完成 SERP 结果类型与首页竞争者复核；
- 页面提供真实可用工具，不生产只有同义改写的薄页面。
