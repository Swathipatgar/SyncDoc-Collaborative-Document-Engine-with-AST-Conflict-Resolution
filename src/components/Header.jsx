function Header({ saveStatus }) {
  return (
    <header className="header">
      <div className="logo">
        SyncDoc
      </div>

      <div className="header-right">
        <span className="status">
          ● {saveStatus}
        </span>

        <button className="share-btn">
          Share
        </button>
      </div>
    </header>
  );
}

export default Header;