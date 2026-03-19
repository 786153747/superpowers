#!/usr/bin/env node

/**
 * generate-excel.js
 * 读取测试用例 JSON 文件，生成格式化的 Excel(.xlsx) 文件
 *
 * 用法: node scripts/generate-excel.js <json-file-path> [output-path]
 * 依赖: npm install exceljs
 */

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// ── 样式常量 ──────────────────────────────────────────────

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const HEADER_BORDER = {
  top: { style: 'thin' }, bottom: { style: 'thin' },
  left: { style: 'thin' }, right: { style: 'thin' }
};

const PRIORITY_FILLS = {
  P0: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } },
  P1: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } },
  P2: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } }
};

const COLUMNS = [
  { header: '用例编号', key: 'id', width: 15 },
  { header: '优先级', key: 'priority', width: 8 },
  { header: '场景分类', key: 'category', width: 15 },
  { header: '场景名称', key: 'scenario', width: 30 },
  { header: '前置条件', key: 'precondition', width: 30 },
  { header: '步骤序号', key: 'stepNo', width: 8 },
  { header: '操作步骤', key: 'action', width: 40 },
  { header: '预期结果', key: 'expected', width: 40 },
  { header: '测试数据', key: 'testData', width: 25 },
  { header: '关联差异', key: 'relatedDiff', width: 12 }
];

// ── 主函数 ──────────────────────────────────────────────

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('用法: node scripts/generate-excel.js <json-file-path> [output-path]');
    process.exit(1);
  }

  const absJsonPath = path.resolve(jsonPath);
  if (!fs.existsSync(absJsonPath)) {
    console.error(`文件不存在: ${absJsonPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(absJsonPath, 'utf-8'));
  const outputPath = process.argv[3]
    || path.join(path.dirname(absJsonPath), 'test-cases.xlsx');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'prd-test-cases skill';
  workbook.created = new Date();

  const summary = [];

  // ── 每个页面一个 Sheet ──────────────────────────────

  for (const page of data.pages) {
    const sheet = workbook.addWorksheet(page.pageName);
    sheet.columns = COLUMNS.map(c => ({ ...c }));

    // 表头样式
    const headerRow = sheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.border = HEADER_BORDER;
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // 启用筛选
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: COLUMNS.length }
    };

    let currentRow = 2;
    let p0 = 0, p1 = 0, p2 = 0;

    for (const tc of page.testCases) {
      const stepCount = tc.steps.length;
      if (tc.priority === 'P0') p0++;
      else if (tc.priority === 'P1') p1++;
      else p2++;

      for (let i = 0; i < stepCount; i++) {
        const step = tc.steps[i];
        const row = sheet.getRow(currentRow + i);

        if (i === 0) {
          row.getCell('id').value = tc.id;
          row.getCell('priority').value = tc.priority;
          row.getCell('category').value = tc.category;
          row.getCell('scenario').value = tc.scenario;
          row.getCell('precondition').value = tc.precondition;
          row.getCell('testData').value = tc.testData || '';
          row.getCell('relatedDiff').value = tc.relatedDiff || '';
        }

        row.getCell('stepNo').value = step.stepNo;
        row.getCell('action').value = step.action;
        row.getCell('expected').value = step.expected;

        // 优先级颜色（仅第一行）
        if (i === 0 && PRIORITY_FILLS[tc.priority]) {
          row.getCell('priority').fill = PRIORITY_FILLS[tc.priority];
        }

        // 单元格边框和对齐
        row.eachCell({ includeEmpty: true }, cell => {
          cell.border = HEADER_BORDER;
          cell.alignment = { vertical: 'top', wrapText: true };
        });

        row.commit();
      }

      // 合并单元格（同一场景多步骤时合并 A-E, I-J 列）
      if (stepCount > 1) {
        const mergeCols = ['A', 'B', 'C', 'D', 'E', 'I', 'J'];
        for (const col of mergeCols) {
          sheet.mergeCells(`${col}${currentRow}:${col}${currentRow + stepCount - 1}`);
        }
      }

      currentRow += stepCount;
    }

    summary.push({
      pageName: page.pageName,
      p0, p1, p2,
      total: p0 + p1 + p2
    });
  }

  // ── 汇总 Sheet ──────────────────────────────────────

  const summarySheet = workbook.addWorksheet('汇总');
  summarySheet.columns = [
    { header: '页面', key: 'pageName', width: 20 },
    { header: 'P0 数量', key: 'p0', width: 10 },
    { header: 'P1 数量', key: 'p1', width: 10 },
    { header: 'P2 数量', key: 'p2', width: 10 },
    { header: '总计', key: 'total', width: 10 }
  ];

  // 汇总表头样式
  const summaryHeaderRow = summarySheet.getRow(1);
  summaryHeaderRow.eachCell(cell => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = HEADER_BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  summarySheet.views = [{ state: 'frozen', ySplit: 1 }];

  let totalP0 = 0, totalP1 = 0, totalP2 = 0, totalAll = 0;

  for (const s of summary) {
    const row = summarySheet.addRow(s);
    row.eachCell(cell => { cell.border = HEADER_BORDER; });
    totalP0 += s.p0;
    totalP1 += s.p1;
    totalP2 += s.p2;
    totalAll += s.total;
  }

  // 合计行
  const totalRow = summarySheet.addRow({
    pageName: '合计', p0: totalP0, p1: totalP1, p2: totalP2, total: totalAll
  });
  totalRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.border = HEADER_BORDER;
  });

  // ── 元信息 ──────────────────────────────────────────

  summarySheet.addRow({});
  summarySheet.addRow({ pageName: '项目名称', p0: data.projectName });
  summarySheet.addRow({ pageName: '生成时间', p0: data.generatedAt });
  summarySheet.addRow({ pageName: 'PRD', p0: data.source?.prd || '' });
  summarySheet.addRow({ pageName: 'diff 文档', p0: data.source?.diff || '' });

  // ── 保存 ────────────────────────────────────────────

  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Excel 文件已生成: ${outputPath}`);
  console.log(`   页面数: ${summary.length}`);
  console.log(`   用例总数: ${totalAll} (P0: ${totalP0}, P1: ${totalP1}, P2: ${totalP2})`);
}

main().catch(err => {
  console.error('❌ 生成失败:', err.message);
  process.exit(1);
});
