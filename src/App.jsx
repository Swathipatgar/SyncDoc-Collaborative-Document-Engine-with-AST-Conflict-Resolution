import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./components/auth/AuthPage";
import DocumentDashboard from "./components/dashboard/DocumentDashboard";
import Editor from "./components/Editor";
import "./App.css";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentDocId, setCurrentDocId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("doc") || null;
  });

  // Keep URL query param synced with current document for easy sharing/refresh
  const handleSelectDoc = (docId) => {
    setCurrentDocId(docId);
    if (docId) {
      const url = new URL(window.location);
      url.searchParams.set("doc", docId);
      window.history.pushState({}, "", url);
    }
  };

  const handleBackToDashboard = () => {
    setCurrentDocId(null);
    const url = new URL(window.location);
    url.searchParams.delete("doc");
    window.history.pushState({}, "", url);
  };

  if (isLoading) {
    return (
      <div className="app-loading-screen">
        <div className="spinner" />
        <span>Initializing SyncDoc Engine...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (currentDocId) {
    return (
      <Editor
        documentId={currentDocId}
        onBack={handleBackToDashboard}
      />
    );
  }

  return <DocumentDashboard onSelectDocument={handleSelectDoc} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}