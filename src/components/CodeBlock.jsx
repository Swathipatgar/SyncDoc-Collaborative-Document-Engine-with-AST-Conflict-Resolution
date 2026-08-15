function CodeBlock({ content, onChange }) {
  return (
    <pre
      className="code-block"
      contentEditable="true"
      suppressContentEditableWarning={true}
      onInput={(event) => onChange(event.currentTarget.textContent)}
    >
      <code>{content}</code>
    </pre>
  );
}

export default CodeBlock;