function HeadingBlock({ content }) {
  return (
    <h2
      className="heading-block"
      contentEditable="true"
      suppressContentEditableWarning={true}
    >
      {content}
    </h2>
  );
}

export default HeadingBlock;