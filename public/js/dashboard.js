// Global state
let currentUser = null;
let brandLogo = "";
let brandGallery = [];
let musicianPhoto = "";
let musicianGallery = [];

// Matriz de Arte - 6 Capítulos Temáticos Sugeridos para Artistas
const MUSICIAN_CHAPTERS = [
    {
        num: 1,
        matrixPhoto: 2,
        title: "El Arsenal & Máquinas (Setup)",
        placeholder: "Describí tus sintetizadores principales, módulos Eurorack, sintetizadores analógicos, pedales o máquinas clave de tu sonido..."
    },
    {
        num: 2,
        matrixPhoto: 3,
        title: "Método & Proceso Creativo",
        placeholder: "Contanos tu flujo de trabajo: improvisación analógica, diseño de sonido desde cero, parches modulares, secuenciación..."
    },
    {
        num: 3,
        matrixPhoto: 4,
        title: "Obra Destacada / Lanzamiento Insignia",
        placeholder: "Tu último álbum, EP, track representativo o el proyecto insignia que venís a presentar a Synth Argentina..."
    },
    {
        num: 4,
        matrixPhoto: 5,
        title: "Influencias & Sonidos de Referencia",
        placeholder: "Discos, artistas de culto, bandas sonoras o estéticas sonoras que han moldeado tu universo musical..."
    },
    {
        num: 5,
        matrixPhoto: 6,
        title: "La Experiencia en Synth Argentina 2026",
        placeholder: "Qué va a vivir el público en tu presentación en vivo: atmósfera sonora, improvisación, visuales reactivas..."
    },
    {
        num: 6,
        matrixPhoto: 7,
        title: "Canales de Conexión & Enlaces Directos",
        placeholder: "Bandcamp, Spotify, YouTube, Instagram, web oficial o plataformas donde escuchar y adquirir tu música..."
    }
];

// Matriz de Arte - 6 Capítulos Temáticos Sugeridos para Marcas / Fabricantes
const BRAND_CHAPTERS = [
    {
        num: 1,
        matrixPhoto: 2,
        title: "Hardware & Instrumentos Destacados",
        placeholder: "Presentá los sintetizadores, módulos Eurorack, pedales o controladores estrella que fabricás..."
    },
    {
        num: 2,
        matrixPhoto: 3,
        title: "Diseño, Circuitos & Filosofía de Fabricación",
        placeholder: "Contanos los secretos de tu ingeniería: diseño analógico, DSP digital, componentes seleccionados, calidez sonora..."
    },
    {
        num: 3,
        matrixPhoto: 4,
        title: "Lanzamiento Insignia / Novedad 2026",
        placeholder: "La última creación o prototipo que los asistentes van a poder probar en exclusiva en tu stand..."
    },
    {
        num: 4,
        matrixPhoto: 5,
        title: "Inspiración & Trayectoria en la Luthería",
        placeholder: "El origen de la marca, los clásicos que te inspiraron y la visión de la luthería electrónica nacional..."
    },
    {
        num: 5,
        matrixPhoto: 6,
        title: "La Experiencia en Synth Argentina 2026",
        placeholder: "Qué vas a ofrecer a quienes visiten tu stand: demostraciones interactivas, pruebas de sonido, charlas de armado..."
    },
    {
        num: 6,
        matrixPhoto: 7,
        title: "Canales de Venta & Contacto Directo",
        placeholder: "Tienda online, Instagram, distribuidores oficiales, WhatsApp o catálogo digital de productos..."
    }
];

