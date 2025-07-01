// Profile page functionality
document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = "login.html"
    return
  }

  // Initialize profile page
  init()
})

async function init() {
  await loadUserProfile()
  await loadUserPosts()
  setupEventListeners()
  setupTabs()
}

function setupEventListeners() {
  // Edit profile button
  const editProfileBtn = document.querySelector(".edit-profile-btn")
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", openEditProfileModal)
  }

  // Edit profile form
  const editProfileForm = document.getElementById("edit-profile-form")
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", handleUpdateProfile)
  }

  // Modal controls
  const closeModalBtns = document.querySelectorAll(".close-modal")
  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", closeModals)
  })

  const cancelEditBtn = document.getElementById("cancel-edit-btn")
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", closeModals)
  }

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeModals()
    }
  })
}

function setupTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab

      // Update active tab button
      tabBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")

      // Update active tab content
      tabContents.forEach((content) => {
        content.classList.remove("active")
        if (content.id === `${targetTab}-tab`) {
          content.classList.add("active")
        }
      })

      // Load tab-specific content
      if (targetTab === "history") {
        loadActivityHistory()
      }
    })
  })
}

async function loadUserProfile() {
  try {
    const response = await authenticatedFetch("api/user/profile.php")
    const user = await response.json()

    if (response.ok) {
      updateProfileDisplay(user)
    } else {
      showNotification("Gagal memuat profil: " + user.error, "error")
    }
  } catch (error) {
    console.error("Error loading profile:", error)
    showNotification("Gagal memuat profil", "error")
  }
}

function updateProfileDisplay(user) {
  // Update profile header
  const profileName = document.getElementById("profile-name")
  const profileNim = document.getElementById("profile-nim")
  const profileEmail = document.getElementById("profile-email")
  const profileAvatar = document.getElementById("profile-avatar")

  if (profileName) {
    profileName.textContent = `${user.first_name} ${user.last_name}`
  }

  if (profileNim) {
    profileNim.textContent = `NIM: ${user.nim}`
  }

  if (profileEmail) {
    profileEmail.textContent = user.email
  }

  if (profileAvatar && user.avatar) {
    profileAvatar.src = `uploads/avatars/${user.avatar}`
  }

  // Store user data for editing
  window.currentUserData = user
}

async function loadUserPosts() {
  try {
    const response = await authenticatedFetch("api/user/my-posts.php")
    const data = await response.json()

    if (response.ok) {
      displayUserPosts(data)
      updateStatistics(data)
    } else {
      showNotification("Gagal memuat postingan: " + data.error, "error")
    }
  } catch (error) {
    console.error("Error loading posts:", error)
    showNotification("Gagal memuat postingan", "error")
  }
}

function displayUserPosts(data) {
  // Display Lost & Found items
  const lostFoundContainer = document.getElementById("my-lost-found")
  if (lostFoundContainer && data.lost_found) {
    if (data.lost_found.length === 0) {
      lostFoundContainer.innerHTML = createEmptyState("lost-found")
    } else {
      lostFoundContainer.innerHTML = data.lost_found.map((item) => createProfileItemCard(item, "lost-found")).join("")
    }
  }

  // Display Activities
  const activitiesContainer = document.getElementById("my-activities")
  if (activitiesContainer && data.activities) {
    if (data.activities.length === 0) {
      activitiesContainer.innerHTML = createEmptyState("activities")
    } else {
      activitiesContainer.innerHTML = data.activities
        .map((activity) => createProfileItemCard(activity, "activity"))
        .join("")
    }
  }
}

function createProfileItemCard(item, type) {
  const isLostFound = type === "lost-found"
  const statusClass = isLostFound ? `status-${item.type}` : "status-active"
  const statusText = isLostFound ? (item.type === "hilang" ? "Hilang" : "Ditemukan") : "Aktif"

  const dateText = isLostFound
    ? new Date(item.date_occurred).toLocaleDateString("id-ID")
    : `${item.formatted_date} ${item.formatted_time}`

  return `
        <div class="profile-item" data-id="${item.id}" data-type="${type}">
            <div class="item-actions-overlay">
                <button class="action-btn edit-btn" onclick="editItem('${item.id}', '${type}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteItem('${item.id}', '${type}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="item-image">
                ${
                  item.image
                    ? `<img src="${item.image}" alt="${item.title}">`
                    : `<i class="fas fa-${isLostFound ? "search" : "calendar-alt"}"></i>`
                }
                <div class="item-status ${statusClass}">
                    ${statusText}
                </div>
            </div>
            
            <div class="item-content">
                <div class="item-category">
                    ${item.category_name}
                </div>
                <h3 class="item-title">${item.title}</h3>
                <div class="item-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${dateText}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${item.location}</span>
                    </div>
                </div>
                <p class="item-description">${item.description}</p>
            </div>
        </div>
    `
}

