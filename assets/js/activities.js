// Activities page functionality - Complete implementation
document.addEventListener("DOMContentLoaded", () => {
  // Setup event listeners untuk cards yang sudah ada dari PHP
  setupExistingCards()

  // Setup modal functionality
  setupModalHandlers()

  // Setup form handlers
  setupFormHandlers()

  // Handle PHP messages
  handlePhpMessages()

  // DOM elements
  const activitiesContainer = document.querySelector(".grid-container")
  const searchInput = document.querySelector('input[name="search"]')
  const categoryFilter = document.querySelector('select[name="category"]')
  const addButton = document.querySelector(".add-button")
  const addModal = document.getElementById("add-modal")
  const detailModal = document.getElementById("detail-modal")
  const addForm = document.querySelector(".modal-form")
  const filterForm = document.querySelector(".filter-bar")

  // Modal controls
  const closeModalBtns = document.querySelectorAll(".close-modal")

  let currentActivities = []
  const searchTimeout = null

  // Initialize page
  init()

  function init() {
    // Load initial data
    handleLiveSearch()
    setupEventListeners()
  }

  function setupEventListeners() {
    // Live search functionality
    if (searchInput) {
      searchInput.addEventListener("input", debounce(handleLiveSearch, 300))
    }

    // Live filter functionality
    if (categoryFilter) {
      categoryFilter.addEventListener("change", handleLiveSearch)
    }

    // Prevent form submission
    if (filterForm) {
      filterForm.addEventListener("submit", (e) => {
        e.preventDefault()
        handleLiveSearch()
      })
    }

    // Modal controls
    if (addButton) {
      addButton.addEventListener("click", openAddModal)
    }

    closeModalBtns.forEach((btn) => {
      btn.addEventListener("click", closeModals)
    })

    // Form submission
    if (addForm) {
      addForm.addEventListener("submit", handleAddActivity)
    }

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        closeModals()
      }
    })
  }

  async function handleLiveSearch() {
    const searchTerm = searchInput ? searchInput.value.trim() : ""
    const category = categoryFilter ? categoryFilter.value : ""

    try {
      showLoading()

      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (category) params.append("category", category)

      const response = await fetch(`api/activities/search.php?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data && Array.isArray(data)) {
        currentActivities = data
        displayActivities(currentActivities)
      } else if (data && data.error) {
        showError("Gagal memuat data: " + data.error)
      } else {
        displayActivities([]) // Show empty state
      }
    } catch (error) {
      console.error("Error in live search:", error)
      showError("Gagal terhubung ke server: " + error.message)
    } finally {
      hideLoading()
    }
  }

  async function loadActivities() {
    try {
      showLoading()
      const response = await fetch("api/activities/search.php")
      const data = await response.json()

      if (response.ok) {
        currentActivities = data
        displayActivities(currentActivities)
      } else {
        showError("Gagal memuat data: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Error loading activities:", error)
      showError("Gagal terhubung ke server")
    } finally {
      hideLoading()
    }
  }

  function displayActivities(activities) {
    if (!activitiesContainer) return

    if (activities.length === 0) {
      activitiesContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-times"></i>
          <h3>Tidak ada kegiatan ditemukan</h3>
          <p>Belum ada kegiatan yang sesuai dengan filter Anda</p>
        </div>
      `
      return
    }

    try {
      const activitiesHTML = activities.map((activity) => createActivityCard(activity)).join("")
      activitiesContainer.innerHTML = activitiesHTML

      // Add event listeners to new cards
      const activityCards = activitiesContainer.querySelectorAll(".activity-item")
      activityCards.forEach((card) => setupCardEvents(card))
    } catch (error) {
      console.error("Error displaying activities:", error)
      showError("Gagal menampilkan data")
    }
  }

  function createActivityCard(activity) {
    const escapedTitle = escapeHtml(activity.title)
    const escapedDescription = escapeHtml(activity.description)
    const escapedCategoryName = escapeHtml(activity.category_name)
    const escapedEventDate = escapeHtml(activity.event_date)
    const escapedEventTime = escapeHtml(activity.event_time)
    const escapedLocation = escapeHtml(activity.location)
    const escapedOrganizer = escapeHtml(activity.organizer)
    const escapedUserName = escapeHtml(activity.user_name)
    const escapedContactInfo = escapeHtml(activity.contact_info)
    const escapedImage = escapeHtml(activity.image || "")
    const escapedCreatedAt = escapeHtml(activity.created_at)

    return `
      <div class="activity-item" data-id="${activity.id}" onclick="showActivityDetail(${activity.id})">
        <div class="activity-image">
          ${
            activity.image
              ? `
            <img src="${activity.image}" alt="${activity.title}">
          `
              : `
            <i class="fas fa-calendar-alt"></i>
          `
          }
          <div class="activity-date">
            <span class="day">${new Date(activity.event_date).getDate()}</span>
            <span class="month">${new Date(activity.event_date).toLocaleDateString("id-ID", { month: "short" })}</span>
          </div>
        </div>
        <div class="activity-content">
          <div class="activity-category">
            ${activity.category_name}
          </div>
          <h3 class="activity-title">${activity.title}</h3>
          <div class="activity-meta">
            <div class="meta-row">
              <i class="fas fa-clock"></i>
              <span>${new Date(activity.event_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}, ${activity.event_time.substring(0, 5)}</span>
            </div>
            <div class="meta-row">
              <i class="fas fa-map-marker-alt"></i>
              <span>${activity.location}</span>
            </div>
            <div class="meta-row">
              <i class="fas fa-user"></i>
              <span>${activity.organizer}</span>
            </div>
          </div>
          <p class="activity-description">${activity.description.length > 150 ? activity.description.substring(0, 150) + "..." : activity.description}</p>
          <div class="activity-organizer">oleh ${activity.user_name}</div>
        </div>

        <!-- Hidden data untuk modal -->
        <script type="application/json" class="activity-data">
          {
            "id": ${activity.id},
            "title": ${JSON.stringify(escapedTitle)},
            "description": ${JSON.stringify(escapedDescription)},
            "category_name": ${JSON.stringify(escapedCategoryName)},
            "event_date": ${JSON.stringify(escapedEventDate)},
            "event_time": ${JSON.stringify(escapedEventTime)},
            "location": ${JSON.stringify(escapedLocation)},
            "organizer": ${JSON.stringify(escapedOrganizer)},
            "user_name": ${JSON.stringify(escapedUserName)},
            "contact_info": ${JSON.stringify(escapedContactInfo)},
            "image": ${JSON.stringify(escapedImage)},
            "created_at": ${JSON.stringify(escapedCreatedAt)}
          }
        </script>
      </div>
    `
  }

  function setupCardEvents(card) {
    // Add hover effects
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-5px)"
    })

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)"
    })
  }

  function openAddModal() {
    if (addModal) {
      addModal.classList.add("active")
    }
  }

  function closeModals() {
    const modals = document.querySelectorAll(".modal")
    modals.forEach((modal) => {
      modal.classList.remove("active")
    })

    // Reset form
    if (addForm) {
      addForm.reset()
      // Hide image preview
      const imagePreview = document.getElementById("image-preview")
      if (imagePreview) {
        imagePreview.style.display = "none"
      }
    }
  }

  async function handleAddActivity(e) {
    // Remove e.preventDefault() to allow natural form submission to PHP
    // Let the form submit naturally to PHP handler
    return true
  }

  function showLoading() {
    if (activitiesContainer) {
      activitiesContainer.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>Memuat data...</p>
        </div>
      `
    }
  }

  function showError(message) {
    if (activitiesContainer) {
      activitiesContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Terjadi Kesalahan</h3>
          <p>${message}</p>
          <button class="btn-primary" onclick="location.reload()">Coba Lagi</button>
        </div>
      `
    }
  }

  function hideLoading() {
    // Hide any existing loading indicators
  }
})

