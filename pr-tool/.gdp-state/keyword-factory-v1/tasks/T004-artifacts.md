# T004 构建 SQLite、CSV 与分析工作簿

## 目标

交付可查询数据库与面向负责人决策的工作簿。

## 对应 S/F

- S1–S4
- F1、F2、F4、F5

## 约束

- C001、C004

## 输入

- schema、工具、市场、本地化和模式数据

## 输出

- `outputs/keyword-factory-v1/global-tool-opportunities-v1.sqlite3`
- `outputs/keyword-factory-v1/global-tool-opportunities-v1.xlsx`
- CSV 导出与 manifest

## 执行记录

- 工作簿包含 Dashboard、Priority Shortlist、Tools、Markets、Keywords、Localization Coverage、Sources、Scoring。
- 第一轮视觉检查发现 shortlist 为空和指标误计；修复后第二轮检查通过。

## 验证命令

- `unzip -t outputs/keyword-factory-v1/global-tool-opportunities-v1.xlsx`
- 工作簿公式错误扫描
- 8 个 sheet 渲染预览

## 验证结果

- pass：XLSX 压缩包完整；公式错误 0；所有 sheet 已视觉检查。

## 遗留风险

- 当前环境无 LibreOffice，未执行第二个办公软件引擎的重算验证。

## 下一步

- T005 导入真实指标。

