// 1. GLOBAL STATE
let currentCourse = null;
let viewedMaterials = new Set();
const loggedInUser = localStorage.getItem('loggedInUser');
const userStorageKey = `completedCourses_${loggedInUser}`;

window.onload = async () => {
    const courseId = localStorage.getItem('currentCourseId');
    if (!loggedInUser) {
        window.location.replace('login.html');
        return;
    }

    const titleHeader = document.getElementById('course-title');
    const progressText = document.getElementById('progress-count');
    const materialList = document.getElementById('material-list');
    const videoContainer = document.getElementById('video-container');

    if (!courseId) {
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        const response = await fetch(`/api/courses/${courseId}`);
        currentCourse = await response.json();

        if (!response.ok || !currentCourse) {
            materialList.innerHTML = "<li>Error: Course not found in database.</li>";
            return;
        }

        titleHeader.innerText = currentCourse.title;
        progressText.innerText = `0 / ${currentCourse.materials.length}`;

        materialList.innerHTML = '';
        currentCourse.materials.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = "material-item";
            li.style = "padding: 15px; margin-bottom: 10px; background: #f8fafc; border-radius: 8px; cursor: pointer; border: 1px solid #e2e8f0; list-style:none; transition: 0.3s;";
            li.innerHTML = `<strong>Unit ${index + 1}:</strong> ${item.title}`;
            
            li.onclick = () => {
                renderVideo(item.url, videoContainer);
                viewedMaterials.add(index);
                updateUIState(index);
            };
            materialList.appendChild(li);
        });

        if (currentCourse.materials && currentCourse.materials.length > 0) {
            renderVideo(currentCourse.materials[0].url, videoContainer);
            viewedMaterials.add(0);
            updateUIState(0);
        }

    } catch (err) {
        console.error("Load Error:", err);
        if(materialList) materialList.innerHTML = "<li style='color:red; padding: 10px;'>Server connection failed.</li>";
    }
};

function updateUIState(activeIndex) {
    const progressText = document.getElementById('progress-count');
    if (progressText) {
        progressText.innerText = `${viewedMaterials.size} / ${currentCourse.materials.length}`;
    }

    document.querySelectorAll('.material-item').forEach((el, i) => {
        el.style.borderColor = (i === activeIndex) ? '#F37021' : '#e2e8f0';
        el.style.background = (i === activeIndex) ? '#fff7ed' : '#f8fafc';
        el.style.borderLeft = (i === activeIndex) ? '5px solid #F37021' : '1px solid #e2e8f0';
    });

    checkMaterialsCompletion();
}

function renderVideo(url, container) {
    let finalUrl = url;
    if (finalUrl.includes('watch?v=')) {
        finalUrl = finalUrl.replace('watch?v=', 'embed/').split('&')[0];
    } else if (finalUrl.includes('youtu.be/')) {
        const videoId = finalUrl.split('/').pop().split('?')[0];
        finalUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    container.innerHTML = `<iframe width="100%" height="100%" src="${finalUrl}" frameborder="0" allowfullscreen style="border-radius: 12px; min-height: 400px;"></iframe>`;
}

function checkMaterialsCompletion() {
    const btn = document.getElementById('completeBtn');
    if (btn && viewedMaterials.size === currentCourse.materials.length) {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        btn.style.background = "#F37021"; 
        btn.style.color = "white";
        btn.innerText = "START ASSESSMENT 📝";
        btn.onclick = startAssessment;
    }
}

// --- ASSESSMENT LOGIC ---

function startAssessment() {
    document.getElementById('learning-container').style.display = 'none';
    const quizSection = document.getElementById('quiz-section');
    quizSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const questionsArea = document.getElementById('questions-area');
    questionsArea.innerHTML = '';

    currentCourse.quiz.forEach((q, index) => {
        const div = document.createElement('div');
        div.style = "margin-bottom: 30px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 10px; background: white;";
        div.innerHTML = `
            <p style="font-weight: bold; font-size: 1.1em; color: #1B263B; margin-bottom: 15px;">${index + 1}. ${q.question}</p>
            <div style="display: grid; gap: 12px;">
                ${q.options.map(opt => `
                    <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #ddd;">
                        <input type="radio" name="question${index}" value="${opt.replace(/"/g, '&quot;')}" required>
                        <span style="font-size: 14px; color: #333;">${opt}</span>
                    </label>
                `).join('')}
            </div>
        `;
        questionsArea.appendChild(div);
    });
}

function submitAssessment() {
    let score = 0;
    const totalQuestions = currentCourse.quiz.length;

    currentCourse.quiz.forEach((q, index) => {
        const selected = document.querySelector(`input[name="question${index}"]:checked`);
        if (selected && selected.value.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            score++;
        }
    });

    const resultDiv = document.getElementById('quiz-result');
    resultDiv.style.display = 'block';
    
    if (score >= Math.ceil(totalQuestions * 0.7)) {
        resultDiv.style.background = "#dcfce7";
        resultDiv.style.color = "#166534";
        resultDiv.style.border = "2px solid #22C55E";
        resultDiv.innerHTML = `
            <h2 style="margin: 0;">PASSED! ✅</h2>
            <p style="font-size: 1.1em; margin: 10px 0;">Final Score: <strong>${score} / ${totalQuestions}</strong></p>
            <button onclick="unlockCertificate()" style="margin-top: 15px; padding: 15px 30px; background: #1B263B; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">CLAIM MY CERTIFICATE</button>
        `;
    } else {
        resultDiv.style.background = "#fee2e2";
        resultDiv.style.color = "#991b1b";
        resultDiv.innerHTML = `<h2>FAILED 🔄</h2><p>${score}/${totalQuestions}</p><button onclick="location.reload()">RETAKE</button>`;
    }
}

// NEW: Connects the Worker's progress to the Admin Database
async function saveProgressToDatabase() {
    try {
        await fetch('/api/users/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userid: loggedInUser, 
                courseTitle: currentCourse.title 
            })
        });
    } catch (err) {
        console.error("Database sync failed:", err);
    }
}

function unlockCertificate() {
    // 1. Local Browser Storage (for immediate UI updates)
    let done = JSON.parse(localStorage.getItem(userStorageKey)) || [];
    if (!done.includes(currentCourse.title)) {
        done.push(currentCourse.title);
        localStorage.setItem(userStorageKey, JSON.stringify(done));
    }

    // 2. CRITICAL: Save to MongoDB for Admin Visibility
    saveProgressToDatabase();

    document.getElementById('quiz-section').style.display = 'none';
    const certArea = document.getElementById('certificate-area');
    certArea.style.display = 'flex';

    document.getElementById('cert-course-title').innerText = currentCourse.title;
    document.getElementById('cert-worker-name').innerText = loggedInUser || "Authorized Worker";
    document.getElementById('cert-date').innerText = new Date().toLocaleDateString();

    const randomId = Math.floor(100000 + Math.random() * 900000);
    const verifEl = document.getElementById('cert-verification-id');
    if (verifEl) verifEl.innerText = `Verification ID: SF-${randomId}`;
}