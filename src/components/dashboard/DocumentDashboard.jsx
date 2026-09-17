import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  FileText,
  Plus,
  Users,
  Clock,
  Trash2,
  Share2,
  Download,
  ExternalLink,
  Cpu,
  Layers,
  Search,
  Sparkles,
  CheckCircle2,
  Code2,
} from "lucide-react";

export default function DocumentDashboard({ onSelectDocument }) {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // 'all', 'mine', 'shared'
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("rfc");
  const [error, setError] = useState("");

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await api.documents.getAll();
      setDocuments(docs || []);
    } catch (err) {
      setError("Failed to load documents: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    setError("");

    let initialAst = [];
    if (selectedTemplate === "rfc") {
      initialAst = [
        { id: `node-${Date.now()}-1`, type: "heading", level: 1, value: newTitle.trim() },
        { id: `node-${Date.now()}-2`, type: "callout", value: "Status: Proposed Architecture Standard • Multi-Master CRDT Replication Matrix" },
        { id: `node-${Date.now()}-3`, type: "heading", level: 2, value: "1. Problem Statement & Scope" },
        { id: `node-${Date.now()}-4`, type: "paragraph", value: "Multi-user text editors frequently suffer from destructive overwrites and sync conflicts. Plain text merging is insufficient for complex structural documents, leading to lost work when multiple users edit the same document simultaneously." },
        { id: `node-${Date.now()}-5`, type: "heading", level: 2, value: "2. Technical Proposal" },
        { id: `node-${Date.now()}-6`, type: "paragraph", value: "This document outlines the AST node conflict resolution architecture utilizing Conflict-free Replicated Data Type (CRDT) matrix synchronization." },
        { id: `node-${Date.now()}-7`, type: "heading", level: 2, value: "3. Implementation Code" },
        { id: `node-${Date.now()}-8`, type: "code", value: "// AST Node State Reconciliation Pipeline\nexport function reconcileNodes(astRoot, peerDeltas) {\n  return YjsMatrix.mergeConcurrentNodes(astRoot, peerDeltas);\n}" },
      ];
    } else if (selectedTemplate === "blueprint") {
      initialAst = [
        { id: `node-${Date.now()}-1`, type: "heading", level: 1, value: newTitle.trim() },
        { id: `node-${Date.now()}-2`, type: "paragraph", value: "System blueprint outlining modular microservices and real-time state delivery." },
        { id: `node-${Date.now()}-3`, type: "heading", level: 2, value: "Core Subsystems" },
        { id: `node-${Date.now()}-4`, type: "list-item", value: "AST Schema Validator with recursive Mongoose hooks" },
        { id: `node-${Date.now()}-5`, type: "list-item", value: "WebSocket CRDT routing layer (Node.js & Yjs)" },
        { id: `node-${Date.now()}-6`, type: "list-item", value: "DOMPurify XSS transformation and PDFKit compiler" },
      ];
    } else {
      initialAst = [
        { id: `node-${Date.now()}-1`, type: "heading", level: 1, value: newTitle.trim() },
        { id: `node-${Date.now()}-2`, type: "paragraph", value: "Start typing your collaborative document..." },
      ];
    }

    try {
      const created = await api.documents.create({
        title: newTitle.trim(),
        content: JSON.stringify(initialAst),
      });
      setShowCreateModal(false);
      setNewTitle("");
      onSelectDocument(created._id);
    } catch (err) {
      setError("Failed to create document: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this technical spec?")) return;

    try {
      await api.documents.delete(id);
      setDocuments(documents.filter((d) => d._id !== id));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const isOwner = doc.owner === user?.id || doc.owner?._id === user?.id;

    if (filterTab === "mine") return matchesSearch && isOwner;
    if (filterTab === "shared") return matchesSearch && !isOwner;
    return matchesSearch;
  });

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <header className="dashboard-nav">
        <div className="nav-brand">
          <div className="brand-logo-icon">
            <Cpu size={22} />
          </div>
          <div>
            <div className="brand-title-wrap">
              <span className="nav-title">SyncDoc</span>
              <span className="badge-crdt">CRDT AST v1.0</span>
            </div>
            <span className="nav-subtitle">Collaborative Document Engine</span>
          </div>
        </div>

        <div className="nav-actions">
          <div className="status-pill online">
            <span className="status-dot" />
            <span>CRDT Matrix Online</span>
          </div>

          <div className="user-profile-menu">
            <div className="user-avatar-badge">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
            </div>
            <div className="user-info-text">
              <span className="user-display-name">{user?.name}</span>
              <span className="user-display-email">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="btn-logout"
              title="Sign Out of Session"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Banner */}
        <section className="dashboard-hero">
          <div className="hero-content">
            <div className="hero-tag">
              <Sparkles size={16} className="text-amber-400" />
              <span>Conflict-Free AST Collaboration</span>
            </div>
            <h1 className="hero-heading">Engineers Technical Specs Hub</h1>
            <p className="hero-desc">
              Concurrent real-time editing powered by Yjs replication matrices and deep Abstract Syntax Tree
              conflict resolution. Zero-overwrite guarantees across paragraph additions and code block insertions.
            </p>

            <div className="hero-actions">
              <button
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                <span>New Technical Spec</span>
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  window.open(window.location.href, "_blank");
                }}
                title="Open another browser window to simulate second engineer"
              >
                <ExternalLink size={16} />
                <span>Simulate 2nd Engineer Window</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hero-stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrap icon-purple">
                <FileText size={20} />
              </div>
              <div className="stat-data">
                <span className="stat-value">{documents.length}</span>
                <span className="stat-label">Active Documents</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap icon-blue">
                <Users size={20} />
              </div>
              <div className="stat-data">
                <span className="stat-value">
                  {documents.reduce((acc, doc) => acc + (doc.collaborators?.length || 0), 0)}
                </span>
                <span className="stat-label">Collaborator Links</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap icon-emerald">
                <CheckCircle2 size={20} />
              </div>
              <div className="stat-data">
                <span className="stat-value">100%</span>
                <span className="stat-label">Zero-Overwrite Rate</span>
              </div>
            </div>
          </div>
        </section>

        {/* Toolbar & Filters */}
        <div className="dashboard-controls">
          <div className="tab-pills">
            <button
              className={`tab-pill ${filterTab === "all" ? "active" : ""}`}
              onClick={() => setFilterTab("all")}
            >
              All Documents ({documents.length})
            </button>
            <button
              className={`tab-pill ${filterTab === "mine" ? "active" : ""}`}
              onClick={() => setFilterTab("mine")}
            >
              My Documents
            </button>
            <button
              className={`tab-pill ${filterTab === "shared" ? "active" : ""}`}
              onClick={() => setFilterTab("shared")}
            >
              Shared with Me
            </button>
          </div>

          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search specifications by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Document Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading technical specifications from AST database...</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <Layers size={48} className="empty-icon" />
            <h3>No specifications found</h3>
            <p>
              {searchQuery
                ? "No document titles match your search criteria."
                : "Create your first collaborative technical spec to start pairing."}
            </p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              <span>Create Specification</span>
            </button>
          </div>
        ) : (
          <div className="documents-grid">
            {filteredDocuments.map((doc) => {
              const isOwner = doc.owner === user?.id || doc.owner?._id === user?.id;
              let blockCount = 0;
              try {
                const parsed = JSON.parse(doc.content);
                blockCount = Array.isArray(parsed) ? parsed.length : 1;
              } catch {
                blockCount = 1;
              }

              return (
                <div
                  key={doc._id}
                  className="doc-card"
                  onClick={() => onSelectDocument(doc._id)}
                >
                  <div className="doc-card-header">
                    <div className="doc-type-badge">
                      <FileText size={16} />
                      <span>AST Doc</span>
                    </div>

                    <div className="doc-card-badges">
                      {isOwner ? (
                        <span className="badge badge-owner">Owner</span>
                      ) : (
                        <span className="badge badge-shared">Collaborator</span>
                      )}
                    </div>
                  </div>

                  <h3 className="doc-card-title">{doc.title}</h3>

                  <p className="doc-card-meta">
                    <Clock size={13} />
                    <span>Updated {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{blockCount} AST Blocks</span>
                  </p>

                  <div className="doc-card-footer">
                    <div className="collaborator-pill-stack">
                      <div className="collaborator-avatar main" title={isOwner ? "You (Owner)" : "Owner"}>
                        {isOwner ? "YOU" : "OW"}
                      </div>
                      {doc.collaborators?.map((c, i) => (
                        <div
                          key={i}
                          className="collaborator-avatar sub"
                          title="Collaborator"
                        >
                          C{i + 1}
                        </div>
                      ))}
                    </div>

                    <div className="doc-card-actions" onClick={(e) => e.stopPropagation()}>
                      {isOwner && (
                        <button
                          className="action-icon-btn delete-btn"
                          title="Delete Specification"
                          onClick={(e) => handleDelete(e, doc._id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      <button
                        className="btn-open-card"
                        onClick={() => onSelectDocument(doc._id)}
                      >
                        <span>Open Spec</span>
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* New Document Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Specification</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="modal-form">
              {error && <div className="auth-error-banner">{error}</div>}

              <div className="form-group">
                <label>Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. RFC-403: Real-Time Event Bus Protocol"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Template Architecture</label>
                <div className="template-grid">
                  <div
                    className={`template-option ${selectedTemplate === "rfc" ? "selected" : ""}`}
                    onClick={() => setSelectedTemplate("rfc")}
                  >
                    <div className="template-icon">
                      <FileText size={20} />
                    </div>
                    <div className="template-details">
                      <span className="template-name">Technical RFC Spec</span>
                      <span className="template-desc">Problem statement, architecture, code sample & AST blocks</span>
                    </div>
                  </div>

                  <div
                    className={`template-option ${selectedTemplate === "blueprint" ? "selected" : ""}`}
                    onClick={() => setSelectedTemplate("blueprint")}
                  >
                    <div className="template-icon">
                      <Layers size={20} />
                    </div>
                    <div className="template-details">
                      <span className="template-name">System Blueprint</span>
                      <span className="template-desc">Subsystems breakdown, checklists and callouts</span>
                    </div>
                  </div>

                  <div
                    className={`template-option ${selectedTemplate === "blank" ? "selected" : ""}`}
                    onClick={() => setSelectedTemplate("blank")}
                  >
                    <div className="template-icon">
                      <Plus size={20} />
                    </div>
                    <div className="template-details">
                      <span className="template-name">Blank Document</span>
                      <span className="template-desc">Empty canvas with AST node builder</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isCreating || !newTitle.trim()}
                >
                  {isCreating ? "Initializing Engine..." : "Create & Launch Editor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
