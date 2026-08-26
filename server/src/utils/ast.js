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

// Validate a single AST node recursively. Rules:
// - node must be an object with a non-empty string `type`
// - if `value` exists it must be a string
// - if `children` exists it must be an array of valid nodes
const validateNode = (node) => {
  if (!node || typeof node !== "object") return false;
  if (typeof node.type !== "string" || node.type.trim() === "") return false;

  if (Object.prototype.hasOwnProperty.call(node, "value")) {
    if (typeof node.value !== "string") return false;
  }

  if (Object.prototype.hasOwnProperty.call(node, "children")) {
    if (!Array.isArray(node.children)) return false;
    for (const child of node.children) {
      if (!validateNode(child)) return false;
    }
  }

  return true;
};

// Validate an AST (array of nodes or single root node)
const validateAST = (ast) => {
  if (ast == null) return true; // treat missing AST as valid (nothing to validate)
  if (Array.isArray(ast)) {
    return ast.every(validateNode);
  }
  if (typeof ast === "object") {
    return validateNode(ast);
  }
  return false;
};

module.exports = { parseContent, getContentProjection, buildDiffSummary, validateNode, validateAST };
