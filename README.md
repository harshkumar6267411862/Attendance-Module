# CAMPUS-MANAGEMENT-SYSTEM
The Attendance Management Module enables efficient tracking and monitoring of student attendance across courses and sessions. It allows faculty members to record attendance digitally while providing students and administrators with real-time access to attendance records and analytics.

🗓️ Attendance Management System

A lightweight, API-driven Attendance Management System built with Flask and SQLite.
This system allows faculty to create classes, manage students, and digitally mark attendance with automatic Present/Absent handling.

🚀 Features
🔐 Faculty Authentication

Faculty login via /api/login

Auto-registration on first login

Session-based authentication

Secure logout support

🏫 Class Management

Create multiple classes

View faculty-specific classes

Classes are linked to logged-in faculty

👩‍🎓 Student Management

Add students to a class

Delete students

Auto-sorted by roll number

Prevents duplicate Student IDs

📅 Attendance System

Mark attendance by:

Class

Date

Automatically marks:

Present for selected students

Absent for others

Clears old attendance before saving new records (prevents duplicates)

Fully API-driven for frontend integration

🛠️ Tech Stack

Backend: Flask

Database: SQLite

Authentication: Flask session

Frontend: HTML Templates (render_template)

API Format: JSON-based REST endpoints

📂 Project Structure
attendance-system/
│
├── app.py
├── database.db
├── templates/
│   └── index.html
└── README.md
