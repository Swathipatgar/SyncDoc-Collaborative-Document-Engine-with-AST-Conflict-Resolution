import { useState, useEffect } from "react";
import Toolbar from "./Toolbar";
import Block from "./Block.jsx";

function Editor({ saveStatus, setSaveStatus }) {
  const [title, setTitle] = useState(() => {
  return (
    localStorage.getItem("syncdoc-title") ||
    "System Architecture"
  );
});

  const [blocks, setBlocks] = useState(() => {
  const savedBlocks = localStorage.getItem("syncdoc-blocks");

  if (savedBlocks) {
    return JSON.parse(savedBlocks);
  }

  return [
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
    ];
    setBlocks(defaultBlocks);
  setTitle("System Architecture");

  localStorage.removeItem("syncdoc-blocks");
  localStorage.removeItem("syncdoc-title");

  const [activeBlockId, setActiveBlockId] = useState(null);
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  // Word count
  const wordCount = blocks.reduce((total, block) => {
    return (
      total +
      block.content
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    );
  }, 0);

  const characterCount = blocks.reduce((total, block) => {
  return total + block.content.length;
}, 0);

  // Show Saving whenever the document changes
  useEffect(() => {
    setSaveStatus("Saving...");

    localStorage.setItem(
  "syncdoc-blocks",
  JSON.stringify(blocks)
);
localStorage.setItem(
  "syncdoc-title",
  title
);

    const timer = setTimeout(() => {
      setSaveStatus("Saved");
    }, 800);

    return () => clearTimeout(timer);
  }, [title, blocks, setSaveStatus]);

  // Add new block
  const addBlock = (type) => {
  saveHistory(blocks);

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
  saveHistory(blocks);

  setBlocks((previousBlocks) =>
    previousBlocks.filter((block) => block.id !== id)
  );

  if (activeBlockId === id) {
    setActiveBlockId(null);
  }
};

  // Duplicate block
  const duplicateBlock = (id) => {
  saveHistory(blocks);

  setBlocks((previousBlocks) => {
    const index = previousBlocks.findIndex(
      (block) => block.id === id
    );

    if (index === -1) {
      return previousBlocks;
    }

    const originalBlock = previousBlocks[index];

    const newBlock = {
      ...originalBlock,
      id: Date.now(),
    };

    const updatedBlocks = [...previousBlocks];

    updatedBlocks.splice(index + 1, 0, newBlock);

    return updatedBlocks;
  });
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
  saveHistory(blocks);
  const handleFormat = (format) => {
  if (!activeBlockId) {
    return;
  }

  saveHistory(blocks);   // 👈 ADD THIS

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
  // Start dragging a block
  const handleDragStart = (event, id) => {
    setDraggedBlockId(id);
    event.dataTransfer.effectAllowed = "move";
  };

  // Allow dropping
  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  // Drop block
  const handleDrop = (event, targetId) => {
    event.preventDefault();

    if (
      !draggedBlockId ||
      draggedBlockId === targetId
    ) {
      return;
    }

    saveHistory(blocks);

    setBlocks((previousBlocks) => {
      const draggedBlock = previousBlocks.find(
        (block) => block.id === draggedBlockId
      );

      if (!draggedBlock) {
        return previousBlocks;
      }

      const remainingBlocks = previousBlocks.filter(
        (block) => block.id !== draggedBlockId
      );

      const targetIndex = remainingBlocks.findIndex(
        (block) => block.id === targetId
      );

      if (targetIndex === -1) {
        return previousBlocks;
      }

      remainingBlocks.splice(
        targetIndex,
        0,
        draggedBlock
      );

      return remainingBlocks;
    });

    setDraggedBlockId(null);
  };
    const saveHistory = (currentBlocks) => {
    setHistory((previousHistory) => [
      ...previousHistory,
      currentBlocks,
    ]);

    setFuture([]);
  };

  const undo = () => {
    if (history.length === 0) {
      return;
    }

    const previousBlocks = history[history.length - 1];

    setFuture((previousFuture) => [
      blocks,
      ...previousFuture,
    ]);

    setBlocks(previousBlocks);

    setHistory((previousHistory) =>
      previousHistory.slice(0, -1)
    );
  };

  const redo = () => {
    if (future.length === 0) {
      return;
    }

    const nextBlocks = future[0];

    setHistory((previousHistory) => [
      ...previousHistory,
      blocks,
    ]);

    setBlocks(nextBlocks);

    setFuture((previousFuture) =>
      previousFuture.slice(1)
    );
  };

  return (
    <main className="editor">

      {/* Document title */}
      <input
        className="title"
        type="text"
        value={title}
        onChange={(event) =>
          setTitle(event.target.value)
        }
        placeholder="Document title"
      />

      {/* Word count */}
      <div className="document-stats">
  Words: {wordCount} | Characters: {characterCount}
</div>
const readingTime = Math.max(
  1,
  Math.ceil(wordCount / 200)
);

<div className="document-stats">
  Words: {wordCount} | Characters: {characterCount} |
  Reading time: {readingTime} min
</div>

      {/* Toolbar */}
      <Toolbar onFormat={handleFormat} />

      <div className="editor-content">

        {/* Selected block information */}
        {activeBlockId && (
          <div className="active-info">
            Selected Block:{" "}
            {
              blocks.find(
                (block) =>
                  block.id === activeBlockId
              )?.type
            }
          </div>
        )}

        {/* Document blocks */}
        {blocks.map((block) => (
          <Block
            key={block.id}
            block={block}
            onDelete={deleteBlock}
            onDuplicate={duplicateBlock}
            onChange={updateBlock}
            onSelect={selectBlock}
            isActive={
              activeBlockId === block.id
            }
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}

        {/* Add block buttons */}
        <div className="block-actions">

          <button
            className="add-block"
            onClick={() =>
              addBlock("heading1")
            }
          >
            + Add H1
          </button>

          <button
            className="add-block"
            onClick={() =>
              addBlock("heading2")
            }
          >
            + Add H2
          </button>

          <button
            className="add-block"
            onClick={() =>
              addBlock("paragraph")
            }
          >
            + Add Paragraph
          </button>

          <button
            className="add-block"
            onClick={() =>
              addBlock("code")
            }
          >
            + Add Code
          </button>

        </div>
      </div>
    </main>
  );
}

export default Editor;