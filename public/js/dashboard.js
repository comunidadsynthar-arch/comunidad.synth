// Global state
let currentUser = null;
let brandLogo = "";
let brandGallery = [];
let musicianPhoto = "";
let musicianGallery = [];

// Canvas Image Compressor (Resize & compress to WebP/JPEG)
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error("El archivo seleccionado no es una imagen válida"));
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width / height > maxWidth / maxHeight) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                // Try WebP first, fallback to JPEG
                let dataUrl = canvas.toDataURL("image/webp", quality);
                if (!dataUrl.startsWith("data:image/webp")) {
                    dataUrl = canvas.toDataURL("image/jpeg", quality);
                }
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error("Error al decodificar la imagen"));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Error al leer el archivo"));
        reader.readAsDataURL(file);
    });
}

// Lightbox modal helpers
function openLightbox(src, caption = "") {
    const modal = document.getElementById("image-lightbox-modal");
    const img = document.getElementById("lightbox-img");
    const cap = document.getElementById("lightbox-caption");
    if (!modal || !img) return;
    img.src = src;
    if (cap) cap.textContent = caption;
    modal.classList.remove("hidden");
}

function closeLightbox() {
    const modal = document.getElementById("image-lightbox-modal");
    if (modal) modal.classList.add("hidden");
}

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
            updateWelcomeBanner();
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
    
    // Update navbar avatar
    const navAvatar = document.getElementById("navbar-avatar");
    const navPlaceholder = document.getElementById("navbar-avatar-placeholder");
    if (navAvatar && navPlaceholder) {
        if (currentUser.avatar_url) {
            navAvatar.src = currentUser.avatar_url;
            navAvatar.classList.remove("hidden");
            navPlaceholder.classList.add("hidden");
        } else {
            navAvatar.classList.add("hidden");
            navPlaceholder.classList.remove("hidden");
        }
    }

    const roleMap = {
        "pending": "Pendiente de Rol",
        "admin": "Administrador",
        "brand": "Expositor / Marca",
        "musician": "Músico / Artista",
        "collaborator": "Colaborador / Staff",
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

// Update personalized welcome banner
function updateWelcomeBanner() {
    const welcomeBox = document.getElementById("user-welcome-box");
    if (!welcomeBox) return;

    welcomeBox.classList.remove("hidden");
    const nameEl = document.getElementById("welcome-user-name");
    const statusEl = document.getElementById("welcome-user-status");
    const roleTagEl = document.getElementById("welcome-role-tag");

    const displayName = currentUser.name || currentUser.email.split("@")[0];
    nameEl.textContent = displayName;

    // Welcome box avatar
    const welcomeAvatarImg = document.getElementById("welcome-avatar-img");
    const welcomeAvatarPlaceholder = document.getElementById("welcome-avatar-placeholder");
    if (welcomeAvatarImg && welcomeAvatarPlaceholder) {
        if (currentUser.avatar_url) {
            welcomeAvatarImg.src = currentUser.avatar_url;
            welcomeAvatarImg.classList.remove("hidden");
            welcomeAvatarPlaceholder.classList.add("hidden");
        } else {
            welcomeAvatarImg.classList.add("hidden");
            welcomeAvatarPlaceholder.classList.remove("hidden");
        }
    }

    const roleMap = {
        "pending": "Elegí tu rol",
        "admin": "👑 Administrador",
        "brand": "🔌 Marca / Expositor",
        "musician": "🎙️ Músico / Artista",
        "collaborator": "🤝 Colaborador / Staff",
        "donor": "💙 Donador / Público"
    };

    roleTagEl.textContent = roleMap[currentUser.role] || currentUser.role;

    if (currentUser.is_admin || currentUser.role === "admin") {
        statusEl.textContent = "Tenés permisos totales para administrar admisiones y consultar todos los perfiles de la comunidad.";
    } else if (currentUser.role === "pending") {
        statusEl.textContent = "Tu cuenta está vinculada. Por favor seleccioná tu rol abajo para participar en el evento.";
    } else {
        statusEl.textContent = "Tus datos están guardados en el sistema. Podés revisarlos o actualizarlos en cualquier momento.";
    }
}

// Handle User Avatar Upload
async function handleAvatarUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const feedback = document.getElementById("avatar-upload-feedback");
    if (feedback) feedback.classList.remove("hidden");

    try {
        const compressed = await compressImage(file, 400, 400, 0.82);
        const res = await fetch("/user/avatar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar_url: compressed })
        });

        if (res.ok) {
            const data = await res.json();
            currentUser.avatar_url = data.avatar_url || compressed;
            updateNavbar();
            updateWelcomeBanner();
            showDashboardAlert("¡Foto de perfil actualizada con éxito!");
        } else {
            showDashboardAlert("No se pudo actualizar la foto de perfil.", "error");
        }
    } catch (err) {
        console.error("Error al procesar foto:", err);
        showDashboardAlert("Error al procesar la imagen.", "error");
    } finally {
        if (feedback) feedback.classList.add("hidden");
        event.target.value = "";
    }
}