function parseGalleryToSlots(galleryRaw) {
    const slots = Array.from({ length: 6 }, () => ({ image: "", caption: "" }));
    if (!Array.isArray(galleryRaw)) return slots;
    galleryRaw.slice(0, 6).forEach((item, idx) => {
        if (typeof item === "string") {
            slots[idx] = { image: item, caption: "" };
        } else if (item && typeof item === "object") {
            const targetIdx = (item.chapter && item.chapter >= 1 && item.chapter <= 6) ? (item.chapter - 1) : idx;
            slots[targetIdx] = {
                image: item.image || "",
                caption: item.caption || ""
            };
        }
    });
    return slots;
}

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
        brandGallery = parseGalleryToSlots(prof.gallery_images);
    } else {
        brandLogo = "";
        brandGallery = parseGalleryToSlots([]);
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

function triggerChapterUpload(role, index) {
    const input = document.getElementById(`${role}-chapter-file-${index}`);
    if (input) input.click();
}

async function handleSingleChapterUpload(role, index, event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
        const compressed = await compressImage(file, 1200, 1200, 0.78);
        if (role === "brand") {
            if (!brandGallery[index]) brandGallery[index] = { image: "", caption: "" };
            brandGallery[index].image = compressed;
            renderBrandGallery();
        } else {
            if (!musicianGallery[index]) musicianGallery[index] = { image: "", caption: "" };
            musicianGallery[index].image = compressed;
            renderMusicianGallery();
        }
        showDashboardAlert(`¡Foto cargada para el Capítulo ${index + 1}!`);
    } catch (e) {
        showDashboardAlert("Error al procesar la foto", "error");
    } finally {
        event.target.value = "";
    }
}

function updateChapterCaption(role, index, value) {
    if (role === "brand") {
        if (!brandGallery[index]) brandGallery[index] = { image: "", caption: "" };
        brandGallery[index].caption = value;
    } else {
        if (!musicianGallery[index]) musicianGallery[index] = { image: "", caption: "" };
        musicianGallery[index].caption = value;
    }
}

function removeBrandChapterImage(index) {
    if (brandGallery[index]) {
        brandGallery[index].image = "";
        renderBrandGallery();
    }
}

function removeMusicianChapterImage(index) {
    if (musicianGallery[index]) {
        musicianGallery[index].image = "";
        renderMusicianGallery();
    }
}

