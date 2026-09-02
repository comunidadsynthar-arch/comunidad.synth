// Global state
let currentUser = null;

// On load
document.addEventListener("DOMContentLoaded", () => {
    fetchUserData();
});

// Fetch user profile and determine view
async function fetchUserData() {
    try {
        const response = await fetch("/auth/me");
        if (response.status === 401) {
            // Not logged in, redirect to login page
            window.location.href = "/login";
            return;
        }

        if (response.ok) {
            currentUser = await response.json();
            updateNavbar();
            renderRoleView();
        } else {
            console.error("Error al obtener perfil.");
        }
    } catch (err) {
        console.error("Error de conexión:", err);
    }
}

// Update navbar with user details
function updateNavbar() {
    document.getElementById("user-display-name").textContent = currentUser.name || currentUser.email;
    
    const roleMap = {
        "pending": "Pendiente de Rol",
        "admin": "Administrador",
        "brand": "Expositor / Marca",
        "musician": "Músico / Artista",
        "donor": "Donante"
    };
    
    const roleBadge = document.getElementById("user-display-role");
    const isUserAdmin = currentUser.is_admin || currentUser.role === "admin";
    if (isUserAdmin) {
        roleBadge.textContent = "👑 Administrador";
        roleBadge.className = "inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-amber-400/20 text-amber-300 border border-amber-500/40 shadow-sm";
    } else {
        roleBadge.textContent = roleMap[currentUser.role] || currentUser.role;
        roleBadge.className = "inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-zinc-800 text-zinc-400 border border-zinc-700";
    }
}

// Hide all dashboard panels
function hideAllViews() {
    document.getElementById("view-pending").classList.add("hidden");
    document.getElementById("view-brand").classList.add("hidden");
    document.getElementById("view-musician").classList.add("hidden");
    document.getElementById("view-donor").classList.add("hidden");
    document.getElementById("view-admin").classList.add("hidden");
}

// Display alert message on top of dashboard
function showDashboardAlert(message, type = "success") {
    const alertBox = document.getElementById("dashboard-alert");
    alertBox.textContent = message;
    alertBox.classList.remove("hidden");
    
    if (type === "success") {
        alertBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-emerald-950/40 text-emerald-400 border-emerald-800";
    } else {
        alertBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-rose-950/40 text-rose-400 border-rose-800";
    }
    
    setTimeout(() => {
        alertBox.classList.add("hidden");
    }, 5000);
}

// Admin Tab Switcher: Grants Administrators full access to all profiles
function switchAdminTab(tabName) {
    hideAllViews();
    
    const tabs = ['admin', 'musician', 'brand', 'donor'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        if (btn) {
            btn.className = "flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition bg-zinc-800 hover:bg-zinc-700 text-zinc-300";
        }
    });
    
    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activeBtn) {
        activeBtn.className = "flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition bg-sky-500 text-zinc-950 shadow-md";
    }
    
    if (tabName === 'admin') {
        document.getElementById("view-admin").classList.remove("hidden");
        renderAdminView();
    } else if (tabName === 'musician') {
        document.getElementById("view-musician").classList.remove("hidden");
        renderMusicianView();
    } else if (tabName === 'brand') {
        document.getElementById("view-brand").classList.remove("hidden");
        renderBrandView();
    } else if (tabName === 'donor') {
        document.getElementById("view-donor").classList.remove("hidden");
        renderDonorView();
    }
}

