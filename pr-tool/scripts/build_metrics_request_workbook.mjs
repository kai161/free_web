import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";


const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outputDir = path.join(root, "outputs", "keyword-factory-v1");
const outputPath = path.join(outputDir, "wave1-keyword-metrics-request.xlsx");
const previewDir = "/private/tmp/keyword-factory-wave1-metrics-request";

const colors = {
  navy: "#17324D",
  teal: "#0F766E",
  mint: "#DDF4EE",
  sky: "#E6F0FA",
  amber: "#FEF3C7",
  red: "#FEE2E2",
  green: "#DCFCE7",
  white: "#FFFFFF",
  ink: "#1F2937",
  line: "#D7E0E8",
};

const marketConfig = {
  BR: { country: "Brazil", language: "Portuguese", locale: "pt-BR", currency: "BRL" },
  ID: { country: "Indonesia", language: "Indonesian", locale: "id-ID", currency: "IDR" },
  VN: { country: "Vietnam", language: "Vietnamese", locale: "vi-VN", currency: "VND" },
  KR: { country: "South Korea", language: "Korean", locale: "ko-KR", currency: "KRW" },
};

const selectedPairs = new Map([
  ["ID|qr-code-generator", "R0"],
  ["VN|password-generator", "R0"],
  ["VN|image-compressor", "R0"],
  ["VN|character-counter", "R0"],
  ["BR|qr-code-generator", "R0"],
  ["VN|json-formatter", "R1"],
  ["ID|json-formatter", "R1"],
  ["ID|password-generator", "R1"],
]);

const recheckSeeds = [
  ["KR", "invoice-generator", "Invoice Generator", "세금계산서 발행", "RECHECK_INTENT", "验证韩国本地电子税务发票用词"],
  ["KR", "invoice-generator", "Invoice Generator", "세금계산서 만들기", "RECHECK_INTENT", "验证韩国本地电子税务发票用词"],
  ["KR", "invoice-generator", "Invoice Generator", "무료 세금계산서 양식", "RECHECK_INTENT", "验证模板型需求"],
  ["KR", "invoice-generator", "Invoice Generator", "온라인 세금계산서", "RECHECK_INTENT", "验证在线工具需求"],
  ["KR", "invoice-generator", "Invoice Generator", "인보이스 양식", "RECHECK_INTENT", "验证通用 invoice 模板需求"],
  ["VN", "invoice-generator", "Invoice Generator", "tạo hóa đơn bán hàng", "RECHECK_INTENT", "区分销售票据与合规电子发票"],
  ["VN", "invoice-generator", "Invoice Generator", "mẫu hóa đơn bán hàng", "RECHECK_INTENT", "验证模板型需求"],
  ["VN", "invoice-generator", "Invoice Generator", "tạo hóa đơn PDF", "RECHECK_INTENT", "验证一次性 PDF 生成需求"],
  ["VN", "invoice-generator", "Invoice Generator", "hóa đơn online miễn phí", "RECHECK_INTENT", "验证免费在线工具需求"],
];

async function readCsvValues(filename) {
  const csvText = await fs.readFile(path.join(outputDir, filename), "utf8");
  const imported = await Workbook.fromCSV(csvText, { sheetName: "Imported" });
  return imported.worksheets.getItem("Imported").getUsedRange(true).values;
}

