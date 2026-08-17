import { useState } from "react";
import Toolbar from "./Toolbar";
import Block from "./Block";

function Editor() {
  const [blocks, setBlocks] = useState([
    {
      id: 1,
      type: "heading",
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


  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type: type,
      content:
        type === "heading"
          ? "New Heading"
          : type === "code"
          ? "// Write your code here"
          : "New paragraph",
    };

    setBlocks((previousBlocks) => [
      ...previousBlocks,
      newBlock,
    ]);
  };

  const deleteBlock = (id) => {
    setBlocks((previousBlocks) =>
      previousBlocks.filter((block) => block.id !== id)
    );
  };
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
  const updateBlock = (id, content) => {
    setBlocks((previousBlocks) =>
      previousBlocks.map((block) =>
        block.id === id
          ? { ...block, content: content }
          : block
      )
    );
  };
  
  const [activeBlockId, setActiveBlockId] = useState(null);

  const selectBlock = (id) => {
  setActiveBlockId(id);
};

  return (
    <main className="editor">
      <input
        className="title"
        type="text"
        defaultValue="System Architecture"
      />

      <Toolbar onFormat={handleFormat} />

      <div className="editor-content">

        {activeBlockId && (
  <div className="active-info">
    Selected Block:{" "}
    {blocks.find((block) => block.id === activeBlockId)?.type}
  </div>
)}

        {blocks.map((block) => (
          <Block
  key={block.id}
  block={block}
  onDelete={deleteBlock}
  onChange={updateBlock}
  onSelect={selectBlock}
  isActive={activeBlockId === block.id}
/>
        ))}

        <div className="block-actions">
          <button
            className="add-block"
            onClick={() => addBlock("heading")}
          >
            + Add Heading
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