// Hide all dashboard panels
function hideAllViews() {
    document.getElementById("view-pending").classList.add("hidden");
    document.getElementById("view-brand").classList.add("hidden");
    document.getElementById("view-musician").classList.add("hidden");
    const collabView = document.getElementById("view-collaborator");
    if (collabView) collabView.classList.add("hidden");
    document.getElementById("view-donor").classList.add("hidden");
    document.getElementById("view-admin").classList.add("hidden");
}

let alertTimeout = null;

// Display floating toast alert message anywhere on screen
function showDashboardAlert(message, type = "success") {
    const alertContainer = document.getElementById("dashboard-alert");
    const alertContent = document.getElementById("dashboard-alert-content");
    const alertText = document.getElementById("dashboard-alert-text");
    const alertIcon = document.getElementById("dashboard-alert-icon");
    if (!alertContainer || !alertContent || !alertText) return;

    if (alertTimeout) {
        clearTimeout(alertTimeout);
        alertTimeout = null;
    }

    alertText.textContent = message;

    if (type === "success") {
        alertContent.className = "flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold backdrop-blur-md pointer-events-auto bg-zinc-900/95 text-emerald-400 border-emerald-500/50 shadow-emerald-950/40";
        if (alertIcon) alertIcon.textContent = "✅";
    } else if (type === "warning") {
        alertContent.className = "flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold backdrop-blur-md pointer-events-auto bg-zinc-900/95 text-amber-300 border-amber-500/50 shadow-amber-950/40";
        if (alertIcon) alertIcon.textContent = "⚠️";
    } else {
        alertContent.className = "flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold backdrop-blur-md pointer-events-auto bg-zinc-900/95 text-rose-400 border-rose-500/50 shadow-rose-950/40";
        if (alertIcon) alertIcon.textContent = "❌";
    }

    // Show container and animate in
    alertContainer.classList.remove("hidden");
    requestAnimationFrame(() => {
        alertContainer.classList.remove("scale-95", "opacity-0");
        alertContainer.classList.add("scale-100", "opacity-100");
    });

    alertTimeout = setTimeout(() => {
        hideDashboardAlert();
    }, 4500);
}

function hideDashboardAlert() {
    const alertContainer = document.getElementById("dashboard-alert");
    if (!alertContainer) return;
    alertContainer.classList.remove("scale-100", "opacity-100");
    alertContainer.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
        alertContainer.classList.add("hidden");
    }, 300);
}