function setupExistingCards() {
  // Setup click events untuk activity cards yang sudah di-render oleh PHP
  const activityCards = document.querySelectorAll(".activity-item")
  activityCards.forEach((card) => {
    // Event sudah ditambahkan via onclick di HTML, jadi kita tidak perlu menambahkan lagi
    // Tapi kita bisa menambahkan hover effects atau hal lain jika diperlukan
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-5px)"
    })

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)"
    })
  })
}

function setupModalHandlers() {
  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.classList.remove("active")
    }
  })

  // Close modal with escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const activeModals = document.querySelectorAll(".modal.active")
      activeModals.forEach((modal) => {
        modal.classList.remove("active")
      })
    }
  })

  // Setup close button handlers
  const closeButtons = document.querySelectorAll(".close-modal")
  closeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const modal = this.closest(".modal")
      if (modal) {
        modal.classList.remove("active")
      }
    })
  })
}

function setupFormHandlers() {
  // Image preview functionality
  const imageInput = document.getElementById("image")
  if (imageInput) {
    imageInput.addEventListener("change", function () {
      window.previewImage(this)
    })
  }

  // Form validation
  const forms = document.querySelectorAll("form")
  forms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      if (!window.validateForm(this)) {
        e.preventDefault()
        return false
      }
    })
  })
}

