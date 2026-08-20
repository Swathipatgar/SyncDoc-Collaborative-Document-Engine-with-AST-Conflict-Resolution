function Header() {
  return (
    <header className="header">
      <div className="logo">SyncDoc</div>

      <div className="header-right">
        <span className="status">● Saved</span>
        <button className="share-btn">Share</button>
      </div>
    </header>
  );
}

export default Header;