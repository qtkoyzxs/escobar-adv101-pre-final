import { useEffect, useState, useRef } from "react";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fmt(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch (e) {
    return "-";
  }
}

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("todo");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [theme, setTheme] = useState("dark");
  const [toast, setToast] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("todos:v1");
      if (raw) setTodos(JSON.parse(raw));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // load theme preference
  useEffect(() => {
    try {
      const t = localStorage.getItem("theme:v1");
      if (t === "light" || t === "dark" || t === "neon") setTheme(t);
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => { 
    try {
      localStorage.setItem("todos:v1", JSON.stringify(todos));
    } catch (e) {
      console.error(e);
    }
  }, [todos]);

  function addTodo(e) {
    e.preventDefault();
    doAdd();
  }

  function doAdd() {
    const t = title.trim();
    if (!t) return;
    const now = Date.now();
    const item = { id: uid(), title: t, description: description.trim(), completed: false, createdAt: now, updatedAt: now };
    setTodos((s) => [item, ...s]);
    setTitle("");
    setDescription("");
    // show temporary toast
    setToast({ id: now, text: "Task added" });
    setTimeout(() => setToast(null), 2000);
  }

  function toggleTheme() {
    // cycle through themes: dark -> light -> neon -> dark
    const next = theme === "dark" ? "light" : theme === "light" ? "neon" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("theme:v1", next);
    } catch (e) {}
  }

  function deleteTodo(id) {
    setTodos((s) => s.filter((it) => it.id !== id));
  }

  function runSearch(e) {
    if (e && e.preventDefault) e.preventDefault();
    const q = (search || "").trim().toLowerCase();
    if (!q) {
      const id = Date.now();
      setToast({ id, text: "Enter search terms" });
      setTimeout(() => setToast(null), 1600);
      if (searchRef.current) searchRef.current.focus();
      return;
    }

    const matches = todos.filter((it) => {
      return (it.title || "").toLowerCase().includes(q) || ((it.description || "").toLowerCase().includes(q));
    });
    const count = matches.length;
    const id = Date.now();
    setToast({ id, text: `${count} result${count === 1 ? "" : "s"}` });
    setTimeout(() => setToast(null), 2000);

    if (count > 0) {
      // scroll the first match into view
      setTimeout(() => {
        try {
          const firstId = matches[0].id;
          const el = document.querySelector(`[data-id="${firstId}"]`);
          if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (err) {
          // ignore
        }
      }, 150);
    }
  }

  function toggleComplete(id) {
    const now = Date.now();
    setTodos((s) => s.map((it) => (it.id === id ? { ...it, completed: !it.completed, updatedAt: now } : it)));
  }

  function startEditing(item) {
    setEditingId(item.id);
    setEditingTitle(item.title);
    setEditingDescription(item.description || "");
  }

  function saveEdit(e) {
    e.preventDefault();
    const t = editingTitle.trim();
    if (!t) return;
    const now = Date.now();
    setTodos((s) => s.map((it) => (it.id === editingId ? { ...it, title: t, description: editingDescription.trim(), updatedAt: now } : it)));
    setEditingId(null);
    setEditingTitle("");
    setEditingDescription("");
  }

  const visible = todos.filter((it) => {
    if (tab === "todo" && it.completed) return false;
    if (tab === "completed" && !it.completed) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(it.title.toLowerCase().includes(q) || (it.description || "").toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const todoCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className={`page ${theme === "dark" ? "dark" : "light"}`}>
      <header className="header">
        <div className="brand">
          <div className="logo">✓</div>
          <div>
            <div className="brand-title">TO DO LIST</div>
            <div className="brand-sub">Organize the task you had in mind</div>
          </div>
        </div>

        <div className="header-center">
          <nav className="nav">
            <button className={`nav-btn ${tab === "todo" ? "active" : ""}`} onClick={() => setTab("todo")}>To Do</button>
            <button className={`nav-btn ${tab === "completed" ? "active" : ""}`} onClick={() => setTab("completed")}>Completed</button>
          </nav>
          <div className="badges">
            <span className="badge">To Do: {todoCount}</span>
            <span className="badge muted">Done: {completedCount}</span>
          </div>
        </div>

        <div className="search-area">
          <input ref={searchRef} className="search" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="search-btn" onClick={runSearch} aria-label="Run search">🔍</button>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">{theme === "dark" ? "☀️" : theme === "light" ? "🌙" : "✨"}</button>
        </div>
      </header>

      <main className="wrap">
        <section className="panel list">
          <h2 className="panel-title">{tab === "todo" ? "To Do" : "Completed"}</h2>

          {visible.length === 0 ? (
            <div className="empty">No tasks — add one using the form.</div>
          ) : (
            <div className="grid">
              {visible.map((it) => (
                <article key={it.id} data-id={it.id} className={`card ${it.completed ? "done" : ""}`}>
                  <div className="card-left">
                    <input type="checkbox" checked={it.completed} onChange={() => toggleComplete(it.id)} />
                  </div>
                  <div className="card-body">
                    {editingId === it.id ? (
                      <form onSubmit={saveEdit} className="edit">
                        <input className="field title" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} />
                        <textarea className="field desc" value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} />
                        <div className="card-actions">
                          <button className="primary small" onClick={saveEdit} type="button">Save</button>
                          <button className="ghost small" onClick={() => setEditingId(null)} type="button">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h3 className="card-title">{it.title}</h3>
                        {it.description ? <p className="card-desc">{it.description}</p> : null}
                        <div className="meta">Created: {fmt(it.createdAt)} · Updated: {fmt(it.updatedAt)}</div>
                      </>
                    )}
                  </div>
                  <div className="card-right">
                    {editingId !== it.id && (
                      <>
                        <button className="ghost small" onClick={() => startEditing(it)}>Edit</button>
                        <button className="danger small" onClick={() => deleteTodo(it.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel create">
          <h2 className="panel-title">Create Task</h2>
          <form className="form" onSubmit={addTodo}>
            <input
              className="field title"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } }}
            />
            <textarea
              className="field desc"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doAdd(); } }}
            />
            <div className="form-actions">
              <button type="submit" className="primary">Add Task</button>
            </div>
          </form>
        </section>
      </main>

      <style jsx>{`
        .page.light{--accent-start:#06b6d4;--accent-end:#6366F1;--muted:#64748B;--bg-1:#f8fafc;--bg-2:#f1f5f9;--text:#0f172a;--card-bg:#fff;--card-border:#edf2ff;background:linear-gradient(180deg,var(--bg-1),var(--bg-2));color:var(--text)}
        .page.dark{--accent-start:#06b6d4;--accent-end:#7c3aed;--muted:#94a3b8;--bg-1:#020617;--bg-2:#071026;--text:#e6eef8;--card-bg:#071027;--card-border:rgba(255,255,255,0.04);background:linear-gradient(180deg,var(--bg-1),var(--bg-2));color:var(--text)}
        /* Surprise neon theme */
        .page.neon{--accent-start:#00ffd5;--accent-end:#7a00ff;--muted:#dfe8ff;--bg-1:#030015;--bg-2:#0b0426;--text:#f4fbff;--card-bg:linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));--card-border:rgba(255,255,255,0.06);background:radial-gradient(1200px 400px at 10% 10%, rgba(122,0,255,0.12), transparent), linear-gradient(180deg,var(--bg-1),var(--bg-2));color:var(--text)}
        .page{min-height:100vh;font-family:Inter,system-ui,Segoe UI,Roboto,'Helvetica Neue',Arial}
        .header{display:flex;align-items:center;gap:16px;padding:20px 28px;max-width:1100px;margin:18px auto}
        .brand{display:flex;gap:12px;align-items:center}
        .logo{width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,var(--accent-start),var(--accent-end));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700}
        .brand-title{font-weight:700;font-size:18px;color:var(--text)}
        .brand-sub{font-size:12px;color:var(--muted)}
        .nav{display:flex;gap:8px}
        .nav-btn{background:transparent;border:0;padding:8px 12px;border-radius:8px;color:#334155;cursor:pointer;transition:all .15s ease}
        .nav-btn:hover{transform:translateY(-1px);filter:brightness(.98)}
        .nav-btn.active{background:var(--accent);color:#fff;box-shadow:0 6px 18px rgba(99,102,241,0.18)}
        .search-area{margin-left:auto}
        .search-btn{margin-left:8px;padding:8px 10px;border-radius:8px;border:0;background:rgba(0,0,0,0.06);color:var(--text);cursor:pointer}
        .search-btn:hover{filter:brightness(1.05)}
        .search{padding:10px 12px;border-radius:10px;border:1px solid rgba(230,237,243,0.6);min-width:220px;box-shadow:inset 0 1px 0 rgba(16,24,40,0.02);background:var(--card-bg);color:var(--text)}
        .theme-toggle{margin-left:8px;padding:8px 10px;border-radius:8px;border:0;background:transparent;color:var(--text);cursor:pointer}

        .header-center{display:flex;flex-direction:column;align-items:flex-start;gap:8px;margin-left:20px}
        .badges{display:flex;gap:8px;align-items:center}
        .badge{background:linear-gradient(90deg,var(--accent-start),var(--accent-end));color:white;padding:6px 10px;border-radius:999px;font-size:13px}
        .badge.muted{background:transparent;color:var(--muted);border:1px solid var(--card-border)}

        .wrap{max-width:1100px;margin:0 auto;padding:12px 28px;display:grid;grid-template-columns:1fr 360px;gap:20px}
        .panel{background:var(--card-bg);border-radius:12px;padding:18px;box-shadow:0 8px 24px rgba(16,24,40,0.06);border:1px solid var(--card-border)}
        .panel-title{margin:0 0 12px 0;font-size:16px;color:var(--text)}

        .form{display:flex;flex-direction:column;gap:10px}
        .field{padding:10px 12px;border-radius:8px;border:1px solid rgba(230,237,243,0.6);background:var(--card-bg);color:var(--text)}
        .field.title{font-weight:600}
        .field.desc{min-height:80px;resize:vertical}
        .form-actions{display:flex;justify-content:flex-end}
        .primary{background:linear-gradient(90deg,var(--accent-start),var(--accent-end));color:white;padding:10px 14px;border-radius:10px;border:0;cursor:pointer;box-shadow:0 8px 20px rgba(99,102,241,0.12);transition:transform .12s ease,box-shadow .12s ease}
        .primary:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(99,102,241,0.16)}
        .primary:focus{outline:2px solid rgba(99,102,241,0.18);outline-offset:3px}

        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
        .card{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:12px;background:linear-gradient(180deg,var(--card-bg),rgba(255,255,255,0.02));border:1px solid var(--card-border);transition:transform .12s ease,box-shadow .12s ease}
        .card:hover{transform:translateY(-6px);box-shadow:0 12px 30px rgba(16,24,40,0.06)}
        .card.done{opacity:0.85;background:linear-gradient(180deg,#f7f7fb,#f2fbf5);border-color:#e6f2ec}
        .card-left{display:flex;align-items:center}
        .card-body{flex:1}
        .card-title{margin:0;font-size:15px;color:var(--text)}
        .card-desc{margin:8px 0;color:var(--muted)}
        .meta{font-size:12px;color:var(--muted)}
        .card-right{display:flex;flex-direction:column;gap:8px}
        .ghost{background:transparent;border:1px solid var(--card-border);padding:8px 10px;border-radius:8px;cursor:pointer}
        .danger{background:#fee2e2;border:0;padding:8px 10px;border-radius:8px;color:#b91c1c;cursor:pointer}
        .small{font-size:13px;padding:6px 8px}
        .empty{color:var(--muted);padding:18px}

        /* toast */
        .toast-wrap{position:fixed;right:20px;bottom:20px;z-index:60}
        .toast{background:rgba(15,23,42,0.9);color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 8px 30px rgba(2,6,23,0.4)}

        @media (max-width:880px){.wrap{grid-template-columns:1fr}.header{padding:12px}}

        /* Dark-theme header contrast improvements */
        .page.dark .header{
          background:linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
          box-shadow:0 6px 22px rgba(2,6,23,0.45);
          border-radius:14px;
          padding:18px 24px;
        }

        .page.dark .brand-title{color:#ffffff}
        .page.dark .brand-sub{color:rgba(230,238,255,0.72)}

        /* Make inactive nav buttons visible on dark backgrounds */
        .page.dark .nav-btn{color:var(--text)}
        .page.dark .nav-btn:not(.active){
          background:rgba(255,255,255,0.02);
          border:1px solid rgba(255,255,255,0.03);
          color:rgba(255,255,255,0.88);
        }

        .page.dark .logo{box-shadow:0 8px 28px rgba(124,58,237,0.22)}
        .page.dark .search{border:1px solid rgba(255,255,255,0.06)}
        .page.dark .badge.muted{color:rgba(255,255,255,0.72);border-color:rgba(255,255,255,0.04);background:transparent}

        /* Neon surprise theme styles */  
        .page.neon .header{
          background:linear-gradient(90deg, rgba(0,255,213,0.06), rgba(122,0,255,0.06));
          box-shadow:0 18px 60px rgba(122,0,255,0.14), 0 6px 18px rgba(0,255,213,0.06);
          border-radius:12px;
          padding:20px 26px;
          border:1px solid rgba(255,255,255,0.04);
        }

        .page.neon .brand-title{color:var(--text);text-shadow:0 2px 18px rgba(122,0,255,0.18)}
        .page.neon .brand-sub{color:rgba(244,251,255,0.85)}

        .page.neon .logo{background:linear-gradient(135deg,var(--accent-start),var(--accent-end));box-shadow:0 8px 36px rgba(122,0,255,0.24), 0 4px 12px rgba(0,255,213,0.08)}
        .page.neon .nav-btn:not(.active){background:rgba(255,255,255,0.02);border:1px solid rgba(122,0,255,0.10);color:var(--text)}
        .page.neon .nav-btn.active{background:linear-gradient(90deg,var(--accent-start),var(--accent-end));box-shadow:0 10px 30px rgba(122,0,255,0.18)}
        .page.neon .search{border:1px solid rgba(122,0,255,0.12);box-shadow:0 4px 18px rgba(0,0,0,0.25)}
        .page.neon .badge{background:linear-gradient(90deg,var(--accent-start),var(--accent-end));box-shadow:0 8px 30px rgba(122,0,255,0.12)}
      `}</style>
      {toast ? (
        <div className="toast-wrap">
          <div className="toast">{toast.text}</div>
        </div>
      ) : null}
    </div>
  );
}