function handlePhpMessages() {
  // Handle messages passed from PHP
  if (window.phpMessage) {
    const { text, type } = window.phpMessage

    // Show notification instead of alert for better UX
    if (typeof window.showNotification === "function") {
      window.showNotification(text, type)
    } else {
      // Fallback to alert if showNotification is not available
      const icon = type === "success" ? "✅" : "❌"
      alert(icon + " " + text)
    }

    // Clean up
    delete window.phpMessage
  }
}

function validateForm(form) {
  const requiredFields = form.querySelectorAll("[required]")
  let isValid = true

  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      showFieldError(field, "Field ini wajib diisi")
      isValid = false
    } else {
      clearFieldError(field)
    }
  })

  // Validasi khusus untuk tanggal
  const eventDate = form.querySelector("#event_date")
  if (eventDate && eventDate.value) {
    const selectedDate = new Date(eventDate.value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      showFieldError(eventDate, "Tanggal kegiatan tidak boleh di masa lalu")
      isValid = false
    }
  }

  return isValid
}

function showFieldError(field, message) {
  const formGroup = field.closest(".form-group")
  if (!formGroup) return

  formGroup.classList.add("error")

  let errorMessage = formGroup.querySelector(".error-message")
  if (!errorMessage) {
    errorMessage = document.createElement("div")
    errorMessage.className = "error-message"
    formGroup.appendChild(errorMessage)
  }

  errorMessage.textContent = message
  errorMessage.style.display = "block"
}

function clearFieldError(field) {
  const formGroup = field.closest(".form-group")
  if (!formGroup) return

  formGroup.classList.remove("error")

  const errorMessage = formGroup.querySelector(".error-message")
  if (errorMessage) {
    errorMessage.style.display = "none"
  }
}

// Global functions yang dipanggil dari HTML
window.openModal = (modalId) => {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.add("active")

    // Focus ke form pertama jika ada
    const firstInput = modal.querySelector("input, select, textarea")
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100)
    }
  }
}

window.closeModal = (modalId) => {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.remove("active")

    // Reset form jika ada
    const form = modal.querySelector("form")
    if (form) {
      form.reset()

      // Clear form errors
      const errorElements = form.querySelectorAll(".error-message")
      errorElements.forEach((error) => (error.style.display = "none"))

      const formGroups = form.querySelectorAll(".form-group.error")
      formGroups.forEach((group) => group.classList.remove("error"))

      // Hide image preview
      const imagePreview = form.querySelector("#image-preview")
      if (imagePreview) {
        imagePreview.style.display = "none"
      }
    }
  }
}

window.previewImage = (input) => {
  const preview = document.getElementById("image-preview")
  const previewImg = document.getElementById("preview-img")

  if (input.files && input.files[0]) {
    const file = input.files[0]

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if (!validTypes.includes(file.type)) {
      alert("Hanya file gambar (JPG, PNG, GIF) yang diperbolehkan!")
      input.value = ""
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert("Ukuran file terlalu besar! Maksimal 5MB.")
      input.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (previewImg) {
        previewImg.src = e.target.result
      }
      if (preview) {
        preview.style.display = "block"
      }
    }
    reader.readAsDataURL(file)
  }
}

window.removeImage = () => {
  const input = document.getElementById("image")
  const preview = document.getElementById("image-preview")

  if (input) input.value = ""
  if (preview) preview.style.display = "none"
}

