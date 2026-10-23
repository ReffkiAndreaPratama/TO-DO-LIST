(() => {
  "use strict";
  const STORAGE_KEY = "taskly.tasks.v1";
  const THEME_KEY = "taskly.theme.v1";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const elements = {
    taskList: $("#taskList"), emptyState: $("#emptyState"), emptyTitle: $("#emptyTitle"),
    emptyText: $("#emptyText"), dialog: $("#taskDialog"), form: $("#taskForm"),
    title: $("#taskTitle"), description: $("#taskDescription"), category: $("#taskCategory"),
    priority: $("#taskPriority"), deadline: $("#taskDeadline"), search: $("#searchInput"),
    sort: $("#sortSelect"), toast: $("#toast")
  };

  let tasks = loadTasks();
  let currentFilter = "all";
  let currentCategory = "all";
  let editingId = null;
  let toastTimer;

  function loadTasks() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data.filter(t => t && typeof t.id === "string" && typeof t.title === "string") : [];
    } catch (error) { return []; }
  }
  function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
  function uid() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }
  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }
  function dateOnlyNow() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
  function isOverdue(task) { return Boolean(task.deadline && task.deadline < dateOnlyNow() && !task.completed); }
  function priorityRank(priority) { return ({ high: 3, medium: 2, low: 1 })[priority] || 0; }
  function priorityLabel(priority) { return ({ high: "Tinggi", medium: "Sedang", low: "Rendah" })[priority] || "Sedang"; }
  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2400);
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total ? Math.round(completed / total * 100) : 0;
    $("#totalStat").textContent = total;
    $("#pendingStat").textContent = pending;
    $("#doneStat").textContent = completed;
    $("#progressBar").style.width = `${percent}%`;
    $("#progressText").textContent = `${percent}% dari seluruh tugas`;
    $("#allCount").textContent = total;
    $("#activeCount").textContent = pending;
    $("#completedCount").textContent = completed;
    $("#listSummary").textContent = `${visibleTasks().length} tugas ditampilkan`;
    $("#clearCompletedBtn").disabled = completed === 0;
  }

  function visibleTasks() {
    const query = elements.search.value.trim().toLocaleLowerCase("id");
    let filtered = tasks.filter(task => {
      const statusMatch = currentFilter === "all" || (currentFilter === "active" && !task.completed) || (currentFilter === "completed" && task.completed);
      const categoryMatch = currentCategory === "all" || task.category === currentCategory;
      const searchMatch = !query || `${task.title} ${task.description || ""} ${task.category}`.toLocaleLowerCase("id").includes(query);
      return statusMatch && categoryMatch && searchMatch;
    });
    switch (elements.sort.value) {
      case "deadline":
        filtered.sort((a, b) => (a.deadline || "9999-99-99").localeCompare(b.deadline || "9999-99-99") || b.createdAt - a.createdAt);
        break;
      case "priority":
        filtered.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || b.createdAt - a.createdAt);
        break;
      default: filtered.sort((a, b) => b.createdAt - a.createdAt);
    }
    return filtered;
  }

  function renderTasks() {
    const filtered = visibleTasks();
    elements.taskList.innerHTML = filtered.map(task => {
      const deadline = task.deadline ? `<span class="deadline ${isOverdue(task) ? "overdue" : ""}">${isOverdue(task) ? "⚠ Terlambat · " : "▦ "}${escapeHTML(formatDate(task.deadline))}</span>` : "";
      return `<article class="task-row ${task.completed ? "completed" : ""}" data-id="${escapeHTML(task.id)}">
        <button class="check-btn" data-action="toggle" aria-label="${task.completed ? "Tandai belum selesai" : "Tandai selesai"}" title="${task.completed ? "Tandai belum selesai" : "Tandai selesai"}">${task.completed ? "✓" : ""}</button>
        <div class="task-body">
          <div class="task-title">${escapeHTML(task.title)}</div>
          ${task.description ? `<div class="task-description">${escapeHTML(task.description)}</div>` : ""}
          <div class="task-meta"><span class="badge category-badge">${escapeHTML(task.category || "Lainnya")}</span><span class="badge priority-${escapeHTML(task.priority || "medium")}">${escapeHTML(priorityLabel(task.priority))}</span>${deadline}</div>
        </div>
        <div class="task-actions"><button data-action="edit" title="Edit tugas" aria-label="Edit tugas">✎</button><button data-action="delete" title="Hapus tugas" aria-label="Hapus tugas">⌫</button></div>
      </article>`;
    }).join("");
    const empty = filtered.length === 0;
    elements.emptyState.classList.toggle("hidden", !empty);
    elements.taskList.classList.toggle("hidden", empty);
    if (empty) {
      const hasAny = tasks.length > 0;
      elements.emptyTitle.textContent = hasAny ? "Tidak ada tugas yang cocok" : "Belum ada tugas";
      elements.emptyText.textContent = hasAny ? "Coba ubah kata pencarian atau filter yang dipilih." : "Tambahkan tugas pertamamu dan mulai atur harimu.";
      $("#emptyAddBtn").classList.toggle("hidden", hasAny);
    }
    const descriptions = { all: "Semua hal yang perlu diselesaikan.", active: "Fokus pada tugas yang belum selesai.", completed: "Lihat semua pencapaianmu." };
    $("#panelDescription").textContent = descriptions[currentFilter];
    $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.filter === currentFilter));
    $$(".chip").forEach(button => button.classList.toggle("active", button.dataset.category === currentCategory));
    updateStats();
  }

  function openDialog(task = null) {
    editingId = task?.id || null;
    $("#dialogTitle").textContent = task ? "Edit tugas" : "Tambah tugas baru";
    $("#saveTaskBtn").textContent = task ? "Simpan perubahan" : "Simpan tugas";
    elements.form.reset();
    elements.title.value = task?.title || "";
    elements.description.value = task?.description || "";
    elements.category.value = task?.category || "Kuliah";
    elements.priority.value = task?.priority || "medium";
    elements.deadline.value = task?.deadline || "";
    elements.dialog.showModal();
    setTimeout(() => elements.title.focus(), 30);
  }
  function closeDialog() { elements.dialog.close(); editingId = null; }

  elements.form.addEventListener("submit", event => {
    event.preventDefault();
    const title = elements.title.value.trim();
    if (!title) { elements.title.focus(); return; }
    const existing = tasks.find(t => t.id === editingId);
    const task = {
      id: editingId || uid(), title,
      description: elements.description.value.trim(),
      category: elements.category.value,
      priority: elements.priority.value,
      deadline: elements.deadline.value,
      completed: existing?.completed || false,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    if (existing) tasks = tasks.map(t => t.id === editingId ? task : t);
    else tasks.push(task);
    saveTasks();
    closeDialog();
    renderTasks();
    showToast(existing ? "Perubahan tugas berhasil disimpan." : "Tugas baru berhasil ditambahkan.");
  });

  elements.taskList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const row = button.closest(".task-row");
    const task = tasks.find(t => t.id === row?.dataset.id);
    if (!task) return;
    switch (button.dataset.action) {
      case "toggle":
        task.completed = !task.completed;
        task.updatedAt = Date.now();
        saveTasks(); renderTasks();
        showToast(task.completed ? "Mantap! Tugas selesai 🎉" : "Tugas ditandai belum selesai.");
        break;
      case "edit": openDialog(task); break;
      case "delete":
        if (confirm(`Hapus tugas "${task.title}"?`)) {
          tasks = tasks.filter(t => t.id !== task.id);
          saveTasks(); renderTasks(); showToast("Tugas berhasil dihapus.");
        }
        break;
    }
  });

  $$(".nav-item").forEach(button => button.addEventListener("click", () => { currentFilter = button.dataset.filter; renderTasks(); }));
  $$(".chip").forEach(button => button.addEventListener("click", () => { currentCategory = button.dataset.category; renderTasks(); }));
  elements.search.addEventListener("input", renderTasks);
  elements.sort.addEventListener("change", renderTasks);
  $("#openAddBtn").addEventListener("click", () => openDialog());
  $("#emptyAddBtn").addEventListener("click", () => openDialog());
  $("#closeDialogBtn").addEventListener("click", closeDialog);
  $("#cancelDialogBtn").addEventListener("click", closeDialog);
  elements.dialog.addEventListener("click", event => { if (event.target === elements.dialog) closeDialog(); });
  $("#clearCompletedBtn").addEventListener("click", () => {
    const count = tasks.filter(t => t.completed).length;
    if (!count) return;
    if (confirm(`Hapus ${count} tugas yang sudah selesai?`)) {
      tasks = tasks.filter(t => !t.completed);
      saveTasks(); renderTasks(); showToast(`${count} tugas selesai dihapus.`);
    }
  });

  function setTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    $("#themeIcon").textContent = theme === "dark" ? "☀" : "☾";
    $("#themeLabel").textContent = theme === "dark" ? "Mode terang" : "Mode gelap";
    localStorage.setItem(THEME_KEY, theme);
  }
  $("#themeToggle").addEventListener("click", () => setTheme(document.body.classList.contains("dark") ? "light" : "dark"));
  setTheme(localStorage.getItem(THEME_KEY) || "light");

  const now = new Date();
  $("#todayLabel").textContent = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now).toLocaleUpperCase("id");
  renderTasks();
})();
