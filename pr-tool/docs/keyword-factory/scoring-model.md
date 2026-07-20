# 机会评分模型

## 两阶段评分

### 阶段一：Heuristic Score

真实 SEO 指标缺失时，只根据工具固有属性和市场适配做早期排序：

```text
heuristic_score =
  commercial_intent      × 22%
  localization_leverage  × 18%
  recurring_use          × 12%
  paid_fit               × 12%
  market_priority        × 14%
  static_delivery_fit    × 10%
  (6 - build_complexity) × 7%
  (6 - competition)      × 5%
```

所有输入为 1–5，最终归一化到 0–100。这个分数是“先查什么”的排序，不是 SEO 成功概率。

### 阶段二：Evidence Score

取得真实指标后重新计算：

```text
evidence_score =
  normalized_search_volume × 22%
  normalized_cpc           × 13%
  commercial_intent        × 15%
  (100 - seo_difficulty)   × 18%
  serp_weakness             × 12%
  localization_quality      × 10%
  buildability              × 10%
```

缺少搜索量、CPC、SEO 难度或 SERP 数据时，`evidence_score` 保持为空；不使用 0 代替未知值。

## SERP Research Score（研究排序，不是证据评分）

Wave 1 公开搜索结果审计完成后，使用一个独立分数决定“下一批先验证什么”：

```text
serp_research_score =
  commercial_intent          × 25%
  localization_gap           × 25%
  static_delivery_fit        × 15%
  query_intent_fit           × 20%
  (6 - competition_strength) × 15%
```

所有输入为 1–5，最终归一化到 0–100。这个分数不包含搜索量、CPC 或 SEO difficulty，因此不能替代 `evidence_score`，也不能被称为成功概率。

- `R0`：≥ 75，优先获取真实指标和做人工 SERP 深审。
- `R1`：60–74.99，作为工具簇或第二批验证。
- `R2`：< 60，暂缓。
- `RECHECK_INTENT`：意图匹配度为 2–3，必须先修正本地关键词。
- `REJECT_INTENT`：意图匹配度为 1，当前核心词拒绝进入开发队列。

## 优先级

- P0：分数 ≥ 80，且数据可信度达到发布/验证 gate。
- P1：65–79.99。
- P2：50–64.99。
- P3：< 50。
- `UNRANKED`：关键数据缺失，不能进入 evidence 排名。

## 风险说明

- SEO 工具的 difficulty 口径并不完全相同，指标必须保留 provider。
- CPC 与商业价值相关但不是等价关系。
- SERP 有大站不一定代表不可做；需要结合结果意图、工具质量和本地化缺口。

## 公开查询信号（非评分指标）

当付费关键词平台不可用时，可以记录自动补全的精确词命中、预测场景和措辞宽度，用于改词、聚类和安排落地页实验。但这些字段：

- 不进入 `Evidence Score`；
- 不转换为搜索量或 SEO difficulty；
- 不用 suggestion_count 跨市场比较绝对需求；
- 必须保留查询文本、预测列表、地域/语言、采集时间和来源。

公开信号的决策状态为 `PROMOTE`、`CLUSTER`、`RECHECK`、`REWORD`、`HOLD`，它们只控制下一步验证动作。
