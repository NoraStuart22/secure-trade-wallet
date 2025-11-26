import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force English locale for RainbowKit and other components
if (typeof document !== "undefined") {
  document.documentElement.lang = "en";
}

createRoot(document.getElementById("root")!).render(<App />);
