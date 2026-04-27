import { useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Notes from "./pages/Notes";
import Calculator from "./pages/Calculator";
import LinkedList from "./pages/LinkedList";
import Student from "./pages/Student";
import Queue from "./pages/Queue";

const THEME_KEY = "visual-notes-theme";
const GUEST_KEY = "guest";
const THEMES = [
  { id: "neon", label: "Neon" },
  { id: "amber", label: "Amber" },
  { id: "midnight", label: "Midnight" }
];


function ProtectedRoute({ children, onGuestChange }) {
  const token = localStorage.getItem("token");
  const guest = localStorage.getItem(GUEST_KEY) === "true";
  const nav = useNavigate();

  if (!token && !guest) {
    return (
      <div className="locked-screen">
        <div className="card locked-card">
          <h2>Sign in or continue as Guest</h2>

          <button className="btn" onClick={() => nav("/")}>
            Go To Login
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.setItem(GUEST_KEY, "true");
              onGuestChange?.(true);
              nav("/notes");
            }}
            type="button"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    );
  }

  return children;
}

function ThemeDock({ theme, onChange }) {
  return (
    <div className="theme-inline">
      {THEMES.map((item) => (
        <button
          key={item.id}
          className={`theme-chip ${theme === item.id ? "theme-chip-active" : ""}`}
          onClick={() => onChange(item.id)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Layout({ children, theme, onThemeChange, isGuest, onGuestChange }) {
  const nav = useNavigate();
  const location = useLocation();
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem(GUEST_KEY);
    onGuestChange?.(false);
    nav("/");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-block">
            <img src="/logo.png" className="logo-img" />
            <div className="brand-copy">
              <div className="logo">Slotae World</div>
              <p className="sidebar-copy">Hello World !!</p>
            </div>
          </div>

          <div className="sidebar-actions">
            {/* <button className={`nav-btn ${location.pathname === "/notes" ? "nav-btn-active" : ""}`}
             onClick={() => nav("/notes")}>Kepp Memo</button> */}
            <button className={`nav-btn ${location.pathname === "/calculator" ? "nav-btn-active" : ""}`}
             onClick={() => nav("/calculator")}>Calculator</button>
            <button className={`nav-btn ${location.pathname === "/queue" ? "nav-btn-active" : ""}`}
             onClick={() => nav("/queue")}>Fruit Queue</button>
             <button className={`nav-btn ${location.pathname === "/linkedlist" ? "nav-btn-active" : ""}`}
             onClick={() => nav("/linkedlist")}>Linked List</button>
            <button className={`nav-btn ${location.pathname === "/student" ? "nav-btn-active" : ""}`}
            onClick={() => nav("/student")}>Student</button>
            {!isGuest && (
            <button className="nav-btn nav-btn-ghost" onClick={logout}>Sign Out</button>)}
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-theme">
            <p className="theme-label">Palette</p>
            <ThemeDock theme={theme} onChange={onThemeChange} />
          </div>

          <div className="sidebar-meta">
            <span>Curate</span>
            <span>Visuals</span>
            <span>Focus</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="main-shell">{children}</div>
      </main>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "neon");
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(GUEST_KEY) === "true");

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login onGuestChange={setIsGuest} />} />
          <Route path="/notes" element={
            <ProtectedRoute isGuest={isGuest} setIsGuest={setIsGuest} onGuestChange={setIsGuest}>
              <Layout theme={theme} onThemeChange={setTheme} isGuest={isGuest} onGuestChange={setIsGuest}>
                <Notes />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/calculator" element={
          <ProtectedRoute isGuest={isGuest} setIsGuest={setIsGuest} onGuestChange={setIsGuest}>
          <Layout theme={theme} onThemeChange={setTheme} isGuest={isGuest} onGuestChange={setIsGuest}>
            <Calculator />
            </Layout>
            </ProtectedRoute> 
           }/>
           <Route path="/queue" element={
           <ProtectedRoute isGuest={isGuest} setIsGuest={setIsGuest} onGuestChange={setIsGuest}>
           <Layout theme={theme} onThemeChange={setTheme} isGuest={isGuest} onGuestChange={setIsGuest}>
            <Queue />
            </Layout>
            </ProtectedRoute>
           }/>
           <Route path="/linkedlist" element={
           <ProtectedRoute isGuest={isGuest} setIsGuest={setIsGuest} onGuestChange={setIsGuest}>
           <Layout theme={theme} onThemeChange={setTheme} isGuest={isGuest} onGuestChange={setIsGuest}>
           <LinkedList />
           </Layout>
           </ProtectedRoute>
          }/>
          <Route path="/student" element={
          <ProtectedRoute isGuest={isGuest} setIsGuest={setIsGuest} onGuestChange={setIsGuest}>
          <Layout theme={theme} onThemeChange={setTheme} isGuest={isGuest} onGuestChange={setIsGuest}>
          <Student />
          </Layout>
          </ProtectedRoute>
          }/>

        </Routes>
      </BrowserRouter>
    </div>
  );
}
