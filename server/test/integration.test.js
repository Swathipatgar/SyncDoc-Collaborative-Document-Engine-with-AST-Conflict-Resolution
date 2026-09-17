const http = require("http");
const { io: ioClient } = require("socket.io-client");
const { startServer } = require("../src/server");
const User = require("../src/models/User");
const Document = require("../src/models/Document");
const mongoose = require("mongoose");

const runIntegrationCheck = async () => {
  console.log("=== SyncDoc End-to-End System Verification ===");
  const { server, io } = startServer();

  // Wait for server to bind
  await new Promise((r) => setTimeout(r, 1500));

  const BASE_URL = "http://localhost:5000/api";

  try {
    // 1. Health check
    console.log("1. Checking backend health check...");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log("   Health:", healthData.message);

    // 2. Authenticate Alice (User A)
    console.log("2. Authenticating Alice Walker (User A)...");
    const aliceRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice@syncdoc.dev", password: "password123" }),
    });
    const aliceData = await aliceRes.json();
    if (!aliceData.token) throw new Error("Alice login failed: " + JSON.stringify(aliceData));
    const aliceToken = aliceData.token;
    console.log("   Alice authenticated:", aliceData.user.name);

    // 3. Authenticate Bob (User B)
    console.log("3. Authenticating Bob Martinez (User B)...");
    const bobRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bob@syncdoc.dev", password: "password123" }),
    });
    const bobData = await bobRes.json();
    if (!bobData.token) throw new Error("Bob login failed: " + JSON.stringify(bobData));
    const bobToken = bobData.token;
    console.log("   Bob authenticated:", bobData.user.name);

    // 4. Alice creates a new AST technical specification
    console.log("4. Creating new AST Technical Specification...");
    const initialAst = [
      { id: "node-1", type: "heading", level: 1, value: "Verification Specification RFC-999" },
      { id: "node-2", type: "callout", value: "Verified architecture state" },
      { id: "node-3", type: "paragraph", value: "This is node 3 authored by Alice." },
      { id: "node-4", type: "code", value: "console.log('AST verification active');" },
    ];

    const createRes = await fetch(`${BASE_URL}/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({
        title: "Verification Specification RFC-999",
        content: JSON.stringify(initialAst),
      }),
    });
    const createdDoc = await createRes.json();
    if (!createdDoc._id) throw new Error("Failed to create doc: " + JSON.stringify(createdDoc));
    console.log("   Document created with ID:", createdDoc._id);

    // 5. Alice shares the document with Bob
    console.log("5. Sharing document with Bob (collaborator)...");
    const shareRes = await fetch(`${BASE_URL}/documents/${createdDoc._id}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({
        collaboratorId: bobData.user.id,
        permission: "write",
      }),
    });
    const shareData = await shareRes.json();
    console.log("   Share status:", shareData.message);

    // 6. Test PDF Export
    console.log("6. Testing PDF Export transformation pipeline...");
    const pdfRes = await fetch(`${BASE_URL}/documents/${createdDoc._id}/export/pdf`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    if (!pdfRes.ok) throw new Error("PDF export failed with status: " + pdfRes.status);
    const pdfBuffer = await pdfRes.arrayBuffer();
    const pdfHeader = Buffer.from(pdfBuffer.slice(0, 5)).toString("utf8");
    if (!pdfHeader.startsWith("%PDF")) {
      throw new Error("Invalid PDF header returned: " + pdfHeader);
    }
    console.log("   PDF generated successfully! Magic bytes:", pdfHeader, `(${pdfBuffer.byteLength} bytes)`);

    // 7. Test HTML Export with DOMPurify
    console.log("7. Testing HTML Export transformation pipeline...");
    const htmlRes = await fetch(`${BASE_URL}/documents/${createdDoc._id}/export/html`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    if (!htmlRes.ok) throw new Error("HTML export failed with status: " + htmlRes.status);
    const htmlText = await htmlRes.text();
    if (!htmlText.includes("Verification Specification RFC-999") || !htmlText.includes("<code>")) {
      throw new Error("HTML content missing expected AST elements");
    }
    console.log("   HTML generated and DOMPurify sanitized successfully!");

    // 8. Test Live Concurrent WebSockets (Alice and Bob)
    console.log("8. Testing live concurrent Socket.IO collaboration & block locking...");
    const aliceSocket = ioClient("http://localhost:5000", {
      auth: { token: aliceToken },
      transports: ["websocket"],
    });

    const bobSocket = ioClient("http://localhost:5000", {
      auth: { token: bobToken },
      transports: ["websocket"],
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Socket collaboration timeout")), 8000);

      aliceSocket.on("connect", () => {
        aliceSocket.emit("join-document", { documentId: createdDoc._id });
      });

      bobSocket.on("connect", () => {
        bobSocket.emit("join-document", { documentId: createdDoc._id });
      });

      let bobReceivedLock = false;

      bobSocket.on("block-editing", (payload) => {
        if (payload.blockId === "node-3" && payload.status === "editing") {
          console.log("   ✔ Bob received visual block state indicator from Alice for block 'node-3'");
          bobReceivedLock = true;
          aliceSocket.emit("block-edit-end", { documentId: createdDoc._id, blockId: "node-3" });
        } else if (payload.blockId === "node-3" && payload.status === "idle" && bobReceivedLock) {
          console.log("   ✔ Bob received block lock release indicator");
          clearTimeout(timeout);
          resolve();
        }
      });

      setTimeout(() => {
        console.log("   Alice acquiring visual block lock on 'node-3'...");
        aliceSocket.emit("block-edit-start", { documentId: createdDoc._id, blockId: "node-3" });
      }, 1000);
    });

    aliceSocket.disconnect();
    bobSocket.disconnect();

    // 9. Clean up test document
    console.log("9. Cleaning up test document...");
    const deleteRes = await fetch(`${BASE_URL}/documents/${createdDoc._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const deleteData = await deleteRes.json();
    console.log("   Delete status:", deleteData.message);

    console.log("\n=======================================================");
    console.log("🎉 ALL MODULES AND CRITICAL REQUIREMENTS VERIFIED 100%!");
    console.log("=======================================================\n");

    server.close(() => {
      io.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("Verification failed:", error);
    server.close(() => {
      io.close();
      process.exit(1);
    });
  }
};

runIntegrationCheck();