// Render view based on role
function renderRoleView() {
    hideAllViews();
    
    const isUserAdmin = currentUser.is_admin || currentUser.role === "admin";
    const adminNav = document.getElementById("admin-nav-tabs");
    
    if (isUserAdmin) {
        if (adminNav) adminNav.classList.remove("hidden");
        // Always default to Admin panel view for administrators
        switchAdminTab('admin');
        return;
    } else {
        if (adminNav) adminNav.classList.add("hidden");
    }
    
    switch (currentUser.role) {
        case "pending":
            document.getElementById("view-pending").classList.remove("hidden");
            break;
            
        case "brand":
            document.getElementById("view-brand").classList.remove("hidden");
            renderBrandView();
            break;
            
        case "musician":
            document.getElementById("view-musician").classList.remove("hidden");
            renderMusicianView();
            break;
            
        case "donor":
            document.getElementById("view-donor").classList.remove("hidden");
            renderDonorView();
            break;
            
        case "admin":
            document.getElementById("view-admin").classList.remove("hidden");
            renderAdminView();
            break;
            
        default:
            console.error("Rol desconocido");
    }
}

// --- Logout Handler ---
async function handleLogout() {
    try {
        await fetch("/auth/logout", { method: "POST" });
        window.location.href = "/";
    } catch (err) {
        console.error("Error al cerrar sesión:", err);
    }
}

// --- Role Selection (For pending users) ---
async function selectRole(role) {
    try {
        const response = await fetch("/auth/select-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role })
        });
        
        if (response.ok) {
            window.location.reload();
        } else {
            const err = await response.json();
            alert(err.detail || "Error seleccionando rol");
        }
    } catch (err) {
        console.error("Error de red:", err);
    }
}

// --- Brand Profile handlers ---
function renderBrandView() {
    // Populate form if profile details exist
    const prof = currentUser.brand_profile || currentUser.profile;
    if (prof) {
        document.getElementById("brand-name").value = prof.brand_name || "";
        document.getElementById("brand-desc").value = prof.description || "";
        document.getElementById("brand-website").value = prof.website || "";
        document.getElementById("brand-space").value = prof.space_requested || 1.0;
        document.getElementById("brand-electricity").value = prof.electricity_needs || "";
        document.getElementById("brand-products").value = prof.products || "";
    }
    
    // Status Alert
    const statusBox = document.getElementById("brand-approval-status");
    if (currentUser.is_admin || currentUser.role === "admin") {
        statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-sky-950/40 text-sky-400 border-sky-800";
        statusBox.textContent = "👑 Modo Administrador: Podés ver o configurar los datos de stand y marca expositora.";
    } else if (currentUser.is_approved) {
        statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-emerald-950/40 text-emerald-400 border-emerald-800";
        statusBox.textContent = "⚡ ¡Tu perfil de marca está APROBADO por administración! Formas parte oficial de los expositores de Synth Argentina.";
    } else {
        statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-amber-950/40 text-amber-400 border-amber-800";
        statusBox.textContent = "⏳ Tu perfil está guardado, pero está PENDIENTE de aprobación por parte de la administración. Se habilitará pronto.";
    }
}

async function saveBrandProfile(event) {
    event.preventDefault();
    const payload = {
        brand_name: document.getElementById("brand-name").value.trim(),
        description: document.getElementById("brand-desc").value.trim(),
        website: document.getElementById("brand-website").value.trim(),
        space_requested: parseFloat(document.getElementById("brand-space").value) || 1.0,
        electricity_needs: document.getElementById("brand-electricity").value,
        products: document.getElementById("brand-products").value.trim()
    };
    
    try {
        const response = await fetch("/profile/brand", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            showDashboardAlert("¡Perfil de marca guardado con éxito!");
            fetchUserData(); // Refresh local state
        } else {
            const err = await response.json();
            showDashboardAlert(err.detail || "Error guardando el perfil", "error");
        }
    } catch (err) {
        showDashboardAlert("Error de conexión", "error");
    }
}

