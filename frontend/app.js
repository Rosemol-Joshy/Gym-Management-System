/**
 * Apex Strength Gym Management System - Standalone Authentication Client Logic
 */

const API_BASE = 'http://localhost:5000/api';

// ==========================================================================
// 1. STATE & ROUTING CONTROLLERS
// ==========================================================================
let state = {
    token: localStorage.getItem('session_token') || null,
    user: null,
    isMockDb: false
};

// Toggle Sandbox Warning Banner
function toggleSandboxBanner(show) {
    const banner = document.getElementById("sandbox-banner");
    if (banner) {
        banner.style.display = show ? "block" : "none";
    }
}

// Global fetch helper
async function authRequest(endpoint, options = {}) {
    if (!options.headers) {
        options.headers = {};
    }
    options.headers['Content-Type'] = 'application/json';
    
    if (state.token) {
        options.headers['Authorization'] = `Bearer ${state.token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `Request failed with status ${response.status}`);
        }
        
        if (data.isMockDb !== undefined) {
            state.isMockDb = data.isMockDb;
            toggleSandboxBanner(state.isMockDb);
        }

        return data;
    } catch (err) {
        throw err;
    }
}

// Switch between Views
function showView(view) {
    const authWrapper = document.getElementById("auth-wrapper");
    const dashboardWrapper = document.getElementById("dashboard-wrapper");
    const loginCard = document.getElementById("login-card");
    const registerCard = document.getElementById("register-card");

    if (view === "login") {
        authWrapper.style.display = "flex";
        dashboardWrapper.style.display = "none";
        loginCard.classList.add("active");
        registerCard.classList.remove("active");
    } else if (view === "register") {
        authWrapper.style.display = "flex";
        dashboardWrapper.style.display = "none";
        loginCard.classList.remove("active");
        registerCard.classList.add("active");
    } else if (view === "dashboard") {
        authWrapper.style.display = "none";
        dashboardWrapper.style.display = "block";
        renderDashboard();
    }
}

// Render Dashboard View Details
function renderDashboard() {
    if (!state.user) return;
    
    document.getElementById("nav-fullname").textContent = state.user.fullName;
    document.getElementById("dashboard-user-title").textContent = state.user.fullName;
    document.getElementById("profile-fullname").textContent = state.user.fullName;
    document.getElementById("profile-username").textContent = state.user.username;
    document.getElementById("profile-email").textContent = state.user.email;
    
    const roleBadge = document.getElementById("profile-role");
    roleBadge.textContent = state.user.role;
    
    // Generate initials for avatar
    const initials = state.user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    document.getElementById("nav-avatar").textContent = initials;
}

// ==========================================================================
// 2. TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    container.appendChild(toast);

    toast.querySelector(".toast-close").addEventListener("click", () => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 200);
    });

    // Auto dismiss
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 200);
        }
    }, 4000);
}

// Card Switch Event Listeners
document.getElementById("link-to-register").addEventListener("click", (e) => {
    e.preventDefault();
    showView("register");
});

document.getElementById("link-to-login").addEventListener("click", (e) => {
    e.preventDefault();
    showView("login");
});

// ==========================================================================
// 3. AUTHENTICATION OPERATIONS
// ==========================================================================

// Login Handler
document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const loginCard = document.getElementById("login-card");
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Verifying Athlete...</span>';

    try {
        const data = await authRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('session_token', data.token);

        showToast(`Access granted! Welcome, ${data.user.fullName}.`, "success");
        showView("dashboard");
        e.target.reset();
    } catch (err) {
        showToast(err.message, "danger");
        // Shake card effect for validation failure
        loginCard.classList.add("shake");
        setTimeout(() => loginCard.classList.remove("shake"), 400);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In</span>';
    }
});

// Registration Handler
document.getElementById("form-register").addEventListener("submit", async (e) => {
    e.preventDefault();
    const registerCard = document.getElementById("register-card");
    const username = document.getElementById("reg-username").value.trim();
    const fullName = document.getElementById("reg-fullname").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const role = document.getElementById("reg-role").value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Enrolling Account...</span>';

    try {
        const data = await authRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, fullName, email, password, role })
        });

        showToast(`Registration successful! Sign in to access facilities.`, "success");
        showView("login");
        e.target.reset();
    } catch (err) {
        showToast(err.message, "danger");
        registerCard.classList.add("shake");
        setTimeout(() => registerCard.classList.remove("shake"), 400);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span>';
    }
});

// Logout Handler
const handleLogout = async () => {
    try {
        if (state.token) {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${state.token}` }
            });
        }
    } catch (err) {
        console.error("Logout request error", err);
    }

    state.token = null;
    state.user = null;
    localStorage.removeItem('session_token');
    toggleSandboxBanner(false);
    showToast("Logged out successfully.", "success");
    showView("login");
};

document.getElementById("btn-logout-dashboard").addEventListener("click", handleLogout);

// ==========================================================================
// 4. MOCK ACCESS GATE ACTIONS
// ==========================================================================
document.getElementById("btn-simulate-checkin").addEventListener("click", () => {
    const gateStatus = document.getElementById("gate-status");
    gateStatus.className = "gate-status success";
    gateStatus.innerHTML = `⚠️ Access Authorized: <strong>TURNSTILE UNLOCKED</strong>`;
    showToast("Turnstile gate opened: Enjoy your workout!", "success");

    setTimeout(() => {
        gateStatus.className = "gate-status";
        gateStatus.innerHTML = `Turnstile status: <strong>SECURED (Ready)</strong>`;
    }, 4000);
});

// Quick Access Helper Click Delegation
document.addEventListener("click", (e) => {
    if (e.target.id === "quick-login-admin") {
        document.getElementById("login-username").value = "admin";
        document.getElementById("login-password").value = "admin";
        document.getElementById("form-login").dispatchEvent(new Event("submit"));
    } else if (e.target.id === "quick-login-member") {
        document.getElementById("login-username").value = "member";
        document.getElementById("login-password").value = "member";
        document.getElementById("form-login").dispatchEvent(new Event("submit"));
    }
});

// ==========================================================================
// 5. INITIALIZATION CHECKS
// ==========================================================================
async function initSession() {
    if (state.token) {
        try {
            const data = await authRequest('/auth/me');
            state.user = data.user;
            showView("dashboard");
        } catch (err) {
            localStorage.removeItem('session_token');
            state.token = null;
            showView("login");
        }
    } else {
        showView("login");
    }
}

document.addEventListener("DOMContentLoaded", initSession);
