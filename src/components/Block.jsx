import ParagraphBlock from "./ParagraphBlock";
import CodeBlock from "./CodeBlock";
import HeadingBlock from "./HeadingBlock";

function Block({
  block,
  onDelete,
  onChange,
  onSelect,
  isActive,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  return (
    <div
      className={`block-wrapper ${
        isActive ? "active-block" : ""
      }`}
      draggable
      onClick={() => onSelect(block.id)}
      onDragStart={(event) => onDragStart(event, block.id)}
      onDragOver={(event) => onDragOver(event)}
      onDrop={(event) => onDrop(event, block.id)}
    >
      {block.type === "heading1" && (
        <h1
          className="heading-block"
          contentEditable="true"
          suppressContentEditableWarning={true}
          onInput={(event) =>
            onChange(
              block.id,
              event.currentTarget.textContent
            )
          }
        >
          {block.content}
        </h1>
      )}

      {block.type === "heading2" && (
        <HeadingBlock
          content={block.content}
          onChange={(content) =>
            onChange(block.id, content)
          }
        />
      )}

      {block.type === "paragraph" && (
        <ParagraphBlock
          content={block.content}
          onChange={(content) =>
            onChange(block.id, content)
          }
        />
      )}

      {block.type === "code" && (
        <CodeBlock
          content={block.content}
          onChange={(content) =>
            onChange(block.id, content)
          }
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