const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const Y = require("yjs");
const { protect } = require("../src/middleware/authMiddleware");
const { validateAST, getContentProjection } = require("../src/utils/ast");
const yjsService = require("../src/services/yjsService");

process.env.JWT_SECRET = "test-secret";

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const invokeProtect = (authorization) => {
  const req = { headers: { authorization } }; const res = response(); let called = false;
  protect(req, res, () => { called = true; });
  return { req, res, called };
};

test("auth accepts a valid JWT", () => {
  const token = jwt.sign({ userId: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const result = invokeProtect(`Bearer ${token}`);
  assert.equal(result.called, true);
  assert.equal(result.req.user.userId, "507f1f77bcf86cd799439011");
});

test("auth rejects invalid, expired, and missing JWTs", () => {
  for (const value of [undefined, "Bearer broken", `Bearer ${jwt.sign({ userId: "x" }, process.env.JWT_SECRET, { expiresIn: -1 })}`]) {
    const result = invokeProtect(value);
    assert.equal(result.called, false);
    assert.equal(result.res.statusCode, 401);
  }
});

test("AST validation accepts valid nested blocks", () => {
  assert.equal(validateAST([{ type: "section", children: [{ type: "text", value: "Hello" }] }]), true);
  assert.equal(getContentProjection('[{"type":"text","value":"Hello"}]').contentFormat, "ast-json");
});

test("AST validation rejects malformed nodes", () => {
  assert.equal(validateAST([{ type: "text", value: 4 }]), false);
  assert.equal(validateAST([{ children: [] }]), false);
  assert.throws(() => getContentProjection('[{"type":"text","value":4}]'));
});

test("Yjs synchronizes updates between client documents", () => {
  const a = new Y.Doc(); const b = new Y.Doc();
  a.getText("content").insert(0, "shared text");
  Y.applyUpdate(b, Y.encodeStateAsUpdate(a));
  assert.equal(b.getText("content").toString(), "shared text");
});

test("Yjs service rejects malformed updates and keeps document usable", () => {
  const id = "507f1f77bcf86cd799439011";
  yjsService.updateText(id, "before");
  assert.equal(yjsService.applyUpdate(id, new Uint8Array([255, 255])), false);
  assert.equal(yjsService.getText(id), "before");
});

test("Yjs state reloads after service memory is cleared", async () => {
  const id = "507f1f77bcf86cd799439012";
  const source = new Y.Doc(); source.getText("content").insert(0, "recovered");
  await yjsService.ensureLoaded(id, async () => ({ yjsState: Buffer.from(Y.encodeStateAsUpdate(source)) }));
  assert.equal(yjsService.getText(id), "recovered");
});

test("corrupt persisted Yjs state falls back to stored content", async () => {
  const id = "507f1f77bcf86cd799439013";
  await yjsService.ensureLoaded(id, async () => ({ yjsState: Buffer.from([255]), content: "safe recovery" }));
  assert.equal(yjsService.getText(id), "safe recovery");
});
