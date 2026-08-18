import { useState } from "react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Editor from "./components/Editor.jsx";
import "./App.css";

function App() {
  const [saveStatus, setSaveStatus] = useState("Saved");

  return (
    <div className="syncdoc">
      <Header saveStatus={saveStatus} />

      <div className="workspace">
        <Sidebar />

        <Editor
          saveStatus={saveStatus}
          setSaveStatus={setSaveStatus}
        />
      </div>
    </div>
  );
}

export default App;