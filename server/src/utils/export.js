const { validateAST } = require("./ast");

let DOMPurifyInstance = null;
const getDOMPurify = () => {
  if (!DOMPurifyInstance) {
    const createDOMPurify = require("dompurify");
    const { JSDOM } = require("jsdom");
    const window = new JSDOM("").window;
    DOMPurifyInstance = createDOMPurify(window);
  }
  return DOMPurifyInstance;
};

let PDFDocument = null;
const getPDFDocument = () => {
  if (!PDFDocument) {
    PDFDocument = require("pdfkit");
  }
  return PDFDocument;
};

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const safeUrl = (url) => /^(https?:|mailto:)/i.test(String(url || "")) ? String(url) : null;

const renderNode = (node) => {
  const children = Array.isArray(node.children) ? node.children.map(renderNode).join("") : "";
  const value = Object.prototype.hasOwnProperty.call(node, "value") ? escapeHtml(node.value) : "";
  switch (node.type) {
    case "document": case "root": case "section": return children || value;
    case "text": return value;
    case "paragraph": return `<p>${children || value}</p>`;
    case "heading": return `<h${node.level}>${children || value}</h${node.level}>`;
    case "code": case "code-block": return `<pre><code>${value || children}</code></pre>`;
    case "list": return `<${node.ordered ? "ol" : "ul"}>${children}</${node.ordered ? "ol" : "ul"}>`;
    case "list-item": return `<li>${children || value}</li>`;
    case "bold": return `<strong>${children || value}</strong>`;
    case "italic": return `<em>${children || value}</em>`;
    case "callout": return `<div class="callout" style="padding:10px 14px;margin:8px 0;background:#eff6ff;border-left:4px solid #3b82f6;border-radius:4px;"><p style="margin:0;color:#1e40af;"><strong>Note:</strong> ${children || value}</p></div>`;
    case "link": {
      const url = safeUrl(node.url);
      if (!url) {
        throw new Error("Invalid or dangerous link URL in AST");
      }
      return `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${children || value}</a>`;
    }
    default: return "";
  }
};

const astToHtml = (ast) => {
  if (!validateAST(ast)) throw new Error("Invalid document AST");
  const rawHtml = (Array.isArray(ast) ? ast : [ast]).map(renderNode).join("");
  return getDOMPurify().sanitize(rawHtml, {
    ALLOWED_TAGS: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "pre", "code", "ul", "ol", "li", "strong", "em", "a", "div", "span"],
    ALLOWED_ATTR: ["href", "rel", "class", "style"],
  });
};

const contentToHtml = (content) => {
  if (typeof content !== "string" || content === "") return "";
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = [{ type: "paragraph", value: content }];
  }
  if (typeof parsed === "string") parsed = [{ type: "paragraph", value: parsed }];
  return astToHtml(parsed);
};

// Clean AST to PDF generator using PDFKit
const renderAstToPdf = (title, ast, outputStream) => {
  let parsedAst = ast;
  if (typeof ast === "string") {
    try {
      parsedAst = JSON.parse(ast);
    } catch {
      parsedAst = [{ type: "paragraph", value: ast }];
    }
  }

  if (!validateAST(parsedAst)) throw new Error("Invalid document AST");

  const PDFDoc = getPDFDocument();
  const doc = new PDFDoc({ margin: 50, size: "A4" });
  doc.pipe(outputStream);

  // Document Title
  doc.fontSize(22).font("Helvetica-Bold").fillColor("#0f172a").text(title || "SyncDoc Document", { align: "left" });
  doc.moveDown(0.2);

  // Subtitle / metadata header
  doc.fontSize(9).font("Helvetica").fillColor("#64748b")
    .text(`SyncDoc Engine • AST Specification Export • Exported on: ${new Date().toLocaleString()}`);
  doc.moveDown(0.6);

  // Divider line
  const startY = doc.y;
  doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, startY).lineTo(545, startY).stroke();
  doc.moveDown(1);
  doc.fillColor("#1e293b");

  const nodes = Array.isArray(parsedAst) ? parsedAst : [parsedAst];

  const renderPdfNode = (node) => {
    if (!node) return;
    const value = node.value || (Array.isArray(node.children) ? node.children.map(c => c.value || "").join("") : "");

    switch (node.type) {
      case "heading": {
        const level = node.level || 1;
        const size = level === 1 ? 18 : level === 2 ? 14 : 12;
        doc.moveDown(0.8);
        doc.fontSize(size).font("Helvetica-Bold").fillColor("#0f172a").text(value || "Heading");
        doc.moveDown(0.3);
        break;
      }
      case "paragraph": {
        doc.fontSize(10.5).font("Helvetica").fillColor("#334155").text(value || "", {
          lineGap: 3,
        });
        doc.moveDown(0.5);
        break;
      }
      case "code":
      case "code-block": {
        doc.moveDown(0.4);
        const codeText = value || "// Code block";
        const lines = codeText.split("\n");
        const blockHeight = Math.max(28, lines.length * 13 + 16);
        const curY = doc.y;

        if (curY + blockHeight > 750) {
          doc.addPage();
        }

        const boxY = doc.y;
        doc.rect(50, boxY, 495, blockHeight).fill("#f8fafc");
        doc.rect(50, boxY, 495, blockHeight).strokeColor("#cbd5e1").lineWidth(0.5).stroke();

        doc.fontSize(9).font("Courier").fillColor("#0f172a").text(codeText, 62, boxY + 8, {
          width: 470,
          lineGap: 2,
        });

        doc.y = boxY + blockHeight + 10;
        break;
      }
      case "callout": {
        doc.moveDown(0.4);
        const text = value || "Note";
        const boxY = doc.y;
        doc.rect(50, boxY, 495, 34).fill("#f0f9ff");
        doc.strokeColor("#0284c7").lineWidth(3).moveTo(50, boxY).lineTo(50, boxY + 34).stroke();
        doc.fontSize(9.5).font("Helvetica").fillColor("#0369a1").text(`NOTE: ${text}`, 62, boxY + 10, { width: 470 });
        doc.y = boxY + 44;
        break;
      }
      case "list": {
        if (Array.isArray(node.children)) {
          node.children.forEach(renderPdfNode);
        }
        doc.moveDown(0.4);
        break;
      }
      case "list-item": {
        doc.fontSize(10).font("Helvetica").fillColor("#334155").text(`•   ${value || ""}`, { indent: 15, lineGap: 2 });
        doc.moveDown(0.2);
        break;
      }
      default: {
        if (Array.isArray(node.children)) {
          node.children.forEach(renderPdfNode);
        } else if (value) {
          doc.fontSize(10).font("Helvetica").fillColor("#334155").text(value);
          doc.moveDown(0.4);
        }
        break;
      }
    }
  };

  nodes.forEach(renderPdfNode);
  doc.end();
};

module.exports = { escapeHtml, astToHtml, contentToHtml, renderAstToPdf, getDOMPurify };
