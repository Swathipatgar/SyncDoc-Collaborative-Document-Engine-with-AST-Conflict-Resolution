import ParagraphBlock from "./ParagraphBlock";
import CodeBlock from "./CodeBlock";
import HeadingBlock from "./HeadingBlock";

function Block({ block, onDelete }) {
  return (
    <div className="block-wrapper">
      {block.type === "heading" && (
        <HeadingBlock content={block.content} />
      )}

      {block.type === "paragraph" && (
        <ParagraphBlock content={block.content} />
      )}

      {block.type === "code" && (
        <CodeBlock content={block.content} />
      )}

      <button
        className="delete-block"
        onClick={() => onDelete(block.id)}
      >
        Delete
      </button>
    </div>
  );
}

export default Block;