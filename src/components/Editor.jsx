import { useState, useEffect } from "react";
import Toolbar from "./Toolbar";
import Block from "./Block.jsx";

function Editor({ saveStatus, setSaveStatus }) {
  // -----------------------------
  // Document Title
  // -----------------------------
  const [title, setTitle] = useState(() => {
    return (
      localStorage.getItem("syncdoc-title") ||
      "System Architecture"
    );
  });

  // -----------------------------
  // Document Blocks
  // -----------------------------
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
  });

  // -----------------------------
  // States
  // -----------------------------
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [draggedBlockId, setDraggedBlockId] = useState(null);

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  // Search states
  const [searchText, setSearchText] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);

  // -----------------------------
  // Document Statistics
  // -----------------------------
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

  const blockCount = blocks.length;

  const readingTime = Math.max(
    1,
    Math.ceil(wordCount / 200)
  );

  // -----------------------------
  // Search Results
  // -----------------------------
  const searchResults = blocks.filter((block) =>
    block.content
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  // -----------------------------
  // Save History
  // -----------------------------
  const saveHistory = (currentBlocks) => {
    setHistory((previousHistory) => [
      ...previousHistory,
      currentBlocks,
    ]);

    setFuture([]);
  };

  // -----------------------------
  // Undo
  // -----------------------------
  const undo = () => {
    if (history.length === 0) {
      return;
    }

    const previousBlocks =
      history[history.length - 1];

    setFuture((previousFuture) => [
      blocks,
      ...previousFuture,
    ]);

    setBlocks(previousBlocks);

    setHistory((previousHistory) =>
      previousHistory.slice(0, -1)
    );
  };

  // -----------------------------
  // Redo
  // -----------------------------
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

  // -----------------------------
  // Auto Save
  // -----------------------------
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

  // -----------------------------
  // Add Block
  // -----------------------------
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

  // -----------------------------
  // Delete Block
  // -----------------------------
  const deleteBlock = (id) => {
    saveHistory(blocks);

    setBlocks((previousBlocks) =>
      previousBlocks.filter(
        (block) => block.id !== id
      )
    );

    if (activeBlockId === id) {
      setActiveBlockId(null);
    }
  };

  // -----------------------------
  // Duplicate Block
  // -----------------------------
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

      updatedBlocks.splice(
        index + 1,
        0,
        newBlock
      );

      return updatedBlocks;
    });
  };

  // -----------------------------
  // Update Block
  // -----------------------------
  const updateBlock = (id, content) => {
    setBlocks((previousBlocks) =>
      previousBlocks.map((block) =>
        block.id === id
          ? {
              ...block,
              content: content,
            }
          : block
      )
    );
  };

  // -----------------------------
  // Select Block
  // -----------------------------
  const selectBlock = (id) => {
    setActiveBlockId(id);
  };

  // -----------------------------
  // Format Block
  // -----------------------------
  const handleFormat = (format) => {
    if (!activeBlockId) {
      return;
    }

    saveHistory(blocks);

    setBlocks((previousBlocks) =>
      previousBlocks.map((block) => {
        if (block.id !== activeBlockId) {
          return block;
        }

        return {
          ...block,
          type: format,
        };
      })
    );
  };

  // -----------------------------
  // Drag Start
  // -----------------------------
  const handleDragStart = (event, id) => {
    setDraggedBlockId(id);

    event.dataTransfer.effectAllowed = "move";
  };

  // -----------------------------
  // Drag Over
  // -----------------------------
  const handleDragOver = (event) => {
    event.preventDefault();

    event.dataTransfer.dropEffect = "move";
  };

  // -----------------------------
  // Drop Block
  // -----------------------------
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
      const draggedBlock =
        previousBlocks.find(
          (block) =>
            block.id === draggedBlockId
        );

      if (!draggedBlock) {
        return previousBlocks;
      }

      const remainingBlocks =
        previousBlocks.filter(
          (block) =>
            block.id !== draggedBlockId
        );

      const targetIndex =
        remainingBlocks.findIndex(
          (block) =>
            block.id === targetId
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

  // -----------------------------
  // Search Next
  // -----------------------------
  const nextSearchResult = () => {
    if (searchResults.length === 0) {
      return;
    }

    const nextIndex =
      (searchIndex + 1) %
      searchResults.length;

    setSearchIndex(nextIndex);

    setActiveBlockId(
      searchResults[nextIndex].id
    );
  };

  // -----------------------------
  // Search Previous
  // -----------------------------
  const previousSearchResult = () => {
    if (searchResults.length === 0) {
      return;
    }

    const previousIndex =
      (searchIndex -
        1 +
        searchResults.length) %
      searchResults.length;

    setSearchIndex(previousIndex);

    setActiveBlockId(
      searchResults[previousIndex].id
    );
  };

  // -----------------------------
  // RETURN / UI
  // -----------------------------
  return (
    <main className="editor">

      {/* Document Title */}
      <input
        className="title"
        type="text"
        value={title}
        onChange={(event) =>
          setTitle(event.target.value)
        }
        placeholder="Document title"
      />

      {/* Search */}
      <div className="search-box">
        <input
          type="text"
          value={searchText}
          onChange={(event) => {
            setSearchText(event.target.value);
            setSearchIndex(0);
          }}
          placeholder="Search document..."
        />

        {searchText && (
  <button
    onClick={() => {
      setSearchText("");
      setSearchIndex(0);
      setActiveBlockId(null);
    }}
  >
    ✕ Clear
  </button>
)}

        {searchText &&
          searchResults.length > 0 && (
            <>
              <button
                onClick={previousSearchResult}
              >
                ← Previous
              </button>

              <span>
                {searchIndex + 1} /{" "}
                {searchResults.length}
              </span>

              <button
                onClick={nextSearchResult}
              >
                Next →
              </button>
            </>
          )}

        {searchText &&
  searchResults.length === 0 && (
    <span className="no-results">
      No matching blocks found
    </span>
  )}
      </div>

      {/* Document Statistics */}
      <div className="document-stats">
        Blocks: {blockCount} | Words: {wordCount} |
        Characters: {characterCount} | Reading time:{" "}
        {readingTime} min
      </div>

      {/* Search Result Message */}
      {searchText && (
        <div className="search-results">
          Found {searchResults.length} matching
          block(s)
        </div>
      )}

      {/* Save Status */}
      <div className="save-indicator">
        Status: {saveStatus}
      </div>

      {/* Toolbar */}
      <Toolbar
  onFormat={handleFormat}
  onUndo={undo}
  onRedo={redo}
  canUndo={history.length > 0}
  canRedo={future.length > 0}
/>

      <div className="editor-content">

        {/* Selected Block */}
        {activeBlockId && (
  <div className="active-info">
    <span>
      Selected Block:{" "}
      {
        blocks.find(
          (block) =>
            block.id === activeBlockId
        )?.type
      }
    </span>

    <button
      onClick={() => setActiveBlockId(null)}
    >
      Clear Selection
    </button>
  </div>
)}

        {/* Document Blocks */}
        {blocks.map((block) => (
          <div
            key={block.id}
            className={
              searchText &&
              block.content
                .toLowerCase()
                .includes(
                  searchText.toLowerCase()
                )
                ? "search-match"
                : ""
            }
          >
            <Block
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
          </div>
        ))}

        {/* Add Block Buttons */}
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