import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Editor from "./components/Editor.jsx";
import "./App.css";

function App() {
  return (
    <div className="syncdoc">
      <Header />

      <div className="workspace">
        <Sidebar />
        <Editor />
      </div>
    </div>
  );
}

export default App;