// Admin Tab Switcher: Grants Administrators full access to all profiles
function switchAdminTab(tabName) {
    hideAllViews();
    
    const tabs = ['admin', 'musician', 'brand', 'collaborator', 'donor'];
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
    } else if (tabName === 'collaborator') {
        const collabView = document.getElementById("view-collaborator");
        if (collabView) collabView.classList.remove("hidden");
        renderCollaboratorView();
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
            
        case "collaborator":
            const collabView = document.getElementById("view-collaborator");
            if (collabView) collabView.classList.remove("hidden");
            renderCollaboratorView();
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
    const prof = currentUser.brand_profile || currentUser.profile;
    if (prof) {
        document.getElementById("brand-name").value = prof.brand_name || "";
        document.getElementById("brand-desc").value = prof.description || "";
        document.getElementById("brand-website").value = prof.website || "";
        document.getElementById("brand-space").value = prof.space_requested || 1.0;
        document.getElementById("brand-electricity").value = prof.electricity_needs || "220V - Simple";
        document.getElementById("brand-products").value = prof.products || "";
        brandLogo = prof.logo_url || "";
        brandGallery = Array.isArray(prof.gallery_images) ? [...prof.gallery_images] : [];
    } else {
        brandLogo = "";
        brandGallery = [];
    }

    renderBrandLogoPreview();
    renderBrandGallery();
    
    const statusBox = document.getElementById("brand-approval-status");
    if (currentUser.is_admin || currentUser.role === "admin") {
        statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-sky-950/40 text-sky-400 border-sky-800";
        statusBox.textContent = "👑 Modo Administrador: Podés ver o configurar los datos de stand y marca expositora.";
    } else if (currentUser.is_approved) {
        statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-emerald-950/40 text-emerald-400 border-emerald-800";
        statusBox.textContent = "⚡ ¡Tu perfil de marca está APROBADO por administración! Formás parte oficial de los expositores de Synth Argentina.";
    } else {
        statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-amber-950/40 text-amber-400 border-amber-800";
        statusBox.textContent = "⏳ Tu perfil está guardado y está PENDIENTE de confirmación por administración. Te contactaremos a la brevedad.";
    }
}

function renderBrandLogoPreview() {
    const imgEl = document.getElementById("brand-logo-img");
    const placeholderEl = document.getElementById("brand-logo-placeholder");
    const removeBtn = document.getElementById("brand-logo-remove-btn");
    if (!imgEl) return;

    if (brandLogo) {
        imgEl.src = brandLogo;
        imgEl.classList.remove("hidden");
        if (placeholderEl) placeholderEl.classList.add("hidden");
        if (removeBtn) removeBtn.classList.remove("hidden");
    } else {
        imgEl.src = "";
        imgEl.classList.add("hidden");
        if (placeholderEl) placeholderEl.classList.remove("hidden");
        if (removeBtn) removeBtn.classList.add("hidden");
    }
}

async function handleBrandLogoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
        brandLogo = await compressImage(file, 500, 500, 0.85);
        renderBrandLogoPreview();
    } catch (e) {
        showDashboardAlert("Error al procesar el logo de la marca", "error");
    } finally {
        event.target.value = "";
    }
}

function removeBrandLogo() {
    brandLogo = "";
    renderBrandLogoPreview();
}

function renderBrandGallery() {
    const grid = document.getElementById("brand-gallery-grid");
    const countEl = document.getElementById("brand-gallery-count");
    if (!grid) return;

    if (countEl) countEl.textContent = `${brandGallery.length} / 6 fotos`;
    grid.innerHTML = "";

    brandGallery.forEach((imgUrl, idx) => {
        const card = document.createElement("div");
        card.className = "relative aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 group shadow-sm";
        card.innerHTML = `
            <img src="${imgUrl}" class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" onclick="openLightbox('${imgUrl}', 'Foto de producto / stand (${idx + 1})')" alt="Foto ${idx + 1}">
            <button type="button" onclick="removeBrandGalleryImage(${idx})" title="Eliminar foto" class="absolute top-1.5 right-1.5 bg-black/75 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition">
                ✕
            </button>
        `;
        grid.appendChild(card);
    });

    if (brandGallery.length < 6) {
        const addBtn = document.createElement("div");
        addBtn.className = "aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-sky-500 hover:bg-sky-950/20 flex flex-col items-center justify-center text-zinc-400 hover:text-sky-400 cursor-pointer transition p-2 text-center group";
        addBtn.onclick = () => document.getElementById("brand-gallery-input").click();
        addBtn.innerHTML = `
            <span class="text-2xl group-hover:scale-110 transition-transform">➕</span>
            <span class="text-[10px] font-bold mt-1">Agregar</span>
        `;
        grid.appendChild(addBtn);
    }
}

async function handleBrandGalleryUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 6 - brandGallery.length;
    if (availableSlots <= 0) {
        showDashboardAlert("Has alcanzado el límite de 6 fotos en la galería", "error");
        event.target.value = "";
        return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    let addedCount = 0;

    for (const file of filesToProcess) {
        try {
            const compressed = await compressImage(file, 1200, 1200, 0.78);
            brandGallery.push(compressed);
            addedCount++;
        } catch (e) {
            console.error("Error al procesar la foto:", e);
        }
    }

    renderBrandGallery();
    event.target.value = "";

    if (files.length > availableSlots) {
        showDashboardAlert(`Se agregaron ${addedCount} foto(s). Se omitieron las restantes porque el límite es de 6 fotos.`, "warning");
    } else if (addedCount > 0) {
        showDashboardAlert(`¡${addedCount} foto(s) agregada(s) a la galería!`);
    }
}

