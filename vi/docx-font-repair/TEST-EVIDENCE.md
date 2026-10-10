# 验收证据

## 发布前复核 — 2026-10-10

- 实际用户 Mac Chrome 打开临时只读服务 `http://127.0.0.1:8876/docx-font-repair/tests.html`，页面显示 **28 passed · 0 failed**，包含任意大小写 Unicode 回归和 3 组独立 DOCX 夹具。
- `node --test vi/docx-font-repair/regression.test.cjs`：**13 passed · 0 failed**。
- 本目录全部 JS/CJS 的 `node --check` 和 `git diff --check` 通过。
- 本次发布复核没有重做 Word/Pages 排版实测；以下 2026-10-08 记录是历史验收，其时间边界仅适用于当时。
- 用户现已明确授权将工具及首页入口提交推送，并由已有 Vercel 项目自动部署。

# 历史验收 — 2026-10-08

## 最终修复

独立已知答案 `TâM` 在旧实现返回 `TõM`，Node assert 先确认失败；随后取消大小写门槛，任何可能正确的 Unicode 都优先保留。没有改回词白名单，没有盲转。

## 测试结果与时间边界

- 修复前完整 Chrome suite：**24 passed · 0 failed**。真实用户 Mac，临时只读 `127.0.0.1:8765` 服务，无新安装。
- 修复后 Node 独立回归：**13 passed · 0 failed**，包含 8 组公开独立答案、一般词转换、三种字体下的任意大小写/®/©/外语控制、未知字符及组合音标保留。
- 重跑命令：`node --test vi/docx-font-repair/regression.test.cjs`。
- `core.js`、`tests.js`、`app.js`、`demo.js` 语法检查通过。
- `tests.html` 现新增混合大小写回归，完整浏览器 suite 应有 25 项；**不能声称本次 25 项已通过**。恢复时原标签不存在，原临时服务连接拒绝；未启动额外服务、未继续长时间等待。用户可用 README 的可选本地方式重跑。

## 已实际完成的界面操作

- 内置示例：17 项建议修改 / 7 项保留，含 VNI 明确警告。
- 取消首项：16/17；中文切换后取消状态保留。
- 全部取消：0/17；另存成功。全部选择：17/17；再次另存成功。
- 重新开始后再次试用：17/17，数据未累计。
- 真实下载文件存在，ZIP CRC 与 XML 独立验证通过。没有依赖浏览器 download 事件等待的成功来证明下载。
- 文件选择回载自动化在等待时中断，未完成；未声称通过。直接 file:// 的自动化受浏览器工具策略限制，未尝试绕过。

## 独立下载检查

使用 Python 标准库 `zipfile.testzip()`、ElementTree XML 解析及 ZIP 本地记录逐字节比较，不调用浏览器的 ZIP/XML实现。

3 个文件均：CRC 完整；全部 XML 可解析；表格 1 个、drawing 图片节点 1 个；5 个未修改资源的解压内容和原始 ZIP 本地记录均一致。

首项取消文件中 `chµo` 未改变，仍继承 `Legacy -> .VnTime`，其余所选词转成 Unicode。全部取消文件与原始内置示例**整包逐字节一致**。全部选择文件中问候、H 大写格言、跨 run 的 nước 和表格文字符合手工答案。所有文件中的正确 Unicode/外语/®/© 与 VNI 控制均原样保留。

文件哈希与结果：

```json
[
  {
    "file": "/Users/kai/Downloads/mau-tcvn3-unicode.docx",
    "bytes": 9224,
    "sha256": "ce3184c1d2ea4fbe36d022986e7b794463960e1ce00ca38d2f1491be4aa9558e",
    "CRC": "PASS",
    "XML": "PASS",
    "unchanged_resources": "5/5 byte-identical local records",
    "selection": "first item canceled; original inherited font retained"
  },
  {
    "file": "/Users/kai/Downloads/mau-tcvn3-unicode (1).docx",
    "bytes": 5315,
    "sha256": "befd8fb73579359ea4b9d04e713fdb77beffb86fd2fb033f96379fe6903e9d8c",
    "CRC": "PASS",
    "XML": "PASS",
    "unchanged_resources": "5/5 byte-identical local records",
    "selection": "all canceled (entire file byte-identical)"
  },
  {
    "file": "/Users/kai/Downloads/mau-tcvn3-unicode (2).docx",
    "bytes": 9440,
    "sha256": "233509407804975cbc358fcce95246ae86c2b834e9ae80c201dd34ef693540ed",
    "CRC": "PASS",
    "XML": "PASS",
    "unchanged_resources": "5/5 byte-identical local records",
    "selection": "all selected"
  }
]
```

## 验证边界

这些下载产生于本次大小写修复之前；修复后通过 Node 复核了同一组独立样本文字和新增 Unicode 回归，没有声称再次完成浏览器导出。ZIP/XML可解析不等于已在 Microsoft Word/Pages 中视觉验收。未测真实用户文件、真实语料准确率或分页视觉一致性。

最终工作树：只新增/修改 `vi/docx-font-repair/`；原 .DS_Store、.idea、pr-tool 的暂存/未跟踪改动保留。不提交、不推送、不部署。临时服务恢复时已不可连接；没有保留任务服务器。
