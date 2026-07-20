# T005 接入合法的真实关键词指标导入

## 目标

允许 Google Ads 或其他已登记来源的指标以 dry-run/apply 方式增量导入。

## 对应 S/F

- S2–S4
- F1、F2、F5

## 约束

- C001

## 输入

- `metric-import-template.csv`
- `wave1-keyword-metrics-request.xlsx`（89 个优先采集词）
- 后续合法数据源导出

## 输出

- `scripts/import_keyword_metrics.py`
- `outputs/keyword-factory-v1/metric-import-template.csv`
- `outputs/keyword-factory-v1/wave1-keyword-metrics-request.xlsx`

## 执行记录

- 默认 dry-run；显式 `--apply` 才写入。
- provider 必须在 sources 注册。
- 验证关键词+市场、数值范围、observed/no_data 语义和重复快照。

## 验证命令

- `python3 -m unittest tests/test_keyword_factory.py`
- `python3 scripts/import_keyword_metrics.py .../database .../metric-import-template.csv`

## 验证结果

- 机制 pass：3 个测试通过，空模板 dry-run 通过。
- 数据 pending：真实指标 0 行，等待合法数据源。
- 请求包 pass：BR 10、ID 30、VN 44、KR 5，共 89 个词；3 个 sheet 完成视觉检查，xlsx archive 正常。

## 遗留风险

- 不同供应商字段和难度口径需要映射适配。

## 下一步

- 用户上传 4 份分市场 Google Ads 原始导出；推荐再上传 4 份 Semrush/Ahrefs 原始导出。
- 先对 89 个优先词执行 dry-run，通过后再决定是否扩大到 500 个候选。
