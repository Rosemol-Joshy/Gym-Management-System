/**
 * Apex Strength - Gym Management System Logic
 * REST API Client controller connected to Express/MySQL backend
 */

// ==========================================================================
// 1. CONFIGURATION & STATE
// ==========================================================================
const API_BASE = 'http://localhost:5000/api';

let state = {
    members: [],
    classes: [],
    invoices: [],
    attendanceChart: {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        average: [85, 92, 104, 78, 95, 115, 60],
        current: [0, 0, 0, 0, 0, 0, 0]
    },
    membersPage: 1,
    membersPerPage: 8,
    activeView: "overview"
};

// ==========================================================================
// DB OFFLINE WARNING BANNER CONTROLLER
// ==========================================================================
function toggleDbWarning(show, message = "") {
    const viewport = document.querySelector(".viewport");
    let warningElement = document.getElementById("db-offline-banner");
    
    if (show) {
        if (!warningElement) {
            warningElement = document.createElement("div");
            warningElement.id = "db-offline-banner";
            warningElement.className = "alert-item danger";
            warningElement.style.marginBottom = "24px";
            warningElement.style.flexDirection = "column";
            warningElement.style.alignItems = "flex-start";
            warningElement.style.gap = "4px";
            viewport.insertBefore(warningElement, viewport.firstChild);
        }
        warningElement.innerHTML = `
            <div style="font-weight: 700; font-size: 0.9rem;">⚠️ Database Connectivity Warning</div>
            <div style="font-size: 0.8rem; color: var(--text-main);">${message || 'Could not connect to MySQL server. Check backend logs for credentials info.'}</div>
        `;
    } else {
        if (warningElement) {
            warningElement.remove();
        }
    }
}

// Global fetch wrapper with automatic error display handling
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (response.status === 503) {
            const errData = await response.json();
            toggleDbWarning(true, `${errData.message} (${errData.systemError || ''})`);
            throw new Error("Database Offline");
        }
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `HTTP error ${response.status}`);
        }
        
        toggleDbWarning(false);
        return await response.json();
    } catch (err) {
        if (err.message !== "Database Offline") {
            toggleDbWarning(true, `Connection failure: Ensure server.js backend is running on http://localhost:5000. Detail: ${err.message}`);
        }
        throw err;
    }
}

// ==========================================================================
// 2. VIEW CONTROLLER (SPA SIMULATION)
// ==========================================================================
const viewConfig = {
    overview: {
        title: "Facility Overview",
        subtitle: "Real-time facility load, performance metrics, and notifications."
    },
    members: {
        title: "Member Registry",
        subtitle: "Search, filter, and manage gym memberships and check-in statuses."
    },
    classes: {
        title: "Session Scheduler",
        subtitle: "Class timetable management, booking capacity, and trainer dispatch."
    },
    billing: {
        title: "Billing & Transactions",
        subtitle: "Invoices tracking, manual payment processing, and account updates."
    }
};

function switchView(viewName) {
    state.activeView = viewName;
    
    // Toggle active state in navigation
    document.querySelectorAll(".nav-item").forEach(btn => {
        if (btn.getAttribute("data-view") === viewName) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Toggle active panel in viewport
    document.querySelectorAll(".view-panel").forEach(panel => {
        if (panel.id === `view-${viewName}`) {
            panel.classList.add("active");
        } else {
            panel.classList.remove("active");
        }
    });

    // Update Header Metadata
    const config = viewConfig[viewName];
    if (config) {
        document.getElementById("view-title").textContent = config.title;
        document.getElementById("view-subtitle").textContent = config.subtitle;
    }

    // Refresh view specific data
    refreshActiveView();
}

function refreshActiveView() {
    if (state.activeView === "overview") {
        fetchDashboardData();
    } else if (state.activeView === "members") {
        fetchMembersData();
    } else if (state.activeView === "classes") {
        fetchClassesData();
    } else if (state.activeView === "billing") {
        fetchBillingData();
    }
}

// Attach nav buttons click listener
document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
        const targetView = btn.getAttribute("data-view");
        switchView(targetView);
    });
});