function renderBrandGallery() {
    const grid = document.getElementById("brand-gallery-grid");
    const countEl = document.getElementById("brand-gallery-count");
    if (!grid) return;

    const loadedCount = brandGallery.filter(s => s && s.image).length;
    if (countEl) countEl.textContent = `${loadedCount} / 6 fotos`;
    grid.innerHTML = "";

    BRAND_CHAPTERS.forEach((ch, idx) => {
        const slot = brandGallery[idx] || { image: "", caption: "" };
        const hasImg = Boolean(slot.image && slot.image.trim() !== "");

        const card = document.createElement("div");
        card.className = "border border-zinc-800 bg-zinc-900/80 p-4 rounded-xl space-y-3 transition hover:border-zinc-700 shadow-sm";
        card.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-sky-400 px-2 py-0.5 rounded border border-zinc-700">
                        Capítulo ${ch.num} · Foto ${ch.matrixPhoto} en Matriz
                    </span>
                    <h4 class="text-xs font-bold text-zinc-200">${ch.title}</h4>
                </div>
                <div>
                    ${hasImg 
                        ? '<span class="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">✅ Foto lista</span>'
                        : '<span class="text-[10px] text-zinc-500 font-medium bg-zinc-950/60 border border-zinc-800 px-2 py-0.5 rounded flex items-center gap-1">📷 Sin imagen</span>'
                    }
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
                <div class="sm:col-span-1 flex flex-col items-center">
                    ${hasImg ? `
                        <div class="relative w-full aspect-square rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 group">
                            <img src="${slot.image}" class="w-full h-full object-cover cursor-pointer hover:scale-105 transition" onclick="openLightbox('${slot.image}', '${ch.title}')" alt="${ch.title}">
                            <button type="button" onclick="removeBrandChapterImage(${idx})" title="Eliminar foto" class="absolute top-1 right-1 bg-black/80 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold transition">✕</button>
                        </div>
                        <button type="button" onclick="triggerChapterUpload('brand', ${idx})" class="mt-2 text-[11px] text-zinc-400 hover:text-sky-400 underline transition">Cambiar foto</button>
                    ` : `
                        <div onclick="triggerChapterUpload('brand', ${idx})" class="w-full aspect-square rounded-lg border-2 border-dashed border-zinc-700 hover:border-sky-500 hover:bg-sky-950/20 flex flex-col items-center justify-center text-zinc-400 hover:text-sky-400 cursor-pointer transition p-2 text-center group">
                            <span class="text-2xl group-hover:scale-110 transition-transform">📷</span>
                            <span class="text-[11px] font-semibold mt-1">Subir foto</span>
                        </div>
                    `}
                    <input type="file" id="brand-chapter-file-${idx}" accept="image/*" class="hidden" onchange="handleSingleChapterUpload('brand', ${idx}, event)">
                </div>
                <div class="sm:col-span-3 flex flex-col">
                    <label class="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Ficha Frecuencia (Texto revelado al mantener presionado 1,5 seg)
                    </label>
                    <textarea id="brand-chapter-caption-${idx}" rows="3" placeholder="${ch.placeholder}" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-sky-500 text-zinc-200" oninput="updateChapterCaption('brand', ${idx}, this.value)">${slot.caption || ""}</textarea>
                    <p class="text-[10px] text-zinc-500 mt-1">💡 Sugerencia: ${ch.placeholder}</p>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function handleBrandGalleryUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let addedCount = 0;
    for (const file of Array.from(files)) {
        const emptyIdx = brandGallery.findIndex(s => !s.image || s.image.trim() === "");
        if (emptyIdx === -1) break;
        try {
            const compressed = await compressImage(file, 1200, 1200, 0.78);
            brandGallery[emptyIdx].image = compressed;
            addedCount++;
        } catch (e) {
            console.error("Error al procesar foto:", e);
        }
    }

    renderBrandGallery();
    event.target.value = "";

    if (addedCount === 0) {
        showDashboardAlert("Todos los 6 capítulos ya tienen foto. Podés cambiar fotos de forma individual en cada capítulo.", "warning");
    } else {
        showDashboardAlert(`¡${addedCount} foto(s) asignada(s) a los capítulos disponibles!`);
    }
}

async function saveBrandProfile(event) {
    event.preventDefault();
    const payloadGallery = brandGallery
        .map((s, idx) => ({
            chapter: idx + 1,
            title: BRAND_CHAPTERS[idx].title,
            image: s.image || "",
            caption: s.caption || ""
        }))
        .filter(s => s.image && s.image.trim() !== "");

    const payload = {
        brand_name: document.getElementById("brand-name").value.trim(),
        description: document.getElementById("brand-desc").value.trim(),
        website: document.getElementById("brand-website").value.trim(),
        logo_url: brandLogo,
        gallery_images: payloadGallery,
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
        musicianGallery = parseGalleryToSlots(prof.gallery_images);
    } else {
        musicianPhoto = "";
        musicianGallery = parseGalleryToSlots([]);
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

    const loadedCount = musicianGallery.filter(s => s && s.image).length;
    if (countEl) countEl.textContent = `${loadedCount} / 6 fotos`;
    grid.innerHTML = "";

    MUSICIAN_CHAPTERS.forEach((ch, idx) => {
        const slot = musicianGallery[idx] || { image: "", caption: "" };
        const hasImg = Boolean(slot.image && slot.image.trim() !== "");

        const card = document.createElement("div");
        card.className = "border border-zinc-800 bg-zinc-900/80 p-4 rounded-xl space-y-3 transition hover:border-zinc-700 shadow-sm";
        card.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-purple-400 px-2 py-0.5 rounded border border-zinc-700">
                        Capítulo ${ch.num} · Foto ${ch.matrixPhoto} en Matriz
                    </span>
                    <h4 class="text-xs font-bold text-zinc-200">${ch.title}</h4>
                </div>
                <div>
                    ${hasImg 
                        ? '<span class="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">✅ Foto lista</span>'
                        : '<span class="text-[10px] text-zinc-500 font-medium bg-zinc-950/60 border border-zinc-800 px-2 py-0.5 rounded flex items-center gap-1">📷 Sin imagen</span>'
                    }
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
                <div class="sm:col-span-1 flex flex-col items-center">
                    ${hasImg ? `
                        <div class="relative w-full aspect-square rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 group">
                            <img src="${slot.image}" class="w-full h-full object-cover cursor-pointer hover:scale-105 transition" onclick="openLightbox('${slot.image}', '${ch.title}')" alt="${ch.title}">
                            <button type="button" onclick="removeMusicianChapterImage(${idx})" title="Eliminar foto" class="absolute top-1 right-1 bg-black/80 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold transition">✕</button>
                        </div>
                        <button type="button" onclick="triggerChapterUpload('musician', ${idx})" class="mt-2 text-[11px] text-zinc-400 hover:text-purple-400 underline transition">Cambiar foto</button>
                    ` : `
                        <div onclick="triggerChapterUpload('musician', ${idx})" class="w-full aspect-square rounded-lg border-2 border-dashed border-zinc-700 hover:border-purple-500 hover:bg-purple-950/20 flex flex-col items-center justify-center text-zinc-400 hover:text-purple-400 cursor-pointer transition p-2 text-center group">
                            <span class="text-2xl group-hover:scale-110 transition-transform">📷</span>
                            <span class="text-[11px] font-semibold mt-1">Subir foto</span>
                        </div>
                    `}
                    <input type="file" id="musician-chapter-file-${idx}" accept="image/*" class="hidden" onchange="handleSingleChapterUpload('musician', ${idx}, event)">
                </div>
                <div class="sm:col-span-3 flex flex-col">
                    <label class="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Ficha Frecuencia (Texto revelado al mantener presionado 1,5 seg)
                    </label>
                    <textarea id="musician-chapter-caption-${idx}" rows="3" placeholder="${ch.placeholder}" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-zinc-200" oninput="updateChapterCaption('musician', ${idx}, this.value)">${slot.caption || ""}</textarea>
                    <p class="text-[10px] text-zinc-500 mt-1">💡 Sugerencia: ${ch.placeholder}</p>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function handleMusicianGalleryUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let addedCount = 0;
    for (const file of Array.from(files)) {
        const emptyIdx = musicianGallery.findIndex(s => !s.image || s.image.trim() === "");
        if (emptyIdx === -1) break;
        try {
            const compressed = await compressImage(file, 1200, 1200, 0.78);
            musicianGallery[emptyIdx].image = compressed;
            addedCount++;
        } catch (e) {
            console.error("Error al procesar foto:", e);
        }
    }

    renderMusicianGallery();
    event.target.value = "";

    if (addedCount === 0) {
        showDashboardAlert("Todos los 6 capítulos ya tienen foto. Podés cambiar fotos de forma individual en cada capítulo.", "warning");
    } else {
        showDashboardAlert(`¡${addedCount} foto(s) asignada(s) a los capítulos de la galería!`);
    }
}

async function saveMusicianProfile(event) {
    event.preventDefault();
    const payloadGallery = musicianGallery
        .map((s, idx) => ({
            chapter: idx + 1,
            title: MUSICIAN_CHAPTERS[idx].title,
            image: s.image || "",
            caption: s.caption || ""
        }))
        .filter(s => s.image && s.image.trim() !== "");

    const payload = {
        artist_name: document.getElementById("musician-name").value.trim(),
        genre: document.getElementById("musician-genre").value.trim(),
        bio: document.getElementById("musician-bio").value.trim(),
        links: document.getElementById("musician-links").value.trim(),
        photo_url: musicianPhoto,
        gallery_images: payloadGallery,
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
            const surveyStat = document.getElementById("stat-surveys");
            if (surveyStat) surveyStat.textContent = stats.total_surveys || 0;
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
                            const imgSrc = (typeof img === "object" && img) ? (img.image || "") : img;
                            const imgCap = (typeof img === "object" && img && img.caption) ? img.caption : (item.details.name || `Foto ${gIdx+1}`);
                            if (imgSrc) {
                                gHtml += `<img src="${imgSrc}" onclick="openLightbox('${imgSrc}', '${imgCap.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded-lg object-cover border border-zinc-700 hover:border-sky-400 cursor-pointer transition transform hover:scale-110 shadow-sm" title="Ver imagen">`;
                            }
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
                            const imgSrc = (typeof img === "object" && img) ? (img.image || "") : img;
                            const imgCap = (typeof img === "object" && img && img.caption) ? img.caption : (item.details.name || `Setup ${gIdx+1}`);
                            if (imgSrc) {
                                gHtml += `<img src="${imgSrc}" onclick="openLightbox('${imgSrc}', '${imgCap.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded-lg object-cover border border-zinc-700 hover:border-purple-400 cursor-pointer transition transform hover:scale-110 shadow-sm" title="Ver imagen">`;
                            }
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

    // 3. Cargar Respuestas de Encuesta Comunitaria
    await loadAdminSurveyResults();
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

// --- Survey Results Admin Handlers ---
window.adminSurveyResponses = [];

async function loadAdminSurveyResults() {
    const tbody = document.getElementById("survey-responses-tbody");
    const statSurveys = document.getElementById("stat-surveys");
    const summaryCards = document.getElementById("survey-summary-cards");
    
    try {
        const res = await fetch("/admin/survey-results");
        if (!res.ok) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-zinc-500">No se pudieron cargar los resultados de la encuesta.</td></tr>`;
            return;
        }

        const data = await res.json();
        const total = data.total || 0;
        const responses = data.responses || [];
        window.adminSurveyResponses = responses;

        if (statSurveys) statSurveys.textContent = total;

        if (!tbody) return;

        if (responses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-zinc-500">Todavía no hay respuestas registradas en la encuesta comunitaria.</td></tr>`;
            if (summaryCards) summaryCards.classList.add("hidden");
            return;
        }

        // Metrics aggregation
        const committeeCounts = {};
        const durationCounts = {};
        const accessCounts = {};

        responses.forEach(r => {
            if (r.first_committee) committeeCounts[r.first_committee] = (committeeCounts[r.first_committee] || 0) + 1;
            if (r.duration) durationCounts[r.duration] = (durationCounts[r.duration] || 0) + 1;
            if (r.access_model) accessCounts[r.access_model] = (accessCounts[r.access_model] || 0) + 1;
        });

        const getTopKey = (obj) => {
            const keys = Object.keys(obj);
            if (keys.length === 0) return "-";
            return keys.reduce((a, b) => obj[a] > obj[b] ? a : b);
        };

        const topCommittee = getTopKey(committeeCounts);
        const topDuration = getTopKey(durationCounts);
        const topAccess = getTopKey(accessCounts);

        if (summaryCards) {
            summaryCards.classList.remove("hidden");
            const elTopComm = document.getElementById("survey-top-committee");
            const elTopDur = document.getElementById("survey-top-duration");
            const elTopAcc = document.getElementById("survey-top-access");
            if (elTopComm) elTopComm.textContent = topCommittee || "-";
            if (elTopDur) elTopDur.textContent = topDuration || "-";
            if (elTopAcc) elTopAcc.textContent = topAccess || "-";
        }

        tbody.innerHTML = "";
        responses.forEach((resp, idx) => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-zinc-800/30 transition border-b border-zinc-800/60";

            // Contact string
            let contactInfo = `<div class="font-bold text-zinc-100">${escapeHtml(resp.full_name || "Anónimo")}</div>`;
            contactInfo += `<div class="text-xs text-sky-400 font-mono">${escapeHtml(resp.email || "")}</div>`;
            if (resp.phone) {
                contactInfo += `<div class="text-[11px] text-zinc-400">📱 ${escapeHtml(resp.phone)}</div>`;
            }

            // Role / link
            const roleBadge = resp.role_relationship 
                ? `<span class="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-950/60 text-amber-300 border border-amber-800/50">${escapeHtml(resp.role_relationship)}</span>`
                : `<span class="text-zinc-500 text-xs">-</span>`;

            // Committees
            let commHtml = `<div class="text-xs font-semibold text-zinc-200">1° ${escapeHtml(resp.first_committee || 'N/A')}</div>`;
            if (resp.second_committee) {
                commHtml += `<div class="text-[11px] text-zinc-400">2° ${escapeHtml(resp.second_committee)}</div>`;
            }

            // Priority tasks
            let tasksHtml = '<span class="text-zinc-500 text-xs">Sin especificar</span>';
            if (Array.isArray(resp.priority_tasks) && resp.priority_tasks.length > 0) {
                tasksHtml = `<ul class="list-disc list-inside text-xs text-zinc-300 space-y-0.5">` + 
                    resp.priority_tasks.slice(0, 2).map(t => `<li class="truncate max-w-xs" title="${escapeHtml(t)}">${escapeHtml(t)}</li>`).join('') +
                    (resp.priority_tasks.length > 2 ? `<li class="text-[10px] text-amber-400 font-semibold">+${resp.priority_tasks.length - 2} más...</li>` : '') +
                    `</ul>`;
            }

            tr.innerHTML = `
                <td class="py-3.5 pr-3">${contactInfo}</td>
                <td class="py-3.5 pr-3">${roleBadge}</td>
                <td class="py-3.5 pr-3">${commHtml}</td>
                <td class="py-3.5 pr-3">${tasksHtml}</td>
                <td class="py-3.5 pr-3 text-xs text-zinc-400 whitespace-nowrap">${resp.created_at || '-'}</td>
                <td class="py-3.5 text-right whitespace-nowrap">
                    <button type="button" onclick="openSurveyDetailModal(${idx})" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800/70 transition shadow-sm">
                        Ver Respuestas
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Error al cargar respuestas de la encuesta:", err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-rose-400">Error al cargar datos de encuesta.</td></tr>`;
    }
}

function openSurveyDetailModal(index) {
    const item = window.adminSurveyResponses[index];
    if (!item) return;

    const modal = document.getElementById("survey-detail-modal");
    const title = document.getElementById("survey-modal-title");
    const subtitle = document.getElementById("survey-modal-subtitle");
    const body = document.getElementById("survey-modal-body");

    title.textContent = `Encuesta: ${item.full_name || "Participante"}`;
    subtitle.textContent = `Registrada el ${item.created_at || 'Fecha desconocida'} • ${item.email || ''} ${item.phone ? '• Tel: ' + item.phone : ''}`;

    const renderList = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return '<span class="text-zinc-500 italic">No especificado</span>';
        return `<ul class="list-disc list-inside space-y-1 text-zinc-200">${arr.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
    };

    body.innerHTML = `
        <!-- Bloque Contacto & Rol -->
        <div class="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
            <h4 class="text-xs uppercase font-extrabold tracking-wider text-amber-400 mb-2">👤 Datos & Rol en la Comunidad</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div><span class="text-zinc-400">Nombre:</span> <strong class="text-zinc-200">${escapeHtml(item.full_name || '')}</strong></div>
                <div><span class="text-zinc-400">Email:</span> <strong class="text-zinc-200">${escapeHtml(item.email || '')}</strong></div>
                <div><span class="text-zinc-400">Teléfono:</span> <strong class="text-zinc-200">${escapeHtml(item.phone || 'N/A')}</strong></div>
                <div><span class="text-zinc-400">Vínculo / Rol:</span> <strong class="text-zinc-200">${escapeHtml(item.role_relationship || 'N/A')}</strong></div>
                <div class="sm:col-span-2"><span class="text-zinc-400">Redes / Web:</span> ${item.social_link ? `<a href="${escapeHtml(item.social_link)}" target="_blank" class="text-sky-400 underline">${escapeHtml(item.social_link)}</a>` : '<span class="text-zinc-500">N/A</span>'}</div>
            </div>
        </div>

        <!-- Bloque 1: Visión -->
        <div class="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 space-y-2">
            <h4 class="text-xs uppercase font-extrabold tracking-wider text-amber-400">1. ¿Qué queremos que sea SYNTH ARGENTINA?</h4>
            <div class="text-xs text-zinc-300">
                <span class="text-zinc-400 font-semibold block mb-1">Pilares de identidad votados:</span>
                ${renderList(item.vision_core)}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div><span class="text-zinc-400">Modelo de acceso:</span> <strong class="text-zinc-200">${escapeHtml(item.access_model || 'N/A')}</strong></div>
                <div><span class="text-zinc-400">Periodicidad:</span> <strong class="text-zinc-200">${escapeHtml(item.frequency || 'N/A')}</strong></div>
            </div>
        </div>

        <!-- Bloque 2: Escala -->
        <div class="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 space-y-2">
            <h4 class="text-xs uppercase font-extrabold tracking-wider text-amber-400">2. Escala de la 1ª Edición</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div><span class="text-zinc-400">Duración:</span> <strong class="text-zinc-200">${escapeHtml(item.duration || 'N/A')}</strong></div>
                <div><span class="text-zinc-400">Convocatoria esperada:</span> <strong class="text-zinc-200">${escapeHtml(item.attendance_scale || 'N/A')}</strong></div>
                <div><span class="text-zinc-400">Cantidad de stands:</span> <strong class="text-zinc-200">${escapeHtml(item.stands_count || 'N/A')}</strong></div>
            </div>
            <div class="text-xs text-zinc-300 pt-1">
                <span class="text-zinc-400 font-semibold block mb-1">Tipo de espacio / locación:</span>
                ${renderList(item.venue_type)}
            </div>
        </div>

        <!-- Bloque 3: Involucramiento -->
        <div class="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 space-y-2">
            <h4 class="text-xs uppercase font-extrabold tracking-wider text-amber-400">3. Involucramiento en la Organización</h4>
            <div class="text-xs">
                <span class="text-zinc-400">Nivel de compromiso:</span> <strong class="text-zinc-200">${escapeHtml(item.involvement_level || 'N/A')}</strong>
            </div>
            <div class="text-xs text-zinc-300">
                <span class="text-zinc-400 font-semibold block mb-1">Disponibilidad horaria:</span>
                ${renderList(item.availability_slots)}
            </div>
        </div>

        <!-- Bloque 4: Aportes -->
        <div class="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 space-y-2">
            <h4 class="text-xs uppercase font-extrabold tracking-wider text-amber-400">4. Aportes, Habilidades y Equipamiento</h4>
            <div class="text-xs text-zinc-300">
                <span class="text-zinc-400 font-semibold block mb-1">Habilidades profesionales ofrecidas:</span>
                ${renderList(item.skills)}
            </div>
            <div class="text-xs text-zinc-300 pt-1">
                <span class="text-zinc-400 font-semibold block mb-1">Equipamiento o recursos materiales:</span>
                ${renderList(item.equipment_resources)}
            </div>
            ${item.equipment_details ? `<div class="text-xs text-zinc-300 pt-1"><span class="text-zinc-400 font-semibold">Detalle de equipamiento:</span> <p class="mt-1 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-zinc-200">${escapeHtml(item.equipment_details)}</p></div>` : ''}
        </div>

        <!-- Bloque 5: Comisiones -->
        <div class="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 space-y-2">
            <h4 class="text-xs uppercase font-extrabold tracking-wider text-amber-400">5. División de Áreas de Trabajo</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div><span class="text-zinc-400">1ª Comisión de interés:</span> <strong class="text-amber-400 font-bold">${escapeHtml(item.first_committee || 'N/A')}</strong></div>
                <div><span class="text-zinc-400">2ª Comisión alternativa:</span> <strong class="text-zinc-200">${escapeHtml(item.second_committee || 'N/A')}</strong></div>
            </div>
            <div class="text-xs text-zinc-300 pt-1">
                <span class="text-zinc-400 font-semibold block mb-1">Herramientas de coordinación sugeridas:</span>
                ${renderList(item.coordination_tools)}
            </div>
        </div>

        <!-- Bloque 6: Tareas Prioritarias -->
        <div class="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 space-y-2">
            <h4 class="text-xs uppercase font-extrabold tracking-wider text-amber-400">6. Prioridad Sprint Inicial & Sugerencias</h4>
            <div class="text-xs text-zinc-300">
                <span class="text-zinc-400 font-semibold block mb-1">Top 3 tareas prioritarias seleccionadas:</span>
                ${renderList(item.priority_tasks)}
            </div>
            ${item.ideas_suggestions ? `<div class="text-xs text-zinc-300 pt-1"><span class="text-zinc-400 font-semibold">Ideas y comentarios adicionales:</span> <p class="mt-1 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-zinc-200 italic whitespace-pre-wrap">"${escapeHtml(item.ideas_suggestions)}"</p></div>` : ''}
        </div>
    `;

    modal.classList.remove("hidden");
}

function closeSurveyDetailModal() {
    const modal = document.getElementById("survey-detail-modal");
    if (modal) modal.classList.add("hidden");
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