// --- Musician Profile handlers ---
function renderMusicianView() {
    const prof = currentUser.musician_profile || currentUser.profile;
    if (prof) {
        document.getElementById("musician-name").value = prof.artist_name || "";
        document.getElementById("musician-genre").value = prof.genre || "";
        document.getElementById("musician-bio").value = prof.bio || "";
        document.getElementById("musician-links").value = prof.links || "";
        document.getElementById("musician-setup").value = prof.setup_description || "";
        document.getElementById("musician-rider").value = prof.technical_rider || "";
    }
    
    const statusBox = document.getElementById("musician-approval-status");
    if (currentUser.is_admin || currentUser.role === "admin") {
        statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-sky-950/40 text-sky-400 border-sky-800";
        statusBox.textContent = "👑 Modo Administrador: Podés ver o configurar la propuesta artística y rider técnico.";
    } else if (currentUser.is_approved) {
        statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-emerald-950/40 text-emerald-400 border-emerald-800";
        statusBox.textContent = "🎙️ ¡Tu propuesta musical está APROBADA! Estás programado en la grilla del evento.";
    } else {
        statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-amber-950/40 text-amber-400 border-amber-800";
        statusBox.textContent = "⏳ Tu propuesta musical fue cargada y está PENDIENTE de curaduría técnica por administración.";
    }
}

async function saveMusicianProfile(event) {
    event.preventDefault();
    const payload = {
        artist_name: document.getElementById("musician-name").value.trim(),
        genre: document.getElementById("musician-genre").value.trim(),
        bio: document.getElementById("musician-bio").value.trim(),
        links: document.getElementById("musician-links").value.trim(),
        setup_description: document.getElementById("musician-setup").value.trim(),
        technical_rider: document.getElementById("musician-rider").value.trim()
    };
    
    try {
        const response = await fetch("/profile/musician", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            showDashboardAlert("¡Propuesta artística guardada con éxito!");
            fetchUserData();
        } else {
            const err = await response.json();
            showDashboardAlert(err.detail || "Error guardando el perfil", "error");
        }
    } catch (err) {
        showDashboardAlert("Error de conexión", "error");
    }
}

