 const API_URL = "https://8l2dnts7e9.execute-api.us-east-1.amazonaws.com/student";

let allStudents = [];

/* ================================
   LOAD STUDENTS FROM AWS API
================================ */
async function loadStudents() {

    const button = document.querySelector(".primary-btn");
    const table = document.getElementById("studentTable");

    if (button) {
        button.disabled = true;
        button.innerHTML = "⏳ Loading Student Data...";
    }

    if (table) {
        table.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon">⏳</div>
                        <h3>Loading student data...</h3>
                        <p>Connecting to AWS API.</p>
                    </div>
                </td>
            </tr>
        `;
    }

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("API request failed: " + response.status);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid data received from API");
        }

        /* Store all students */
        allStudents = data;

        /* Update dashboard */
        updateDashboard(allStudents);

        /* Show table */
        renderStudents(allStudents);

        /* Update time */
        const lastUpdated = document.getElementById("lastUpdated");

        if (lastUpdated) {
            lastUpdated.textContent =
                "Updated " +
                new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                });
        }

        /* Clear search */
        const searchBox = document.getElementById("studentSearch");

        if (searchBox) {
            searchBox.value = "";
        }

    } catch (error) {

        console.error("Student API error:", error);

        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <div class="empty-icon">⚠️</div>
                            <h3>Unable to load student data</h3>
                            <p>Check the AWS API connection and try again.</p>
                        </div>
                    </td>
                </tr>
            `;
        }

        const lastUpdated = document.getElementById("lastUpdated");

        if (lastUpdated) {
            lastUpdated.textContent = "Data not loaded";
        }

    } finally {

        if (button) {
            button.disabled = false;
            button.innerHTML = "🔄 Load Student Data";
        }
    }
}


/* ================================
   UPDATE DASHBOARD STATISTICS
================================ */
function updateDashboard(students) {

    /* Total students */
    const total = students.length;

    /* Active students */
    const active = students.filter(student =>
        String(student.status || "").toLowerCase() === "active"
    ).length;

    /* Unique courses */
    const courses = new Set(
        students
            .map(student => student.course)
            .filter(course =>
                course !== undefined &&
                course !== null &&
                String(course).trim() !== ""
            )
    ).size;

    /* Average marks */
    const marks = students
        .map(student => Number(student.marks))
        .filter(mark => Number.isFinite(mark));

    const average = marks.length
        ? marks.reduce((sum, mark) => sum + mark, 0) / marks.length
        : 0;

    /* Put values into dashboard */
    setText("totalStudents", total);
    setText("activeStudents", active);
    setText("totalCourses", courses);
    setText("averageMarks", average.toFixed(2));

    /* Record count */
    setText("recordCount", total);
}


/* ================================
   SEARCH STUDENTS
================================ */
function searchStudents() {

    const input = document.getElementById("studentSearch");

    if (!input) {
        return;
    }

    const query = input.value.trim().toLowerCase();

    /* If search is empty, show all */
    if (!query) {
        renderStudents(allStudents);
        return;
    }

    /* Search ID, name and course */
    const filteredStudents = allStudents.filter(student => {

        const studentId =
            String(student.studentId || "").toLowerCase();

        const name =
            String(student.name || "").toLowerCase();

        const course =
            String(student.course || "").toLowerCase();

        return (
            studentId.includes(query) ||
            name.includes(query) ||
            course.includes(query)
        );
    });

    renderStudents(filteredStudents);
}


/* ================================
   DISPLAY STUDENTS IN TABLE
================================ */
function renderStudents(students) {

    const table = document.getElementById("studentTable");
    const count = document.getElementById("recordCount");

    if (!table) {
        return;
    }

    /* Update record count */
    if (count) {
        count.textContent = students.length;
    }

    /* No records */
    if (students.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No students found</h3>
                        <p>Try another student ID, name, or course.</p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    /* Create table rows */
    table.innerHTML = students.map(student => {

        const name =
            escapeHtml(student.name || "Unknown");

        const studentId =
            escapeHtml(student.studentId || "N/A");

        const course =
            escapeHtml(student.course || "N/A");

        const marksNumber =
            Number(student.marks);

        const marks =
            Number.isFinite(marksNumber)
                ? marksNumber
                : "N/A";

        const statusRaw =
            String(student.status || "Active");

        const status =
            escapeHtml(statusRaw);

        const performance =
            getPerformance(marksNumber);

        const performanceClass =
            performance.toLowerCase().replace(/\s+/g, "-");

        const statusClass =
            statusRaw.toLowerCase() === "active"
                ? "active"
                : "inactive";


        return `
            <tr>

                <td>
                    <strong>${name}</strong>
                </td>

                <td>
                    ${studentId}
                </td>

                <td>
                    ${course}
                </td>

                <td>
                    <strong>${marks}</strong>
                </td>

                <td>
                    <span class="performance-badge ${performanceClass}">
                        ${performance}
                    </span>
                </td>

                <td>
                    <span class="status-badge ${statusClass}">
                        ${status}
                    </span>
                </td>

            </tr>
        `;

    }).join("");
}


/* ================================
   PERFORMANCE CALCULATION
================================ */
function getPerformance(marks) {

    if (!Number.isFinite(marks)) {
        return "N/A";
    }

    if (marks >= 90) {
        return "Excellent";
    }

    if (marks >= 80) {
        return "Good";
    }

    if (marks >= 70) {
        return "Average";
    }

    return "Needs Improvement";
}


/* ================================
   SET TEXT SAFELY
================================ */
function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


/* ================================
   HTML SECURITY
================================ */
function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ================================
   INITIAL PAGE LOAD
================================ */
document.addEventListener("DOMContentLoaded", function () {

    setText("totalStudents", 0);
    setText("activeStudents", 0);
    setText("totalCourses", 0);
    setText("averageMarks", "0");
    setText("recordCount", 0);

});