function addTitle(sheet, lastColumn, title, subtitle) {
  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A1:${lastColumn}1`).format = {
    fill: colors.navy,
    font: { bold: true, color: colors.white, size: 18 },
    rowHeight: 32,
    verticalAlignment: "center",
  };
  sheet.mergeCells(`A2:${lastColumn}2`);
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange(`A2:${lastColumn}2`).format = {
    fill: colors.sky,
    font: { color: colors.ink, italic: true, size: 10 },
    rowHeight: 28,
    verticalAlignment: "center",
    wrapText: true,
  };
  sheet.showGridLines = false;
}

function styleHeader(range, fill = colors.teal) {
  range.format = {
    fill,
    font: { bold: true, color: colors.white },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    rowHeight: 25,
    wrapText: true,
  };
}

function buildInstructions(workbook, counts) {
  const sheet = workbook.worksheets.add("说明");
  addTitle(
    sheet,
    "J",
    "Keyword Factory · Wave 1 真实指标请求包",
    "你只需导出原始 CSV/XLSX 并上传，不要提供账号密码、Cookie、API Key 或付款信息。我们负责字段映射、清洗、去重和入库。",
  );

  sheet.getRange("A4:J4").values = [["推荐方案", "优先级", "你需要做什么", "文件数", "能得到什么", "是否需要付费账户", "上传格式", "不要做什么", "官方说明", "状态"]];
  styleHeader(sheet.getRange("A4:J4"));
  sheet.getRange("A5:J7").values = [
    [
      "Google Ads Keyword Planner",
      "最低可用",
      "按 BR / ID / VN / KR 分别设置国家与语言，导入对应关键词，下载历史指标",
      4,
      "平均月搜索量、广告竞争、页首出价区间",
      "通常需要完成 Google Ads 账户与结算资料设置",
      "CSV / XLSX",
      "不要合并国家；不要删原始列",
      "https://support.google.com/google-ads/answer/7337243",
      "待提供",
    ],
    [
      "Semrush Bulk Analysis",
      "推荐补充",
      "按国家数据库分别粘贴关键词，保留全部列后导出",
      4,
      "Volume、KD%、CPC、Competition、Intent、Trend、SERP Features",
      "需要可用 Semrush SEO Toolkit 额度",
      "CSV / XLSX",
      "不要只截图；不要只导出全球数据",
      "https://www.semrush.com/kb/257-keyword-overview",
      "待提供",
    ],
    [
      "Ahrefs / DataForSEO / 其他",
      "可替代",
      "按国家、语言导出原始结果；平台原始列全部保留",
      "每市场 1 份",
      "至少包含 Volume、KD、CPC 与采集地域",
      "视平台而定",
      "CSV / XLSX / JSON",
      "不要手工改列名或换算币种",
      "上传原始导出即可",
      "待提供",
    ],
  ];
  sheet.getRange("A4:J7").format.borders = { color: colors.line, style: "continuous" };
  sheet.getRange("A5:J7").format.wrapText = true;
  sheet.getRange("A5:J7").format.rowHeight = 64;
  sheet.getRange("B5:B7").format.fill = colors.mint;
  sheet.getRange("J5:J7").format.fill = colors.amber;

  sheet.getRange("A10:H10").values = [["本轮规模", "BR", "ID", "VN", "KR", "合计", "最低文件数", "最优文件数"]];
  styleHeader(sheet.getRange("A10:H10"), colors.navy);
  sheet.getRange("A11:H11").values = [["关键词数", counts.BR, counts.ID, counts.VN, counts.KR, counts.total, 4, 8]];
  sheet.getRange("A10:H11").format.borders = { color: colors.line, style: "continuous" };
  sheet.getRange("B11:H11").format = {
    fill: colors.green,
    font: { bold: true, color: colors.navy, size: 14 },
    horizontalAlignment: "center",
  };

  sheet.getRange("A14:J14").values = [["最省事的交付方式"]];
  sheet.mergeCells("A14:J14");
  styleHeader(sheet.getRange("A14:J14"), colors.navy);
  sheet.getRange("A15:J19").values = [
    ["1", "告诉我你现有的平台：Google Ads / Semrush / Ahrefs / DataForSEO / 都没有", null, null, null, null, null, null, null, null],
    ["2", "打开“关键词清单”：按 market_code 过滤，一个国家复制一批", null, null, null, null, null, null, null, null],
    ["3", "设置地域和语言：必须与清单中的 country / language 一致", null, null, null, null, null, null, null, null],
    ["4", "导出原始文件：所有列保留，文件名带国家与采集日期", null, null, null, null, null, null, null, null],
    ["5", "直接上传给我：无需清洗、翻译、合并或填写我们的模板", null, null, null, null, null, null, null, null],
  ];
  sheet.mergeCells("B15:J15");
  sheet.mergeCells("B16:J16");
  sheet.mergeCells("B17:J17");
  sheet.mergeCells("B18:J18");
  sheet.mergeCells("B19:J19");
  sheet.getRange("A15:A19").format = {
    fill: colors.teal,
    font: { bold: true, color: colors.white, size: 14 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
  sheet.getRange("B15:J19").format = { fill: "#F7F9FC", wrapText: true, verticalAlignment: "center", rowHeight: 30 };
  sheet.getRange("A15:J19").format.borders = { color: colors.line, style: "continuous" };

  const widths = [18, 14, 34, 12, 34, 28, 16, 30, 44, 14];
  widths.forEach((width, index) => {
    const col = String.fromCharCode(65 + index);
    sheet.getRange(`${col}1:${col}19`).format.columnWidth = width;
  });
  sheet.freezePanes.freezeRows(4);
  return sheet;
}

function buildKeywordSheet(workbook, rows) {
  const sheet = workbook.worksheets.add("关键词清单");
  addTitle(
    sheet,
    "M",
    "Wave 1 指标采集关键词清单",
    "按 market_code 过滤后复制 Keyword 列。Google Ads 上传文件只需要一列，列名必须为 Keyword；也可以直接粘贴。",
  );
  const headers = [
    "market_code", "country", "language", "locale", "currency", "tool_slug", "tool_name_en",
    "Keyword", "research_priority", "purpose", "google_ads_filename", "seo_export_filename", "notes",
  ];
  sheet.getRange("A4:M4").values = [headers];
  styleHeader(sheet.getRange("A4:M4"));
  sheet.getRange(`A5:M${rows.length + 4}`).values = rows;
  const table = sheet.tables.add(`A4:M${rows.length + 4}`, true, "MetricSeedTable");
  table.style = "TableStyleMedium2";
  table.showFilterButton = true;
  sheet.getRange(`A4:M${rows.length + 4}`).format.borders = { color: colors.line, style: "continuous" };
  sheet.getRange(`H5:H${rows.length + 4}`).format.font = { bold: true, color: colors.navy };
  sheet.getRange(`I5:I${rows.length + 4}`).conditionalFormats.addCustom('=I5="R0"', { fill: colors.green });
  sheet.getRange(`I5:I${rows.length + 4}`).conditionalFormats.addCustom('=I5="RECHECK_INTENT"', { fill: colors.amber });
  sheet.getRange(`J5:J${rows.length + 4}`).format.wrapText = true;
  const widths = [12, 18, 16, 12, 12, 28, 26, 36, 20, 36, 32, 32, 28];
  widths.forEach((width, index) => {
    const col = String.fromCharCode(65 + index);
    sheet.getRange(`${col}1:${col}${rows.length + 4}`).format.columnWidth = width;
  });
  sheet.freezePanes.freezeRows(4);
  sheet.freezePanes.freezeColumns(2);
  return sheet;
}

function buildFieldsSheet(workbook) {
  const sheet = workbook.worksheets.add("期望字段");
  addTitle(sheet, "G", "我们会从原始导出中提取的字段", "不用手工补齐。某个平台没有的字段保持缺失，并记录 provider 与采集时间。");
  sheet.getRange("A4:G4").values = [["字段", "最低需要", "Google Ads", "Semrush/Ahrefs", "允许为空", "处理规则", "说明"]];
  styleHeader(sheet.getRange("A4:G4"));
  sheet.getRange("A5:G15").values = [
    ["Keyword", "是", "Keyword", "Keyword", "否", "NFKC + 空格标准化", "必须保留原始文本"],
    ["Market / Database", "是", "Location setting", "Country database", "否", "映射到 market_code", "不得混合国家"],
    ["Language", "是", "Language setting", "Locale / database", "否", "记录 locale", "与市场语言一致"],
    ["Avg. monthly searches / Volume", "是", "Avg. monthly searches", "Volume", "可", "整数；无数据不填 0", "核心需求指标"],
    ["CPC / Top of page bid", "推荐", "Top of page bid low/high", "CPC", "可", "保留原币与 provider", "商业价值信号"],
    ["Ads competition", "推荐", "Competition / index", "Competitive Density", "可", "保留平台原口径", "付费竞争信号"],
    ["Keyword Difficulty", "推荐", "无", "KD%", "可", "保留 provider", "不能跨平台直接混算"],
    ["Trend", "推荐", "Monthly searches", "Trend", "可", "转 0–100 时记录方法", "季节性信号"],
    ["Intent", "可选", "无", "Intent", "可", "与人工意图并存", "不覆盖人工判断"],
    ["SERP Features / Results", "可选", "无", "SERP Features / Results", "可", "保留原值", "竞争结构信号"],
    ["Collected at", "是", "文件导出时间", "文件导出时间", "否", "ISO 时间", "用于快照审计"],
  ];
  sheet.getRange("A4:G15").format.borders = { color: colors.line, style: "continuous" };
  sheet.getRange("A5:G15").format.wrapText = true;
  sheet.getRange("B5:B15").format.fill = colors.mint;
  const widths = [32, 14, 30, 30, 14, 34, 34];
  widths.forEach((width, index) => {
    const col = String.fromCharCode(65 + index);
    sheet.getRange(`${col}1:${col}15`).format.columnWidth = width;
  });
  sheet.freezePanes.freezeRows(4);
  return sheet;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(previewDir, { recursive: true });
  const keywords = await readCsvValues("keywords.csv");
  const rows = [];
  for (const row of keywords.slice(1)) {
    const marketCode = String(row[5]);
    const toolSlug = String(row[2]);
    const key = `${marketCode}|${toolSlug}`;
    if (!selectedPairs.has(key)) continue;
    const market = marketConfig[marketCode];
    const priority = selectedPairs.get(key);
    rows.push([
      marketCode,
      market.country,
      market.language,
      market.locale,
      market.currency,
      toolSlug,
      String(row[3]),
      String(row[1]),
      priority,
      priority === "R0" ? "补真实指标，决定是否进入 MVP" : "工具簇第二批验证",
      `google-ads-${marketCode.toLowerCase()}-2026-07.csv`,
      `seo-metrics-${marketCode.toLowerCase()}-2026-07.csv`,
      "保留平台原始列",
    ]);
  }
  for (const [marketCode, toolSlug, toolName, keyword, priority, purpose] of recheckSeeds) {
    const market = marketConfig[marketCode];
    rows.push([
      marketCode,
      market.country,
      market.language,
      market.locale,
      market.currency,
      toolSlug,
      toolName,
      keyword,
      priority,
      purpose,
      `google-ads-${marketCode.toLowerCase()}-2026-07.csv`,
      `seo-metrics-${marketCode.toLowerCase()}-2026-07.csv`,
      "候选本地词，需结合指标与母语复核",
    ]);
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]) || a[5].localeCompare(b[5]) || a[7].localeCompare(b[7]));

  const counts = { BR: 0, ID: 0, VN: 0, KR: 0, total: rows.length };
  rows.forEach((row) => { counts[row[0]] += 1; });
  if (rows.length !== 89 || counts.BR !== 10 || counts.ID !== 30 || counts.VN !== 44 || counts.KR !== 5) {
    throw new Error(`Unexpected request pack counts: ${JSON.stringify(counts)}`);
  }

  const workbook = Workbook.create();
  buildInstructions(workbook, counts);
  buildKeywordSheet(workbook, rows);
  buildFieldsSheet(workbook);

  const inspection = await workbook.inspect({
    kind: "table",
    range: "说明!A1:J19",
    include: "values,formulas",
    tableMaxRows: 19,
    tableMaxCols: 10,
    maxChars: 8000,
  });
  const formulaErrors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    summary: "formula error scan",
    maxChars: 3000,
  });
  const previewPaths = [];
  for (const [sheetName, range] of [
    ["说明", "A1:J19"],
    ["关键词清单", "A1:M24"],
    ["期望字段", "A1:G15"],
  ]) {
    const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
    const previewPath = path.join(previewDir, `${sheetName}.png`);
    await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
    previewPaths.push(previewPath);
  }
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(outputPath);
  console.log(JSON.stringify({ outputPath, counts, previewPaths, inspection: inspection.ndjson, formulaErrors: formulaErrors.ndjson }, null, 2));
}

await main();
