import React from "react";
import ReactDOM from "react-dom/client";
import "virtual:windi.css";

import App from "./App";
import { AppKitProvider } from "./config/appkit";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppKitProvider>
      <App />
    </AppKitProvider>
  </React.StrictMode>
);
