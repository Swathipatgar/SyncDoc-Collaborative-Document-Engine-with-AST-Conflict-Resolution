import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Users, UserPlus, Trash2, Shield, UserCheck, AlertCircle } from "lucide-react";

export default function ShareModal({ document, onClose, onUpdated }) {
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [permission, setPermission] = useState("write");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await api.auth.getUsers();
        // Filter out users already in collaborators or owner
        const existingIds = new Set([
          document.owner?._id || document.owner,
          ...(document.collaborators || []).map((c) => (c.user?._id || c.user || c).toString()),
        ]);
        const remaining = (users || []).filter((u) => !existingIds.has(u._id));
        setAvailableUsers(remaining);
        if (remaining.length > 0) {
          setSelectedUserId(remaining[0]._id);
        }
      } catch (err) {
        console.warn("Failed to fetch available users:", err.message);
      }
    };
    fetchUsers();
  }, [document]);

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.documents.share(document._id, {
        collaboratorId: selectedUserId,
        permission,
      });
      setSuccess("Collaborator successfully invited!");
      onUpdated(res.document);
      // Remove from available
      setAvailableUsers((prev) => prev.filter((u) => u._id !== selectedUserId));
      setSelectedUserId("");
    } catch (err) {
      setError(err.message || "Failed to add collaborator");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.documents.removeCollaborator(document._id, collaboratorId);
      setSuccess("Collaborator access revoked.");
      onUpdated(res.document);
    } catch (err) {
      setError(err.message || "Failed to remove collaborator");
    } finally {
      setLoading(false);
    }
  };

  const isOwner = (document.owner?._id || document.owner) === user?.id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Users size={20} className="text-indigo-400" />
            <h3>Share Specification & Permissions</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="share-modal-body">
          {error && (
            <div className="auth-error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="auth-success-banner">
              <UserCheck size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Add collaborator form (only for owner) */}
          {isOwner && (
            <form onSubmit={handleAddCollaborator} className="share-add-form">
              <label>Invite Engineer to Collaborate</label>
              <div className="share-input-row">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="share-user-select"
                  disabled={loading || availableUsers.length === 0}
                >
                  {availableUsers.length === 0 ? (
                    <option value="">No other registered users available</option>
                  ) : (
                    availableUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))
                  )}
                </select>

                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  className="share-perm-select"
                  disabled={loading}
                >
                  <option value="write">Can Edit (Write)</option>
                  <option value="read">Can View (Read-Only)</option>
                </select>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !selectedUserId}
                >
                  <UserPlus size={16} />
                  <span>Invite</span>
                </button>
              </div>
            </form>
          )}

          {/* Collaborator List */}
          <div className="collaborators-list-section">
            <label>People with Access</label>
            <div className="collaborators-list">
              {/* Owner */}
              <div className="collaborator-item owner">
                <div className="user-avatar-circle">
                  {document.owner?.name
                    ? document.owner.name.slice(0, 2).toUpperCase()
                    : "OW"}
                </div>
                <div className="collab-details">
                  <span className="collab-name">
                    {document.owner?.name || "Document Creator"}
                  </span>
                  <span className="collab-email">
                    {document.owner?.email || "Owner Account"}
                  </span>
                </div>
                <span className="badge badge-owner">Owner</span>
              </div>

              {/* Collaborators */}
              {(!document.collaborators || document.collaborators.length === 0) ? (
                <div className="no-collabs-msg">
                  No additional collaborators added yet.
                </div>
              ) : (
                document.collaborators.map((c) => {
                  const u = c.user || {};
                  const collabId = u._id || u;
                  return (
                    <div key={collabId} className="collaborator-item">
                      <div className="user-avatar-circle collab">
                        {u.name ? u.name.slice(0, 2).toUpperCase() : "CO"}
                      </div>
                      <div className="collab-details">
                        <span className="collab-name">{u.name || "Collaborator"}</span>
                        <span className="collab-email">{u.email || "Registered User"}</span>
                      </div>

                      <div className="collab-actions">
                        <span className={`badge ${c.permission === "write" ? "badge-write" : "badge-read"}`}>
                          {c.permission === "write" ? "Editor" : "Viewer"}
                        </span>

                        {isOwner && (
                          <button
                            type="button"
                            className="btn-remove-collab"
                            onClick={() => handleRemoveCollaborator(collabId)}
                            title="Remove collaborator"
                            disabled={loading}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