function removeBrandGalleryImage(index) {
    brandGallery.splice(index, 1);
    renderBrandGallery();
}

async function saveBrandProfile(event) {
    event.preventDefault();
    const payload = {
        brand_name: document.getElementById("brand-name").value.trim(),
        description: document.getElementById("brand-desc").value.trim(),
        website: document.getElementById("brand-website").value.trim(),
        logo_url: brandLogo,
        gallery_images: brandGallery,
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
            fetchUserData();
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
        musicianPhoto = prof.photo_url || "";
        musicianGallery = Array.isArray(prof.gallery_images) ? [...prof.gallery_images] : [];
    } else {
        musicianPhoto = "";
        musicianGallery = [];
    }

    renderMusicianPhotoPreview();
    renderMusicianGallery();
    
    const statusBox = document.getElementById("musician-approval-status");
    if (currentUser.is_admin || currentUser.role === "admin") {
        statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-sky-950/40 text-sky-400 border-sky-800";
        statusBox.textContent = "👑 Modo Administrador: Podés ver o configurar la propuesta artística y rider técnico.";
    } else if (currentUser.is_approved) {
        statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-emerald-950/40 text-emerald-400 border-emerald-800";
        statusBox.textContent = "🎙️ ¡Tu propuesta musical está APROBADA!";
    } else {
        statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-amber-950/40 text-amber-400 border-amber-800";
        statusBox.textContent = "⏳ Tu propuesta musical fue cargada y está PENDIENTE de curaduría técnica por administración.";
    }
}

function renderMusicianPhotoPreview() {
    const imgEl = document.getElementById("musician-photo-img");
    const placeholderEl = document.getElementById("musician-photo-placeholder");
    const removeBtn = document.getElementById("musician-photo-remove-btn");
    if (!imgEl) return;

    if (musicianPhoto) {
        imgEl.src = musicianPhoto;
        imgEl.classList.remove("hidden");
        if (placeholderEl) placeholderEl.classList.add("hidden");
        if (removeBtn) removeBtn.classList.remove("hidden");
    } else {
        imgEl.src = "";
        imgEl.classList.add("hidden");
        if (placeholderEl) placeholderEl.classList.remove("hidden");
        if (removeBtn) removeBtn.classList.add("hidden");
    }
}

async function handleMusicianPhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
        musicianPhoto = await compressImage(file, 800, 800, 0.82);
        renderMusicianPhotoPreview();
    } catch (e) {
        showDashboardAlert("Error al procesar la foto de prensa", "error");
    } finally {
        event.target.value = "";
    }
}

function removeMusicianPhoto() {
    musicianPhoto = "";
    renderMusicianPhotoPreview();
}

function renderMusicianGallery() {
    const grid = document.getElementById("musician-gallery-grid");
    const countEl = document.getElementById("musician-gallery-count");
    if (!grid) return;

    if (countEl) countEl.textContent = `${musicianGallery.length} / 6 fotos`;
    grid.innerHTML = "";

    musicianGallery.forEach((imgUrl, idx) => {
        const card = document.createElement("div");
        card.className = "relative aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 group shadow-sm";
        card.innerHTML = `
            <img src="${imgUrl}" class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" onclick="openLightbox('${imgUrl}', 'Foto de sintetizador / show (${idx + 1})')" alt="Foto ${idx + 1}">
            <button type="button" onclick="removeMusicianGalleryImage(${idx})" title="Eliminar foto" class="absolute top-1.5 right-1.5 bg-black/75 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition">
                ✕
            </button>
        `;
        grid.appendChild(card);
    });

    if (musicianGallery.length < 6) {
        const addBtn = document.createElement("div");
        addBtn.className = "aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-sky-500 hover:bg-sky-950/20 flex flex-col items-center justify-center text-zinc-400 hover:text-sky-400 cursor-pointer transition p-2 text-center group";
        addBtn.onclick = () => document.getElementById("musician-gallery-input").click();
        addBtn.innerHTML = `
            <span class="text-2xl group-hover:scale-110 transition-transform">➕</span>
            <span class="text-[10px] font-bold mt-1">Agregar</span>
        `;
        grid.appendChild(addBtn);
    }
}

