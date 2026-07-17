# T001 建立目标状态、schema 和评分口径

## 目标

把长期目标、数据可信度边界、评分规则和持续更新结构落盘。

## 对应 S/F

- S3、S4、S6
- F1、F2、F4、F5

## 约束

- C001–C004

## 输入

- 用户当前方案与共享对话
- 当前仓库状态
- Google Ads、Google Trends、Ahrefs 公开资料

## 输出

- `.gdp-state/keyword-factory-v1/`
- `docs/keyword-factory/`
- `data/keyword-factory/`

## 执行记录

- 2026-07-17：初始化 Long 任务状态目录。

## 验证命令

- `find .gdp-state/keyword-factory-v1 -type f | sort`

## 验证结果

- pass：状态文件齐全，schema 已创建，评分与可信度边界已文档化。

## 遗留风险

- 真实指标来源尚未授权。

## 下一步

- T002–T004 已完成；T005 等待真实指标数据源。

