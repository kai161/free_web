# Keyword Factory · Wave 1 公开 SERP 审计

日期：2026-07-17  
范围：10 个 MVP 工具 × 5 个市场（BR、JP、KR、ID、VN）= 50 个本地核心查询  
项目来源：[TrustMRR / Keyword Factory 对话](https://chatgpt.com/share/6a59f54f-b9a0-83ec-98b9-79999c283241)

## 结论

第一轮结果不支持“10 个工具同时复制到 5 个国家”。更合理的 MVP 形态是：

1. 先做一个国家内的相关工具簇；
2. 用真实搜索量、CPC、SEO 难度决定是否开发；
3. 对不符合本地工作流的英文产品概念直接拒绝，而不是把“没有竞争”误判为机会。

本轮产生 5 个 `R0`、38 个 `R1`、2 个 `R2`、2 个 `RECHECK_INTENT`、3 个 `REJECT_INTENT`。`R0` 只代表下一批优先补数据，不代表已经证明能获得流量。

## 当前优先队列

| 顺序 | 市场 | 核心词 | 工具 | Research Score | 当前判断 |
| ---: | --- | --- | --- | ---: | --- |
| 1 | ID | `generator kode QR` | QR Code Generator | 84 | 需求意图明确；结果以全球印尼语页面为主，可继续验证 QRIS、WhatsApp、菜单和名片模板 |
| 2 | VN | `tạo mật khẩu` | Password Generator | 82 | 本地精确工具结果较分散；适合作为安全工具簇，不适合单独收费 |
| 3 | VN | `nén ảnh` | Image Compressor | 79 | 可作为越南隐私型图片工具簇的流量入口，需验证证件照、批量和端侧处理需求 |
| 4 | VN | `đếm ký tự` | Character Counter | 77 | 竞争较弱但商业价值低，只作为文本工具簇补充 |
| 5 | BR | `gerador de QR Code` | QR Code Generator | 76 | 需求成立但已有多个巴西本地站；需用 Pix、WhatsApp 和品牌模板差异化 |

代表性样本包括印尼语 [GenQRCode](https://genqrcode.com/id)、越南语 [Vizua](https://vizua.io/vi/)、越南本地密码工具 [Biết Máy Tính](https://bietmaytinh.com/tao-mat-khau/) 和巴西 [Gera Código](https://www.geracodigo.com.br/gerador-de-qr-code)。这些链接是公开结果样本，不代表精确 Google 排名。

## 建议的两个 MVP 假设

### A. 越南隐私型实用工具簇

锚点工具：Image Compressor。  
低成本配套：Password Generator、JSON Formatter、Character Counter。  
统一差异化：浏览器本地处理、无上传、移动端、越南语错误说明和社交/证件场景预设。

越南图片查询已有本地化产品，但还没有出现一个在本轮样本中明显垄断“隐私 + 多工具”心智的品牌；[Vizua](https://vizua.io/vi/) 已把浏览器端处理作为卖点，说明这个方向有竞争，也说明用户价值主张容易被理解。

### B. 印尼业务型 QR 工具

锚点工具：QR Code Generator。  
模板：URL、Wi-Fi、WhatsApp、QRIS、菜单、名片。  
后续连接：Invoice Generator，但必须避开与本地成熟产品的正面同质竞争。

印尼发票工具已经出现针对 UMKM、Rupiah、PPN 和 QRIS 的完整产品，例如 [InvoiceGratis.id](https://invoicegratis.id/)；WhatsApp 链接也有 [WASAP](https://www.wasap.at/) 等本地产品。因此，发票和 WhatsApp 更适合作为 QR 模板与业务场景，而不是首个独立产品。

## 明确拒绝或暂缓

### 拒绝当前核心词

- JP `WhatsApp リンク 作成`
- KR `WhatsApp 링크 생성`
- VN `tạo link WhatsApp`

这些查询在公开样本中没有形成稳定的本地工具意图。越南应先研究 Zalo 工作流；日本、韩国也应从当地通讯/商业平台重新找词，而不是直译 WhatsApp 产品概念。

### 先改词再判断

- KR `인보이스 생성기`：结果更偏解释内容；应研究 `세금계산서`、报价单和自由职业者收款场景。
- VN `tạo hóa đơn`：结果更偏合规电子发票 SaaS，例如 [eHoaDon](https://ehoadon.org/)；应拆分电子发票、销售票据、模板和一次性 PDF 生成意图。

### 暂缓首发

- 日本、韩国的 Character Counter：分别已有大量日本专站，以及 Naver/Saramin 等强平台工作流。
- 五个市场的 PDF Compressor：Smallpdf、PDF24、Adobe、WPS 等成熟套件普遍完成本地化。例如韩国 [Smallpdf](https://smallpdf.com/kr/compress-pdf) 和印尼 [PDF24](https://tools.pdf24.org/id/kompres-pdf)。
- 日本、韩国、印尼、越南的 Resume Builder：本地招聘平台、格式和 ATS 产品成熟。日本有 [求人ジャーナル履歴書メーカー](https://j-resume.entori.jp/)，印尼有 [ResumeKu](https://resumeku.id/)，越南有 [Timviec365](https://timviec365.vn/cv-xin-viec)。

## 评分边界

`SERP Research Score` 使用商业意图、本地化缺口、静态交付适配、查询意图和公开结果竞争强度计算。它没有使用搜索量、CPC 或 SEO difficulty，因此：

- 不能被称为 SEO 成功概率；
- 不能直接决定开发；
- 不能用 0 代替缺失指标；
- 代表 URL 不能被当作精确排名。

详细公式见 [scoring-model.md](./scoring-model.md)。完整 50 行数据已进入 SQLite 的 `serp_assessments` 表和 Excel 的 `SERP Audit` 工作表。

## 下一步数据 Gate

下一轮只给以下对象补真实指标，不扩更多页面：

1. 5 个 R0 核心词及其本地变体；
2. 越南 JSON Formatter 与印尼 JSON Formatter / Password Generator；
3. 韩国、越南发票的修正词；
4. 每个候选的 Google Ads 月搜索量、CPC、广告竞争；
5. 同一 locale 下的 SEO difficulty 和前 10 结果类型。

取得指标后才计算 `Evidence Score`。在此之前，不建议启动完整工具开发；若要提前验证，只做越南工具簇与印尼 QR 的可索引落地页/轻量原型。