async function handleMusicianGalleryUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 6 - musicianGallery.length;
    if (availableSlots <= 0) {
        showDashboardAlert("Has alcanzado el límite de 6 fotos en la galería", "error");
        event.target.value = "";
        return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    let addedCount = 0;

    for (const file of filesToProcess) {
        try {
            const compressed = await compressImage(file, 1200, 1200, 0.78);
            musicianGallery.push(compressed);
            addedCount++;
        } catch (e) {
            console.error("Error al procesar la foto:", e);
        }
    }

    renderMusicianGallery();
    event.target.value = "";

    if (files.length > availableSlots) {
        showDashboardAlert(`Se agregaron ${addedCount} foto(s). Se omitieron las restantes porque el límite es de 6 fotos.`, "warning");
    } else if (addedCount > 0) {
        showDashboardAlert(`¡${addedCount} foto(s) agregada(s) a la galería!`);
    }
}

function removeMusicianGalleryImage(index) {
    musicianGallery.splice(index, 1);
    renderMusicianGallery();
}

async function saveMusicianProfile(event) {
    event.preventDefault();
    const payload = {
        artist_name: document.getElementById("musician-name").value.trim(),
        genre: document.getElementById("musician-genre").value.trim(),
        bio: document.getElementById("musician-bio").value.trim(),
        links: document.getElementById("musician-links").value.trim(),
        photo_url: musicianPhoto,
        gallery_images: musicianGallery,
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

// --- Collaborator Profile handlers (NUEVO) ---
function renderCollaboratorView() {
    const prof = currentUser.collaborator_profile || currentUser.profile;
    if (prof) {
        document.getElementById("collaborator-phone").value = prof.phone || "";
        document.getElementById("collaborator-availability").value = prof.availability || "";
        document.getElementById("collaborator-experience").value = prof.experience || "";
        document.getElementById("collaborator-notes").value = prof.notes || "";

        // Check checkboxes
        const selectedAreas = (prof.areas_of_interest || "").split(",").map(a => a.trim());
        const checkboxes = document.querySelectorAll('input[name="collab-area"]');
        checkboxes.forEach(cb => {
            cb.checked = selectedAreas.includes(cb.value);
        });
    }

    const statusBox = document.getElementById("collaborator-approval-status");
    if (statusBox) {
        if (currentUser.is_admin || currentUser.role === "admin") {
            statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-sky-950/40 text-sky-400 border-sky-800";
            statusBox.textContent = "👑 Modo Administrador: Podés ver o configurar la postulación de colaboración.";
        } else if (currentUser.is_approved) {
            statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-emerald-950/40 text-emerald-400 border-emerald-800";
            statusBox.textContent = "🤝 ¡Tu colaboración en el equipo de Synth Argentina está CONFIRMADA! Nos estaremos comunicando por WhatsApp.";
        } else {
            statusBox.className = "mb-6 p-4 rounded-xl border text-sm text-center bg-amber-950/40 text-amber-400 border-amber-800";
            statusBox.textContent = "⏳ Tus datos de colaboración están guardados. La coordinación de producción se pondrá en contacto pronto.";
        }
    }
}

async function saveCollaboratorProfile(event) {
    event.preventDefault();

    const checkedBoxes = Array.from(document.querySelectorAll('input[name="collab-area"]:checked')).map(cb => cb.value);
    if (checkedBoxes.length === 0) {
        showDashboardAlert("Por favor seleccioná al menos un área en la que te gustaría colaborar.", "error");
        return;
    }

    const payload = {
        areas_of_interest: checkedBoxes.join(", "),
        phone: document.getElementById("collaborator-phone").value.trim(),
        availability: document.getElementById("collaborator-availability").value.trim(),
        experience: document.getElementById("collaborator-experience").value.trim(),
        notes: document.getElementById("collaborator-notes").value.trim()
    };

    try {
        const response = await fetch("/profile/collaborator", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showDashboardAlert("¡Perfil de colaborador guardado con éxito! Muchas gracias por sumarte al equipo.");
            fetchUserData();
        } else {
            const err = await response.json();
            showDashboardAlert(err.detail || "Error guardando el perfil", "error");
        }
    } catch (err) {
        showDashboardAlert("Error de conexión con el servidor", "error");
    }
}

// --- Donor/Donation Handlers ---
async function renderDonorView() {
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

async function handleDonation(event) {
    event.preventDefault();
    const input = document.getElementById("donation-amount");
    const amount = parseFloat(input.value);
    if (!amount || amount < 500) {
        showDashboardAlert("Por favor ingresa un monto válido (Mínimo $500 ARS)", "error");
        return;
    }

    try {
        const response = await fetch("/donations/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount })
        });
        
        if (response.ok) {
            showDashboardAlert("¡Aporte registrado! ¡Muchas gracias por apoyar a la comunidad! 💙");
            renderDonorView();
        } else {
            showDashboardAlert("No se pudo registrar la donación.", "error");
        }
    } catch (err) {
        showDashboardAlert("Error de red", "error");
    }
}

// --- Admin Handlers ---
async function renderAdminView() {
    // 1. Fetch Stats
    try {
        const response = await fetch("/admin/stats");
        if (response.ok) {
            const stats = await response.json();
            document.getElementById("stat-brands").textContent = stats.total_brands || 0;
            document.getElementById("stat-musicians").textContent = stats.total_musicians || 0;
            const collabStat = document.getElementById("stat-collaborators");
            if (collabStat) collabStat.textContent = stats.total_collaborators || 0;
            document.getElementById("stat-space").textContent = `${stats.total_space_requested_m2 || 0} m²`;
            document.getElementById("stat-funds").textContent = `$${(stats.total_donated_ars || 0).toLocaleString('es-AR')} ARS`;
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
                tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-zinc-500">No hay convocatorias registradas aún.</td></tr>`;
                return;
            }
            
            items.forEach(item => {
                const row = document.createElement("tr");
                
                // Formatear detalles y galería según rol
                let detailHtml = "";
                let roleTag = "";
                let avatarThumb = "";

                if (item.role === "brand") {
                    roleTag = `<span class="inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-sky-950 text-sky-400 border border-sky-900">Marca</span>`;
                    
                    if (item.details.logo_url) {
                        avatarThumb = `<img src="${item.details.logo_url}" onclick="openLightbox('${item.details.logo_url}', '${item.details.name || 'Logo Marca'}')" class="w-10 h-10 rounded-xl object-cover border border-sky-500/40 cursor-pointer shadow-sm flex-shrink-0" title="Ver logo">`;
                    } else if (item.avatar_url) {
                        avatarThumb = `<img src="${item.avatar_url}" onclick="openLightbox('${item.avatar_url}', '${item.full_name || 'Avatar'}')" class="w-10 h-10 rounded-full object-cover border border-sky-500/40 cursor-pointer shadow-sm flex-shrink-0" title="Ver avatar">`;
                    } else {
                        avatarThumb = `<div class="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg flex-shrink-0">🔌</div>`;
                    }

                    detailHtml = `
                        <div class="text-xs">
                            <span class="block text-zinc-400">Espacio: <strong class="text-zinc-200">${item.details.space_requested} m²</strong></span>
                            <span class="block text-zinc-400">Electricidad: <strong class="text-zinc-200">${item.details.electricity_needs}</strong></span>
                            <span class="block text-zinc-400">Productos: ${item.details.products || 'N/A'}</span>
                        </div>
                    `;

                    if (item.details.gallery_images && item.details.gallery_images.length > 0) {
                        let gHtml = `
                            <div class="mt-2.5">
                                <span class="block text-[10px] uppercase font-bold text-sky-400 mb-1">Galería (${item.details.gallery_images.length} fotos):</span>
                                <div class="flex items-center gap-1.5 flex-wrap">
                        `;
                        item.details.gallery_images.forEach((img, gIdx) => {
                            gHtml += `<img src="${img}" onclick="openLightbox('${img}', '${item.details.name || 'Marca'} - Foto ${gIdx+1}')" class="w-8 h-8 rounded-lg object-cover border border-zinc-700 hover:border-sky-400 cursor-pointer transition transform hover:scale-110 shadow-sm" title="Ver imagen">`;
                        });
                        gHtml += `</div></div>`;
                        detailHtml += gHtml;
                    }

                } else if (item.role === "musician") {
                    roleTag = `<span class="inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-purple-950 text-purple-400 border border-purple-900">Músico</span>`;
                    
                    if (item.details.photo_url) {
                        avatarThumb = `<img src="${item.details.photo_url}" onclick="openLightbox('${item.details.photo_url}', '${item.details.name || 'Foto Prensa'}')" class="w-10 h-10 rounded-xl object-cover border border-purple-500/40 cursor-pointer shadow-sm flex-shrink-0" title="Ver foto prensa">`;
                    } else if (item.avatar_url) {
                        avatarThumb = `<img src="${item.avatar_url}" onclick="openLightbox('${item.avatar_url}', '${item.full_name || 'Avatar'}')" class="w-10 h-10 rounded-full object-cover border border-purple-500/40 cursor-pointer shadow-sm flex-shrink-0" title="Ver avatar">`;
                    } else {
                        avatarThumb = `<div class="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg flex-shrink-0">🎙️</div>`;
                    }

                    detailHtml = `
                        <div class="text-xs">
                            <span class="block text-zinc-400">Género: <strong class="text-zinc-200">${item.details.genre}</strong></span>
                            <span class="block text-zinc-400">Links: ${item.details.links || 'N/A'}</span>
                            <span class="block text-zinc-400">Equipos: ${item.details.setup_description || 'N/A'}</span>
                        </div>
                    `;

                    if (item.details.gallery_images && item.details.gallery_images.length > 0) {
                        let gHtml = `
                            <div class="mt-2.5">
                                <span class="block text-[10px] uppercase font-bold text-purple-400 mb-1">Galería (${item.details.gallery_images.length} fotos):</span>
                                <div class="flex items-center gap-1.5 flex-wrap">
                        `;
                        item.details.gallery_images.forEach((img, gIdx) => {
                            gHtml += `<img src="${img}" onclick="openLightbox('${img}', '${item.details.name || 'Músico'} - Setup ${gIdx+1}')" class="w-8 h-8 rounded-lg object-cover border border-zinc-700 hover:border-purple-400 cursor-pointer transition transform hover:scale-110 shadow-sm" title="Ver imagen">`;
                        });
                        gHtml += `</div></div>`;
                        detailHtml += gHtml;
                    }

                } else if (item.role === "collaborator") {
                    roleTag = `<span class="inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-900">Colaborador</span>`;
                    
                    if (item.avatar_url) {
                        avatarThumb = `<img src="${item.avatar_url}" onclick="openLightbox('${item.avatar_url}', '${item.full_name || 'Colaborador'}')" class="w-10 h-10 rounded-full object-cover border border-emerald-500/40 cursor-pointer shadow-sm flex-shrink-0" title="Ver foto">`;
                    } else {
                        avatarThumb = `<div class="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg flex-shrink-0">🤝</div>`;
                    }

                    detailHtml = `
                        <div class="text-xs">
                            <span class="block text-zinc-400">Áreas: <strong class="text-emerald-400">${item.details.areas_of_interest || 'N/A'}</strong></span>
                            <span class="block text-zinc-400">WhatsApp: <strong class="text-zinc-200">${item.details.phone || 'N/A'}</strong></span>
                            <span class="block text-zinc-400">Disponibilidad: ${item.details.availability || 'N/A'}</span>
                            <span class="block text-zinc-400">Experiencia: ${item.details.experience || 'N/A'}</span>
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
                        <div class="flex items-center gap-3">
                            ${avatarThumb}
                            <div>
                                <span class="block font-bold text-zinc-200 leading-tight">${item.details.name || 'Sin nombre'}</span>
                                <span class="text-[11px] text-zinc-500">${item.created_at}</span>
                            </div>
                        </div>
                    </td>
                    <td class="py-4">${roleTag}</td>
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
            showDashboardAlert("Participante aprobado con éxito.");
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
            showDashboardAlert("Estado actualizado correctamente.");
            renderAdminView();
        }
    } catch (err) {
        console.error("Error de red:", err);
    }
}
