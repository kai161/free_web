# T002 建立 200 工具与 10 市场种子

## 目标

建立稳定、唯一、可评分的候选工具与市场目录。

## 对应 S/F

- S1、S2
- F6

## 约束

- C004、C005

## 输入

- 用户建议的 10 个国家
- 当前 pt-BR 站点现状
- 10 个工具类别的编辑级候选

## 输出

- `scripts/build_keyword_factory.py`
- SQLite `tools`、`markets`、`categories`
- `outputs/keyword-factory-v1/tools.csv`
- `outputs/keyword-factory-v1/markets.csv`

## 执行记录

- 建立 10 个分类，每类 20 个工具，共 200 个唯一 slug。
- Wave 1：BR、JP、KR、ID、VN；Wave 2：DE、FR、ES、TH、TR。

## 验证命令

- `python3 scripts/build_keyword_factory.py`
- `python3 -m unittest tests/test_keyword_factory.py`

## 验证结果

- pass：200 工具、10 市场；SQLite integrity 与外键检查通过。

## 遗留风险

- 工具和市场优先级仍是研究假设，需真实指标重排。

## 下一步

- T003 建立 MVP 本地关键词。

