import { strToU8, zipSync } from "fflate";

/**
 * Pembuat file Excel (.xlsx) dan Word (.docx) murni di browser.
 * Tidak memakai server atau library berbayar. File dibentuk dari XML OOXML
 * minimal lalu di-zip dengan fflate.
 */

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function sanitizeSheetName(name, used) {
  let base = String(name ?? "Sheet")
    .replace(/[\\/?*[\]:]/g, " ")
    .trim()
    .slice(0, 31);
  if (!base) base = "Sheet";

  let candidate = base;
  let counter = 2;
  while (used.has(candidate)) {
    const suffix = ` ${counter}`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    counter += 1;
  }
  used.add(candidate);
  return candidate;
}

function normalizeCell(cell) {
  if (cell === null || cell === undefined) return null;
  if (typeof cell === "object" && !(cell instanceof Date)) {
    return {
      value: cell.value ?? "",
      kind: cell.kind ?? "text",
    };
  }
  if (typeof cell === "number") return { value: cell, kind: "number" };
  if (cell instanceof Date) {
    return {
      value: `${cell.getFullYear()}-${String(cell.getMonth() + 1).padStart(2, "0")}-${String(cell.getDate()).padStart(2, "0")}`,
      kind: "date",
    };
  }
  return { value: cell, kind: "text" };
}

const STYLE_INDEX = {
  text: 0,
  number: 0,
  header: 1,
  currency: 2,
  percent: 3,
  title: 4,
  section: 5,
  wrap: 6,
  date: 7,
  muted: 8,
};

function stylesXml() {
  return `${XML_HEADER}
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2">
    <numFmt numFmtId="164" formatCode="&quot;Rp&quot;\\ #,##0"/>
    <numFmt numFmtId="165" formatCode="0.0%"/>
  </numFmts>
  <fonts count="5">
    <font><sz val="11"/><name val="Calibri"/><color rgb="FF1F2937"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font>
    <font><b/><sz val="18"/><name val="Calibri"/><color rgb="FF0B2A4A"/></font>
    <font><b/><sz val="12"/><name val="Calibri"/><color rgb="FF0B2A4A"/></font>
    <font><i/><sz val="9"/><name val="Calibri"/><color rgb="FF6B7280"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0B2A4A"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE8F4FF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF4E0"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFD9E2EC"/></left>
      <right style="thin"><color rgb="FFD9E2EC"/></right>
      <top style="thin"><color rgb="FFD9E2EC"/></top>
      <bottom style="thin"><color rgb="FFD9E2EC"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="9">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function sheetXml(sheet) {
  const rows = Array.isArray(sheet.rows) ? sheet.rows : [];
  const columns = Array.isArray(sheet.columns) ? sheet.columns : [];
  const freezeRows = Math.max(Number(sheet.freezeRows) || 0, 0);

  const colsXml = columns.length
    ? `<cols>${columns
        .map(
          (width, index) =>
            `<col min="${index + 1}" max="${index + 1}" width="${Number(width) || 14}" customWidth="1"/>`,
        )
        .join("")}</cols>`
    : "";

  const rowsXml = rows
    .map((row, rowIndex) => {
      const cells = Array.isArray(row) ? row : [];
      const height =
        cells.some((cell) => normalizeCell(cell)?.kind === "title")
          ? 30
          : cells.some((cell) => normalizeCell(cell)?.kind === "section")
            ? 22
            : 18;

      const cellsXml = cells
        .map((raw, columnIndex) => {
          const cell = normalizeCell(raw);
          if (!cell) return "";
          const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
          const style = STYLE_INDEX[cell.kind] ?? 0;

          if (
            ["currency", "percent", "number"].includes(cell.kind) &&
            Number.isFinite(Number(cell.value))
          ) {
            const value = cell.kind === "percent" ? Number(cell.value) : Number(cell.value);
            return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
          }

          return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(cell.value)}</t></is></c>`;
        })
        .join("");

      return `<row r="${rowIndex + 1}" ht="${height}" customHeight="1">${cellsXml}</row>`;
    })
    .join("");

  const pane = freezeRows
    ? `<pane ySplit="${freezeRows}" topLeftCell="A${freezeRows + 1}" activePane="bottomLeft" state="frozen"/>`
    : "";

  return `${XML_HEADER}
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  ${colsXml}
  <sheetData>${rowsXml}</sheetData>
  <pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
</worksheet>`;
}

/**
 * sheets: [{ name, columns: [width...], rows: [[cell...]], freezeRows }]
 * cell: string | number | { value, kind }
 * kind: text | number | header | currency | percent | title | section | wrap | date | muted
 */
