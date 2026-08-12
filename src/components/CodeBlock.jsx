function CodeBlock({ content }) {
  return (
    <pre
      className="code-block"
      contentEditable="true"
      suppressContentEditableWarning={true}
    >
      <code>{content}</code>
    </pre>
  );
}

export default CodeBlock;