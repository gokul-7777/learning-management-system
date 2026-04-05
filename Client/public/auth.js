const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || '';

function apiUrl(path) {
    return `${API_BASE_URL}${path}`;
}

// 1. GLOBAL MODE TRACKING
let currentMode = 'login'; 

// 2. TOGGLE BETWEEN LOGIN AND REGISTER
function setAuthMode(mode) {
    currentMode = mode;
    const title = document.getElementById('auth-title');
    const submitBtn = document.getElementById('submit-btn');
    const lBtn = document.getElementById('l-btn');
    const rBtn = document.getElementById('r-btn');
    const status = document.getElementById('auth-status');
    
    // Reset the error message whenever switching modes
    if (status) {
        status.style.display = 'none';
        status.innerText = '';
    }

    // Update Text
    title.innerText = (mode === 'login') ? "Worker Login" : "New Registration";
    if(submitBtn) submitBtn.innerText = (mode === 'login') ? "ACCESS PLATFORM" : "REGISTER WORKER";
    
    // Update Button Styles
    if (lBtn && rBtn) {
        lBtn.style.background = (mode === 'login') ? "#1B263B" : "transparent";
        lBtn.style.color = (mode === 'login') ? "white" : "#64748b";
        
        rBtn.style.background = (mode === 'register') ? "#1B263B" : "transparent";
        rBtn.style.color = (mode === 'register') ? "white" : "#64748b";
    }
}

// 3. HANDLE FORM SUBMISSION
document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userid = document.getElementById('userid').value.trim();
    const password = document.getElementById('password').value;
    const status = document.getElementById('auth-status');

    // Hide status initially and clear old messages
    if(status) {
        status.style.display = 'none';
        status.innerText = '';
    }

    const endpoint = currentMode === 'login' ? apiUrl('/api/login') : apiUrl('/api/register');

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userid, password })
        });

        const data = await response.json();

        if (response.ok) {
            if (currentMode === 'login') {
                // SUCCESS: Save user and go to dashboard
                localStorage.setItem('loggedInUser', userid);
                
                if (userid.toLowerCase() === 'admin') {
                    localStorage.setItem('userRole', 'admin');
                }

                window.location.href = 'dashboard.html';
            } else {
                // SUCCESS REGISTRATION
                alert("✅ Registration Successful! You can now log in.");
                setAuthMode('login'); // Switch back to login view
                document.getElementById('password').value = ''; 
            }
        } else {
            // SHOW DYNAMIC ERROR FROM SERVER
            if(status) {
                status.style.display = 'block';
                // This will now show "ID already exists" instead of "Invalid ID"
                status.innerText = data.message || "Authentication Failed";
            }
        }
    } catch (err) {
        if(status) {
            status.style.display = 'block';
            status.innerText = "⚠️ Connection Error: Is your Node server running?";
        }
        console.error("Auth Error:", err);
    }
});
