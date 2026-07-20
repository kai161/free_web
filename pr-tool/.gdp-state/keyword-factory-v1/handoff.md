# Handoff

## 当前目标

建立全球工具站机会数据库 v1，并先交付可运行的基础设施和首批 MVP 数据。

## 当前 task

T005：指标导入机制保留，但用户当前没有付费关键词平台；T008 已用 16 个公开查询信号收敛 MVP；下一步进入越南图片压缩轻量原型和巴西/印尼 QR 落地页验证。

## 最近证据

- SQLite：200 tools、10 markets、2,000 localizations、1,000 candidates、50 SERP assessments、16 public query signals，integrity=ok。
- 自动化测试：3/3 pass。
- 工作簿：10 个 sheet，新增 `Public Signals`，视觉检查通过，公式错误 0，xlsx archive 正常。
- SERP 研究队列：5 R0、38 R1、2 R2、2 RECHECK_INTENT、3 REJECT_INTENT。
- 当前 MVP 收敛：越南图片压缩轻量原型；巴西 Pix/WhatsApp QR 与印尼通用 QR 先做落地页测试。
- 真实指标：0 行，符合禁止伪造约束。
- 数据请求包仍保留为未来选项；当前不要求用户购买或注册关键词平台。
- 验收：轻 V `partial / locally_verified`；完整 V sub-agent 未返回，已记录降级风险。

## 未完成事项

- 越南图片压缩原型、巴西/印尼 QR 落地页、Search Console 一手数据验证；T006 母语复核与 T007 20k 扩展仍未完成。

## 下一步建议

直接实现越南图片压缩的最小原型与 4–6 个差异化页面；同步准备巴西/印尼 QR 场景落地页。上线后接入 Search Console，以 4–8 周真实曝光、查询词和点击决定扩展方向。

## 已知风险

生成型关键词只能作为候选，不等于有真实需求；真实指标和当地意图验证是发布 gate。
