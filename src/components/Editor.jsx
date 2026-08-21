import { useState, useEffect } from "react";
import Toolbar from "./Toolbar";
import Block from "./Block";

function Editor({ saveStatus, setSaveStatus }) {
  const [title, setTitle] = useState("System Architecture");
  const wordCount = blocks.reduce((total, block) => {
  return total + block.content.trim().split(/\s+/).filter(Boolean).length;
}, 0);
<div className="document-stats">
  Words: {wordCount}
</div>
  const [blocks, setBlocks] = useState([
    {
      id: 1,
      type: "heading1",
      content: "System Architecture",
    },
    {
      id: 2,
      type: "paragraph",
      content:
        "Welcome to SyncDoc. This is a collaborative document editor.",
    },
    {
      id: 3,
      type: "paragraph",
      content:
        "Multiple users will be able to edit different blocks of this document simultaneously.",
    },
    {
      id: 4,
      type: "code",
      content: `const message = "Hello SyncDoc";
console.log(message);`,
    },
  ]);

  const [activeBlockId, setActiveBlockId] = useState(null);
  const [draggedBlockId, setDraggedBlockId] = useState(null);

  // Show Saving whenever the document changes
  useEffect(() => {
    setSaveStatus("Saving...");

    const timer = setTimeout(() => {
      setSaveStatus("Saved");
    }, 800);
    const handleDragStart = (event, id) => {
  setDraggedBlockId(id);
  event.dataTransfer.effectAllowed = "move";
};

const handleDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
};

const handleDrop = (event, targetId) => {
  event.preventDefault();

  if (!draggedBlockId || draggedBlockId === targetId) {
    return;
  }

  setBlocks((previousBlocks) => {
    const draggedBlock = previousBlocks.find(
      (block) => block.id === draggedBlockId
    );

    const remainingBlocks = previousBlocks.filter(
      (block) => block.id !== draggedBlockId
    );

    const targetIndex = remainingBlocks.findIndex(
      (block) => block.id === targetId
    );

    remainingBlocks.splice(targetIndex, 0, draggedBlock);

    return remainingBlocks;
  });

  setDraggedBlockId(null);
};

    return () => clearTimeout(timer);
  }, [title, blocks]);

  // Add new block
  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type: type,
      content:
        type === "heading1"
          ? "New Heading"
          : type === "heading2"
          ? "New Subheading"
          : type === "code"
          ? "// Write your code here"
          : "New paragraph",
    };

    setBlocks((previousBlocks) => [
      ...previousBlocks,
      newBlock,
    ]);
  };

  // Delete block
  const deleteBlock = (id) => {
    setBlocks((previousBlocks) =>
      previousBlocks.filter((block) => block.id !== id)
    );

    if (activeBlockId === id) {
      setActiveBlockId(null);
    }
  };

  // Update block content
  const updateBlock = (id, content) => {
    setBlocks((previousBlocks) =>
      previousBlocks.map((block) =>
        block.id === id
          ? { ...block, content: content }
          : block
      )
    );
  };

  // Select block
  const selectBlock = (id) => {
    setActiveBlockId(id);
  };

  // Change block type using toolbar
  const handleFormat = (format) => {
    if (!activeBlockId) {
      return;
    }

    setBlocks((previousBlocks) =>
      previousBlocks.map((block) => {
        if (block.id !== activeBlockId) {
          return block;
        }

        if (format === "heading1") {
          return {
            ...block,
            type: "heading1",
          };
        }

        if (format === "heading2") {
          return {
            ...block,
            type: "heading2",
          };
        }

        if (format === "paragraph") {
          return {
            ...block,
            type: "paragraph",
          };
        }

        if (format === "code") {
          return {
            ...block,
            type: "code",
          };
        }

        return block;
      })
    );
  };

  return (
    <main className="editor">

      {/* Document title */}
      <input
        className="title"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Document title"
      />
      <div className="document-stats">
  Words: {wordCount}
</div>


      {/* Toolbar */}
      <Toolbar onFormat={handleFormat} />

      <div className="editor-content">

        {/* Selected block information */}
        {activeBlockId && (
          <div className="active-info">
            Selected Block:{" "}
            {blocks.find(
              (block) => block.id === activeBlockId
            )?.type}
          </div>
        )}

        {/* Document blocks */}
        {blocks.map((block) => (
          <Block
  key={block.id}
  block={block}
  onDelete={deleteBlock}
  onChange={updateBlock}
  onSelect={selectBlock}
  isActive={activeBlockId === block.id}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDrop={handleDrop}
/>
        ))}

        {/* Add block buttons */}
        <div className="block-actions">

          <button
            className="add-block"
            onClick={() => addBlock("heading1")}
          >
            + Add H1
          </button>

          <button
            className="add-block"
            onClick={() => addBlock("heading2")}
          >
            + Add H2
          </button>

          <button
            className="add-block"
            onClick={() => addBlock("paragraph")}
          >
            + Add Paragraph
          </button>

          <button
            className="add-block"
            onClick={() => addBlock("code")}
          >
            + Add Code
          </button>

        </div>
      </div>
    </main>
  );
}

export default Editor;