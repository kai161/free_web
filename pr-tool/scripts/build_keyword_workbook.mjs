import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";


const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outputDir = path.join(root, "outputs", "keyword-factory-v1");
const outputPath = path.join(outputDir, "global-tool-opportunities-v1.xlsx");
const previewDir = "/private/tmp/keyword-factory-v1-previews";

const theme = {
  navy: "#17324D",
  teal: "#0F766E",
  mint: "#DDF4EE",
  sky: "#E6F0FA",
  amber: "#F59E0B",
  paleAmber: "#FEF3C7",
  red: "#B91C1C",
  paleRed: "#FEE2E2",
  green: "#15803D",
  paleGreen: "#DCFCE7",
  ink: "#1F2937",
  gray: "#64748B",
  line: "#D7E0E8",
  canvas: "#F7F9FC",
  white: "#FFFFFF",
};

function columnName(index) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }
  return name;
}

async function readCsvValues(filename) {
  const csvText = await fs.readFile(path.join(outputDir, filename), "utf8");
  const imported = await Workbook.fromCSV(csvText, { sheetName: "Imported" });
  return imported.worksheets.getItem("Imported").getUsedRange(true).values;
}

function styleTitle(sheet, lastColumn, title, subtitle) {
  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A1:${lastColumn}1`).format = {
    fill: theme.navy,
    font: { bold: true, color: theme.white, size: 18 },
    horizontalAlignment: "left",
    verticalAlignment: "center",
    rowHeight: 32,
  };
  sheet.mergeCells(`A2:${lastColumn}2`);
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange(`A2:${lastColumn}2`).format = {
    fill: theme.sky,
    font: { color: theme.ink, italic: true, size: 10 },
    verticalAlignment: "center",
    rowHeight: 26,
    wrapText: true,
  };
}

function styleTableSheet(sheet, values, options) {
  const rowCount = values.length;
  const colCount = values[0].length;
  const lastColumn = columnName(colCount - 1);
  const lastRow = rowCount + 3;
  styleTitle(sheet, lastColumn, options.title, options.subtitle);
  sheet.getRange(`A4:${lastColumn}${lastRow}`).values = values;
  sheet.getRange(`A4:${lastColumn}4`).format = {
    fill: theme.teal,
    font: { bold: true, color: theme.white, size: 10 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    rowHeight: 26,
    wrapText: true,
  };
  sheet.getRange(`A5:${lastColumn}${lastRow}`).format = {
    font: { color: theme.ink, size: 9 },
    verticalAlignment: "center",
    rowHeight: 20,
  };
  sheet.getRange(`A4:${lastColumn}${lastRow}`).format.borders = {
    color: theme.line,
    style: "continuous",
  };
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(4);
  const table = sheet.tables.add(`A4:${lastColumn}${lastRow}`, true, options.tableName);
  table.style = "TableStyleMedium2";
  table.showFilterButton = true;
  for (const [columnIndex, width] of Object.entries(options.widths ?? {})) {
    const col = columnName(Number(columnIndex));
    sheet.getRange(`${col}4:${col}${lastRow}`).format.columnWidth = width;
  }
  if (options.wrapColumns) {
    for (const columnIndex of options.wrapColumns) {
      const col = columnName(columnIndex);
      sheet.getRange(`${col}5:${col}${lastRow}`).format.wrapText = true;
    }
  }
  return { lastColumn, lastRow, rowCount, colCount };
}

function addKpiCard(sheet, labelRange, valueRange, label, formula, fill) {
  sheet.mergeCells(labelRange);
  sheet.getRange(labelRange.split(":")[0]).values = [[label]];
  sheet.getRange(labelRange).format = {
    fill,
    font: { bold: true, color: theme.navy, size: 10 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
  sheet.mergeCells(valueRange);
  sheet.getRange(valueRange.split(":")[0]).formulas = [[formula]];
  sheet.getRange(valueRange).format = {
    fill: theme.white,
    font: { bold: true, color: theme.navy, size: 22 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
}

function buildDashboard(workbook, counts) {
  const sheet = workbook.worksheets.add("Dashboard");
  styleTitle(
    sheet,
    "O",
    "全球工具站机会数据库 v1",
    "决策快照 · 200 工具 / 10 市场 / 1,000 本地关键词候选 / 50 个公开 SERP 样本 / 16 个自动补全查询观察。真实搜索量、CPC 与 SEO 难度尚未导入。",
  );
  addKpiCard(sheet, "A4:C4", "A5:C6", "候选工具", "=COUNTA(Tools!A5:A204)", theme.mint);
  addKpiCard(sheet, "E4:G4", "E5:G6", "目标市场", "=COUNTA(Markets!A5:A14)", theme.sky);
  addKpiCard(sheet, "I4:K4", "I5:K6", "关键词候选", "=COUNTA(Keywords!A5:A1004)", theme.mint);
  addKpiCard(sheet, "M4:O4", "M5:O6", "SERP 核心词审计", "=COUNTA('SERP Audit'!A5:A54)", theme.paleAmber);

  sheet.mergeCells("A8:O8");
  sheet.getRange("A8").values = [["当前判断：越南图片压缩优先做轻量原型；巴西 Pix/WhatsApp QR 与印尼通用 QR 先做落地页验证；韩国通用发票生成器继续暂缓。公开信号是需求代理，不是搜索量。"]];
  sheet.getRange("A8:O8").format = {
    fill: theme.paleAmber,
    font: { bold: true, color: "#7C4A03", size: 10 },
    rowHeight: 28,
    verticalAlignment: "center",
    wrapText: true,
  };

  sheet.getRange("A10:D10").values = [["市场", "候选词数", "平均启发式分", "真实指标数"]];
  sheet.getRange("A10:D10").format = {
    fill: theme.teal,
    font: { bold: true, color: theme.white },
    horizontalAlignment: "center",
  };
  const marketCodes = ["BR", "JP", "KR", "ID", "VN", "DE", "FR", "ES", "TH", "TR"];
  sheet.getRange("A11:A20").values = marketCodes.map((code) => [code]);
  sheet.getRange("B11:B20").formulas = marketCodes.map((_, index) => [`=COUNTIF(Keywords!$F$5:$F$1004,A${11 + index})`]);
  sheet.getRange("C11:C20").formulas = marketCodes.map((_, index) => [`=AVERAGEIF(Keywords!$F$5:$F$1004,A${11 + index},Keywords!$N$5:$N$1004)`]);
  sheet.getRange("D11:D20").formulas = marketCodes.map((_, index) => [`=COUNTIFS(Keywords!$F$5:$F$1004,A${11 + index},Keywords!$P$5:$P$1004,"?*")`]);
  sheet.getRange("C11:C20").format.numberFormat = "0.0";
  sheet.getRange("A10:D20").format.borders = { color: theme.line, style: "continuous" };
  const marketChart = sheet.charts.add("bar", sheet.getRange("A10:B20"));
  marketChart.title = "首批关键词候选覆盖（按市场）";
  marketChart.hasLegend = false;
  marketChart.setPosition("F10", "O22");

  sheet.getRange("A23:B23").values = [["工具分类", "工具数"]];
  sheet.getRange("A23:B23").format = {
    fill: theme.teal,
    font: { bold: true, color: theme.white },
    horizontalAlignment: "center",
  };
  const categories = [
    "developer", "document_pdf", "image_design", "business_finance", "career_hr",
    "marketing_seo", "writing_ai", "social_communication", "media", "calculators_converters",
  ];
  sheet.getRange("A24:A33").values = categories.map((category) => [category]);
  sheet.getRange("B24:B33").formulas = categories.map((_, index) => [`=COUNTIF(Tools!$C$5:$C$204,A${24 + index})`]);
  sheet.getRange("A23:B33").format.borders = { color: theme.line, style: "continuous" };
  const categoryChart = sheet.charts.add("bar", sheet.getRange("A23:B33"));
  categoryChart.title = "200 个工具的分类构成";
  categoryChart.hasLegend = false;
  categoryChart.setPosition("F24", "O38");

  sheet.mergeCells("A35:D35");
  sheet.getRange("A35").values = [["数据可信度 Gate"]];
  sheet.getRange("A35:D35").format = {
    fill: theme.navy,
    font: { bold: true, color: theme.white },
    horizontalAlignment: "center",
  };
  sheet.getRange("A36:D40").values = [
    ["阶段", "当前", "含义", "是否可发布"],
    ["generated", "已完成", "由本地 head term + 模式生成", "否"],
    ["editor_reviewed", "已完成", "编辑级初筛，仍需当地验证", "否"],
    ["native_verified", "未开始", "母语/当地专家确认用词", "否"],
    ["serp_verified", "47 个核心词", "公开结果样本已复核，仍不等于真实排名数据", "达到指标 gate 后可进入页面生产"],
  ];
  sheet.getRange("A36:D40").format.wrapText = true;
  sheet.getRange("A36:D40").format.borders = { color: theme.line, style: "continuous" };
  sheet.getRange("A36:D36").format = { fill: theme.teal, font: { bold: true, color: theme.white } };
  sheet.getRange("A37:D40").format.rowHeight = 34;

  sheet.getRange("A1:O40").format.font = { name: "Aptos" };
  sheet.getRange("A1:O40").format.verticalAlignment = "center";
  sheet.getRange("A1:A40").format.columnWidth = 22;
  sheet.getRange("B1:D40").format.columnWidth = 15;
  sheet.getRange("E1:O40").format.columnWidth = 12;
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(2);
  return sheet;
}

function buildScoringSheet(workbook) {
  const sheet = workbook.worksheets.add("Scoring");
  styleTitle(sheet, "H", "评分模型与使用边界", "Heuristic Score 只决定“先研究什么”；公开自动补全只能验证措辞与意图；真实指标缺失时，不产生 Evidence Score。 ");
  sheet.getRange("A4:D4").values = [["Heuristic 输入", "权重", "方向", "说明"]];
  sheet.getRange("A5:D12").values = [
    ["commercial_intent", 0.22, "越高越好", "购买、付费或业务价值的先验"],
    ["localization_leverage", 0.18, "越高越好", "本地语言/法规/习惯带来的差异化"],
    ["recurring_use", 0.12, "越高越好", "重复使用潜力"],
    ["paid_fit", 0.12, "越高越好", "订阅、增值或线索变现适配"],
    ["market_priority", 0.14, "越高越好", "市场初始优先级"],
    ["static_delivery_fit", 0.10, "越高越好", "与当前静态站点能力的适配"],
    ["6 - build_complexity", 0.07, "越高越好", "开发成本反向分"],
    ["6 - baseline_competition", 0.05, "越高越好", "竞争先验反向分"],
  ];
  sheet.getRange("A13:B13").values = [["权重合计", null]];
  sheet.getRange("B13").formulas = [["=SUM(B5:B12)"]];
  sheet.getRange("B5:B13").format.numberFormat = "0%";

  sheet.getRange("F4:H4").values = [["优先级", "分数区间", "解释"]];
  sheet.getRange("F5:H8").values = [
    ["P0", ">= 80", "高优先研究；不等于可直接发布"],
    ["P1", "65–79.99", "进入研究队列"],
    ["P2", "50–64.99", "补数据后再判断"],
    ["P3", "< 50", "暂缓"],
  ];
  sheet.getRange("F10:H10").values = [["真实指标", "缺失策略", "来源要求"]];
  sheet.getRange("F11:H14").values = [
    ["Search volume", "空值，不填 0", "provider + collected_at + locale"],
    ["CPC", "空值，不填 0", "provider + currency + collected_at"],
    ["SEO difficulty", "空值，不推断", "保留 provider 口径"],
    ["SERP competition", "未观察即空", "结果 URL + 排名 + observed_at"],
  ];
  sheet.getRange("A16:D16").values = [["SERP Research 输入", "权重", "方向", "说明"]];
  sheet.getRange("A17:D21").values = [
    ["commercial_intent", 0.25, "越高越好", "沿用工具商业价值先验"],
    ["localization_gap", 0.25, "越高越好", "现有结果本地化越弱，研究价值越高"],
    ["static_delivery_fit", 0.15, "越高越好", "与当前前端交付能力的适配"],
    ["query_intent_fit", 0.20, "越高越好", "查询是否明确指向在线工具"],
    ["6 - competition_strength", 0.15, "越高越好", "公开结果竞争强度反向分"],
  ];
  sheet.getRange("A22:B22").values = [["权重合计", null]];
  sheet.getRange("B22").formulas = [["=SUM(B17:B21)"]];
  sheet.getRange("B17:B22").format.numberFormat = "0%";
  sheet.getRange("F16:H16").values = [["研究状态", "Gate", "含义"]];
  sheet.getRange("F17:H21").values = [
    ["R0", ">= 75", "优先补真实搜索量、CPC、难度和深度 SERP"],
    ["R1", "60–74.99", "第二批或作为工具簇验证"],
    ["R2", "< 60", "暂缓"],
    ["RECHECK_INTENT", "intent 2–3", "先改写本地核心词"],
    ["REJECT_INTENT", "intent = 1", "当前核心词不进入开发队列"],
  ];
  sheet.getRange("F23:H23").values = [["公开信号", "可用于", "不可用于"]];
  sheet.getRange("F24:H27").values = [
    ["Autocomplete exact match", "判断措辞是否进入预测", "证明固定搜索量"],
    ["Suggestion breadth", "发现用户场景和修饰词", "跨国家比较绝对需求"],
    ["SERP sample", "判断意图和竞争结构", "替代精确排名/KD"],
    ["PROMOTE / HOLD", "安排原型与落地页测试", "计算 Evidence Score"],
  ];
  sheet.getRange("A4:D13").format.borders = { color: theme.line, style: "continuous" };
  sheet.getRange("F4:H14").format.borders = { color: theme.line, style: "continuous" };
  sheet.getRange("A4:D4").format = { fill: theme.teal, font: { bold: true, color: theme.white } };
  sheet.getRange("F4:H4").format = { fill: theme.teal, font: { bold: true, color: theme.white } };
  sheet.getRange("F10:H10").format = { fill: theme.navy, font: { bold: true, color: theme.white } };
  sheet.getRange("A16:D22").format.borders = { color: theme.line, style: "continuous" };
  sheet.getRange("F16:H21").format.borders = { color: theme.line, style: "continuous" };
  sheet.getRange("F23:H27").format.borders = { color: theme.line, style: "continuous" };
  sheet.getRange("A16:D16").format = { fill: theme.teal, font: { bold: true, color: theme.white } };
  sheet.getRange("F16:H16").format = { fill: theme.navy, font: { bold: true, color: theme.white } };
  sheet.getRange("F23:H23").format = { fill: theme.navy, font: { bold: true, color: theme.white } };
  sheet.getRange("A1:H27").format.wrapText = true;
  sheet.getRange("A1:H27").format.verticalAlignment = "center";
  sheet.getRange("A1:A27").format.columnWidth = 28;
  sheet.getRange("B1:C27").format.columnWidth = 14;
  sheet.getRange("D1:D27").format.columnWidth = 38;
  sheet.getRange("E1:E27").format.columnWidth = 4;
  sheet.getRange("F1:F27").format.columnWidth = 24;
  sheet.getRange("G1:G27").format.columnWidth = 22;
  sheet.getRange("H1:H27").format.columnWidth = 34;
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(4);
  return sheet;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(previewDir, { recursive: true });
  const [tools, markets, keywords, localizations, sources, serpAudit, publicSignals] = await Promise.all([
    readCsvValues("tools.csv"),
    readCsvValues("markets.csv"),
    readCsvValues("keywords.csv"),
    readCsvValues("localizations.csv"),
    readCsvValues("sources.csv"),
    readCsvValues("serp-audit.csv"),
    readCsvValues("public-query-signals.csv"),
  ]);

  const workbook = Workbook.create();
  buildDashboard(workbook, {
    tools: tools.length - 1,
    markets: markets.length - 1,
    keywords: keywords.length - 1,
  });

  const shortlist = [keywords[0], ...keywords.slice(1).filter((row) => Number(row[8]) === 1 && ["P0", "P1"].includes(row[14])).slice(0, 200)];
  const shortlistSheet = workbook.worksheets.add("Priority Shortlist");
  const shortlistMeta = styleTableSheet(shortlistSheet, shortlist, {
    title: "Wave 1 优先研究队列",
    subtitle: "按启发式分排序的前 200 个候选。指标列为空代表尚未取得真实数据；请不要把 Research P0/P1 当作发布优先级。",
    tableName: "PriorityShortlistTable",
    widths: { 0: 10, 1: 34, 2: 24, 3: 24, 4: 20, 5: 10, 6: 16, 7: 12, 8: 10, 9: 15, 10: 15, 11: 18, 12: 18, 13: 14, 14: 12, 15: 18, 16: 20, 17: 18, 18: 14, 19: 18, 20: 18, 21: 14, 22: 14, 23: 16 },
    wrapColumns: [1, 3],
  });
  shortlistSheet.getRange(`N5:N${shortlistMeta.lastRow}`).format.numberFormat = "0.0";
  shortlistSheet.getRange(`N5:N${shortlistMeta.lastRow}`).conditionalFormats.addColorScale({
    minColor: theme.paleRed,
    midColor: theme.paleAmber,
    maxColor: theme.paleGreen,
  });
  shortlistSheet.getRange(`P5:X${shortlistMeta.lastRow}`).format.fill = "#FFF9E8";

  const toolsSheet = workbook.worksheets.add("Tools");
  const toolsMeta = styleTableSheet(toolsSheet, tools, {
    title: "200 个候选工具",
    subtitle: "工具固有属性是可解释的编辑评分，用于第一轮研究排序；真实关键词数据导入后会重新计算 Evidence Score。",
    tableName: "ToolsCatalogTable",
    widths: { 0: 26, 1: 28, 2: 24, 3: 20, 4: 18, 5: 14, 6: 16, 7: 18, 8: 14, 9: 10, 10: 10, 11: 18, 12: 18, 13: 12, 14: 12, 15: 26, 16: 30 },
    wrapColumns: [16],
  });
  toolsSheet.getRange(`F5:M${toolsMeta.lastRow}`).conditionalFormats.addColorScale({
    minColor: theme.paleRed,
    midColor: theme.paleAmber,
    maxColor: theme.paleGreen,
  });
  toolsSheet.getRange(`O5:O${toolsMeta.lastRow}`).dataValidation = {
    rule: { type: "list", values: ["candidate", "mvp", "hold"] },
  };

  const marketsSheet = workbook.worksheets.add("Markets");
  const marketsMeta = styleTableSheet(marketsSheet, markets, {
    title: "首批 10 个市场",
    subtitle: "Wave 1 结合用户推荐与当前 pt-BR 站点适配；市场顺序是待真实数据验证的假设。",
    tableName: "MarketsTable",
    widths: { 0: 12, 1: 20, 2: 16, 3: 12, 4: 12, 5: 12, 6: 18, 7: 16, 8: 12, 9: 14, 10: 14, 11: 48 },
    wrapColumns: [11],
  });
  marketsSheet.getRange(`G5:H${marketsMeta.lastRow}`).conditionalFormats.addColorScale({
    minColor: theme.paleRed,
    midColor: theme.paleAmber,
    maxColor: theme.paleGreen,
  });
  marketsSheet.getRange(`K5:K${marketsMeta.lastRow}`).dataValidation = {
    rule: { type: "list", values: ["active", "backlog"] },
  };

  const keywordsSheet = workbook.worksheets.add("Keywords");
  const keywordsMeta = styleTableSheet(keywordsSheet, keywords, {
    title: "1,000 个本地关键词候选",
    subtitle: "10 个 MVP 工具 × 10 个市场 × 10 个当地意图模式。所有外部指标目前为空；localization_status=editor_reviewed 仍需 native + SERP 验证。",
    tableName: "KeywordsTable",
    widths: { 0: 10, 1: 36, 2: 26, 3: 28, 4: 22, 5: 10, 6: 16, 7: 12, 8: 12, 9: 16, 10: 16, 11: 18, 12: 20, 13: 14, 14: 12, 15: 20, 16: 22, 17: 18, 18: 14, 19: 18, 20: 18, 21: 14, 22: 14, 23: 16 },
    wrapColumns: [1, 3],
  });
  keywordsSheet.getRange(`N5:N${keywordsMeta.lastRow}`).format.numberFormat = "0.0";
  keywordsSheet.getRange(`N5:N${keywordsMeta.lastRow}`).conditionalFormats.addColorScale({
    minColor: theme.paleRed,
    midColor: theme.paleAmber,
    maxColor: theme.paleGreen,
  });
  keywordsSheet.getRange(`P5:X${keywordsMeta.lastRow}`).format.fill = "#FFF9E8";

  const serpSheet = workbook.worksheets.add("SERP Audit");
  const serpMeta = styleTableSheet(serpSheet, serpAudit, {
    title: "Wave 1 · 50 个核心查询公开 SERP 审计",
    subtitle: "10 个 MVP 工具 × BR/JP/KR/ID/VN。代表 URL 是公开搜索样本，不代表精确 Google 排名；分数只决定下一步研究顺序。",
    tableName: "SerpAuditTable",
    widths: { 0: 28, 1: 28, 2: 10, 3: 18, 4: 28, 5: 12, 6: 18, 7: 16, 8: 18, 9: 20, 10: 24, 11: 62, 12: 36, 13: 70, 14: 16, 15: 30 },
    wrapColumns: [4, 12, 13],
  });
  serpSheet.getRange(`I5:I${serpMeta.lastRow}`).format.numberFormat = "0.0";
  serpSheet.getRange(`I5:I${serpMeta.lastRow}`).conditionalFormats.addColorScale({
    minColor: theme.paleRed,
    midColor: theme.paleAmber,
    maxColor: theme.paleGreen,
  });
  serpSheet.getRange(`J5:J${serpMeta.lastRow}`).conditionalFormats.addCustom('=J5="R0"', { fill: theme.paleGreen, font: { bold: true, color: theme.green } });
  serpSheet.getRange(`J5:J${serpMeta.lastRow}`).conditionalFormats.addCustom('=J5="RECHECK_INTENT"', { fill: theme.paleAmber, font: { bold: true, color: "#7C4A03" } });
  serpSheet.getRange(`J5:J${serpMeta.lastRow}`).conditionalFormats.addCustom('=J5="REJECT_INTENT"', { fill: theme.paleRed, font: { bold: true, color: theme.red } });
  serpSheet.getRange(`O5:O${serpMeta.lastRow}`).format.numberFormat = "yyyy-mm-dd";

  const publicSignalsSheet = workbook.worksheets.add("Public Signals");
  const publicSignalsMeta = styleTableSheet(publicSignalsSheet, publicSignals, {
    title: "Wave 1 · 公开查询信号",
    subtitle: "16 个焦点查询的自动补全观察，用于验证本地措辞、意图和场景。suggestion_count 不是搜索量，不能用于跨市场绝对需求比较。",
    tableName: "PublicSignalsTable",
    widths: { 0: 10, 1: 10, 2: 28, 3: 34, 4: 16, 5: 16, 6: 14, 7: 36, 8: 16, 9: 80, 10: 70, 11: 16, 12: 30 },
    wrapColumns: [3, 7, 9, 10],
  });
  publicSignalsSheet.getRange(`E5:G${publicSignalsMeta.lastRow}`).conditionalFormats.addColorScale({
    minColor: theme.paleRed,
    midColor: theme.paleAmber,
    maxColor: theme.paleGreen,
  });
  publicSignalsSheet.getRange(`I5:I${publicSignalsMeta.lastRow}`).conditionalFormats.addCustom('=I5="PROMOTE"', { fill: theme.paleGreen, font: { bold: true, color: theme.green } });
  publicSignalsSheet.getRange(`I5:I${publicSignalsMeta.lastRow}`).conditionalFormats.addCustom('=I5="HOLD"', { fill: theme.paleRed, font: { bold: true, color: theme.red } });
  publicSignalsSheet.getRange(`I5:I${publicSignalsMeta.lastRow}`).conditionalFormats.addCustom('=OR(I5="RECHECK",I5="REWORD")', { fill: theme.paleAmber, font: { bold: true, color: "#7C4A03" } });
  publicSignalsSheet.getRange(`L5:L${publicSignalsMeta.lastRow}`).format.numberFormat = "yyyy-mm-dd";

  const localizationSheet = workbook.worksheets.add("Localization Coverage");
  const localizationMeta = styleTableSheet(localizationSheet, localizations, {
    title: "工具 × 市场本地化覆盖",
    subtitle: "共 2,000 个槽位：100 个已有编辑级 head term，1,900 个保持 pending。空值是有意保留，不用英文或机器翻译填充。",
    tableName: "LocalizationCoverageTable",
    widths: { 0: 28, 1: 12, 2: 36, 3: 36, 4: 20, 5: 26, 6: 20, 7: 40 },
    wrapColumns: [2, 3, 7],
  });
  localizationSheet.getRange(`E5:E${localizationMeta.lastRow}`).dataValidation = {
    rule: { type: "list", values: ["pending", "generated", "editor_reviewed", "native_verified", "serp_verified", "rejected"] },
  };
  localizationSheet.getRange(`E5:E${localizationMeta.lastRow}`).conditionalFormats.addCustom('=E5="pending"', { fill: theme.paleAmber });
  localizationSheet.getRange(`E5:E${localizationMeta.lastRow}`).conditionalFormats.addCustom('=E5="serp_verified"', { fill: theme.paleGreen });

  const sourcesSheet = workbook.worksheets.add("Sources");
  const sourcesMeta = styleTableSheet(sourcesSheet, sources, {
    title: "来源注册表",
    subtitle: "每个外部指标必须回链来源、采集时间、地域与语言口径。URL 保持纯文本，便于审计。",
    tableName: "SourcesTable",
    widths: { 0: 28, 1: 44, 2: 18, 3: 70, 4: 38, 5: 55, 6: 24 },
    wrapColumns: [1, 3, 4, 5],
  });
  sourcesSheet.getRange(`G5:G${sourcesMeta.lastRow}`).format.numberFormat = "yyyy-mm-dd";

  buildScoringSheet(workbook);

  const inspectDashboard = await workbook.inspect({
    kind: "table",
    range: "Dashboard!A1:O40",
    include: "values,formulas",
    tableMaxRows: 40,
    tableMaxCols: 15,
    maxChars: 12000,
  });
  const formulaErrors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 300 },
    summary: "final formula error scan",
    maxChars: 5000,
  });

  const previewRanges = {
    Dashboard: "A1:O40",
    "Priority Shortlist": "A1:X24",
    Tools: "A1:Q24",
    Markets: "A1:L14",
    Keywords: "A1:X24",
    "Localization Coverage": "A1:H24",
    Sources: "A1:G10",
    "SERP Audit": "A1:P24",
    "Public Signals": "A1:M20",
    Scoring: "A1:H27",
  };
  const previewPaths = [];
  for (const [sheetName, range] of Object.entries(previewRanges)) {
    const blob = await workbook.render({ sheetName, range, scale: 1, format: "png" });
    const previewPath = path.join(previewDir, `${sheetName.replaceAll(" ", "-").toLowerCase()}.png`);
    await fs.writeFile(previewPath, new Uint8Array(await blob.arrayBuffer()));
    previewPaths.push(previewPath);
  }

  const xlsx = await SpreadsheetFile.exportXlsx(workbook);
  await xlsx.save(outputPath);
  await fs.writeFile(
    path.join(previewDir, "workbook-verification.json"),
    JSON.stringify(
      {
        outputPath,
        dashboardInspection: inspectDashboard.ndjson,
        formulaErrorScan: formulaErrors.ndjson,
        previewPaths,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ outputPath, previewPaths, formulaErrors: formulaErrors.ndjson }, null, 2));
}

await main();
