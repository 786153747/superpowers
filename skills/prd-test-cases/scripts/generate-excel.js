#!/usr/bin/env node

/**
 * generate-excel.js
 * Validate test-case JSON and generate formatted Excel(.xlsx).
 *
 * Usage:
 *   node scripts/generate-excel.js <json-file-path> [output-path]
 */

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const {
  validateTestCasesFile,
  formatValidationReport
} = require('./validate-test-cases');

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const HEADER_BORDER = {
  top: { style: 'thin' },
  bottom: { style: 'thin' },
  left: { style: 'thin' },
  right: { style: 'thin' }
};

const PRIORITY_FILLS = {
  P0: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } },
  P1: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } },
  P2: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } }
};

const COLUMNS = [
  { header: '用例编号', key: 'id', width: 15 },
  { header: '优先级', key: 'priority', width: 8 },
  { header: '场景分类', key: 'category', width: 18 },
  { header: '场景名称', key: 'scenario', width: 30 },
  { header: '前置条件', key: 'precondition', width: 30 },
  { header: '步骤序号', key: 'stepNo', width: 8 },
  { header: '操作步骤', key: 'action', width: 40 },
  { header: '预期结果', key: 'expected', width: 40 },
  { header: '测试数据', key: 'testData', width: 25 },
  { header: '关联差异', key: 'relatedDiff', width: 16 }
];

function trimSheetName(name) {
  return String(name || 'Sheet').slice(0, 31);
}

function applyHeaderStyle(row) {
  row.eachCell(cell => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = HEADER_BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
}

function applyBodyStyle(row) {
  row.eachCell({ includeEmpty: true }, cell => {
    cell.border = HEADER_BORDER;
    cell.alignment = { vertical: 'top', wrapText: true };
  });
}

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('Usage: node scripts/generate-excel.js <json-file-path> [output-path]');
    process.exit(1);
  }

  const absJsonPath = path.resolve(jsonPath);
  if (!fs.existsSync(absJsonPath)) {
    console.error(`JSON file not found: ${absJsonPath}`);
    process.exit(1);
  }

  const { data, report } = validateTestCasesFile(absJsonPath);
  if (report.errors.length > 0) {
    console.error(formatValidationReport(report));
    process.exit(1);
  }

  if (report.warnings.length > 0) {
    console.warn(formatValidationReport(report));
  }

  const outputPath = process.argv[3] || path.join(path.dirname(absJsonPath), 'test-cases.xlsx');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'prd-test-cases skill';
  workbook.created = new Date();

  const summary = [];

  for (const page of data.pages) {
    const sheet = workbook.addWorksheet(trimSheetName(page.pageName));
    sheet.columns = COLUMNS.map(column => ({ ...column }));
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: COLUMNS.length }
    };

    applyHeaderStyle(sheet.getRow(1));

    let currentRow = 2;
    const counts = { P0: 0, P1: 0, P2: 0, total: 0 };

    for (const testCase of page.testCases) {
      const stepCount = testCase.steps.length;
      counts[testCase.priority] += 1;
      counts.total += 1;

      for (let index = 0; index < stepCount; index += 1) {
        const step = testCase.steps[index];
        const row = sheet.getRow(currentRow + index);

        if (index === 0) {
          row.getCell('id').value = testCase.id;
          row.getCell('priority').value = testCase.priority;
          row.getCell('category').value = testCase.category;
          row.getCell('scenario').value = testCase.scenario;
          row.getCell('precondition').value = testCase.precondition;
          row.getCell('testData').value = testCase.testData || '';
          row.getCell('relatedDiff').value = testCase.relatedDiff || '';

          if (PRIORITY_FILLS[testCase.priority]) {
            row.getCell('priority').fill = PRIORITY_FILLS[testCase.priority];
          }
        }

        row.getCell('stepNo').value = step.stepNo;
        row.getCell('action').value = step.action;
        row.getCell('expected').value = step.expected;

        applyBodyStyle(row);
        row.commit();
      }

      if (stepCount > 1) {
        for (const column of ['A', 'B', 'C', 'D', 'E', 'I', 'J']) {
          sheet.mergeCells(`${column}${currentRow}:${column}${currentRow + stepCount - 1}`);
        }
      }

      currentRow += stepCount;
    }

    summary.push({
      pageName: page.pageName,
      ...counts
    });
  }

  const summarySheet = workbook.addWorksheet('汇总');
  summarySheet.columns = [
    { header: '页面', key: 'pageName', width: 20 },
    { header: 'P0 数量', key: 'P0', width: 10 },
    { header: 'P1 数量', key: 'P1', width: 10 },
    { header: 'P2 数量', key: 'P2', width: 10 },
    { header: '总计', key: 'total', width: 10 }
  ];
  summarySheet.views = [{ state: 'frozen', ySplit: 1 }];
  applyHeaderStyle(summarySheet.getRow(1));

  const totals = { P0: 0, P1: 0, P2: 0, total: 0 };

  for (const pageSummary of summary) {
    const row = summarySheet.addRow(pageSummary);
    applyBodyStyle(row);
    totals.P0 += pageSummary.P0;
    totals.P1 += pageSummary.P1;
    totals.P2 += pageSummary.P2;
    totals.total += pageSummary.total;
  }

  const totalRow = summarySheet.addRow({
    pageName: '合计',
    ...totals
  });
  totalRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.border = HEADER_BORDER;
  });

  summarySheet.addRow({});
  summarySheet.addRow({ pageName: '项目名称', P0: data.projectName });
  summarySheet.addRow({ pageName: '生成时间', P0: data.generatedAt });
  summarySheet.addRow({ pageName: 'PRD', P0: data.source?.prd || '' });
  summarySheet.addRow({ pageName: 'diff 文档', P0: data.source?.diff || '' });

  await workbook.xlsx.writeFile(outputPath);

  console.log(`Excel generated: ${outputPath}`);
  console.log(`Pages: ${summary.length}`);
  for (const pageSummary of summary) {
    console.log(
      `${pageSummary.pageName}: P0 ${pageSummary.P0} / P1 ${pageSummary.P1} / P2 ${pageSummary.P2} / total ${pageSummary.total}`
    );
  }
  console.log(`Total cases: ${totals.total} (P0 ${totals.P0}, P1 ${totals.P1}, P2 ${totals.P2})`);
  console.log(`Validation warnings: ${report.warnings.length}`);
}

main().catch(error => {
  console.error(`Failed to generate Excel: ${error.message}`);
  process.exit(1);
});
