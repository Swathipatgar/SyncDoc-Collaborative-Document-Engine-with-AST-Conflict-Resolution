import { useState } from "react";
import "./App.css";

function App() {
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
    <div className="syncdoc">

      {/* Header */}
      <header className="header">
        <div className="logo">SyncDoc</div>

        <div className="header-right">
          <span className="status">● Saved</span>
          <button className="share-btn">Share</button>
        </div>
      </header>

      {/* Workspace */}
      <div className="workspace">

        {/* Sidebar */}
        <aside className="sidebar">
          <h3>Documents</h3>

          <div className="document active">
            📄 System Architecture
          </div>

          <div className="document">
            📄 Technical Specification
          </div>

          <button className="new-doc">
            + New Document
          </button>
        </aside>

        {/* Editor */}
        <main className="editor">

          {/* Document title */}
          <input
            className="title"
            type="text"
            defaultValue="System Architecture"
          />

          {/* Toolbar */}
          <div className="toolbar">
            <button>B</button>
            <button>I</button>
            <button>H1</button>
            <button>H2</button>
            <button>Code</button>
          </div>

          {/* Editor content */}
          <div className="editor-content">

            <h1
              contentEditable="true"
              suppressContentEditableWarning={true}
            >
              System Architecture
            </h1>

            {/* Document blocks */}
            {blocks.map((block) => {

              if (block.type === "paragraph") {
                return (
                  <p
                    key={block.id}
                    contentEditable="true"
                    suppressContentEditableWarning={true}
                  >
                    {block.content}
                  </p>
                );
              }

              if (block.type === "code") {
                return (
                  <pre
                    key={block.id}
                    contentEditable="true"
                    suppressContentEditableWarning={true}
                  >
                    <code>{block.content}</code>
                  </pre>
                );
              }

              return null;
            })}

            {/* Add new block */}
            <button
              className="add-block"
              onClick={addBlock}
            >
              + Add Block
            </button>

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;