// Direct Navigation from warning cards
document.querySelector(".btn-view-expired").addEventListener("click", () => {
    switchView("members");
    document.getElementById("filter-status").value = "expired";
    fetchMembersData();
});

document.querySelector(".btn-view-billing").addEventListener("click", () => {
    switchView("billing");
    document.getElementById("filter-invoice-status").value = "Pending";
    fetchBillingData();
});


// ==========================================================================
// 3. TOAST NOTIFICATION COMPONENT
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
    
    // Bind close button
    toast.querySelector(".toast-close").addEventListener("click", () => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 200);
    });

    // Auto dismiss
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            setTimeout(() => toast.remove(), 200);
        }
    }, 4000);
}


// ==========================================================================
// 4. OVERVIEW VIEW DATA FETCHING & CUSTOM SVG GRAPHICS
// ==========================================================================
async function fetchDashboardData() {
    try {
        const data = await apiRequest('/overview');
        
        // 1. Map Overview Stats
        document.getElementById("stat-active-count").textContent = data.stats.activeMembers;
        document.getElementById("stat-checkins-count").textContent = data.stats.checkinsToday;
        document.getElementById("stat-revenue-value").textContent = `$${data.stats.monthlyRevenue.toLocaleString()}`;
        
        // Capacity setup
        const capacityLimit = 120;
        const currentCount = data.stats.checkinsToday;
        const capacityPct = Math.min(100, Math.round((currentCount / capacityLimit) * 100));
        document.getElementById("stat-capacity-pct").textContent = `${capacityPct}%`;
        document.getElementById("capacity-bar").style.width = `${capacityPct}%`;
        document.getElementById("capacity-detail").textContent = `${currentCount}/${capacityLimit} active in facility`;

        // Update charts datasets
        state.attendanceChart = data.attendanceChart;

        // 2. Render Check-ins Feed Stream
        const feedList = document.getElementById("live-checkin-list");
        feedList.innerHTML = "";
        
        if (data.liveCheckins.length === 0) {
            feedList.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No gym entries logged today.</div>`;
        } else {
            data.liveCheckins.forEach(item => {
                const initials = item.name.split(" ").map(n => n[0]).join("");
                const row = document.createElement("div");
                row.className = "checkin-stream-item";
                row.innerHTML = `
                    <div class="stream-member-meta">
                        <div class="stream-avatar">${initials}</div>
                        <div class="stream-member-name">${item.name}</div>
                    </div>
                    <div class="stream-time">${item.time}</div>
                `;
                feedList.appendChild(row);
            });
        }

        // Draw custom SVG chart
        renderSvgChart();
    } catch (err) {
        console.error("Dashboard error:", err.message);
    }
}

function renderSvgChart() {
    const container = document.getElementById("attendance-chart");
    if (!container) return;
    
    const containerWidth = container.clientWidth - 48;
    const containerHeight = 240;
    
    const maxVal = 140;
    const paddingX = 40;
    const paddingY = 30;
    
    const graphWidth = containerWidth - paddingX * 2;
    const graphHeight = containerHeight - paddingY * 2;
    
    const days = state.attendanceChart.days;
    const avgData = state.attendanceChart.average;
    const todayData = state.attendanceChart.current;
    
    let gridLinesHtml = "";
    const yGridCount = 4;
    for (let i = 0; i <= yGridCount; i++) {
        const gridVal = Math.round((maxVal / yGridCount) * i);
        const y = paddingY + graphHeight - (gridVal / maxVal) * graphHeight;
        gridLinesHtml += `
            <line class="chart-grid-line" x1="${paddingX}" y1="${y}" x2="${containerWidth - paddingX}" y2="${y}" />
            <text class="chart-axis-text" x="${paddingX - 10}" y="${y + 3}" text-anchor="end">${gridVal}</text>
        `;
    }
    
    const spacingX = graphWidth / (days.length - 1);
    let daysHtml = "";
    days.forEach((day, index) => {
        const x = paddingX + index * spacingX;
        daysHtml += `
            <text class="chart-axis-text" x="${x}" y="${containerHeight - paddingY + 16}" text-anchor="middle">${day}</text>
        `;
    });
    
    let avgPoints = [];
    let currentPoints = [];
    
    days.forEach((day, index) => {
        const x = paddingX + index * spacingX;
        const avgY = paddingY + graphHeight - (avgData[index] / maxVal) * graphHeight;
        avgPoints.push(`${x},${avgY}`);
        
        if (todayData[index] > 0) {
            const todayY = paddingY + graphHeight - (todayData[index] / maxVal) * graphHeight;
            currentPoints.push(`${x},${todayY}`);
        }
    });
    
    const avgPathD = `M ${avgPoints.join(" L ")}`;
    const currentPathD = currentPoints.length > 0 ? `M ${currentPoints.join(" L ")}` : "";
    
    let currentDotsHtml = "";
    days.forEach((day, index) => {
        if (todayData[index] > 0) {
            const x = paddingX + index * spacingX;
            const y = paddingY + graphHeight - (todayData[index] / maxVal) * graphHeight;
            currentDotsHtml += `
                <circle class="chart-dot" cx="${x}" cy="${y}" r="4" />
            `;
        }
    });

    container.innerHTML = `
        <svg class="chart-svg" width="100%" height="${containerHeight}">
            ${gridLinesHtml}
            ${daysHtml}
            <path class="chart-path-avg" d="${avgPathD}" />
            ${currentPathD ? `<path class="chart-path-today" d="${currentPathD}" />` : ""}
            ${currentDotsHtml}
        </svg>
    `;
}

// Window resize listener
window.addEventListener("resize", () => {
    if (state.activeView === "overview") {
        renderSvgChart();
    }
});


// ==========================================================================
// 5. MEMBER DIRECTORY: PAGINATION, SEARCH, CRUD APIS
// ==========================================================================
async function fetchMembersData() {
    const tableBody = document.querySelector("#members-table tbody");
    if (!tableBody) return;

    const searchVal = document.getElementById("member-search").value;
    const statusVal = document.getElementById("filter-status").value;
    const planVal = document.getElementById("filter-plan").value;

    try {
        const queryParams = new URLSearchParams({
            search: searchVal,
            status: statusVal,
            plan: planVal,
            page: state.membersPage,
            limit: state.membersPerPage
        });

        const data = await apiRequest(`/members?${queryParams.toString()}`);
        
        tableBody.innerHTML = "";
        
        // Update state cache
        state.members = data.members;

        // Update Pagination controls
        const totalItems = data.total;
        const maxPage = Math.max(1, Math.ceil(totalItems / state.membersPerPage));
        const startIndex = (state.membersPage - 1) * state.membersPerPage;
        const endIndex = Math.min(startIndex + state.membersPerPage, totalItems);

        document.getElementById("pagination-info-text").textContent = 
            totalItems === 0 
                ? "Showing 0 of 0 members" 
                : `Showing ${startIndex + 1}-${endIndex} of ${totalItems} members`;
                
        document.getElementById("prev-page").disabled = state.membersPage === 1;
        document.getElementById("next-page").disabled = state.membersPage === maxPage;

        if (state.members.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">
                        No members found matching search parameters.
                    </td>
                </tr>
            `;
            return;
        }

        // Render rows
        state.members.forEach(m => {
            const fullName = `${m.firstName} ${m.lastName}`;
            const initials = `${m.firstName[0]}${m.lastName[0]}`;
            
            // Check-in status display
            const isCheckedInToday = m.lastCheckin && m.lastCheckin.includes("2026-06-24"); // Assuming today is June 24, 2026 matches backend seed dates

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <div class="table-member-info">
                        <div class="table-avatar">${initials}</div>
                        <div class="table-member-details">
                            <span class="table-member-name">${fullName}</span>
                            <span class="table-member-id">${m.id}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge badge-${m.status}">${m.status}</span>
                </td>
                <td>${m.plan}</td>
                <td>${m.renewalDate}</td>
                <td>
                    <span class="text-${isCheckedInToday ? 'success' : 'muted'}">
                        ${m.lastCheckin ? m.lastCheckin : "Never"}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-accent btn-member-checkin" data-id="${m.id}" ${isCheckedInToday || m.status !== 'active' ? 'disabled' : ''}>
                            Check-In
                        </button>
                        <button class="btn-icon btn-member-edit" data-id="${m.id}" title="Edit Profile">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-icon btn-member-delete" data-id="${m.id}" title="Remove Member" style="color: var(--color-danger); border-color: rgba(239, 68, 68, 0.2)">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Event listeners binding
        document.querySelectorAll(".btn-member-checkin").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const memberId = e.currentTarget.getAttribute("data-id");
                verifyGateCheckIn(memberId);
            });
        });

        document.querySelectorAll(".btn-member-edit").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const memberId = e.currentTarget.getAttribute("data-id");
                openEditMemberModal(memberId);
            });
        });

        document.querySelectorAll(".btn-member-delete").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const memberId = e.currentTarget.getAttribute("data-id");
                deleteMemberRecord(memberId);
            });
        });

    } catch (err) {
        console.error("Members error:", err.message);
    }
}

