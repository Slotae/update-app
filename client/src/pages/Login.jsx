import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const LOCAL_USERS_KEY = "visual-notes-users";

const readLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
  } catch (_error) {
    return [];
  }
};

const writeLocalUsers = (users) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const createLocalToken = (email) => `local-token:${email}:${Date.now()}`;

export default function Login({ onGuestChange }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const nav = useNavigate();

  const normalizedEmail = email.trim().toLowerCase();

  const login = async () => {
    try {
      setMessage("");
      const res = await API.post("/auth/login", {
        email,
        password
      });

      console.log(res.data);

      localStorage.removeItem("guest");
      localStorage.setItem("token", res.data.token);
      onGuestChange?.(false);
      nav("/notes");
    } catch (err) {
      if (err.response) {
        console.log(err.response?.data);
        setMessage(err.response?.data?.message || "Login failed");
        return;
      }

      const localUsers = readLocalUsers();
      const localUser = localUsers.find((user) => user.email === normalizedEmail);

      if (!localUser) {
        setMessage("Server unavailable and no local account was found");
        return;
      }

      if (localUser.password !== password) {
        setMessage("Incorrect password");
        return;
      }

      localStorage.removeItem("guest");
      localStorage.setItem("token", createLocalToken(normalizedEmail));
      onGuestChange?.(false);
      setMessage("Server unavailable. Logged in with local account.");
      nav("/notes");
    }
  };

  const register = async () => {
    try {
      setMessage("");
      const res = await API.post("/auth/register", {
        email,
        password
      });

      console.log(res.data);

      localStorage.removeItem("guest");
      localStorage.setItem("token", res.data.token);
      onGuestChange?.(false);
      nav("/notes");
    } catch (err) {
      if (err.response) {
        console.log(err.response?.data);
        setMessage(err.response?.data?.message || "Registration failed");
        return;
      }

      if (!normalizedEmail || !password) {
        setMessage("Email and password are required");
        return;
      }

      const localUsers = readLocalUsers();
      const exists = localUsers.some((user) => user.email === normalizedEmail);

      if (exists) {
        setMessage("User already exists locally");
        return;
      }

      writeLocalUsers([
        ...localUsers,
        { email: normalizedEmail, password }
      ]);

      localStorage.removeItem("guest");
      localStorage.setItem("token", createLocalToken(normalizedEmail));
      onGuestChange?.(false);
      setMessage("Server unavailable. Account created locally.");
      nav("/notes");
    }
  };

  const continueAsGuest = () => {
    localStorage.removeItem("token");
    localStorage.setItem("guest", "true");
    onGuestChange?.(true);
    nav("/notes");
  };

  return (
    <div className="container">
      <div className="auth-shell">
        <div className="card auth-panel">
          <p className="eyebrow">Visual Workspace</p>
          <h1>Museboard keeps your strongest ideas in one clean frame.</h1>
          <p className="subtitle">
            Save references, captions, covers, and pinned concepts without the clutter of a typical note app.
          </p>

          <div className="auth-pills">
            <span>Image-ready</span>
            <span>Pinned picks</span>
            <span>Fast search</span>
          </div>
        </div>

        <div className="card auth-card">
          <p className="eyebrow">Welcome back</p>
          <h2>Hello How are you</h2>
          <p className="subtitle">Sign in to keep building your curated visual collection.</p>

          <input
            className="input"
            value={email}
            placeholder="Email address"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="input"
            type="password"
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          {message ? <p className="message">{message}</p> : null}

          <div className="button-row">
            <button className="btn" onClick={login}>
              Login
            </button>
            

            <button className="btn btn-secondary" onClick={register}>
              Register
            </button>
            <button className="btn btn-secondary" onClick={continueAsGuest} type="button">
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
