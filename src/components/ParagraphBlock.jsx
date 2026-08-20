function ParagraphBlock({ content, onChange }) {
  return (
    <p
      className="paragraph-block"
      contentEditable="true"
      suppressContentEditableWarning={true}
      onInput={(event) => onChange(event.currentTarget.textContent)}
    >
      {content}
    </p>
  );
}

export default ParagraphBlock;