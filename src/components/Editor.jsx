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

  const updateBlock = (id, content) => {
    setBlocks((previousBlocks) =>
      previousBlocks.map((block) =>
        block.id === id
          ? { ...block, content: content }
          : block
      )
    );
  };

  return (
    <main className="editor">
      <input
        className="title"
        type="text"
        defaultValue="System Architecture"
      />

      <Toolbar />

      <div className="editor-content">
        {blocks.map((block) => (
          <Block
            key={block.id}
            block={block}
            onDelete={deleteBlock}
            onChange={updateBlock}
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