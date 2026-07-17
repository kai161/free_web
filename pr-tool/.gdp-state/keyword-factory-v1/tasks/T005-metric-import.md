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
- 后续合法数据源导出

## 输出

- `scripts/import_keyword_metrics.py`
- `outputs/keyword-factory-v1/metric-import-template.csv`

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

## 遗留风险

- 不同供应商字段和难度口径需要映射适配。

## 下一步

- 获取 Google Ads/Ahrefs/Semrush/DataForSEO 导出，先对 Wave 1 500 个候选执行 dry-run。

