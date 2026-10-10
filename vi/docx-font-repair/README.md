# Sửa mã font DOCX / 越南语旧 DOCX 字体编码修复

第一版保守工具，位于现有 `free_web/vi/docx-font-repair/`，没有建立独立项目。

## 试用

用较新的 Chrome 打开本目录的 `index.html`，点击 **Thử bản mẫu có sẵn / 试用内置示例**。默认越南语，右上角切换中文。选择单个 `.docx` 后，逐词审阅前后差异；取消勾选会保留该项原文及字体。另存名为 `原名-unicode.docx`，不会覆盖输入。

经典本地脚本不使用 ES 模块、fetch、CDN 或第三方依赖，设计为可以直接打开文件。自动化浏览器工具禁止访问 file://，实际 Chrome 验收通过获准的临时 `127.0.0.1` 只读服务完成；**没有声称自动化验证过直接打开模式**。如浏览器限制本地脚本，可在仓库运行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory vi/docx-font-repair
```

再打开 `http://127.0.0.1:8765/index.html`。这是可选本地预览，非部署；验收服务在任务结束时停止。

## 实际支持范围

- TCVN3：74 个核对过的单字形字符映射；字体须明确为 `.VnTime`、`.VnArial`、`.VnCourier` 或它们的 H 大写变体。不限制固定词白名单。
- 每个词仅在原文不像可能正确的 Unicode、所有非 ASCII 字符都有映射、转换结果符合保守越南语音节结构时提出修改。正确 Unicode 优先保护，**包括任意大小写组合**。孤立字符、符号、歧义词保留并提示。
- H 字体下接受的词转成大写 Unicode；仅接受修改的片段直接覆盖为 Times New Roman。字体变化可能影响换行和分页，必须在 Word 中检查输出。
- 读取默认字体、段落/字符样式及 basedOn 继承链、直接 rFonts。支持同字体、同容器、同段落的跨 run 词，以及 `w:softHyphen` 的旧编码 ư。不会把不同字体或 tab/换行/图片两侧内容串起来。
- 扫描正文、页眉、页脚、脚注、尾注，包括表格中明确直接字体的词。未知表格样式/编号继承、冲突的 ascii/hAnsi 字体保留并提示；不猜 theme 字体。
- **VNI 只检测并原样保留**，包括跨 run 的多字符词。其他旧字体、没有明确旧字体信号的内容不尝试通用自动识别。
- 这是保守修复器，不能保证完整还原所有 TCVN3 文档。音节结构校验不是语言理解；歧义内容如 `Tù` 可能是正确 Unicode 也可能是旧编码，选择保留。不是全量盲转，不进行 OCR，不支持双字形大写组合或复杂字形恢复。

## 格式与完整性

只接受标准 DOCX ZIP，支持 stored/deflate，逐条校验 CRC 和长度。最大输入 32 MiB、展开总量 64 MiB、单条目 32 MiB、2000 条目，每部件最多 5000 个建议/提示。拒绝 ZIP64、多磁盘、加密、错误 XML、DTD/entity、路径穿越和异常继承链。

旧 DOC、PDF、密码加密文件、宏、签名、批注、修订、动态域、内容控件、复杂嵌入和不支持的 DrawingML 文本会明确拒绝。支持标准 Transitional WordprocessingML 命名空间；Strict DOCX 不在首版范围。

不重建文档内容：只在接受的文字片段上拆分 run、替换文字及局部字体，保留原 run 格式。表格、图片、关系、样式等未修改 ZIP 条目的原始本地记录和压缩数据原样复制；中央目录偏移会重算。修改的 XML 重新序列化，语义结构保留，但该 XML 部件不会逐字节相同。全部取消时返回原输入字节。每次导出从原文件重新计算，不累计修改。

## 隐私

文档页没有公共导航脚本、广告、Vercel Insights、统计、上传或第三方运行代码。CSP 禁止 connect-src；文件仅在当前页面内存处理。离开或重置后页面不保留文档。上方 FreeTools 链接会离开此隔离区域；其他项目页面没有被修改。

## 测试与证据

打开同目录 `tests.html` 自动运行。另有无需浏览器的独立回归：`node --test vi/docx-font-repair/regression.test.cjs`。2026-10-10 发布前复核：Node 回归 13/13 通过；用户 Mac Chrome 完整浏览器 suite 28/28 通过（含 3 组独立 DOCX 夹具），详见 `TEST-EVIDENCE.md`。`answers.js` 的预期值人工转录自独立公开文本，没有调用实现映射生成答案。字符表对照来源与独立准确性样本分开记录；这是有限夹具测试，不是真实文档语料准确率。

覆盖：公开已知答案、词表外一般文本、H 大写、Unicode/外语控制、混合 Unicode、任意大小写、®/©、段落/字符/默认样式继承、直接字体覆盖、跨 run、softHyphen、表格、VNI 保留、资源原始记录一致性、Python zipfile 独立 DEFLATE 夹具、重复导出、取消及异常拒绝。

已完成的界面验收：内置示例 17 项修改/7 项保留；取消第一项后 16/17，切换中文保持选择；全部取消为 0/17；全部选择为 17/17；下载和重新开始后再次试用成功。浏览器下载事件等待曾超时，采用已实际落盘的文件作独立证据，没有把等待成功当作下载证据。文件选择回载的自动化未完成，不声称验证通过。

独立 Python `zipfile.testzip()` 与 ElementTree 检查了下载 `mau-tcvn3-unicode.docx`：ZIP CRC 完整、全部 XML 可解析；`chµo` 取消后仍在原文，其余已选项输出 Unicode；Unicode/外语/® 控制及 VNI 保留。全部选择和全部取消下载另行检查，最终结果见 `TEST-EVIDENCE.md`。

未做 Microsoft Word/Pages 排版兼容性实测，也未测真实用户文档。图片/表格结构和资源一致性已测，分页视觉效果未测。

## 参考与许可

映射事实核对：[duydev/vietnamese-conversion 的字符表](https://github.com/duydev/vietnamese-conversion/blob/main/src/charsets.ts)。其 package.json 声明 MIT、作者 Tran Nhat Duy；本工具独立实现 ZIP、XML、保护与交互逻辑，没有复制该库的转换或识别程序。

研究参考：[michioxd/tcvn2uni](https://github.com/michioxd/tcvn2uni) 的 LICENSE 已核实为 MIT（2023 nekochoko / michioxd）。没有复制其实现，也没有使用 GPL UniKey 代码。

独立答案 A：[tcvn2uni README](https://github.com/michioxd/tcvn2uni#readme)；B：[viparse CHANGELOG](https://github.com/TrizenX/viparse/blob/main/CHANGELOG.md) 的固定公开短语与 softHyphen 记录；C：[越南数学学会 T4S2.pdf](https://vms.org.vn/storage/attachments/T4S2.pdf) 的原始文本人工转录；D：固定国家格言的人工 Unicode 转录及 H 字体语义；E：[vietnamese-conversion README](https://github.com/duydev/vietnamese-conversion#readme) 中独立发布的输入/输出例子。回归控制是人工编写的正确 Unicode。

仅保留少量用于测试的短文本与来源，不引入第三方运行库或完整外部文档。
