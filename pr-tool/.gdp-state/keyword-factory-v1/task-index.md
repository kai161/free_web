# Execution Plan / Task Index

| Task | 状态 | 实质动作 | Value Target | 对应 S/F | 约束 | 验证 | 可逆性 |
|---|---|---|---|---|---|---|---|
| T001 | done | 建立目标状态、schema 和评分口径 | V1,V3,V5/P0 | S3,S4,S6; F1,F2,F4,F5 | C001-C004 | schema、状态文件与评分文档检查通过 | reversible |
| T002 | done | 建立 200 工具与 10 市场种子 | V2,V5/P0 | S1,S2; F6 | C004,C005 | 200 工具、10 市场、唯一性通过 | reversible |
| T003 | done | 建立 10×10 本地化 head term 与关键词候选 | V4,V5/P0 | S5; F3,F6 | C003,C005 | 100 head terms、1,000 候选、pending 隔离通过 | reversible |
| T004 | done | 构建 SQLite、CSV 与分析工作簿 | V1,V2,V3/P0 | S1-S4; F1,F2,F4,F5 | C001,C004 | 构建、查询、公式与 9 个 sheet 视觉验证通过 | reversible |
| T005 | in_progress | 接入合法的真实关键词指标导入 | V1,V2,V3/P0 | S2-S4; F1,F2 | C001 | 导入器与 dry-run/apply 测试通过；真实数据待提供 | reversible |
| T006 | in_progress | Wave 1 母语与 SERP 验证 | V2,V4/P0 | S2,S5; F3 | C003 | 50 个核心词公开结果样本完成；母语复核与真实排名仍待完成 | reversible |
| T007 | pending | 扩展至 200×10×约10 的 20k 关键词 | V2,V3,V4/P1 | S1-S5; F1-F6 | C001-C005 | 20k coverage gate | reversible |
