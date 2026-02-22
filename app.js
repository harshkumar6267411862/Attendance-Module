let currentClassId = null;

/* ================= PAGE SYSTEM ================= */
function showPage(id) {
    document.querySelectorAll(".page").forEach(p =>
        p.classList.remove("active")
    );
    document.getElementById(id).classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
    showPage("login-page");
});

/* ================= LOGIN ================= */
function handleLogin(e) {
    e.preventDefault();

    fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            faculty_id: document.getElementById("login-faculty-id").value,
            password: document.getElementById("login-password").value
        })
    })
    .then(r => r.json())
    .then(d => {
        if (!d.success) {
            alert("Login failed");
            return;
        }
        loadClasses();
        showPage("classes-page");
    });
}

function handleLogout() {
    fetch("/api/logout").then(() => {
        showPage("login-page");
    });
}

/* ================= CLASSES ================= */
function loadClasses() {
    fetch("/api/classes")
        .then(r => r.json())
        .then(d => {
            const grid = document.getElementById("classes-grid");
            grid.innerHTML = "";

            d.classes.forEach(c => {
                const div = document.createElement("div");
                div.className = "bg-white p-6 rounded-xl shadow cursor-pointer";
                div.innerHTML = `<h3>${c[1]}</h3>`;
                div.onclick = () => openClass(c[0], c[1]);
                grid.appendChild(div);
            });
        });
}

function handleCreateClass(e) {
    e.preventDefault();

    fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            class_name: document.getElementById("class-name-input").value
        })
    }).then(() => {
        document.getElementById("class-name-input").value = "";
        loadClasses();
    });
}

/* ================= CLASS DETAIL ================= */
function openClass(id, name) {
    currentClassId = id;
    document.getElementById("class-detail-name").innerText = name;
    loadStudents();
    showPage("class-detail-page");
}

function goToClasses() {
    loadClasses();
    showPage("classes-page");
}

function toggleAddStudent() {
    document.getElementById("add-student-form").classList.toggle("hidden");
}

function loadStudents() {
    fetch(`/api/class/${currentClassId}/students`)
        .then(r => r.json())
        .then(d => {
            const tbody = document.getElementById("students-tbody");
            tbody.innerHTML = "";

            d.students.forEach(s => {
                tbody.innerHTML += `
                    <tr>
                        <td>${s[1]}</td>
                        <td>${s[2]}</td>
                        <td>${s[0]}</td>
                        <td class="text-right">
                            <button onclick="removeStudent('${s[0]}')">
                                Remove
                            </button>
                        </td>
                    </tr>
                `;
            });
        });
}

function handleAddStudent(e) {
    e.preventDefault();

    const studId = document.getElementById("stud-id-input").value;
    const rollNo = document.getElementById("roll-no-input").value;
    const name = document.getElementById("name-input").value;

    fetch(`/api/class/${currentClassId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            stud_id: studId,
            roll_no: rollNo,
            name: name
        })
    })
    .then(r => r.json())
    .then(d => {
        if (d.success === false) {
            alert(d.message || "Error adding student");
            return;
        }

        document.getElementById("stud-id-input").value = "";
        document.getElementById("roll-no-input").value = "";
        document.getElementById("name-input").value = "";

        document.getElementById("add-student-form").classList.add("hidden");
        loadStudents();
    });
}

function removeStudent(id) {
    if (!confirm("Remove this student?")) return;
    fetch(`/api/student/${id}`, { method: "DELETE" })
        .then(() => loadStudents());
}

/* ================= ATTENDANCE ================= */
function goToAttendance() {
    loadAttendanceList();
    showPage("attendance-page");
}

function loadAttendanceList() {
    fetch(`/api/class/${currentClassId}/students`)
        .then(r => r.json())
        .then(d => {
            const list = document.getElementById("attendance-list");
            const total = d.students.length;

            list.innerHTML = "";

            document.getElementById("attendance-total").innerText =
                `Total: ${total}`;
            document.getElementById("attendance-present").innerText =
                `Present: 0`;
            document.getElementById("attendance-absent").innerText =
                `Absent: ${total}`;

            d.students.forEach(s => {
                list.innerHTML += `
                    <div class="attendance-row">
                        <div class="student-info">
                            <span class="roll">${s[1]}</span>
                            <span class="name">${s[2]}</span>
                        </div>

                        <input type="checkbox"
                               class="attendance-checkbox"
                               value="${s[0]}"
                               onchange="updateAttendanceCount(${total})">
                    </div>
                `;
            });
        });
}

function updateAttendanceCount(total) {
    const present =
        document.querySelectorAll(".attendance-checkbox:checked").length;

    document.getElementById("attendance-present").innerText =
        `Present: ${present}`;
    document.getElementById("attendance-absent").innerText =
        `Absent: ${total - present}`;
}

function submitAttendance() {
    const present = [];

    document.querySelectorAll(".attendance-checkbox:checked")
        .forEach(cb => present.push(cb.value));

    fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            class_id: currentClassId,
            date: new Date().toISOString().split("T")[0],
            present: present
        })
    })
    .then(() => {
        alert(
            `Attendance Submitted\n\n` +
            `Present: ${present.length}\n` +
            `Absent: ${
                document.querySelectorAll(".attendance-checkbox").length -
                present.length
            }`
        );
        showPage("class-detail-page");
    });
}
