const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || '';

function apiUrl(path) {
    return `${API_BASE_URL}${path}`;
}

// 1. Initial Load
window.onload = () => {
    loadCourses();
    loadUserAnalytics();
    generateQuizInputs();

    const addBtn = document.getElementById('add-material-btn');
    if (addBtn) {
        addBtn.onclick = addMaterialRow;
    }

    const materialsList = document.getElementById('materials-list');
    if (materialsList && materialsList.children.length === 0) {
        addMaterialRow();
    }
};

/**
 * UPDATED: Fetches registered workers and filters out the 'admin' account
 */
async function loadUserAnalytics() {
    const tableBody = document.getElementById('user-stats-table');
    if (!tableBody) return;

    try {
        const response = await fetch(apiUrl('/api/admin/stats'));
        if (!response.ok) throw new Error("Could not fetch analytics data");

        let users = await response.json();

        // --- THE FILTER: Remove 'admin' from the display list ---
        users = users.filter(user => user.userid.toLowerCase() !== 'admin');

        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#94a3b8; font-style:italic;">No workers registered in the database yet.</td></tr>';
            return;
        }

        tableBody.innerHTML = users.map(user => {
            const completionCount = user.completedCourses ? user.completedCourses.length : 0;
            
            return `
                <tr style="border-bottom: 1px solid #e2e8f0; transition: 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 15px; font-weight: bold; color: #1B263B;">${user.userid}</td>
                    <td style="padding: 15px;">
                        <span style="background: ${completionCount > 0 ? '#DCFCE7' : '#F1F5F9'}; 
                                     color: ${completionCount > 0 ? '#166534' : '#64748B'}; 
                                     padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; border: 1px solid ${completionCount > 0 ? '#bbf7d0' : '#e2e8f0'};">
                            ${completionCount > 0 ? '● Certified' : '○ Enrolled'}
                        </span>
                    </td>
                    <td style="padding: 15px; color: #64748B; font-size: 13px;">
                        ${user.completedCourses && user.completedCourses.length > 0 
                            ? user.completedCourses.map(title => `<span style="display:inline-block; background:#eff6ff; color:#1e40af; padding:2px 8px; border-radius:4px; margin:2px;">${title}</span>`).join('') 
                            : '<span style="color:#cbd5e1;">No certifications yet</span>'}
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Analytics Error:", err);
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#ef4444;">Failed to load worker data.</td></tr>';
    }
}

/**
 * Generates 10 Question blocks for the Assessment
 */
function generateQuizInputs() {
    const container = document.getElementById('quiz-inputs-container');
    if (!container) return;

    container.innerHTML = '<h3 style="margin-top:40px; color:#1B263B; border-bottom: 2px solid #F37021; padding-bottom:10px;">Step 2: Industrial Assessment (10 Questions Required)</h3>';
    
    for (let i = 1; i <= 10; i++) {
        const qBlock = document.createElement('div');
        qBlock.className = "quiz-admin-block";
        qBlock.style = "padding:20px; border:1px solid #e2e8f0; margin-bottom:20px; border-radius:10px; background:#fdfdfd; box-shadow: 0 2px 5px rgba(0,0,0,0.02);";
        
        qBlock.innerHTML = `
            <p style="font-weight:bold; margin-bottom:12px; color: #1B263B; font-size: 1.1rem;">Question ${i}</p>
            <input type="text" class="q-text" placeholder="Enter Question ${i}" required style="width:100%; margin-bottom:12px; padding:12px; border:1px solid #ccc; border-radius:6px; box-sizing:border-box;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <input type="text" class="q-opt" placeholder="Option 1" required style="padding:10px; border:1px solid #ccc; border-radius:6px;">
                <input type="text" class="q-opt" placeholder="Option 2" required style="padding:10px; border:1px solid #ccc; border-radius:6px;">
                <input type="text" class="q-opt" placeholder="Option 3" required style="padding:10px; border:1px solid #ccc; border-radius:6px;">
                <input type="text" class="q-opt" placeholder="Option 4" required style="padding:10px; border:1px solid #ccc; border-radius:6px;">
            </div>
            <p style="margin: 15px 0 5px 0; font-size: 12px; color: #22C55E; font-weight: bold;">Correct Answer:</p>
            <input type="text" class="q-correct" placeholder="Type the correct option text here" required style="width:100%; border:2px solid #22C55E; padding:12px; border-radius:6px; box-sizing:border-box;">
        `;
        container.appendChild(qBlock);
    }
}

/**
 * Adds a new row for Video/PDF/PPT inputs
 */
function addMaterialRow() {
    const list = document.getElementById('materials-list');
    if (!list) return;

    const row = document.createElement('div');
    row.className = "material-row";
    row.style = "display: flex; gap: 10px; margin-bottom: 10px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; align-items: center;";
    
    row.innerHTML = `
        <select class="m-type" style="padding: 10px; border-radius: 6px; border: 1px solid #ddd; background: white;">
            <option value="video">Video</option>
            <option value="pdf">PDF Document</option>
            <option value="ppt">PowerPoint</option>
        </select>
        <input type="text" class="m-title" placeholder="Material Title" required style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        <input type="text" class="m-url" placeholder="URL (YouTube Link)" required style="flex: 2; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        <button type="button" onclick="this.parentElement.remove()" style="background: #ef4444; color: white; border: none; border-radius: 6px; padding: 10px 15px; cursor: pointer; font-weight: bold;">✕</button>
    `;
    list.appendChild(row);
}

/**
 * Main form submission handler
 */
const courseForm = document.getElementById('course-form');
if (courseForm) {
    courseForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const title = document.getElementById('course-title').value.trim();
        
        const materialRows = document.querySelectorAll('.material-row'); 
        const materialsArray = Array.from(materialRows).map(row => ({
            type: row.querySelector('.m-type').value,
            title: row.querySelector('.m-title').value.trim(),
            url: row.querySelector('.m-url').value.trim()
        }));

        const quizBlocks = document.querySelectorAll('.quiz-admin-block');
        const quizArray = Array.from(quizBlocks).map(block => {
            const options = Array.from(block.querySelectorAll('.q-opt')).map(opt => opt.value.trim());
            return {
                question: block.querySelector('.q-text').value.trim(),
                options: options,
                correctAnswer: block.querySelector('.q-correct').value.trim()
            };
        });

        try {
            const response = await fetch(apiUrl('/api/courses'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: title,
                    materials: materialsArray,
                    quiz: quizArray
                })
            });

            if (response.ok) {
                alert("✅ Success: Module Deployed!");
                location.reload(); 
            } else {
                const result = await response.json();
                alert("❌ Error: " + result.message);
            }
        } catch (err) {
            alert("Network Error: Server might be offline.");
        }
    });
}

/**
 * Fetches and displays existing courses
 */
async function loadCourses() {
    try {
        const response = await fetch(apiUrl('/api/courses'));
        const courses = await response.json();
        const list = document.getElementById('admin-course-list');
        
        if (!list) return;
        list.innerHTML = ''; 

        if (courses.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding:20px; color:#94a3b8;">Catalog is empty.</p>';
            return;
        }

        courses.forEach(course => {
            const item = document.createElement('div');
            item.style = "background: #fff; padding: 18px; margin-bottom: 12px; border-radius: 10px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);";
            
            item.innerHTML = `
                <div>
                    <strong style="display: block; color: #1B263B; font-size: 1.1rem;">${course.title}</strong>
                    <small style="color: #64748b;">
                        ${course.materials.length} Materials | 
                        ${course.quiz ? course.quiz.length : 0} Questions
                    </small>
                </div>
                <button onclick="deleteCourse('${course._id}')" style="background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    Delete
                </button>
            `;
            list.appendChild(item);
        });
    } catch (err) {
        console.error("Error loading courses:", err);
    }
}

async function deleteCourse(id) {
    if (confirm("Remove this module?")) {
        try {
            const response = await fetch(apiUrl(`/api/courses/${id}`), { method: 'DELETE' });
            if (response.ok) location.reload();
        } catch (err) {
            alert("Error deleting course.");
            
        }
    }
}