// --- Donor/Donation Handlers ---
async function renderDonorView() {
    // Fetch my donations
    try {
        const response = await fetch("/donations/my");
        if (response.ok) {
            const donations = await response.json();
            const tbody = document.getElementById("my-donations-tbody");
            tbody.innerHTML = "";
            
            if (donations.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" class="py-4 text-center text-zinc-500">Todavía no has realizado ninguna donación.</td></tr>`;
                return;
            }
            
            donations.forEach(d => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td class="py-3 text-zinc-400">${d.created_at}</td>
                    <td class="py-3 font-bold text-sky-400">$${d.amount.toLocaleString('es-AR')} ${d.currency}</td>
                    <td class="py-3 text-right text-xs">
                        <span class="px-2 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">Completada</span>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (err) {
        console.error("Error al obtener donaciones:", err);
    }
}

async function donateAmount(amount) {
    try {
        const response = await fetch("/donations/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: parseFloat(amount) })
        });
        
        if (response.ok) {
            showDashboardAlert("¡Donación registrada! ¡Muchas gracias por tu apoyo! 💙");
            renderDonorView();
        } else {
            showDashboardAlert("No se pudo registrar la donación.", "error");
        }
    } catch (err) {
        showDashboardAlert("Error de red", "error");
    }
}

function donateCustom() {
    const input = document.getElementById("custom-donation");
    const amount = parseFloat(input.value);
    if (!amount || amount < 1000) {
        showDashboardAlert("Por favor ingresa un monto válido (Mínimo $1.000 ARS)", "error");
        return;
    }
    donateAmount(amount);
    input.value = "";
}

// --- Admin Handlers ---
async function renderAdminView() {
    // 1. Fetch Stats
    try {
        const response = await fetch("/admin/stats");
        if (response.ok) {
            const stats = await response.json();
            document.getElementById("stat-brands").textContent = stats.total_brands;
            document.getElementById("stat-musicians").textContent = stats.total_musicians;
            document.getElementById("stat-space").textContent = `${stats.total_space_requested_m2} m²`;
            document.getElementById("stat-funds").textContent = `$${stats.total_donated_ars.toLocaleString('es-AR')} ARS`;
        }
    } catch (err) {
        console.error("Error al cargar estadísticas:", err);
    }

    // 2. Fetch Registrations
    try {
        const response = await fetch("/admin/registrations");
        if (response.ok) {
            const items = await response.json();
            const tbody = document.getElementById("registrations-tbody");
            tbody.innerHTML = "";
            
            if (items.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-zinc-500">No hay marcas ni músicos registrados aún.</td></tr>`;
                return;
            }
            
            items.forEach(item => {
                const row = document.createElement("tr");
                
                // Formatear detalles según rol
                let detailHtml = "";
                if (item.role === "brand") {
                    detailHtml = `
                        <div class="text-xs">
                            <span class="block text-zinc-400">Sitio: <a href="${item.details.website}" target="_blank" class="text-sky-400 hover:underline">${item.details.website || 'N/A'}</a></span>
                            <span class="block text-zinc-400">Espacio: <strong class="text-zinc-200">${item.details.space_requested} m²</strong></span>
                            <span class="block text-zinc-400">Electricidad: <strong class="text-zinc-200">${item.details.electricity_needs}</strong></span>
                            <span class="block text-zinc-400">Productos: ${item.details.products || 'N/A'}</span>
                        </div>
                    `;
                } else if (item.role === "musician") {
                    detailHtml = `
                        <div class="text-xs">
                            <span class="block text-zinc-400">Género: <strong class="text-zinc-200">${item.details.genre}</strong></span>
                            <span class="block text-zinc-400">Links: ${item.details.links || 'N/A'}</span>
                            <span class="block text-zinc-400">Equipos: ${item.details.setup_description || 'N/A'}</span>
                        </div>
                    `;
                }
                
                // Status badge
                const statusBadge = item.is_approved
                    ? `<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-semibold">Aprobado</span>`
                    : `<span class="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-xs font-semibold">Pendiente</span>`;
                
                // Action Buttons
                const actionButton = item.is_approved
                    ? `<button onclick="rejectUser(${item.user_id})" class="bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-400 font-bold py-1 px-3 rounded-lg text-xs transition">Revocar</button>`
                    : `<button onclick="approveUser(${item.user_id})" class="bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 font-bold py-1 px-3 rounded-lg text-xs transition">Aprobar</button>`;

                row.innerHTML = `
                    <td class="py-4">
                        <span class="block font-bold text-zinc-200">${item.details.name || 'Sin nombre cargado'}</span>
                        <span class="inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                            item.role === 'brand' ? 'bg-sky-950 text-sky-400 border border-sky-900' : 'bg-purple-950 text-purple-400 border border-purple-900'
                        }">${item.role === 'brand' ? 'Marca' : 'Músico'}</span>
                    </td>
                    <td class="py-4">
                        <span class="block text-sm text-zinc-300">${item.full_name || 'N/A'}</span>
                        <span class="block text-xs text-zinc-500">${item.email}</span>
                    </td>
                    <td class="py-4">${detailHtml}</td>
                    <td class="py-4">${statusBadge}</td>
                    <td class="py-4 text-right">${actionButton}</td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (err) {
        console.error("Error al cargar registros administrativos:", err);
    }
}

async function approveUser(userId) {
    try {
        const response = await fetch(`/admin/approve/${userId}`, { method: "POST" });
        if (response.ok) {
            showDashboardAlert("Usuario aprobado con éxito.");
            renderAdminView();
        }
    } catch (err) {
        console.error("Error de red:", err);
    }
}

async function rejectUser(userId) {
    try {
        const response = await fetch(`/admin/reject/${userId}`, { method: "POST" });
        if (response.ok) {
            showDashboardAlert("Aprobación revocada correctamente.");
            renderAdminView();
        }
    } catch (err) {
        console.error("Error de red:", err);
    }
}
