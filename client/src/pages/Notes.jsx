import React, { useEffect, useState } from "react";
import API from "../api/axios";

const LOCAL_NOTES_KEY = "visual-notes-local";

const emptyForm = {
  title: "",
  content: "",
  pinned: false
};

const readLocalNotes = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_NOTES_KEY) || "[]");
  } catch (_error) {
    return [];
  }
};

const writeLocalNotes = (notes) => {
  localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
};

const hasGuestSession = () => localStorage.getItem("guest") === "true";

const hasLocalTokenSession = () => {
  const token = localStorage.getItem("token") || "";
  return token.startsWith("local-token:");
};

const shouldUseLocalFallback = (err) =>
  !err.response || hasGuestSession() || hasLocalTokenSession() || [401, 403].includes(err.response?.status);

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const sortNotes = (items) =>
  [...items].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }

    const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bDate - aDate;
  });

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [storageMode, setStorageMode] = useState("server");
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [lightboxImage, setLightboxImage] = useState("");
  const [detailNote, setDetailNote] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const pushToast = (text, tone = "default") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const getNotes = async () => {
    try {
      const res = await API.get("/notes");
      setNotes(sortNotes(res.data));
      setStorageMode("server");
    } catch (err) {
      if (!shouldUseLocalFallback(err)) {
        setMessage(err.response?.data?.message || "Could not load notes");
        return;
      }

      const fallbackNotes = sortNotes(readLocalNotes());
      setNotes(fallbackNotes);
      setStorageMode("local");
      if (fallbackNotes.length) {
        setMessage("Server unavailable. Showing local notes.");
        pushToast("Showing locally stored notes", "soft");
      } else {
        setMessage("Server unavailable. Saving locally for now.");
        pushToast("Offline mode activated", "soft");
      }
    }
  };

  useEffect(() => {
    getNotes();
  }, []);

  useEffect(() => {
    if (!image) {
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(image);
    setPreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [image]);

  const resetForm = () => {
    setForm(emptyForm);
    setImage(null);
    setPreviewUrl("");
    setRemoveImage(false);
    setEditingId("");
  };

  const submit = async () => {
    if (!form.title.trim()) {
      setMessage("Please add a title first");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("content", form.content);
      payload.append("pinned", String(form.pinned));

      if (image) {
        payload.append("image", image);
      }

      if (editingId) {
        payload.append("removeImage", String(removeImage));
        await API.put(`/notes/${editingId}`, payload);
      } else {
        await API.post("/notes", payload);
      }

      setStorageMode("server");
      resetForm();
      await getNotes();
      pushToast(editingId ? "Note updated" : "Note created", "success");
    } catch (err) {
      if (!shouldUseLocalFallback(err)) {
        setMessage(err.response?.data?.message || "Could not save note");
        pushToast(err.response?.data?.message || "Could not save note", "danger");
        return;
      }

      const localNotes = readLocalNotes();
      let imageUrl = previewUrl;

      if (image) {
        imageUrl = await toDataUrl(image);
      }

      const now = new Date().toISOString();

      let nextNotes;
      if (editingId) {
        nextNotes = localNotes.map((note) =>
          note._id === editingId
            ? {
                ...note,
                title: form.title,
                content: form.content,
                pinned: form.pinned,
                imageUrl: removeImage ? "" : imageUrl,
                updatedAt: now
              }
            : note
        );
      } else {
        nextNotes = [
          {
            _id: `local-${Date.now()}`,
            title: form.title,
            content: form.content,
            pinned: form.pinned,
            imageUrl,
            createdAt: now,
            updatedAt: now
          },
          ...localNotes
        ];
      }

      const sorted = sortNotes(nextNotes);
      writeLocalNotes(sorted);
      setNotes(sorted);
      setStorageMode("local");
      setMessage("Server unavailable. Note saved locally.");
      resetForm();
      pushToast("Saved locally", "soft");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (note) => {
    setEditingId(note._id);
    setForm({
      title: note.title || "",
      content: note.content || "",
      pinned: Boolean(note.pinned)
    });
    setImage(null);
    setPreviewUrl(note.imageUrl || "");
    setRemoveImage(false);
    setMessage("");
    setDetailNote(null);
  };

  const del = async (id) => {
    try {
      setMessage("");
      await API.delete(`/notes/${id}`);

      if (editingId === id) {
        resetForm();
      }
      if (detailNote?._id === id) {
        setDetailNote(null);
      }

      await getNotes();
      pushToast("Note deleted", "danger");
    } catch (err) {
      if (!shouldUseLocalFallback(err)) {
        setMessage(err.response?.data?.message || "Could not delete note");
        pushToast(err.response?.data?.message || "Could not delete note", "danger");
        return;
      }

      const nextNotes = sortNotes(readLocalNotes().filter((note) => note._id !== id));
      writeLocalNotes(nextNotes);
      setNotes(nextNotes);
      if (editingId === id) {
        resetForm();
      }
      if (detailNote?._id === id) {
        setDetailNote(null);
      }
      setStorageMode("local");
      setMessage("Server unavailable. Note deleted locally.");
      pushToast("Deleted locally", "soft");
    }
  };

  const clearSelectedImage = () => {
    setImage(null);
    setPreviewUrl("");
    setRemoveImage(true);
  };

  const togglePinned = async (note) => {
    const nextPinned = !note.pinned;

    try {
      const payload = new FormData();
      payload.append("title", note.title || "");
      payload.append("content", note.content || "");
      payload.append("pinned", String(nextPinned));
      payload.append("removeImage", "false");

      await API.put(`/notes/${note._id}`, payload);
      await getNotes();
      setDetailNote((current) => (current && current._id === note._id ? { ...current, pinned: nextPinned } : current));
      pushToast(nextPinned ? "Note pinned" : "Pin removed", "success");
    } catch (err) {
      if (!shouldUseLocalFallback(err)) {
        setMessage(err.response?.data?.message || "Could not update pin");
        pushToast(err.response?.data?.message || "Could not update pin", "danger");
        return;
      }

      const nextNotes = sortNotes(
        readLocalNotes().map((item) =>
          item._id === note._id ? { ...item, pinned: nextPinned, updatedAt: new Date().toISOString() } : item
        )
      );
      writeLocalNotes(nextNotes);
      setNotes(nextNotes);
      setDetailNote((current) => (current && current._id === note._id ? { ...current, pinned: nextPinned } : current));
      setStorageMode("local");
      setMessage("Server unavailable. Pin updated locally.");
      pushToast(nextPinned ? "Pinned locally" : "Unpinned locally", "soft");
    }
  };

  const handleDroppedFiles = (files) => {
    const nextImage = files?.[0] || null;
    if (!nextImage) {
      return;
    }

    setImage(nextImage);
    setRemoveImage(false);
    pushToast("Image ready to upload", "success");
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredNotes = notes.filter((note) => {
    const matchesQuery =
      !normalizedQuery ||
      note.title?.toLowerCase().includes(normalizedQuery) ||
      note.content?.toLowerCase().includes(normalizedQuery);

    const matchesFilter =
      filterMode === "all" ||
      (filterMode === "images" && note.imageUrl) ||
      (filterMode === "pinned" && note.pinned);

    return matchesQuery && matchesFilter;
  });

  return (
    <div className="notes-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Moodboard</p>
          <h1>Build a sharp visual board for ideas worth keeping.</h1>
          <p className="hero-copy">
            Curate references, captions, and cover shots in a layout that stays clean, visual, and easy to scan.
          </p>
          <p className="sync-pill">{storageMode === "server" ? "Syncing with server" : "Offline local mode"}</p>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <strong>{notes.length}</strong>
            <span>Frames</span>
          </div>
          <div className="stat-card">
            <strong>{notes.filter((note) => note.pinned).length}</strong>
            <span>Pinned</span>
          </div>
        </div>
      </section>

      <section className="toolbar card">
        <input
          className="input toolbar-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search frames, captions, or moods..."
        />
        <div className="filter-row">
          <button className={`chip ${filterMode === "all" ? "chip-active" : ""}`} onClick={() => setFilterMode("all")} type="button">
            All
          </button>
          <button className={`chip ${filterMode === "images" ? "chip-active" : ""}`} onClick={() => setFilterMode("images")} type="button">
            Images
          </button>
          <button className={`chip ${filterMode === "pinned" ? "chip-active" : ""}`} onClick={() => setFilterMode("pinned")} type="button">
            Pinned
          </button>
        </div>
      </section>

      <section className="notes-layout">
        <div className="composer card composer-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">{editingId ? "Editing frame" : "New frame"}</p>
              <h2>{editingId ? "Refine this frame" : "Create a fresh frame"}</h2>
            </div>
            {editingId ? (
              <button className="btn btn-secondary" onClick={resetForm} type="button">
                Cancel
              </button>
            ) : null}
          </div>

          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
            placeholder="Frame title"
          />

          <textarea
            className="input textarea"
            value={form.content}
            onChange={(e) => setForm((current) => ({ ...current, content: e.target.value }))}
            placeholder="Write the concept, story hook, or visual direction..."
          />

          <button
            className={`pin-toggle-button ${form.pinned ? "pin-toggle-button-active" : ""}`}
            onClick={() => setForm((current) => ({ ...current, pinned: !current.pinned }))}
            type="button"
          >
            <span className="pin-toggle-glow" />
            <span className="pin-toggle-copy">
              <strong>{form.pinned ? "Pinned frame" : "Pin this frame"}</strong>
              <small>{form.pinned ? "This frame stays at the top." : "Keep this one floating above the rest."}</small>
            </span>
            <span className="pin-toggle-pill">{form.pinned ? "On" : "Off"}</span>
          </button>

          <label
            className={`upload-field upload-dropzone ${isDragging ? "upload-dropzone-active" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleDroppedFiles(e.dataTransfer.files);
            }}
          >
            <span>Cover image</span>
            <strong>Drop an image here or browse from your device</strong>
            <small>Use a strong visual to make this frame stand out.</small>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                handleDroppedFiles(e.target.files);
              }}
            />
          </label>

          {previewUrl ? (
            <div className="preview-shell">
              <img className="preview-image" src={previewUrl} alt="Preview" />
              <button className="btn btn-secondary" onClick={clearSelectedImage} type="button">
                Remove image
              </button>
            </div>
          ) : null}

          {message ? <p className="message">{message}</p> : null}

          <button className="btn btn-primary-hero" onClick={submit} disabled={loading} type="button">
            {loading ? "Saving..." : editingId ? "Update frame" : "Create frame"}
          </button>
        </div>

        <div className="notes-grid">
          {filteredNotes.length ? filteredNotes.map((note, index) => (
            <article
              key={note._id}
              className={`note-card ${note.pinned ? "note-card-pinned" : ""}`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <button className={`pin-badge ${note.pinned ? "pin-badge-active" : ""}`} onClick={() => togglePinned(note)} type="button">
                {note.pinned ? "Pinned" : "Pin"}
              </button>

              {note.imageUrl ? (
                <button className="image-button" onClick={() => setDetailNote(note)} type="button">
                  <img className="note-image" src={note.imageUrl} alt={note.title} />
                </button>
              ) : (
                <button className="image-button" onClick={() => setDetailNote(note)} type="button">
                  <div className="note-image note-image-placeholder">
                    <span>No image</span>
                  </div>
                </button>
              )}

              <button className="note-card-open" onClick={() => setDetailNote(note)} type="button">
                <div className="note-body">
                  <div className="note-header">
                    <h3>{note.title}</h3>
                    <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p>{note.content || "No story added yet."}</p>
                </div>
              </button>

              <div className="note-actions">
                <button className="btn btn-secondary" onClick={() => startEdit(note)} type="button">
                  Edit
                </button>
                <button className="btn btn-danger" onClick={() => del(note._id)} type="button">
                  Delete
                </button>
              </div>
            </article>
          )) : (
            <div className="empty-state card">
              <p className="eyebrow">Clear Board</p>
              <h3>Nothing is showing for this view yet.</h3>
              <p className="subtitle">Try another filter, search with a different mood, or create a new frame with a strong cover image.</p>
            </div>
          )}
        </div>
      </section>

      {detailNote ? (
        <div className="detail-overlay" onClick={() => setDetailNote(null)} role="presentation">
          <div className="detail-modal card" onClick={(e) => e.stopPropagation()} role="presentation">
            <div className="detail-topbar">
              <p className="eyebrow">Frame Detail</p>
              <button className="lightbox-close" onClick={() => setDetailNote(null)} type="button">
                Close
              </button>
            </div>

            <div className="detail-layout">
              <div className="detail-visual">
                {detailNote.imageUrl ? (
                  <>
                    <img className="detail-image" src={detailNote.imageUrl} alt={detailNote.title} />
                    <button className="btn btn-secondary detail-image-action" onClick={() => setLightboxImage(detailNote.imageUrl)} type="button">
                      Open Full Image
                    </button>
                  </>
                ) : (
                  <div className="detail-image detail-image-empty">
                    <span>No cover image</span>
                  </div>
                )}
              </div>

              <div className="detail-content">
                <div className="note-header">
                  <h2>{detailNote.title}</h2>
                  <span className={`detail-pin ${detailNote.pinned ? "detail-pin-active" : ""}`}>
                    {detailNote.pinned ? "Pinned" : "Standard"}
                  </span>
                </div>
                <p className="detail-date">
                  Updated {new Date(detailNote.updatedAt || detailNote.createdAt).toLocaleString()}
                </p>
                <p className="detail-copy">{detailNote.content || "No story added yet."}</p>

                <div className="detail-actions">
                  <button className="btn" onClick={() => togglePinned(detailNote)} type="button">
                    {detailNote.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button className="btn btn-secondary" onClick={() => startEdit(detailNote)} type="button">
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => del(detailNote._id)} type="button">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {lightboxImage ? (
        <div className="lightbox" onClick={() => setLightboxImage("")} role="presentation">
          <div className="lightbox-shell">
            <button className="lightbox-close" onClick={() => setLightboxImage("")} type="button">
              Close
            </button>
            <img className="lightbox-image" src={lightboxImage} alt="Expanded note" />
          </div>
        </div>
      ) : null}

      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`}>
            {toast.text}
          </div>
        ))}
      </div>
    </div>
  );
}
