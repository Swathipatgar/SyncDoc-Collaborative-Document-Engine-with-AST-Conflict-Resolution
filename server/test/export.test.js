const test = require("node:test");
const assert = require("node:assert/strict");
const { astToHtml, contentToHtml } = require("../src/utils/export");

test("renders paragraphs, headings, code, and nested lists", () => {
  const html = astToHtml([
    { type: "paragraph", children: [{ type: "text", value: "Hello" }] },
    { type: "heading", level: 2, value: "Title" },
    { type: "code-block", value: "<script>alert(1)</script>" },
    { type: "list", ordered: false, children: [{ type: "list-item", children: [{ type: "text", value: "Nested" }] }] },
  ]);
  assert.match(html, /<p>Hello<\/p>/);
  assert.match(html, /<h2>Title<\/h2>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /<ul><li>Nested<\/li><\/ul>/);
});

test("escapes XSS text and rejects dangerous links", () => {
  const html = contentToHtml('<script>alert(1)</script>');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.throws(() => astToHtml({ type: "link", url: "javascript:alert(1)", value: "click" }));
  assert.doesNotMatch(astToHtml({ type: "paragraph", value: "x", onclick: "alert(1)" }), /onclick/);
});

test("rejects unknown, malformed, and deeply nested ASTs", () => {
  assert.throws(() => astToHtml({ type: "unknown", value: "x" }));
  assert.throws(() => astToHtml({ type: "heading", level: 9, value: "x" }));
  let node = { type: "text", value: "x" };
  for (let i = 0; i < 70; i += 1) node = { type: "paragraph", children: [node] };
  assert.throws(() => astToHtml(node));
});
