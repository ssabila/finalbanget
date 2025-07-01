// Activities page functionality
document.addEventListener("DOMContentLoaded", () => { 
  // DOM elements
  const activitiesContainer = document.getElementById("activities-container")
  const searchInput = document.getElementById("search-input")
  const categoryFilter = document.getElementById("category-filter")
  const dateFilter = document.getElementById("date-filter")
  const addButton = document.getElementById("add-button")
  const addModal = document.getElementById("add-modal")
  const detailModal = document.getElementById("detail-modal")
  const addForm = document.getElementById("add-form")

  // Modal controls
  const closeModalBtns = document.querySelectorAll(".close-modal")
  const cancelBtn = document.getElementById("cancel-btn")

  let sampleActivities = [] // Data dari API
  let currentActivities = []

  // Initialize page
  init()

  async function init() {
    await loadActivities()
    setupEventListeners()
    hideLoading()
    initializeAuthState()
  }

  function setupEventListeners() {
    // Search functionality
    if (searchInput) {
      searchInput.addEventListener("input", debounce(filterActivities, 300))
    }

    // Filter functionality
    if (categoryFilter) {
      categoryFilter.addEventListener("change", filterActivities)
    }

    if (dateFilter) {
      dateFilter.addEventListener("change", filterActivities)
    }

    // Modal controls
    if (addButton) {
      addButton.addEventListener("click", openAddModal)
    }

    closeModalBtns.forEach((btn) => {
      btn.addEventListener("click", closeModals)
    })

    if (cancelBtn) {
      cancelBtn.addEventListener("click", closeModals)
    }

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

  // Update the loadActivities function to handle authentication
  async function loadActivities() {
    try {
      showLoading()
      const response = await fetch("api/activities/index.php")
      const data = await response.json()

      if (response.ok) {
        sampleActivities = data
        currentActivities = [...data]
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

    const activitiesHTML = activities.map((activity) => createActivityCard(activity)).join("")
    activitiesContainer.innerHTML = activitiesHTML

    // Add click event listeners to activity cards
    const activityCards = activitiesContainer.querySelectorAll(".activity-item")
    activityCards.forEach((card) => {
      card.addEventListener("click", function () {
        const activityId = this.dataset.id
        showActivityDetail(activityId)
      })
    })
  }

  function createActivityCard(activity) {
    const eventDate = new Date(activity.event_date)
    const day = eventDate.getDate()
    const month = eventDate.toLocaleDateString("id-ID", { month: "short" })
    const formattedDate = eventDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    const formattedTime = activity.event_time.substring(0, 5)

    return `
            <div class="activity-item" data-id="${activity.id}">
                <div class="activity-image">
                    <i class="fas fa-calendar-alt"></i>
                    <div class="activity-date">
                        <span class="day">${day}</span>
                        <span class="month">${month}</span>
                    </div>
                </div>
                <div class="activity-content">
                    <div class="activity-category category-${activity.category}">
                        ${activity.category_name}
                    </div>
                    <h3 class="activity-title">${activity.title}</h3>
                    <div class="activity-meta">
                        <div class="meta-row">
                            <i class="fas fa-clock"></i>
                            <span>${formattedDate}, ${formattedTime}</span>
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
                    <p class="activity-description">${activity.description}</p>
                    <div class="activity-organizer">oleh ${activity.user_name}</div>
                </div>
            </div>
        `
  }

  function filterActivities() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : ""
    const selectedCategory = categoryFilter ? categoryFilter.value : ""
    const selectedDate = dateFilter ? dateFilter.value : ""

    const filtered = sampleActivities.filter((activity) => {
      const matchesSearch =
        activity.title.toLowerCase().includes(searchTerm) ||
        activity.description.toLowerCase().includes(searchTerm) ||
        activity.organizer.toLowerCase().includes(searchTerm)

      const matchesCategory = !selectedCategory || activity.category === selectedCategory

      let matchesDate = true
      if (selectedDate) {
        const activityDate = new Date(activity.event_date)
        const today = new Date()

        switch (selectedDate) {
          case "today":
            matchesDate = activityDate.toDateString() === today.toDateString()
            break
          case "week":
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            matchesDate = activityDate >= today && activityDate <= weekFromNow
            break
          case "month":
            const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
            matchesDate = activityDate >= today && activityDate <= monthFromNow
            break
          case "upcoming":
            matchesDate = activityDate >= today
            break
        }
      }

      return matchesSearch && matchesCategory && matchesDate
    })

    currentActivities = filtered
    displayActivities(filtered)
  }

  function showActivityDetail(activityId) {
    const activity = sampleActivities.find((a) => a.id == activityId)
    if (!activity) return

    const eventDate = new Date(activity.event_date)
    const formattedDate = eventDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    const formattedTime = activity.event_time.substring(0, 5)

    const detailContent = document.getElementById("detail-content")
    const detailTitle = document.getElementById("detail-title")

    if (detailTitle) {
      detailTitle.textContent = activity.title
    }

    if (detailContent) {
      detailContent.innerHTML = `
                <div class="activity-detail-content">
                    <div class="activity-detail-image">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="activity-detail-info">
                        <div class="activity-category category-${activity.category}">
                            ${activity.category_name}
                        </div>
                        <h3>${activity.title}</h3>
                        <div class="activity-detail-meta">
                            <div class="meta-item">
                                <i class="fas fa-calendar"></i>
                                <span>${formattedDate}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <span>${formattedTime} WIB</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${activity.location}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-user"></i>
                                <span>${activity.organizer}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-phone"></i>
                                <span>${activity.contact_info}</span>
                            </div>
                        </div>
                        <div class="activity-detail-description">
                            <p>${activity.description}</p>
                        </div>
                        <div class="activity-detail-actions">
                            <a href="https://wa.me/${activity.contact_info}" target="_blank" class="register-btn">
                                <i class="fab fa-whatsapp"></i>
                                Hubungi Penyelenggara
                            </a>
                            <button class="share-btn" onclick="shareActivity('${activity.title}', '${activity.description}')">
                                <i class="fas fa-share"></i>
                                Bagikan
                            </button>
                        </div>
                    </div>
                </div>
            `
    }

    if (detailModal) {
      detailModal.classList.add("active")
    }
  }

  // Update the openAddModal function to check authentication
  function openAddModal() {
    if (!requireAuth()) {
      return
    }

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
    }
  }

  // Update the handleAddActivity function to use authentication
  async function handleAddActivity(e) {
    e.preventDefault()

    if (!requireAuth()) {
      return
    }

    const formData = new FormData(addForm)
    const submitBtn = addForm.querySelector('button[type="submit"]')

    // Show loading state
    submitBtn.classList.add("loading")
    submitBtn.disabled = true

    try {
      // Handle image upload first if there's an image
      let imagePath = null
      const imageFile = formData.get("image")

      if (imageFile && imageFile.size > 0) {
        const imageFormData = new FormData()
        imageFormData.append("image", imageFile)
        imageFormData.append("type", "activity")

        const imageResponse = await authenticatedFetch("api/upload/image.php", {
          method: "POST",
          body: imageFormData,
          headers: {}, // Remove Content-Type to let browser set it for FormData
        })

        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          imagePath = imageData.filename
        }
      }

      // Create the activity
      const activityData = {
        title: formData.get("title"),
        description: formData.get("description"),
        category_id: formData.get("category"),
        event_date: formData.get("date"),
        event_time: formData.get("time"),
        location: formData.get("location"),
        organizer: formData.get("organizer"),
        image: imagePath,
      }

      const response = await authenticatedFetch("api/activities/index.php", {
        method: "POST",
        body: JSON.stringify(activityData),
      })

      const result = await response.json()

      if (response.ok) {
        showNotification("Kegiatan berhasil ditambahkan!", "success")
        closeModals()

        // Reload activities
        await loadActivities()
      } else {
        showNotification(result.error || "Gagal menambahkan kegiatan", "error")
      }
    } catch (error) {
      console.error("Error adding activity:", error)
      showNotification("Terjadi kesalahan saat menambahkan kegiatan", "error")
    } finally {
      // Remove loading state
      submitBtn.classList.remove("loading")
      submitBtn.disabled = false
    }
  }

  function getCategoryName(category) {
    const categoryMap = {
      seminar: "Seminar",
      workshop: "Workshop",
      kompetisi: "Kompetisi",
      organisasi: "Organisasi",
      olahraga: "Olahraga",
      seni: "Seni & Budaya",
    }
    return categoryMap[category] || category
  }

  function hideLoading() {
    const loading = document.getElementById("loading")
    if (loading) {
      loading.style.display = "none"
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

  // Global function for sharing
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
      navigator.clipboard.writeText(text).then(() => {
        alert("Link kegiatan berhasil disalin!")
      })
    }
  }

  function showLoading() {
    const loading = document.getElementById("loading")
    if (loading) {
      loading.style.display = "block"
    }
  }

  function showError(message) {
    const errorContainer = document.getElementById("error-message")
    if (errorContainer) {
      errorContainer.textContent = message
      errorContainer.style.display = "block"
    } else {
      alert(message)
    }
  }

  // Add this function to initialize auth state on page load
  function initializeAuthState() {
    if (!isAuthenticated()) {
      // Hide add button for non-authenticated users
      const addButton = document.getElementById("add-button")
      if (addButton) {
        addButton.style.display = "none"
      }
    }
  }

  // Mock functions for requireAuth, authenticatedFetch, showNotification, and isAuthenticated
  // Replace these with your actual implementation
  function requireAuth() {
    console.log("requireAuth called")
    return true // Replace with your actual authentication check
  }

  async function authenticatedFetch(url, options) {
    console.log("authenticatedFetch called with", url, options)
    // Simulate a successful response
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: "Success" }),
    })
  }

  function showNotification(message, type) {
    console.log(`Notification: ${message} (Type: ${type})`)
    alert(message) // Replace with your actual notification implementation
  }

  function isAuthenticated() {
    console.log("isAuthenticated called")
    return true // Replace with your actual authentication check
  }
})