// Search and filter callbacks
document.getElementById("member-search").addEventListener("input", () => {
    state.membersPage = 1;
    fetchMembersData();
});
document.getElementById("filter-status").addEventListener("change", () => {
    state.membersPage = 1;
    fetchMembersData();
});
document.getElementById("filter-plan").addEventListener("change", () => {
    state.membersPage = 1;
    fetchMembersData();
});

// Pagination
document.getElementById("prev-page").addEventListener("click", () => {
    if (state.membersPage > 1) {
        state.membersPage--;
        fetchMembersData();
    }
});

document.getElementById("next-page").addEventListener("click", () => {
    state.membersPage++;
    fetchMembersData();
});


// ==========================================================================
// 6. SCHEDULER VIEW DATA FETCHING & CLASS CARD INTERACTION
// ==========================================================================
async function fetchClassesData() {
    const gridBody = document.getElementById("scheduler-grid-body");
    if (!gridBody) return;

    try {
        const classes = await apiRequest('/classes');
        state.classes = classes;
        
        gridBody.innerHTML = "";
        
        const timeSlots = ["06:00 AM", "08:00 AM", "10:00 AM", "12:00 PM", "04:00 PM", "06:00 PM", "08:00 PM"];
        const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        timeSlots.forEach(time => {
            const row = document.createElement("div");
            row.className = "scheduler-row";
            
            const timeCell = document.createElement("div");
            timeCell.className = "scheduler-time-cell";
            timeCell.textContent = time;
            row.appendChild(timeCell);
            
            weekdays.forEach(day => {
                const dayCell = document.createElement("div");
                dayCell.className = "scheduler-day-cell";
                if (day === "Thu") dayCell.classList.add("today-cell-highlight");
                
                const matchedClasses = state.classes.filter(c => c.day === day && c.time_slot === time);
                
                matchedClasses.forEach(cls => {
                    const classCard = document.createElement("div");
                    classCard.className = "class-item-card";
                    
                    const isFull = cls.booked >= cls.capacity;
                    const capacityClass = isFull ? "full" : "";
                    
                    classCard.innerHTML = `
                        <div class="class-item-title" title="${cls.name}">${cls.name}</div>
                        <div class="class-item-instructor">${cls.trainer}</div>
                        <div class="class-item-meta">
                            <span class="class-item-capacity ${capacityClass}">${cls.booked}/${cls.capacity} Booked</span>
                        </div>
                    `;
                    
                    // Click class card to toggle reservation
                    classCard.addEventListener("click", () => {
                        toggleSlotReservation(cls.id, cls.booked >= cls.capacity ? 'cancel' : 'book');
                    });
                    
                    dayCell.appendChild(classCard);
                });
                
                row.appendChild(dayCell);
            });
            
            gridBody.appendChild(row);
        });

    } catch (err) {
        console.error("Classes error:", err.message);
    }
}

