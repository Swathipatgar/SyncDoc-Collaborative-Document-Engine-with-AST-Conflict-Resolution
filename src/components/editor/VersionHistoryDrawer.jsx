import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { History, GitCommit, Clock, User, ArrowLeft, RefreshCw } from "lucide-react";

export default function VersionHistoryDrawer({ documentId, onClose, onRestoreVersion }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const data = await api.documents.getVersions(documentId);
      setVersions(data || []);
    } catch (err) {
      setError(err.message || "Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="version-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <History size={20} className="text-indigo-400" />
            <h3>Version Checkpoints</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-info-text">
            Automatic checkpoint snapshots saved by the debounced persistence engine upon live collaboration.
          </div>

          {loading ? (
            <div className="drawer-loading">
              <RefreshCw size={20} className="animate-spin text-indigo-400" />
              <span>Fetching AST version snapshots...</span>
            </div>
          ) : error ? (
            <div className="auth-error-banner">{error}</div>
          ) : versions.length === 0 ? (
            <div className="drawer-empty">
              <GitCommit size={32} className="text-slate-500" />
              <p>No version checkpoints recorded yet.</p>
              <span>Checkpoints are created automatically as collaborators edit.</span>
            </div>
          ) : (
            <div className="version-timeline">
              {versions.map((ver, idx) => (
                <div key={ver._id || idx} className="version-card">
                  <div className="version-header-row">
                    <span className="version-number-tag">
                      v{ver.versionNumber || versions.length - idx}
                    </span>
                    <span className="version-time">
                      {new Date(ver.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="version-summary">
                    {ver.changeSummary || "Collaborative modification"}
                  </div>

                  {ver.diff && (
                    <div className="version-diff-pill">
                      <span>{ver.diff}</span>
                    </div>
                  )}

                  <div className="version-meta">
                    <User size={12} />
                    <span>{ver.savedBy?.name || "Automated Checkpoint"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close History
          </button>
        </div>
      </div>
    </div>
  );
}
