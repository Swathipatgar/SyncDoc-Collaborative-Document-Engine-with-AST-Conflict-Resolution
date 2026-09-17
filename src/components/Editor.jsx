import React, { useState, useEffect, useRef, useMemo } from "react";
import { api } from "../services/api";
import { CollaborationSession } from "../services/collaboration";
import { useAuth } from "../context/AuthContext";
import Block from "./Block.jsx";
import ShareModal from "./editor/ShareModal.jsx";
import AstInspectorModal from "./editor/AstInspectorModal.jsx";
import VersionHistoryDrawer from "./editor/VersionHistoryDrawer.jsx";
import {
  ArrowLeft,
  Share2,
  Download,
  History,
  Database,
  Users,
  Plus,
  Heading1,
  Heading2,
  AlignLeft,
  Code2,
  AlertCircle,
  List,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  FileDown,
  ShieldCheck,
} from "lucide-react";

const USER_COLORS = [
  "#6366f1", // Indigo (Alice)
  "#f59e0b", // Amber (Bob)
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
];

const getUserColor = (userId) => {
  if (!userId) return USER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

export default function Editor({ documentId, onBack }) {
  const { user, token } = useAuth();

  const [documentData, setDocumentData] = useState(null);
  const [title, setTitle] = useState("Loading Spec...");
  const [blocks, setBlocks] = useState([]);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [syncStatus, setSyncStatus] = useState("connecting"); // 'connected', 'syncing', 'connecting', 'disconnected'
  const [lastSavedTime, setLastSavedTime] = useState(Date.now());

  // Multi-user presence & block locking state
  const [activeUsers, setActiveUsers] = useState([]);
  const [lockedBlocks, setLockedBlocks] = useState({}); // { [blockId]: { userId, name, color } }

  // Modals state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAstModal, setShowAstModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const sessionRef = useRef(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // Helper to parse AST from JSON string or return default blocks
  const parseAstContent = (contentStr) => {
    if (!contentStr || typeof contentStr !== "string") {
      return [
        { id: "b1", type: "heading1", content: "New Technical Specification" },
        { id: "b2", type: "paragraph", content: "Start drafting with live AST conflict resolution..." },
      ];
    }
    try {
      const parsed = JSON.parse(contentStr);
      if (Array.isArray(parsed)) {
        return parsed.map((node, idx) => ({
          id: node.id || `node-${idx + 1}`,
          type:
            node.type === "heading"
              ? node.level === 1
                ? "heading1"
                : node.level === 2
                ? "heading2"
                : "heading3"
              : node.type === "code-block"
              ? "code"
              : node.type === "list-item"
              ? "list"
              : node.type || "paragraph",
          content: node.value || (Array.isArray(node.children) ? node.children.map((c) => c.value || "").join("") : ""),
        }));
      }
    } catch (e) {
      // plain text fallback
      return [{ id: "b1", type: "paragraph", content: contentStr }];
    }
    return [{ id: "b1", type: "paragraph", content: contentStr }];
  };

  // Convert current blocks array back to canonical AST JSON string
  const serializeToAst = (blockList) => {
    const astNodes = blockList.map((b) => {
      const node = {
        id: String(b.id),
        type: b.type === "heading1" || b.type === "heading2" || b.type === "heading3" ? "heading" : b.type,
        value: b.content || "",
      };
      if (b.type === "heading1") node.level = 1;
      if (b.type === "heading2") node.level = 2;
      if (b.type === "heading3") node.level = 3;
      return node;
    });
    return JSON.stringify(astNodes);
  };

  // Fetch initial document details & setup collaboration session
  useEffect(() => {
    let isMounted = true;

    const initDoc = async () => {
      try {
        const doc = await api.documents.getById(documentId);
        if (!isMounted) return;

        setDocumentData(doc);
        setTitle(doc.title);
        const parsed = parseAstContent(doc.content);
        setBlocks(parsed);

        // Initialize Collaboration Session with Yjs and Socket.IO
        const session = new CollaborationSession({
          documentId,
          token,
          onSync: (remoteText) => {
            if (!remoteText) return;
            try {
              const updatedBlocks = parseAstContent(remoteText);
              setBlocks(updatedBlocks);
              setSyncStatus("connected");
              setLastSavedTime(Date.now());
            } catch (err) {
              console.error("Error applying remote AST sync:", err);
            }
          },
          onPresence: (users) => {
            setActiveUsers(
              users.map((u) => ({
                ...u,
                color: getUserColor(u.userId),
              }))
            );
          },
          onBlockLock: ({ userId, blockId, status }) => {
            setLockedBlocks((prev) => {
              const next = { ...prev };
              if (status === "editing") {
                // Find user info if available
                const peer = activeUsers.find((u) => u.userId === userId);
                next[blockId] = {
                  userId,
                  name: peer?.name || (userId === user?.id ? "You" : "Collaborator"),
                  color: getUserColor(userId),
                };
              } else {
                delete next[blockId];
              }
              return next;
            });
          },
          onStatusChange: (status) => {
            setSyncStatus(status);
          },
        });

        sessionRef.current = session;
      } catch (err) {
        console.error("Failed to load document for editor:", err);
        setSyncStatus("disconnected");
      }
    };

    initDoc();

    return () => {
      isMounted = false;
      if (sessionRef.current) {
        sessionRef.current.destroy();
      }
    };
  }, [documentId, token]);

  // Propagate local block changes to Yjs CRDT
  const propagateChange = (updatedBlocks) => {
    setBlocks(updatedBlocks);
    setSyncStatus("syncing");
    const serialized = serializeToAst(updatedBlocks);
    if (sessionRef.current) {
      sessionRef.current.updateText(serialized);
    }
    setLastSavedTime(Date.now());
  };

  // Block handlers
  const handleBlockChange = (id, newContent) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, content: newContent } : b));
    propagateChange(updated);
  };

  const handleBlockFocus = (id) => {
    setActiveBlockId(id);
    if (sessionRef.current) {
      sessionRef.current.startBlockEdit(id);
    }
  };

  const handleBlockBlur = (id) => {
    if (activeBlockId === id) {
      setActiveBlockId(null);
    }
    if (sessionRef.current) {
      sessionRef.current.endBlockEdit(id);
    }
  };

  const handleBlockDelete = (id) => {
    if (blocks.length <= 1) return; // Keep at least one block
    const updated = blocks.filter((b) => b.id !== id);
    propagateChange(updated);
  };

  const handleBlockDuplicate = (id) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const orig = blocks[idx];
    const newBlock = {
      ...orig,
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    const updated = [...blocks];
    updated.splice(idx + 1, 0, newBlock);
    propagateChange(updated);
  };

  const handleBlockChangeType = (id, newType) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, type: newType } : b));
    propagateChange(updated);
  };

  const handleAddBlock = (type = "paragraph") => {
    const newBlock = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      content:
        type === "heading1"
          ? "New Section Header"
          : type === "heading2"
          ? "New Sub-header"
          : type === "code"
          ? "// Enter implementation snippet\n"
          : type === "callout"
          ? "Architectural rule or design constraint..."
          : "",
    };
    const updated = [...blocks, newBlock];
    propagateChange(updated);
  };

  const handleAddBelow = (targetId, type = "paragraph") => {
    const idx = blocks.findIndex((b) => b.id === targetId);
    const newBlock = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      content: "",
    };
    const updated = [...blocks];
    updated.splice(idx + 1, 0, newBlock);
    propagateChange(updated);
  };

  // Export handlers
  const handleExportPdf = async () => {
    setShowExportMenu(false);
    try {
      await api.documents.exportPdf(documentId, `${(title || "specification").replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      alert("PDF Export failed: " + err.message);
    }
  };

  const handleExportHtml = async () => {
    setShowExportMenu(false);
    try {
      await api.documents.exportHtml(documentId, `${(title || "specification").replace(/\s+/g, "_")}.html`);
    } catch (err) {
      alert("HTML Export failed: " + err.message);
    }
  };

  const handleExportMarkdown = () => {
    setShowExportMenu(false);
    let md = `# ${title}\n\n`;
    blocks.forEach((b) => {
      if (b.type === "heading1") md += `# ${b.content}\n\n`;
      else if (b.type === "heading2") md += `## ${b.content}\n\n`;
      else if (b.type === "heading3") md += `### ${b.content}\n\n`;
      else if (b.type === "code") md += "```javascript\n" + b.content + "\n```\n\n";
      else if (b.type === "callout") md += `> **Note:** ${b.content}\n\n`;
      else if (b.type === "list") md += `- ${b.content}\n`;
      else md += `${b.content}\n\n`;
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "specification").replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Document statistics
  const wordCount = useMemo(() => {
    return blocks.reduce(
      (acc, b) => acc + (b.content || "").trim().split(/\s+/).filter(Boolean).length,
      0
    );
  }, [blocks]);

  const charCount = useMemo(() => {
    return blocks.reduce((acc, b) => acc + (b.content || "").length, 0);
  }, [blocks]);

  return (
    <div className="editor-workspace">
      {/* Top Collaboration Bar */}
      <header className="editor-nav">
        <div className="editor-nav-left">
          <button
            className="btn-back"
            onClick={onBack}
            title="Return to Specifications Dashboard"
          >
            <ArrowLeft size={18} />
            <span>Specifications</span>
          </button>

          <div className="editor-title-container">
            <input
              type="text"
              className="editor-nav-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Specification Title..."
            />
            <span className="badge-ast-format">AST Matrix v1.0</span>
          </div>
        </div>

        {/* Center: Live Connection Pill */}
        <div className="editor-nav-center">
          <div className={`status-pill ${syncStatus}`}>
            <span className="status-dot" />
            <span>
              {syncStatus === "connected"
                ? "● Live CRDT Sync"
                : syncStatus === "syncing"
                ? "Synchronizing Delts..."
                : "Connecting..."}
            </span>
          </div>
        </div>

        {/* Right Actions & Presences */}
        <div className="editor-nav-right">
          {/* Active Collaborators Stack */}
          <div className="presence-avatars-group" title="Online Collaborators in Document Room">
            {activeUsers.map((u, i) => (
              <div
                key={u.userId || i}
                className="presence-avatar"
                style={{ borderColor: u.color }}
                title={`${u.name || "Collaborator"} (${u.userId === user?.id ? "You" : "Online"})`}
              >
                {u.name ? u.name.slice(0, 2).toUpperCase() : "CO"}
                <span className="presence-online-dot" />
              </div>
            ))}
            {activeUsers.length === 0 && (
              <div className="presence-avatar alone" title="You are the sole active engineer">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "ME"}
              </div>
            )}
          </div>

          {/* Quick Simulation Link */}
          <button
            type="button"
            className="btn-tool-icon"
            onClick={() => window.open(window.location.href, "_blank")}
            title="Open in new window / Incognito to test concurrent 2-user editing"
          >
            <ExternalLink size={16} />
            <span className="tool-btn-text">Test 2nd User</span>
          </button>

          {/* Share Modal Trigger */}
          <button
            type="button"
            className="btn-tool-action"
            onClick={() => setShowShareModal(true)}
            title="Manage Collaborators & Permissions"
          >
            <Share2 size={16} />
            <span>Share</span>
            {documentData?.collaborators?.length > 0 && (
              <span className="pill-count">{documentData.collaborators.length}</span>
            )}
          </button>

          {/* AST Inspector Modal Trigger */}
          <button
            type="button"
            className="btn-tool-action highlight"
            onClick={() => setShowAstModal(true)}
            title="Inspect Live Abstract Syntax Tree JSON & Pre-save Schema"
          >
            <Database size={16} />
            <span>AST Inspector</span>
          </button>

          {/* Version History Drawer Trigger */}
          <button
            type="button"
            className="btn-tool-action"
            onClick={() => setShowHistoryDrawer(true)}
            title="View Automatic CRDT Version Checkpoints"
          >
            <History size={16} />
            <span>History</span>
          </button>

          {/* Export Dropdown */}
          <div className="export-dropdown-wrapper">
            <button
              type="button"
              className="btn-primary btn-export"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download size={16} />
              <span>Export</span>
              <ChevronDown size={14} />
            </button>

            {showExportMenu && (
              <div className="export-menu-card" onClick={(e) => e.stopPropagation()}>
                <div className="export-menu-header">Transformation Pipeline</div>

                <button
                  type="button"
                  className="export-menu-item"
                  onClick={handleExportPdf}
                >
                  <FileDown size={16} className="text-rose-400" />
                  <div className="export-item-text">
                    <span className="export-name">Export to PDF</span>
                    <span className="export-sub">Styled specification via PDFKit</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="export-menu-item"
                  onClick={handleExportHtml}
                >
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <div className="export-item-text">
                    <span className="export-name">Export Clean HTML</span>
                    <span className="export-sub">DOMPurify XSS-sanitized document</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="export-menu-item"
                  onClick={handleExportMarkdown}
                >
                  <AlignLeft size={16} className="text-indigo-400" />
                  <div className="export-item-text">
                    <span className="export-name">Export Markdown (.md)</span>
                    <span className="export-sub">Portable developer spec format</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Editor Body Canvas */}
      <div className="editor-body-layout">
        {/* Document Stats & Use Case Reminder Bar */}
        <div className="editor-use-case-banner">
          <div className="use-case-badge">
            <Sparkles size={14} className="text-indigo-400" />
            <span>AST Conflict Resolution Active</span>
          </div>
          <div className="use-case-text">
            <span>
              <strong>Real-time Guarantee:</strong> As User A types a paragraph, User B concurrently adds a code block. Visual indicators outline locked nodes in real time.
            </span>
          </div>
          <div className="editor-stats-pills">
            <span>{blocks.length} Nodes</span>
            <span>•</span>
            <span>{wordCount} Words</span>
            <span>•</span>
            <span>{charCount} Characters</span>
          </div>
        </div>

        {/* Blocks Canvas */}
        <main className="editor-canvas" onClick={() => setShowExportMenu(false)}>
          <div className="blocks-container">
            {blocks.map((block) => (
              <Block
                key={block.id}
                block={block}
                isActive={activeBlockId === block.id}
                peerEditor={
                  lockedBlocks[block.id] && lockedBlocks[block.id].userId !== user?.id
                    ? lockedBlocks[block.id]
                    : null
                }
                onChange={handleBlockChange}
                onFocus={handleBlockFocus}
                onBlur={handleBlockBlur}
                onDelete={handleBlockDelete}
                onDuplicate={handleBlockDuplicate}
                onChangeType={handleBlockChangeType}
                onAddBelow={handleAddBelow}
              />
            ))}
          </div>

          {/* Quick Add Node Bottom Bar */}
          <div className="editor-bottom-bar">
            <span className="bottom-bar-title">+ Add AST Node:</span>
            <div className="bottom-bar-buttons">
              <button
                type="button"
                className="btn-add-node"
                onClick={() => handleAddBlock("heading1")}
              >
                <Heading1 size={15} />
                <span>H1</span>
              </button>

              <button
                type="button"
                className="btn-add-node"
                onClick={() => handleAddBlock("heading2")}
              >
                <Heading2 size={15} />
                <span>H2</span>
              </button>

              <button
                type="button"
                className="btn-add-node"
                onClick={() => handleAddBlock("paragraph")}
              >
                <AlignLeft size={15} />
                <span>Paragraph</span>
              </button>

              <button
                type="button"
                className="btn-add-node code-btn"
                onClick={() => handleAddBlock("code")}
              >
                <Code2 size={15} />
                <span>Code Block</span>
              </button>

              <button
                type="button"
                className="btn-add-node callout-btn"
                onClick={() => handleAddBlock("callout")}
              >
                <AlertCircle size={15} />
                <span>Callout</span>
              </button>

              <button
                type="button"
                className="btn-add-node"
                onClick={() => handleAddBlock("list")}
              >
                <List size={15} />
                <span>List Item</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showShareModal && documentData && (
        <ShareModal
          document={documentData}
          onClose={() => setShowShareModal(false)}
          onUpdated={(updatedDoc) => setDocumentData(updatedDoc)}
        />
      )}

      {showAstModal && (
        <AstInspectorModal
          blocks={blocks}
          docTitle={title}
          onClose={() => setShowAstModal(false)}
        />
      )}

      {showHistoryDrawer && (
        <VersionHistoryDrawer
          documentId={documentId}
          onClose={() => setShowHistoryDrawer(false)}
        />
      )}
    </div>
  );
}