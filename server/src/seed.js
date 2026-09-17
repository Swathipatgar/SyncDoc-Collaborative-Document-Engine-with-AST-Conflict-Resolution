const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("./models/User");
const Document = require("./models/Document");
const yjsService = require("./services/yjsService");
const { persistDocumentState } = require("./services/documentService");

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/syncdoc";
    console.log("Connecting to MongoDB at:", mongoUri);
    await mongoose.connect(mongoUri);

    console.log("Seeding demo users...");
    const hashedPassword = await bcrypt.hash("password123", 10);

    let alice = await User.findOne({ email: "alice@syncdoc.dev" });
    if (!alice) {
      alice = await User.create({
        name: "Alice Walker (Engineer A)",
        email: "alice@syncdoc.dev",
        password: hashedPassword,
      });
      console.log("Created demo user Alice:", alice.email);
    } else {
      console.log("Demo user Alice already exists:", alice.email);
    }

    let bob = await User.findOne({ email: "bob@syncdoc.dev" });
    if (!bob) {
      bob = await User.create({
        name: "Bob Martinez (Engineer B)",
        email: "bob@syncdoc.dev",
        password: hashedPassword,
      });
      console.log("Created demo user Bob:", bob.email);
    } else {
      console.log("Demo user Bob already exists:", bob.email);
    }

    // Check if initial technical spec doc exists
    let doc = await Document.findOne({ title: "RFC-402: Distributed AST Synchronization Engine" });
    if (!doc) {
      const astNodes = [
        {
          id: "node-1",
          type: "heading",
          level: 1,
          value: "RFC-402: Distributed AST Synchronization Engine",
        },
        {
          id: "node-2",
          type: "callout",
          value: "Status: Proposed Architecture Standard • Multi-Master CRDT Replication Matrix",
        },
        {
          id: "node-3",
          type: "heading",
          level: 2,
          value: "1. Problem Statement",
        },
        {
          id: "node-4",
          type: "paragraph",
          value: "Multi-user text editors frequently suffer from destructive overwrites and sync conflicts. Plain text merging is insufficient for complex structural documents, leading to lost work when multiple users edit the same document simultaneously.",
        },
        {
          id: "node-5",
          type: "heading",
          level: 2,
          value: "2. Abstract Syntax Tree Architecture",
        },
        {
          id: "node-6",
          type: "paragraph",
          value: "SyncDoc models documents as a typed Abstract Syntax Tree (AST). Each node maintains a stable identifier, structural type, and isolated replication bounds. Pre-save validation hooks ensure tree integrity across concurrent mutations.",
        },
        {
          id: "node-7",
          type: "heading",
          level: 2,
          value: "3. Implementation Reference",
        },
        {
          id: "node-8",
          type: "code",
          value: "// Concurrent AST Node Conflict Reconciliation\nfunction mergeASTDeltas(baseTree, deltaA, deltaB) {\n  const resolvedTree = YjsCRDT.applyMatrix(deltaA, deltaB);\n  return SchemaValidator.validateDeepTree(resolvedTree);\n}\n\nconsole.log('Zero-overwrite CRDT synchronization ready.');",
        },
        {
          id: "node-9",
          type: "heading",
          level: 2,
          value: "4. Live Operational Block Locking",
        },
        {
          id: "node-10",
          type: "paragraph",
          value: "Engineers see live visual block indicators showing who is editing what. As User A drafts a new paragraph, User B concurrently updates code blocks without layout-destructive race conditions.",
        },
      ];

      const contentString = JSON.stringify(astNodes);

      doc = await Document.create({
        title: "RFC-402: Distributed AST Synchronization Engine",
        content: contentString,
        contentFormat: "ast-json",
        owner: alice._id,
        collaborators: [
          {
            user: bob._id,
            permission: "write",
          },
        ],
        astVersion: 1,
      });

      const documentId = doc._id.toString();
      yjsService.updateText(documentId, contentString);
      await persistDocumentState({
        documentId,
        yjsState: yjsService.encodeState(documentId),
        content: contentString,
        userId: alice._id.toString(),
      });

      console.log("Created initial shared RFC-402 document:", doc._id);
    } else {
      console.log("Initial RFC-402 document already exists:", doc._id);
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
