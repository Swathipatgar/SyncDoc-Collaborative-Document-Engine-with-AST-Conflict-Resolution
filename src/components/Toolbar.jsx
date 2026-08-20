\function Toolbar({ onFormat }) {
  return (
    <div className="toolbar">
      <button onClick={() => onFormat("bold")}>
        B
      </button>

      <button onClick={() => onFormat("italic")}>
        I
      </button>

      <button onClick={() => onFormat("heading1")}>
        H1
      </button>

      <button onClick={() => onFormat("heading2")}>
        H2
      </button>

      <button onClick={() => onFormat("paragraph")}>
        P
      </button>

      <button onClick={() => onFormat("code")}>
        Code
      </button>
    </div>
  );
}

export default Toolbar;