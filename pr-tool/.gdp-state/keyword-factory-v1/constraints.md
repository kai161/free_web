# Constraints

## C001 禁止伪造外部 SEO 指标

- 来源：目标推导
- 类型：硬约束
- 影响范围：关键词指标、评分、工作簿
- 状态：active
- 说明：无来源的 search_volume、cpc、keyword_difficulty 必须为空。

## C002 保护现有工作区修改

- 来源：仓库现状与用户偏好
- 类型：硬约束
- 影响范围：文件修改、Git
- 状态：active
- 说明：不覆盖现有页面和用户未跟踪文件，不执行 commit/push。

## C003 本地化需要状态分层

- 来源：S5,F3
- 类型：硬约束
- 影响范围：tool_market_localizations、keyword_candidates
- 状态：active
- 说明：generated、editor_reviewed、native_verified、serp_verified 必须可区分。

## C004 评分必须可审计

- 来源：S2,F4
- 类型：硬约束
- 影响范围：评分公式、工作簿、文档
- 状态：active
- 说明：权重、输入和缺失值策略需公开。

## C005 首批验证市场

- 来源：用户 MVP 建议与当前葡语站点现状
- 类型：可协商约束
- 影响范围：首批关键词
- 状态：active
- 说明：Brazil、Japan、South Korea、Indonesia、Vietnam 为 Wave 1；其余五国为候选扩展。

