from flask import Flask, render_template, request, session
import sqlite3

app = Flask(__name__)
app.secret_key = "campus_secret_key"

# ================= DATABASE =================
def get_db():
    return sqlite3.connect(
        "database.db",
        timeout=10,
        check_same_thread=False
    )

def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS faculty (
        faculty_id TEXT PRIMARY KEY,
        password TEXT NOT NULL
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS classes (
        class_id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_name TEXT,
        faculty_id TEXT
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS students (
        stud_id TEXT PRIMARY KEY,
        roll_no INTEGER,
        name TEXT,
        class_id INTEGER
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        stud_id TEXT,
        class_id INTEGER,
        date TEXT,
        status TEXT
    )
    """)

    conn.commit()
    conn.close()

# ================= FRONTEND =================
@app.route("/")
def frontend():
    return render_template("index.html")

# ================= AUTH =================
@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    faculty_id = data["faculty_id"]
    password = data["password"]

    conn = get_db()
    c = conn.cursor()

    faculty = c.execute(
        "SELECT password FROM faculty WHERE faculty_id=?",
        (faculty_id,)
    ).fetchone()

    if not faculty:
        c.execute(
            "INSERT INTO faculty VALUES (?, ?)",
            (faculty_id, password)
        )
        conn.commit()
    elif faculty[0] != password:
        conn.close()
        return {"success": False, "message": "Invalid password"}

    conn.close()
    session["faculty_id"] = faculty_id
    return {"success": True}

@app.route("/api/logout")
def api_logout():
    session.clear()
    return {"success": True}

# ================= CLASSES =================
@app.route("/api/classes")
def api_classes():
    fid = session.get("faculty_id")
    if not fid:
        return {"classes": []}

    conn = get_db()
    c = conn.cursor()

    classes = c.execute(
        "SELECT class_id, class_name FROM classes WHERE faculty_id=? ORDER BY class_name",
        (fid,)
    ).fetchall()

    conn.close()
    return {"classes": classes}

@app.route("/api/classes", methods=["POST"])
def api_create_class():
    fid = session.get("faculty_id")
    if not fid:
        return {"success": False}

    name = request.json["class_name"]

    conn = get_db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO classes (class_name, faculty_id) VALUES (?, ?)",
        (name, fid)
    )
    conn.commit()
    conn.close()

    return {"success": True}

# ================= STUDENTS =================
@app.route("/api/class/<int:class_id>/students")
def api_students(class_id):
    conn = get_db()
    c = conn.cursor()

    students = c.execute(
        "SELECT stud_id, roll_no, name FROM students WHERE class_id=? ORDER BY roll_no",
        (class_id,)
    ).fetchall()

    conn.close()
    return {"students": students}

@app.route("/api/class/<int:class_id>/students", methods=["POST"])
def api_add_student(class_id):
    d = request.json

    conn = get_db()
    try:
        c = conn.cursor()
        c.execute(
            "INSERT INTO students VALUES (?, ?, ?, ?)",
            (d["stud_id"], d["roll_no"], d["name"], class_id)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return {"success": False, "message": "Student ID already exists"}

    conn.close()
    return {"success": True}

@app.route("/api/student/<stud_id>", methods=["DELETE"])
def api_remove_student(stud_id):
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute(
            "DELETE FROM students WHERE stud_id=?",
            (stud_id,)
        )
        conn.commit()
    finally:
        conn.close()

    return {"success": True}

# ================= ATTENDANCE =================
@app.route("/api/attendance", methods=["POST"])
def api_attendance():
    d = request.json
    class_id = d["class_id"]
    date_ = d["date"]
    present_ids = set(d["present"])

    conn = get_db()
    c = conn.cursor()

    # Clear old attendance for that date & class
    c.execute(
        "DELETE FROM attendance WHERE class_id=? AND date=?",
        (class_id, date_)
    )

    students = c.execute(
        "SELECT stud_id FROM students WHERE class_id=?",
        (class_id,)
    ).fetchall()

    for (sid,) in students:
        status = "Present" if sid in present_ids else "Absent"
        c.execute(
            "INSERT INTO attendance VALUES (?, ?, ?, ?)",
            (sid, class_id, date_, status)
        )

    conn.commit()
    conn.close()

    return {"success": True}

# ================= MAIN =================
if __name__ == "__main__":
    init_db()
    app.run(debug=True)
