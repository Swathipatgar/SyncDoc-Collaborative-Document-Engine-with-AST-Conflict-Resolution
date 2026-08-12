function ParagraphBlock({ content }) {
  return (
    <p
      className="paragraph-block"
      contentEditable="true"
      suppressContentEditableWarning={true}
    >
      {content}
    </p>
  );
}

export default ParagraphBlock;