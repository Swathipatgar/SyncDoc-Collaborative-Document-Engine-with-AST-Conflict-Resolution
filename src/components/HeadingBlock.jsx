function HeadingBlock({ content, onChange }) {
  return (
    <h2
      className="heading-block"
      contentEditable="true"
      suppressContentEditableWarning={true}
      onInput={(event) => onChange(event.currentTarget.textContent)}
    >
      {content}
    </h2>
  );
}

export default HeadingBlock;