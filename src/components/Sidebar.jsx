function Sidebar() {
  return (
    <aside className="sidebar">
      <h3>Documents</h3>

      <div className="document active">
        📄 System Architecture
      </div>

      <div className="document">
        📄 Technical Specification
      </div>

      <button className="new-doc">
        + New Document
      </button>
    </aside>
  );
}

export default Sidebar;