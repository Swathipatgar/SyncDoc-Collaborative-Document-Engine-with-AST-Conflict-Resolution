import ParagraphBlock from "./ParagraphBlock";
import CodeBlock from "./CodeBlock";
import HeadingBlock from "./HeadingBlock";

function Block({ block, onDelete, onChange }) {
  return (
    <div className="block-wrapper">
      {block.type === "heading" && (
        <HeadingBlock
          content={block.content}
          onChange={(content) => onChange(block.id, content)}
        />
      )}

      {block.type === "paragraph" && (
        <ParagraphBlock
          content={block.content}
          onChange={(content) => onChange(block.id, content)}
        />
      )}

      {block.type === "code" && (
        <CodeBlock
          content={block.content}
          onChange={(content) => onChange(block.id, content)}
        />
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