function createEmptyState(type) {
  const isLostFound = type === "lost-found"
  return `
        <div class="empty-state">
            <i class="fas fa-${isLostFound ? "search" : "calendar-times"}"></i>
            <h3>Belum Ada ${isLostFound ? "Laporan" : "Kegiatan"}</h3>
            <p>Anda belum membuat ${isLostFound ? "laporan lost & found" : "kegiatan"} apapun</p>
            <a href="${isLostFound ? "lost-found.html" : "activities.html"}" class="btn-primary">
                <i class="fas fa-plus"></i>
                Tambah ${isLostFound ? "Laporan" : "Kegiatan"}
            </a>
        </div>
    `
}

function updateStatistics(data) {
  const lostFoundCount = document.getElementById("lost-found-count")
  const activitiesCount = document.getElementById("activities-count")
  const resolvedCount = document.getElementById("resolved-count")

  if (lostFoundCount && data.lost_found) {
    lostFoundCount.textContent = data.lost_found.length
  }

  if (activitiesCount && data.activities) {
    activitiesCount.textContent = data.activities.length
  }

  if (resolvedCount && data.lost_found) {
    const resolved = data.lost_found.filter((item) => item.status === "selesai").length
    resolvedCount.textContent = resolved
  }
}

function openEditProfileModal() {
  const modal = document.getElementById("edit-profile-modal")
  if (modal && window.currentUserData) {
    // Populate form with current data
    const form = document.getElementById("edit-profile-form")
    form.querySelector("#edit-first-name").value = window.currentUserData.first_name
    form.querySelector("#edit-last-name").value = window.currentUserData.last_name
    form.querySelector("#edit-email").value = window.currentUserData.email
    form.querySelector("#edit-phone").value = window.currentUserData.phone

    modal.classList.add("active")
  }
}

async function handleUpdateProfile(e) {
  e.preventDefault()

  const form = e.target
  const submitBtn = form.querySelector('button[type="submit"]')
  const formData = new FormData(form)

  // Show loading state
  submitBtn.classList.add("loading")
  submitBtn.disabled = true

  try {
    const response = await authenticatedFetch("api/user/profile.php", {
      method: "PUT",
      body: JSON.stringify({
        first_name: formData.get("firstName"),
        last_name: formData.get("lastName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
      }),
    })

    const data = await response.json()

    if (response.ok) {
      showNotification("Profil berhasil diperbarui", "success")
      closeModals()

      // Reload profile
      await loadUserProfile()

      // Update stored user data
      const currentUser = getCurrentUser()
      currentUser.first_name = formData.get("firstName")
      currentUser.last_name = formData.get("lastName")
      currentUser.email = formData.get("email")
      currentUser.phone = formData.get("phone")
      localStorage.setItem("user_data", JSON.stringify(currentUser))
    } else {
      showNotification(data.error || "Gagal memperbarui profil", "error")
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    showNotification("Terjadi kesalahan saat memperbarui profil", "error")
  } finally {
    // Remove loading state
    submitBtn.classList.remove("loading")
    submitBtn.disabled = false
  }
}

async function editItem(id, type) {
  // Redirect to appropriate page with edit mode
  const page = type === "lost-found" ? "lost-found.html" : "activities.html"
  window.location.href = `${page}?edit=${id}`
}

async function deleteItem(id, type) {
  if (!confirm("Apakah Anda yakin ingin menghapus item ini?")) {
    return
  }

  try {
    const endpoint = type === "lost-found" ? "api/lost-found/delete.php" : "api/activities/delete.php"

    const response = await authenticatedFetch(endpoint, {
      method: "DELETE",
      body: JSON.stringify({ id: id }),
    })

    const data = await response.json()

    if (response.ok) {
      showNotification("Item berhasil dihapus", "success")

      // Reload posts
      await loadUserPosts()
    } else {
      showNotification(data.error || "Gagal menghapus item", "error")
    }
  } catch (error) {
    console.error("Error deleting item:", error)
    showNotification("Terjadi kesalahan saat menghapus item", "error")
  }
}

async function loadActivityHistory() {
  // This would load activity logs from the server
  // For now, we'll show a placeholder
  const historyContainer = document.getElementById("activity-history")
  if (historyContainer) {
    historyContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>Riwayat Aktivitas</h3>
                <p>Fitur riwayat aktivitas akan segera tersedia</p>
            </div>
        `
  }
}

function closeModals() {
  const modals = document.querySelectorAll(".modal")
  modals.forEach((modal) => {
    modal.classList.remove("active")
  })
}

// Global functions
window.editItem = editItem
window.deleteItem = deleteItem
