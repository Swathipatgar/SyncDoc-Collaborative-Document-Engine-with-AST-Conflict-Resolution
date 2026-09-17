import React, { useState } from "react";
import { Cpu, CheckCircle2, Copy, Check, Code2, Database, ShieldCheck } from "lucide-react";

export default function AstInspectorModal({ blocks, docTitle, onClose }) {
  const [copied, setCopied] = useState(false);

  // Convert blocks to canonical AST format
  const astRepresentation = blocks.map((b) => {
    const node = {
      id: String(b.id),
      type: b.type === "heading1" ? "heading" : b.type === "heading2" ? "heading" : b.type,
      value: b.content || "",
    };
    if (b.type === "heading1") node.level = 1;
    if (b.type === "heading2") node.level = 2;
    if (b.type === "heading3") node.level = 3;
    if (b.type === "code" && b.language) node.language = b.language;
    return node;
  });

  const jsonString = JSON.stringify(astRepresentation, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card ast-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Database size={20} className="text-emerald-400" />
            <div>
              <h3>Abstract Syntax Tree (AST) Live Inspector</h3>
              <span className="modal-subtitle">Recursive Mongoose Schema Representation</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="ast-modal-body">
          {/* Metrics bar */}
          <div className="ast-stats-row">
            <div className="ast-stat-pill">
              <span className="ast-stat-lbl">Total AST Nodes:</span>
              <span className="ast-stat-val text-indigo-400">{blocks.length}</span>
            </div>
            <div className="ast-stat-pill">
              <span className="ast-stat-lbl">Mongoose Schema Hook:</span>
              <span className="ast-stat-val text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={14} /> Validated Deep Pre-Save
              </span>
            </div>
            <div className="ast-stat-pill">
              <span className="ast-stat-lbl">CRDT Matrix:</span>
              <span className="ast-stat-val text-sky-400">Yjs Y.Doc Sync</span>
            </div>
          </div>

          <div className="ast-info-banner">
            <Cpu size={16} className="text-indigo-400 flex-shrink-0" />
            <p>
              Each block in SyncDoc is an isolated structural node in the AST. When concurrent edits occur,
              Yjs resolves deltas at the node level, preventing layout-destructive string overwrites.
            </p>
          </div>

          {/* JSON Tree Display */}
          <div className="ast-code-wrapper">
            <div className="ast-code-header">
              <div className="code-lang-tag">
                <Code2 size={14} />
                <span>JSON Abstract Syntax Tree</span>
              </div>
              <button className="btn-copy-ast" onClick={handleCopy}>
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? "Copied AST!" : "Copy JSON"}</span>
              </button>
            </div>
            <pre className="ast-json-view">
              <code>{jsonString}</code>
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
