import ParagraphBlock from "./ParagraphBlock";
import CodeBlock from "./CodeBlock";
import HeadingBlock from "./HeadingBlock";

function Block({
  block,
  onDelete,
  onChange,
  onSelect,
  isActive,
}) {
  return (
    <div
      className={`block-wrapper ${isActive ? "active-block" : ""}`}
      onClick={() => onSelect(block.id)}
    >
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
        onClick={(event) => {
          event.stopPropagation();
          onDelete(block.id);
        }}
      >
        Delete
      </button>
    </div>
  );
}

export default Block;