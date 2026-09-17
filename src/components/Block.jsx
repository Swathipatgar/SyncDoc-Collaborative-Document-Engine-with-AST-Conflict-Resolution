import React, { useRef, useEffect } from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  Code2,
  AlertCircle,
  List,
  Trash2,
  Copy,
  GripVertical,
  Plus,
  ChevronDown,
  Check,
} from "lucide-react";

export default function Block({
  block,
  isActive,
  peerEditor, // { userId, name, color } if someone else is editing this block
  onChange,
  onFocus,
  onBlur,
  onDelete,
  onDuplicate,
  onChangeType,
  onAddBelow,
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea to fit content without scrollbars
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(36, textareaRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [block.content, block.type]);

  const handleKeyDown = (e) => {
    // If Enter in heading or paragraph, create new paragraph below
    if (e.key === "Enter" && !e.shiftKey && block.type !== "code") {
      e.preventDefault();
      onAddBelow(block.id, "paragraph");
    }
    // If Backspace in empty block, delete block
    if (e.key === "Backspace" && (!block.content || block.content === "")) {
      e.preventDefault();
      onDelete(block.id);
    }
  };

  // Assign clean visual style depending on type
  const isPeerEditing = !!peerEditor;
  const peerColor = peerEditor?.color || "#6366f1";
  const peerName = peerEditor?.name || "Peer Engineer";

  return (
    <div
      className={`block-wrapper ${isActive ? "is-focused" : ""} ${isPeerEditing ? "is-peer-editing" : ""}`}
      style={
        isPeerEditing
          ? {
              borderColor: peerColor,
              boxShadow: `0 0 0 1.5px ${peerColor}, 0 4px 14px -4px ${peerColor}33`,
            }
          : undefined
      }
    >
      {/* Live Visual Block State Indicator (Peer presence banner) */}
      {isPeerEditing && (
        <div
          className="peer-editor-badge"
          style={{ backgroundColor: peerColor }}
        >
          <span className="peer-editor-dot" />
          <span>👤 {peerName} is editing...</span>
        </div>
      )}

      {/* Block Type Bar / Left Gutters */}
      <div className="block-left-gutter">
        <div className="drag-handle" title="Block Controls">
          <GripVertical size={14} />
        </div>

        {/* Quick Type Dropdown */}
        <div className="block-type-selector">
          <select
            value={block.type}
            onChange={(e) => onChangeType(block.id, e.target.value)}
            className="type-select"
            title="Change Block Type"
          >
            <option value="paragraph">Paragraph</option>
            <option value="heading1">Heading 1</option>
            <option value="heading2">Heading 2</option>
            <option value="heading3">Heading 3</option>
            <option value="code">Code Block</option>
            <option value="callout">Callout Box</option>
            <option value="list">Bullet Item</option>
          </select>
        </div>
      </div>

      {/* Block Content by Type */}
      <div className="block-content-area">
        {block.type === "heading1" && (
          <textarea
            ref={textareaRef}
            className="block-input block-heading1"
            placeholder="Heading 1..."
            value={block.content || ""}
            onChange={(e) => onChange(block.id, e.target.value)}
            onFocus={() => onFocus(block.id)}
            onBlur={() => onBlur(block.id)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        )}

        {block.type === "heading2" && (
          <textarea
            ref={textareaRef}
            className="block-input block-heading2"
            placeholder="Heading 2..."
            value={block.content || ""}
            onChange={(e) => onChange(block.id, e.target.value)}
            onFocus={() => onFocus(block.id)}
            onBlur={() => onBlur(block.id)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        )}

        {block.type === "heading3" && (
          <textarea
            ref={textareaRef}
            className="block-input block-heading3"
            placeholder="Heading 3..."
            value={block.content || ""}
            onChange={(e) => onChange(block.id, e.target.value)}
            onFocus={() => onFocus(block.id)}
            onBlur={() => onBlur(block.id)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        )}

        {block.type === "paragraph" && (
          <textarea
            ref={textareaRef}
            className="block-input block-paragraph"
            placeholder="Type text or enter markdown..."
            value={block.content || ""}
            onChange={(e) => onChange(block.id, e.target.value)}
            onFocus={() => onFocus(block.id)}
            onBlur={() => onBlur(block.id)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        )}

        {block.type === "code" && (
          <div className="code-block-container">
            <div className="code-block-header">
              <span className="code-block-tag">
                <Code2 size={13} />
                <span>JavaScript / AST Code</span>
              </span>
              <button
                type="button"
                className="btn-copy-code"
                onClick={() => navigator.clipboard.writeText(block.content || "")}
                title="Copy code to clipboard"
              >
                <Copy size={13} />
                <span>Copy</span>
              </button>
            </div>
            <textarea
              ref={textareaRef}
              className="block-input block-code"
              placeholder="// Enter code snippet here..."
              value={block.content || ""}
              onChange={(e) => onChange(block.id, e.target.value)}
              onFocus={() => onFocus(block.id)}
              onBlur={() => onBlur(block.id)}
              rows={3}
              spellCheck={false}
            />
          </div>
        )}

        {block.type === "callout" && (
          <div className="callout-block-container">
            <div className="callout-icon">
              <AlertCircle size={18} />
            </div>
            <textarea
              ref={textareaRef}
              className="block-input block-callout"
              placeholder="Important architectural note or specification rule..."
              value={block.content || ""}
              onChange={(e) => onChange(block.id, e.target.value)}
              onFocus={() => onFocus(block.id)}
              onBlur={() => onBlur(block.id)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
          </div>
        )}

        {block.type === "list" && (
          <div className="list-block-container">
            <span className="list-bullet">•</span>
            <textarea
              ref={textareaRef}
              className="block-input block-list"
              placeholder="List item..."
              value={block.content || ""}
              onChange={(e) => onChange(block.id, e.target.value)}
              onFocus={() => onFocus(block.id)}
              onBlur={() => onBlur(block.id)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
          </div>
        )}
      </div>

      {/* Floating Block Actions (visible on hover or focus) */}
      <div className="block-actions-bar">
        <button
          type="button"
          className="block-action-btn"
          title="Add block below"
          onClick={() => onAddBelow(block.id, "paragraph")}
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          className="block-action-btn"
          title="Duplicate block"
          onClick={() => onDuplicate(block.id)}
        >
          <Copy size={13} />
        </button>
        <button
          type="button"
          className="block-action-btn delete"
          title="Delete block"
          onClick={() => onDelete(block.id)}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}