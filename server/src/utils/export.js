const { validateAST } = require("./ast");

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
    case "link": {
      const url = safeUrl(node.url);
      return url ? `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${children || value}</a>` : (children || value);
    }
    default: return "";
  }
};

const astToHtml = (ast) => {
  if (!validateAST(ast)) throw new Error("Invalid document AST");
  return (Array.isArray(ast) ? ast : [ast]).map(renderNode).join("");
};

const contentToHtml = (content) => {
  if (typeof content !== "string" || content === "") return "";
  let parsed;
  try { parsed = JSON.parse(content); } catch { parsed = [{ type: "paragraph", value: content }]; }
  if (typeof parsed === "string") parsed = [{ type: "paragraph", value: parsed }];
  return astToHtml(parsed);
};

module.exports = { escapeHtml, astToHtml, contentToHtml };