async function toggleSlotReservation(classId, action) {
    try {
        const response = await apiRequest(`/classes/${classId}/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        
        showToast(action === 'book' ? "Enrolled member successfully." : "Reservation cancelled.", "info");
        fetchClassesData();
    } catch (err) {
        showToast(err.message, "danger");
    }
}


// ==========================================================================
// 7. BILLING VIEW DATA FETCHING
// ==========================================================================
async function fetchBillingData() {
    const tableBody = document.querySelector("#invoices-table tbody");
    if (!tableBody) return;

    const filterStatus = document.getElementById("filter-invoice-status").value;

    try {
        const data = await apiRequest(`/invoices?status=${filterStatus}`);
        state.invoices = data;
        
        tableBody.innerHTML = "";

        // Dynamically compute sum statistics from active view content
        const pendingCount = state.invoices.filter(i => i.status === "Pending").length;
        document.getElementById("stat-pending-invoices").textContent = pendingCount;
        
        // Trigger dashboard recalculation if needed or map values
        const paidSum = state.invoices.filter(i => i.status === "Paid").reduce((s, c) => s + c.amount, 0);
        document.getElementById("stat-billing-success").textContent = `$${paidSum.toLocaleString()}`;

        const overdueSum = state.invoices.filter(i => i.status === "Overdue").reduce((s, c) => s + c.amount, 0);
        document.getElementById("stat-overdue-total").textContent = `$${overdueSum}`;

        if (state.invoices.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">
                        No invoices match status parameters.
                    </td>
                </tr>
            `;
            return;
        }

        state.invoices.forEach(inv => {
            const row = document.createElement("tr");
            
            let statusBadgeClass = "badge-suspended";
            if (inv.status === "Paid") statusBadgeClass = "badge-active";
            if (inv.status === "Overdue") statusBadgeClass = "badge-expired";

            row.innerHTML = `
                <td><strong>${inv.id}</strong></td>
                <td>${inv.memberName}</td>
                <td>${inv.plan}</td>
                <td>${inv.dueDate}</td>
                <td><strong>$${inv.amount}</strong></td>
                <td><span class="badge ${statusBadgeClass}">${inv.status}</span></td>
                <td class="text-right">
                    ${inv.status !== 'Paid' ? `
                        <button class="btn btn-sm btn-accent btn-pay-invoice" data-id="${inv.id}">
                            Mark Paid
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-secondary" disabled>Settled</button>
                    `}
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Pay action
        document.querySelectorAll(".btn-pay-invoice").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const invoiceId = e.currentTarget.getAttribute("data-id");
                processManualInvoicePayment(invoiceId);
            });
        });

    } catch (err) {
        console.error("Billing error:", err.message);
    }
}

async function processManualInvoicePayment(invoiceId) {
    try {
        await apiRequest(`/invoices/${invoiceId}/pay`, { method: 'POST' });
        showToast(`Invoice ${invoiceId} settled.`, "success");
        fetchBillingData();
        if (state.activeView === "overview") fetchDashboardData();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

document.getElementById("filter-invoice-status").addEventListener("change", fetchBillingData);


// ==========================================================================
// 8. FORM CONTROL MODALS
// ==========================================================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
}

function closeModal(modal) {
    modal.classList.remove("active");
}

document.querySelectorAll("[data-close]").forEach(el => {
    el.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal(el.closest(".modal-overlay"));
    });
});

document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal(modal);
    });
});

/* QUICK CHECK-IN GATES METHOD */
const checkinBtn = document.getElementById("btn-quick-checkin");
const checkinModal = document.getElementById("modal-quick-checkin");
const checkinFeedback = document.getElementById("checkin-feedback");
const checkinSelect = document.getElementById("checkin-member-select");

checkinBtn.addEventListener("click", async () => {
    checkinSelect.innerHTML = `<option value="">Select a member...</option>`;
    
    try {
        // Fetch all members for quick selection
        const response = await apiRequest('/members?limit=100');
        
        response.members.forEach(m => {
            const renewalYear = m.renewalDate.split('-')[0];
            checkinSelect.innerHTML += `
                <option value="${m.id}">${m.firstName} ${m.lastName} - ${m.id} (${m.status})</option>
            `;
        });

        checkinFeedback.className = "checkin-status-box";
        checkinFeedback.innerHTML = "Select an athlete to perform gate check-in verification.";
        openModal("modal-quick-checkin");
    } catch (err) {
        showToast("Could not retrieve member listings.", "danger");
    }
});

// Verify Check-in submit handler
document.getElementById("form-checkin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const selectedId = checkinSelect.value;
    if (!selectedId) {
        checkinFeedback.className = "checkin-status-box failed";
        checkinFeedback.textContent = "Please select a member first.";
        return;
    }

    try {
        const res = await apiRequest('/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: selectedId })
        });

        checkinFeedback.className = "checkin-status-box success";
        checkinFeedback.innerHTML = `<strong>${res.message}</strong><br>${res.memberName}<br>Tier: ${res.plan}`;
        showToast(`Gate unlocked: ${res.memberName} verified.`, "success");

        setTimeout(() => {
            closeModal(checkinModal);
            refreshActiveView();
        }, 1500);

    } catch (err) {
        checkinFeedback.className = "checkin-status-box failed";
        checkinFeedback.innerHTML = `<strong>ACCESS BLOCKED</strong><br>Error: ${err.message}`;
    }
});

async function verifyGateCheckIn(memberId) {
    try {
        const res = await apiRequest('/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId })
        });
        
        showToast(`Checked in ${res.memberName}.`, "success");
        fetchMembersData();
        if (state.activeView === "overview") fetchDashboardData();
    } catch (err) {
        showToast(err.message, "danger");
    }
}


/* NEW / EDIT PROFILE FORM SUBMIT */
const addMemberBtnTop = document.getElementById("btn-add-member-top");
const addMemberBtnList = document.getElementById("btn-add-member-list");
const memberModal = document.getElementById("modal-new-member");
const memberForm = document.getElementById("form-new-member");

function openNewMemberModal() {
    document.getElementById("member-modal-title").textContent = "New Member Registration";
    document.getElementById("btn-save-member").textContent = "Register Member";
    document.getElementById("edit-member-id").value = "";
    memberForm.reset();
    openModal("modal-new-member");
}

addMemberBtnTop.addEventListener("click", openNewMemberModal);
if (addMemberBtnList) {
    addMemberBtnList.addEventListener("click", openNewMemberModal);
}

function openEditMemberModal(memberId) {
    const m = state.members.find(member => member.id === memberId);
    if (m) {
        document.getElementById("member-modal-title").textContent = "Edit Member Details";
        document.getElementById("btn-save-member").textContent = "Update Profile";
        document.getElementById("edit-member-id").value = m.id;
        
        document.getElementById("member-first-name").value = m.firstName;
        document.getElementById("member-last-name").value = m.lastName;
        document.getElementById("member-email").value = m.email;
        document.getElementById("member-plan").value = m.plan;
        document.getElementById("member-status").value = m.status;
        
        openModal("modal-new-member");
    }
}

memberForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const editId = document.getElementById("edit-member-id").value;
    const firstName = document.getElementById("member-first-name").value.trim();
    const lastName = document.getElementById("member-last-name").value.trim();
    const email = document.getElementById("member-email").value.trim();
    const plan = document.getElementById("member-plan").value;
    const status = document.getElementById("member-status").value;

    const payload = { firstName, lastName, email, plan, status };

    try {
        if (editId) {
            // Edit Profile API
            await apiRequest(`/members/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            showToast("Member profile updated successfully.", "success");
        } else {
            // Register Profile API
            const res = await apiRequest('/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            showToast(`Profile generated: ${res.id}`, "success");
        }

        closeModal(memberModal);
        refreshActiveView();
    } catch (err) {
        showToast(err.message, "danger");
    }
});

async function deleteMemberRecord(memberId) {
    const confirmDelete = confirm(`Are you sure you want to completely delete member record ${memberId}?`);
    if (!confirmDelete) return;

    try {
        await apiRequest(`/members/${memberId}`, { method: 'DELETE' });
        showToast("Record removed successfully.", "info");
        fetchMembersData();
    } catch (err) {
        showToast(err.message, "danger");
    }
}


/* PROCESS MANUAL PAYMENT OVERLAY */
const triggerPaymentModalBtn = document.getElementById("btn-trigger-payment-modal");
const paymentModal = document.getElementById("modal-process-payment");
const paymentMemberSelect = document.getElementById("payment-member-name");

triggerPaymentModalBtn.addEventListener("click", async () => {
    paymentMemberSelect.innerHTML = "";
    
    try {
        const invoices = await apiRequest('/invoices?status=Pending');
        const overdueInvoices = await apiRequest('/invoices?status=Overdue');
        const unpaid = [...invoices, ...overdueInvoices];

        if (unpaid.length === 0) {
            paymentMemberSelect.innerHTML = `<option value="">No outstanding payments pending...</option>`;
        } else {
            unpaid.forEach(inv => {
                paymentMemberSelect.innerHTML += `
                    <option value="${inv.id}" data-amount="${inv.amount}">
                        ${inv.memberName} - ${inv.id} ($${inv.amount} due)
                    </option>
                `;
            });
        }

        // Amount mapping
        paymentMemberSelect.addEventListener("change", () => {
            const selected = paymentMemberSelect.options[paymentMemberSelect.selectedIndex];
            if (selected) {
                const amt = selected.getAttribute("data-amount");
                if (amt) document.getElementById("payment-amount").value = amt;
            }
        });

        const first = paymentMemberSelect.options[0];
        if (first) {
            const amt = first.getAttribute("data-amount");
            if (amt) document.getElementById("payment-amount").value = amt;
        }

        openModal("modal-process-payment");
    } catch (err) {
        showToast("Could not retrieve unpaid transactions.", "danger");
    }
});

document.getElementById("form-process-payment").addEventListener("submit", async (e) => {
    e.preventDefault();
    const invoiceId = paymentMemberSelect.value;
    if (!invoiceId) {
        showToast("Select a pending invoice transaction.", "danger");
        return;
    }

    try {
        await apiRequest(`/invoices/${invoiceId}/pay`, { method: 'POST' });
        showToast("Payment transaction logged successfully.", "success");
        closeModal(paymentModal);
        refreshActiveView();
    } catch (err) {
        showToast(err.message, "danger");
    }
});


/* ADD CLASS FORM SUBMIT */
const addClassBtn = document.getElementById("btn-add-class");
const classModal = document.getElementById("modal-add-class");

addClassBtn.addEventListener("click", () => {
    document.getElementById("form-add-class").reset();
    openModal("modal-add-class");
});

document.getElementById("form-add-class").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("class-name").value.trim();
    const trainer = document.getElementById("class-trainer").value.trim();
    const capacity = parseInt(document.getElementById("class-capacity").value);
    const day = document.getElementById("class-day").value;
    const timeSlot = document.getElementById("class-time").value;

    const payload = { name, trainer, capacity, day, timeSlot };

    try {
        await apiRequest('/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        showToast("Schedule slot published successfully.", "success");
        closeModal(classModal);
        refreshActiveView();
    } catch (err) {
        showToast(err.message, "danger");
    }
});


// ==========================================================================
// 9. SYSTEM INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const clock = document.getElementById("clock-display");
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    clock.textContent = today.toLocaleDateString('en-US', options);

    // Initial Overview render (fetches live MySQL values)
    switchView("overview");
});
