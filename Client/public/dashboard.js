// 1. GLOBAL FUNCTIONS
function logout() {
    if(confirm("Are you sure you want to log out of SkillForge?")) {
        localStorage.removeItem('loggedInUser'); 
        window.location.replace('login.html'); 
    }
}

function openCourse(courseId) {
    if (!courseId) return;
    localStorage.setItem('currentCourseId', courseId);
    window.location.href = 'learning.html';
}

function filterCourses() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('#course-grid > div');
    
    cards.forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        card.style.display = title.includes(searchTerm) ? "flex" : "none";
    });
}

// 2. INITIALIZATION LOGIC
window.onload = async () => {
    const userName = localStorage.getItem('loggedInUser');
    if (!userName) {
        window.location.replace('login.html');
        return;
    }

    const userStorageKey = `completedCourses_${userName}`;
    const completedList = JSON.parse(localStorage.getItem(userStorageKey)) || [];
    
    const userDisplay = document.getElementById('user-display');
    const dropdownName = document.getElementById('dropdown-user-name');
    const avatar = document.getElementById('user-avatar');
    const grid = document.getElementById('course-grid');
    const totalCountEl = document.getElementById('total-count');
    const completedCountEl = document.getElementById('completed-count');

    if (userDisplay) userDisplay.innerText = userName;
    if (dropdownName) dropdownName.innerText = userName;
    if (avatar) avatar.innerText = userName.charAt(0).toUpperCase();

    const isAdmin = userName.toLowerCase() === 'admin';
    const adminLink = document.getElementById('admin-link');
    const adminBtn = document.getElementById('admin-catalog-btn');
    
    if (adminLink) adminLink.style.display = isAdmin ? "block" : "none";
    if (adminBtn) adminBtn.style.display = isAdmin ? "block" : "none";

    if (!grid) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) throw new Error("Failed to fetch courses");
        const courses = await response.json();
        
        if(totalCountEl) totalCountEl.innerText = courses.length;
        if(completedCountEl) {
            const validCompletions = completedList.filter(title => 
                courses.some(c => c.title === title)
            );
            completedCountEl.innerText = validCompletions.length;
        }

        grid.innerHTML = ''; 

        if (courses.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 60px; font-size: 18px;">No training modules available.</p>';
            return;
        }

        courses.forEach(course => {
            const isFinished = completedList.includes(course.title);
            const card = document.createElement('div');
            
            // DYNAMIC STYLING: Certified cards are shorter (200px) than Available ones (300px)
            card.style = `
                background: white; 
                padding: 24px; 
                border-radius: 16px; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.06); 
                border-bottom: 6px solid ${isFinished ? '#22C55E' : '#1B263B'}; 
                display: flex; 
                flex-direction: column; 
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                height: ${isFinished ? '200px' : '300px'}; 
                width: 100%;
                box-sizing: border-box;
                position: relative;
            `;

            card.onclick = () => openCourse(course._id);
            card.onmouseover = () => { 
                card.style.transform = "translateY(-8px)"; 
                card.style.boxShadow = "0 12px 30px rgba(0,0,0,0.12)"; 
            };
            card.onmouseout = () => { 
                card.style.transform = "translateY(0)"; 
                card.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; 
            };

            // Enhanced Pill Badge
            let badgeHTML = `
                <div style="
                    background: ${isFinished ? '#DCFCE7' : '#F1F5F9'}; 
                    color: ${isFinished ? '#15803d' : '#64748B'}; 
                    font-weight: 800; 
                    padding: 5px 12px; 
                    border-radius: 20px; 
                    font-size: 10px; 
                    align-self: flex-start; 
                    margin-bottom: 15px; 
                    text-transform: uppercase; 
                    letter-spacing: 1px;
                    border: 1px solid ${isFinished ? '#bbf7d0' : '#e2e8f0'};
                ">
                    ${isFinished ? '● Certified' : 'Available'}
                </div>
            `;

            let bodyContent = '';
            if (!isFinished) {
                bodyContent = `
                    <p style="font-size: 0.85rem; color: #64748B; margin-bottom: 20px; flex-grow: 1; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                        Complete this module to gain official SkillForge certification for ${course.title}.
                    </p>
                    <button style="background: #F37021; border: none; color: white; padding: 12px; border-radius: 8px; width: 100%; font-weight: bold; font-size: 13px; pointer-events: none; margin-top: auto;">
                        START TRAINING
                    </button>
                `;
            } else {
                bodyContent = `
                    <div style="margin-top: auto; display: flex; align-items: center; gap: 5px;">
                        <span style="font-size: 0.85rem; color: #718096; font-weight: 600;">Review Materials</span>
                        <span style="color: #22C55E; font-weight: bold;">→</span>
                    </div>
                `;
            }

            card.innerHTML = `
                ${badgeHTML}
                <h3 style="
                    margin: 0; 
                    color: #1B263B; 
                    font-size: 1.25rem; 
                    font-weight: 700; 
                    line-height: 1.3;
                    min-height: ${isFinished ? 'auto' : '52px'};
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                ">
                    ${course.title}
                </h3>
                ${bodyContent}
            `;

            grid.appendChild(card);
        });

        const searchInput = document.getElementById('searchInput');
        if(searchInput) {
            searchInput.addEventListener('input', filterCourses);
        }

    } catch (err) {
        console.error("Dashboard Error:", err);
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px;"><p style="color: #ef4444; font-weight: bold;">Connection Lost.</p></div>';
    }
};