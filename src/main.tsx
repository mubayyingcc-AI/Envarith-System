import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AuthorityRegistry from "./AuthorityRegistry";
import { SitePage, knownSitePaths } from "./SitePages";
import "./styles/global.css";
import "./styles/pages.css";

const path = window.location.pathname.replace(/\/$/, "") || "/";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {path === "/" ? <App /> : path === "/platform/authority" ? <AuthorityRegistry /> : knownSitePaths.includes(path) ? <SitePage path={path} /> : <SitePage path={path} />}
  </React.StrictMode>,
);