window.showActivityDetail = (activityId) => {
  const activityCard = document.querySelector(`[data-id="${activityId}"]`)
  if (!activityCard) return

  const activityDataScript = activityCard.querySelector(".activity-data")
  if (!activityDataScript) return

  try {
    const activityData = JSON.parse(activityDataScript.textContent)

    // Format tanggal dan waktu
    const eventDate = new Date(activityData.event_date)
    const formattedDate = eventDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    const formattedTime = activityData.event_time.substring(0, 5)

    const formattedCreatedAt = new Date(activityData.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    // Buat konten modal
    const modalBody = document.getElementById("detail-modal-body")
    const modalTitle = document.getElementById("detail-modal-title")

    modalTitle.textContent = activityData.title

    modalBody.innerHTML = `
      <div class="activity-detail-content">
        <div class="activity-detail-image-section">
          ${
            activityData.image && activityData.image.trim() !== ""
              ? `
            <div class="activity-detail-image-container">
              <img src="${activityData.image}" 
                   alt="${activityData.title}" 
                   class="activity-detail-image-large"
                   onerror="this.parentElement.innerHTML = '<div class=\\'activity-detail-image-placeholder\\'><i class=\\'fas fa-calendar-alt\\' style=\\'font-size: 5rem; color: white;\\'></i></div>';">
            </div>
          `
              : `
            <div class="activity-detail-image-container no-image">
              <div class="activity-detail-image-placeholder">
                <i class="fas fa-calendar-alt" style="font-size: 5rem; color: white; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);"></i>
              </div>
            </div>
          `
          }
        </div>
        
        <div class="activity-detail-info-section">
          <div class="activity-detail-category">
            <span class="category-badge">${activityData.category_name}</span>
          </div>
          
          <h3 class="activity-detail-title">${activityData.title}</h3>
          
          <div class="activity-detail-meta">
            <div class="meta-row">
              <i class="fas fa-calendar"></i>
              <span><strong>Tanggal:</strong> ${formattedDate}</span>
            </div>
            <div class="meta-row">
              <i class="fas fa-clock"></i>
              <span><strong>Waktu:</strong> ${formattedTime} WIB</span>
            </div>
            <div class="meta-row">
              <i class="fas fa-map-marker-alt"></i>
              <span><strong>Lokasi:</strong> ${activityData.location}</span>
            </div>
            <div class="meta-row">
              <i class="fas fa-users"></i>
              <span><strong>Penyelenggara:</strong> ${activityData.organizer}</span>
            </div>
            <div class="meta-row">
              <i class="fas fa-user"></i>
              <span><strong>Dibuat oleh:</strong> ${activityData.user_name}</span>
            </div>
            <div class="meta-row">
              <i class="fas fa-clock"></i>
              <span><strong>Tanggal Dibuat:</strong> ${formattedCreatedAt}</span>
            </div>
          </div>
          
          <div class="activity-detail-description">
            <h4>Deskripsi:</h4>
            <p>${activityData.description}</p>
          </div>
          
          <div class="activity-detail-actions">
            <a href="https://wa.me/${activityData.contact_info.replace(/[^0-9]/g, "")}" 
               target="_blank" 
               class="contact-btn-large">
              <i class="fab fa-whatsapp"></i>
              Hubungi Penyelenggara
            </a>
            <button class="share-btn" onclick="window.shareActivity('${activityData.title.replace(/'/g, "\\'")}', '${activityData.description.replace(/'/g, "\\'")}')">
              <i class="fas fa-share"></i>
              Bagikan
            </button>
          </div>
        </div>
      </div>
    `

    // Tampilkan modal
    window.openModal("detail-modal")
  } catch (error) {
    console.error("Error parsing activity data:", error)
    alert("Terjadi kesalahan saat menampilkan detail kegiatan.")
  }
}

window.shareActivity = (title, description) => {
  if (navigator.share) {
    navigator.share({
      title: title,
      text: description,
      url: window.location.href,
    })
  } else {
    // Fallback - copy to clipboard
    const text = `${title}\n\n${description}\n\n${window.location.href}`
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Link kegiatan berhasil disalin!")
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement("textarea")
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        alert("Link kegiatan berhasil disalin!")
      })
  }
}

// Utility functions
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatTime(timeString) {
  return timeString.substring(0, 5)
}

// Helper function to escape HTML
function escapeHtml(string) {
  if (typeof string !== "string") {
    return string
  }
  return string.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&":
        return "&amp;"
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case '"':
        return "&quot;"
      case "'":
        return "&#39;"
      default:
        return m
    }
  })
}

// Export utility functions to global scope
window.debounce = debounce
window.formatDate = formatDate
window.formatTime = formatTime