export function buildXlsx(sheets) {
  const usedNames = new Set();
  const safeSheets = sheets.map((sheet) => ({
    ...sheet,
    name: sanitizeSheetName(sheet.name, usedNames),
  }));

  const files = {};
  const sheetOverrides = safeSheets
    .map(
      (_, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("");

  files["[Content_Types].xml"] = strToU8(`${XML_HEADER}
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheetOverrides}
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);

  files["_rels/.rels"] = strToU8(`${XML_HEADER}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

  files["xl/workbook.xml"] = strToU8(`${XML_HEADER}
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="14000"/></bookViews>
  <sheets>${safeSheets
    .map(
      (sheet, index) =>
        `<sheet name="${esc(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
    )
    .join("")}</sheets>
  <calcPr calcId="191029"/>
</workbook>`);

  files["xl/_rels/workbook.xml.rels"] = strToU8(`${XML_HEADER}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${safeSheets
    .map(
      (_, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
    )
    .join("")}
  <Relationship Id="rId${safeSheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  files["xl/styles.xml"] = strToU8(stylesXml());

  safeSheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = strToU8(sheetXml(sheet));
  });

  const createdAt = new Date().toISOString();
  files["docProps/core.xml"] = strToU8(`${XML_HEADER}
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>ZhKas</dc:title>
  <dc:creator>ZhKas · ZhStoreLsw Corp.</dc:creator>
  <cp:lastModifiedBy>ZhKas</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified>
</cp:coreProperties>`);

  files["docProps/app.xml"] = strToU8(`${XML_HEADER}
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>ZhKas</Application>
  <Company>ZhStoreLsw Corp.</Company>
</Properties>`);

  return zipSync(files, { level: 6 });
}

function wRun(text, options = {}) {
  const properties = [
    options.bold ? "<w:b/>" : "",
    options.italic ? "<w:i/>" : "",
    options.size ? `<w:sz w:val="${options.size}"/><w:szCs w:val="${options.size}"/>` : "",
    options.color ? `<w:color w:val="${options.color}"/>` : "",
    options.underline ? '<w:u w:val="single"/>' : "",
    '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/>',
  ].join("");

  return `<w:r><w:rPr>${properties}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

function wParagraph(text, options = {}) {
  const alignment = options.align ? `<w:jc w:val="${options.align}"/>` : "";
  const spacing = `<w:spacing w:before="${options.before ?? 0}" w:after="${options.after ?? 100}" w:line="276" w:lineRule="auto"/>`;
  const border = options.borderBottom
    ? `<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="4" w:color="${options.borderBottom}"/></w:pBdr>`
    : "";
  const indent = options.indent
    ? `<w:ind w:left="${options.indent}" w:hanging="220"/>`
    : "";

  const runs = Array.isArray(options.runs)
    ? options.runs.map((run) => wRun(run.text, run)).join("")
    : wRun(text, options);

  return `<w:p><w:pPr>${spacing}${alignment}${border}${indent}</w:pPr>${runs}</w:p>`;
}

function wTable({ headers = [], rows = [], widths, align }) {
  const totalWidth = 9360;
  const columnCount = Math.max(headers.length, ...rows.map((row) => row.length), 1);
  const weights = widths?.length === columnCount ? widths : Array(columnCount).fill(1);
  const weightTotal = weights.reduce((sum, weight) => sum + Number(weight), 0) || 1;
  const columnWidths = weights.map((weight) =>
    Math.round((Number(weight) / weightTotal) * totalWidth),
  );

  const borders = `<w:tblBorders>
    <w:top w:val="single" w:sz="4" w:color="D9E2EC"/>
    <w:left w:val="single" w:sz="4" w:color="D9E2EC"/>
    <w:bottom w:val="single" w:sz="4" w:color="D9E2EC"/>
    <w:right w:val="single" w:sz="4" w:color="D9E2EC"/>
    <w:insideH w:val="single" w:sz="4" w:color="D9E2EC"/>
    <w:insideV w:val="single" w:sz="4" w:color="D9E2EC"/>
  </w:tblBorders>`;

  const cell = (value, index, header, rowIndex) => {
    const width = columnWidths[index] ?? Math.round(totalWidth / columnCount);
    const alignment = header ? "left" : align?.[index] ?? "left";
    const fill = header ? "0B2A4A" : rowIndex % 2 === 1 ? "F7FAFC" : "FFFFFF";
    return `<w:tc>
      <w:tcPr>
        <w:tcW w:w="${width}" w:type="dxa"/>
        <w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>
        <w:tcMar><w:top w:w="70" w:type="dxa"/><w:bottom w:w="70" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tcMar>
        <w:vAlign w:val="center"/>
      </w:tcPr>
      <w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:jc w:val="${alignment}"/></w:pPr>${wRun(value, {
        bold: header,
        color: header ? "FFFFFF" : "1F2937",
        size: 18,
      })}</w:p>
    </w:tc>`;
  };

  const headerRow = headers.length
    ? `<w:tr><w:trPr><w:tblHeader/></w:trPr>${headers
        .map((value, index) => cell(value, index, true, 0))
        .join("")}</w:tr>`
    : "";

  const bodyRows = rows
    .map(
      (row, rowIndex) =>
        `<w:tr>${row
          .map((value, index) => cell(value, index, false, rowIndex))
          .join("")}</w:tr>`,
    )
    .join("");

  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="${totalWidth}" w:type="dxa"/>
      <w:tblLayout w:type="fixed"/>
      ${borders}
    </w:tblPr>
    <w:tblGrid>${columnWidths.map((width) => `<w:gridCol w:w="${width}"/>`).join("")}</w:tblGrid>
    ${headerRow}${bodyRows}
  </w:tbl>`;
}

function docBlocks(blocks) {
  return blocks
    .map((block) => {
      if (block.type === "title") {
        return wParagraph(block.text, {
          bold: true,
          size: 40,
          color: "0B2A4A",
          after: 80,
          borderBottom: "D9A84E",
        });
      }
      if (block.type === "subtitle") {
        return wParagraph(block.text, {
          size: 24,
          color: "4B5563",
          after: 60,
        });
      }
      if (block.type === "meta") {
        return wParagraph(block.text, {
          size: 18,
          color: "6B7280",
          after: 40,
        });
      }
      if (block.type === "heading") {
        return wParagraph(block.text, {
          bold: true,
          size: 28,
          color: "0B2A4A",
          before: 260,
          after: 120,
        });
      }
      if (block.type === "subheading") {
        return wParagraph(block.text, {
          bold: true,
          size: 22,
          color: "1F2937",
          before: 160,
          after: 80,
        });
      }
      if (block.type === "paragraph") {
        return wParagraph(block.text, {
          size: block.size ?? 20,
          color: block.color ?? "1F2937",
          bold: block.bold,
          italic: block.italic,
          align: block.align,
          before: block.before ?? 0,
          after: block.after ?? 100,
        });
      }
      if (block.type === "note") {
        return wParagraph(block.text, {
          size: 17,
          color: "6B7280",
          italic: true,
          before: 80,
          after: 120,
        });
      }
      if (block.type === "bullets") {
        return (block.items ?? [])
          .map((item) =>
            wParagraph(`•  ${item}`, {
              size: 19,
              color: "1F2937",
              after: 60,
              indent: 360,
            }),
          )
          .join("");
      }
      if (block.type === "table") {
        return `${wTable(block)}${wParagraph("", { after: 80 })}`;
      }
      if (block.type === "spacer") {
        return wParagraph("", { after: block.after ?? 120 });
      }
      if (block.type === "pageBreak") {
        return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      }
      return "";
    })
    .join("");
}

/**
 * blocks: title | subtitle | meta | heading | subheading | paragraph |
 * note | bullets | table | spacer | pageBreak
 */
export function buildDocx({ title, subtitle, meta = [], blocks = [] }) {
  const files = {};
  const createdAt = new Date().toISOString();

  const headerBlocks = [
    title ? { type: "title", text: title } : null,
    subtitle ? { type: "subtitle", text: subtitle } : null,
    ...meta.map((line) => ({ type: "meta", text: line })),
  ].filter(Boolean);

  const documentXml = `${XML_HEADER}
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${docBlocks([...headerBlocks, ...blocks])}
    ${wParagraph("Dibuat dengan ZhKas · ZhStoreLsw Corp. · data diproses lokal di perangkat.", {
      size: 16,
      color: "9CA3AF",
      before: 260,
      after: 0,
    })}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  files["[Content_Types].xml"] = strToU8(`${XML_HEADER}
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);

  files["_rels/.rels"] = strToU8(`${XML_HEADER}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

  files["word/document.xml"] = strToU8(documentXml);

  files["word/_rels/document.xml.rels"] = strToU8(`${XML_HEADER}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  files["word/styles.xml"] = strToU8(`${XML_HEADER}
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:color w:val="1F2937"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
</w:styles>`);

  files["docProps/core.xml"] = strToU8(`${XML_HEADER}
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${esc(title ?? "ZhKas")}</dc:title>
  <dc:creator>ZhKas · ZhStoreLsw Corp.</dc:creator>
  <cp:lastModifiedBy>ZhKas</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified>
</cp:coreProperties>`);

  files["docProps/app.xml"] = strToU8(`${XML_HEADER}
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>ZhKas</Application>
  <Company>ZhStoreLsw Corp.</Company>
</Properties>`);

  return zipSync(files, { level: 6 });
}
