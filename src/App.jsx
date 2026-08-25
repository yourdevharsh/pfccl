import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import Toolbar from "./components/Toolbar";
import MainCanvas from "./components/MainCanvas";

import "./App.css";

function App() {
  return (
    <ReactFlowProvider>
      <MainCanvas />
      <Toolbar />
    </ReactFlowProvider>
  );
}

export default App;
