const parseContent = (content) => {
  if (!content || typeof content !== "string") {
    return [];
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    return [{ type: "text", value: content }];
  }
};

const getContentProjection = (content) => {
  const normalizedContent = typeof content === "string" ? content : "";

  if (normalizedContent === "") {
    return { content: "", ast: [], contentFormat: "plain-text" };
  }

  try {
    const ast = JSON.parse(normalizedContent);
    if (!validateAST(ast)) {
      throw new Error("Document content must be a valid AST structure.");
    }

    return {
      content: JSON.stringify(ast),
      ast,
      contentFormat: "ast-json",
    };
  } catch (error) {
    if (error.message === "Document content must be a valid AST structure.") {
      throw error;
    }

    return {
      content: normalizedContent,
      ast: [{ type: "text", value: normalizedContent }],
      contentFormat: "plain-text",
    };
  }
};

const buildDiffSummary = (previousContent, nextContent) => {
  const prev = previousContent || "";
  const next = nextContent || "";

  if (prev === next) {
    return "No changes";
  }

  const added = next.length - prev.length;
  return added >= 0 ? `Updated content (${Math.abs(added)} chars changed)` : "Modified content";
};

const AST_NODE_TYPES = new Set([
  "document", "root", "section", "paragraph", "text", "heading", "code", "code-block",
  "list", "list-item", "bold", "italic", "link",
]);
const MAX_AST_DEPTH = 64;
const MAX_AST_NODES = 10000;

// Validate the project's recursive AST with explicit structural bounds.
const validateNode = (node, depth = 0, state = { count: 0 }) => {
  if (!node || typeof node !== "object" || Array.isArray(node) || depth > MAX_AST_DEPTH) return false;
  state.count += 1;
  if (state.count > MAX_AST_NODES || typeof node.type !== "string" || !AST_NODE_TYPES.has(node.type)) return false;

  if (Object.prototype.hasOwnProperty.call(node, "value")) {
    if (typeof node.value !== "string") return false;
  }

  if (Object.prototype.hasOwnProperty.call(node, "children")) {
    if (!Array.isArray(node.children)) return false;
    for (const child of node.children) {
      if (!validateNode(child, depth + 1, state)) return false;
    }
  }

  if (node.type === "heading" && (!Number.isInteger(node.level) || node.level < 1 || node.level > 6)) return false;
  if (node.type === "link" && (typeof node.url !== "string" || !/^(https?:|mailto:)/i.test(node.url))) return false;
  if (["list", "list-item", "paragraph", "heading", "code", "code-block", "bold", "italic", "link"].includes(node.type) && node.children === undefined && node.value === undefined) return false;

  return true;
};

// Validate an AST (array of nodes or single root node)
const validateAST = (ast) => {
  if (ast == null) return true; // treat missing AST as valid (nothing to validate)
  if (Array.isArray(ast)) {
    const state = { count: 0 };
    return ast.every((node) => validateNode(node, 0, state));
  }
  if (typeof ast === "object") {
    return validateNode(ast);
  }
  return false;
};

module.exports = { parseContent, getContentProjection, buildDiffSummary, validateNode, validateAST };
