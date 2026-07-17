# T003 建立 10×10 本地化 head term 与关键词候选

## 目标

为 10 个 MVP 工具建立 10 个市场的编辑级 head term，并用当地模式扩展首批候选。

## 对应 S/F

- S5
- F3、F6

## 约束

- C003、C005

## 输入

- 10 个 MVP 工具
- 10 个市场
- 每个市场 10 个意图模式

## 输出

- 2,000 个工具×市场槽位
- 100 个 `editor_reviewed` head term
- 1,900 个明确 `pending` 槽位
- 1,000 个关键词候选

## 执行记录

- 没有用英文占位填充 pending 市场。
- 关键词状态未提升为 native/serp verified。

## 验证命令

- `python3 scripts/build_keyword_factory.py`

## 验证结果

- pass：1,000 个唯一市场关键词；pending localization 没有生成关键词。

## 遗留风险

- 100 个 head term 仍需母语与真实 SERP 复核。

## 下一步

- T004 构建可筛选产物。

