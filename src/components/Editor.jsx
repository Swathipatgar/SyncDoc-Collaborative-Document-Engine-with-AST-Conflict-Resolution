import { useState } from "react";
import Toolbar from "./Toolbar";
import ParagraphBlock from "./ParagraphBlock";
import CodeBlock from "./CodeBlock";

function Editor() {
  const [blocks, setBlocks] = useState([
    {
      id: 1,
      type: "paragraph",
      content:
        "Welcome to SyncDoc. This is a collaborative document editor.",
    },
    {
      id: 2,
      type: "paragraph",
      content:
        "Multiple users will be able to edit different blocks of this document simultaneously.",
    },
    {
      id: 3,
      type: "code",
      content: `const message = "Hello SyncDoc";
console.log(message);`,
    },
  ]);

  const addBlock = () => {
    const newBlock = {
      id: Date.now(),
      type: "paragraph",
      content: "New block",
    };

    setBlocks((previousBlocks) => [...previousBlocks, newBlock]);
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
        <h1
          contentEditable="true"
          suppressContentEditableWarning={true}
        >
          System Architecture
        </h1>

        {blocks.map((block) => {
          if (block.type === "paragraph") {
            return (
              <ParagraphBlock
                key={block.id}
                content={block.content}
              />
            );
          }

          if (block.type === "code") {
            return (
              <CodeBlock
                key={block.id}
                content={block.content}
              />
            );
          }

          return null;
        })}

        <button className="add-block" onClick={addBlock}>
          + Add Block
        </button>
      </div>
    </main>
  );
}

export default Editor;