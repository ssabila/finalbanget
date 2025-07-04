// Lost & Found page functionality dengan Live Search dan AJAX
document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const lostFoundContainer = document.querySelector(".grid-container")
  const searchInput = document.querySelector('input[name="search"]')
  const categoryFilter = document.querySelector('select[name="category"]')
  const statusFilter = document.querySelector('select[name="type"]')
  const addButton = document.querySelector(".add-button")
  const addModal = document.getElementById("add-modal")
  const detailModal = document.getElementById("detail-modal")
  const addForm = document.querySelector(".modal-form")
  const filterForm = document.querySelector(".filter-bar")

  // Modal controls
  const closeModalBtns = document.querySelectorAll(".close-modal")

  let currentItems = []
  const searchTimeout = null

  // Initialize page
  init()

  function init() {
    // Load initial data
    loadInitialData()
    setupEventListeners()
  }

  async function loadInitialData() {
    await handleLiveSearch()
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

    if (statusFilter) {
      statusFilter.addEventListener("change", handleLiveSearch)
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
      addForm.addEventListener("submit", handleAddItem)
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
    const type = statusFilter ? statusFilter.value : ""

    try {
      showLoading()

      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (category) params.append("category", category)
      if (type) params.append("type", type)

      const response = await fetch(`api/lost-found/search.php?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      if (data && Array.isArray(data)) {
        currentItems = data
        displayItems(currentItems)
      } else if (data && data.error) {
        showError("Gagal memuat data: " + data.error)
      } else {
        displayItems([]) // Display empty state
      }
    } catch (error) {
      console.error("Error in live search:", error)
      showError("Gagal terhubung ke server: " + error.message)
    } finally {
      hideLoading()
    }
  }

  async function loadLostFoundItems() {
    try {
      showLoading()
      const response = await fetch("api/lost-found/search.php")
      const data = await response.json()

      if (response.ok) {
        currentItems = data
        displayItems(currentItems)
      } else {
        showError("Gagal memuat data: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Error loading lost found items:", error)
      showError("Gagal terhubung ke server")
    } finally {
      hideLoading()
    }
  }

  function displayItems(items) {
    if (!lostFoundContainer) return

    if (items.length === 0) {
      lostFoundContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h3>Tidak ada item ditemukan</h3>
          <p>Belum ada laporan yang sesuai dengan filter Anda</p>
        </div>
      `
      return
    }

    try {
      const itemsHTML = items.map((item) => createItemCard(item)).join("")
      lostFoundContainer.innerHTML = itemsHTML

      // Add event listeners to new cards
      const itemCards = lostFoundContainer.querySelectorAll(".lost-found-item")
      itemCards.forEach((card) => setupCardEvents(card))
    } catch (error) {
      console.error("Error displaying items:", error)
      showError("Gagal menampilkan data")
    }
  }

  function createItemCard(item) {
    const formattedDate = new Date(item.date_occurred).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

    const statusClass = `status-${item.type}`
    const statusText = item.type === "hilang" ? "HILANG" : "DITEMUKAN"
    const currentUser = getCurrentUser()
    const isOwner = currentUser && currentUser.id == item.user_id

    // Determine if we have a valid image
    const hasImage = item.image && item.image.trim() !== ""
    const imageClass = hasImage ? "has-image" : ""

    // Clean phone number for WhatsApp
    const cleanPhone = item.contact_info ? item.contact_info.replace(/[^0-9]/g, "") : ""

    // Get icon based on category
    const icon = getItemIcon(item.category_name)

    // Escape JSON-unsafe characters
    const escapedTitle = item.title.replace(/["'\\\n\r]/g, (match) => {
      switch (match) {
        case '"':
          return "&quot;"
        case "'":
          return "&#39;"
        case "\\":
          return "\\\\"
        case "\n":
          return "\\n"
        case "\r":
          return "\\r"
        default:
          return match
      }
    })
    const escapedDescription = item.description.replace(/["'\\\n\r]/g, (match) => {
      switch (match) {
        case '"':
          return "&quot;"
        case "'":
          return "&#39;"
        case "\\":
          return "\\\\"
        case "\n":
          return "\\n"
        case "\r":
          return "\\r"
        default:
          return match
      }
    })

    return `
      <div class="lost-found-item" data-id="${item.id}" onclick="window.showItemDetail(${item.id})">
        ${
          isOwner
            ? `
          <div class="item-actions-overlay">
            <button class="action-btn edit-btn" onclick="event.stopPropagation(); window.editItem(${item.id}, 'lost-found')" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" onclick="event.stopPropagation(); window.deleteItem(${item.id}, 'lost-found')" title="Hapus">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `
            : ""
        }
        
        <div class="item-image ${imageClass}">
          ${
            hasImage
              ? `
            <img src="${item.image}" 
                 alt="${item.title}" 
                 loading="lazy">
          `
              : `
            <i class="fas fa-${icon} item-icon"></i>
          `
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
              <span>${formattedDate}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>${item.location}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-user"></i>
              <span>${item.user_name}</span>
            </div>
          </div>
          
          <p class="item-description">${item.description}</p>
          
          <div class="item-actions">
            <a href="https://wa.me/${cleanPhone}" 
               target="_blank" 
               class="contact-btn"
               onclick="event.stopPropagation();">
              <i class="fab fa-whatsapp"></i>
              Hubungi
            </a>
            <div class="item-owner">
              oleh ${item.user_name}
            </div>
          </div>
        </div>
        
        <!-- Hidden data untuk modal -->
        <script type="application/json" class="item-data">
          {
            "id": ${item.id},
            "title": "${escapedTitle}",
            "description": "${escapedDescription}",
            "type": "${item.type}",
            "category_name": "${item.category_name}",
            "location": "${item.location}",
            "date_occurred": "${item.date_occurred}",
            "user_name": "${item.user_name}",
            "contact_info": "${item.contact_info}",
            "image": "${item.image || ""}",
            "created_at": "${item.created_at}"
          }
        </script>
      </div>
    `
  }

  function setupCardEvents(card) {
    // Add click event untuk detail
    card.addEventListener("click", function (e) {
      // Jangan trigger jika klik button action atau contact
      if (!e.target.closest(".action-btn") && !e.target.closest(".contact-btn")) {
        const itemId = this.dataset.id
        if (itemId) {
          window.showItemDetail(itemId)
        }
      }
    })
  }

  function getItemIcon(category) {
    const iconMap = {
      elektronik: "laptop",
      aksesoris: "glasses",
      pakaian: "tshirt",
      buku: "book",
      "alat tulis": "pen",
      tas: "briefcase",
      sepatu: "shoe-prints",
      perhiasan: "gem",
      kendaraan: "car",
      lainnya: "box",
    }

    const normalizedCategory = category.toLowerCase()
    return iconMap[normalizedCategory] || "box"
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

  async function handleAddItem(e) {
    // Remove e.preventDefault() to allow natural form submission to PHP
    // Let the form submit naturally to PHP handler
    // The PHP code will handle the form submission and image processing
    return true
  }

  function showLoading() {
    if (lostFoundContainer) {
      lostFoundContainer.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>Memuat data...</p>
        </div>
      `
    }
  }

  function showError(message) {
    if (lostFoundContainer) {
      lostFoundContainer.innerHTML = `
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

  function getCurrentUser() {
    // Mock function - replace with your actual user detection
    return { id: 1 }
  }

  // Global functions for PHP integration
  window.editItem = async (id, type) => {
    console.log("Edit item:", id)
    // Implement edit functionality
  }

  window.deleteItem = async (id, type) => {
    if (!confirm("Apakah Anda yakin ingin menghapus item ini?")) {
      return
    }
    console.log("Delete item:", id)
    // Implement delete functionality
  }

  window.openModal = (modalId) => {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.add("active")
    }
  }

  window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.remove("active")
    }
  }

  // Image preview functions dengan resize preview
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

  // Detail Modal Function
  window.showItemDetail = (itemId) => {
    const itemCard = document.querySelector(`[data-id="${itemId}"]`)
    if (!itemCard) return

    const itemDataScript = itemCard.querySelector(".item-data")
    if (!itemDataScript) return

    const itemData = JSON.parse(itemDataScript.textContent)

    // Format tanggal
    const formattedDate = new Date(itemData.date_occurred).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    const formattedCreatedAt = new Date(itemData.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    // Buat konten modal
    const modalBody = document.getElementById("detail-modal-body")
    const modalTitle = document.getElementById("detail-modal-title")

    modalTitle.textContent = itemData.title

    // Tentukan icon berdasarkan kategori
    const icon = getItemIcon(itemData.category_name)

    modalBody.innerHTML = `
      <div class="detail-content">
        <div class="detail-image-section">
          ${
            itemData.image && itemData.image.trim() !== ""
              ? `
            <div class="detail-image-container">
              <img src="${itemData.image}" 
                   alt="${itemData.title}" 
                   class="detail-image-large"
                   style="width: 200px; height: auto; object-fit: cover; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.15);">
            </div>
          `
              : `
            <div class="detail-image-container no-image">
              <div class="detail-image-placeholder" style="width: 200px; height: auto; background: linear-gradient(135deg, #4bc3ff, #95e8de); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 30px rgba(0,0,0,0.15);">
                <i class="fas fa-${icon}" style="font-size: 5rem; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.1);"></i>
              </div>
            </div>
          `
          }
        </div>
        
        <div class="detail-info-section">
          <div class="detail-category">
            <span class="category-badge">${itemData.category_name}</span>
            <span class="status-badge status-${itemData.type}">
              ${itemData.type === "hilang" ? "BARANG HILANG" : "BARANG DITEMUKAN"}
            </span>
          </div>
          
          <h3 class="detail-title">${itemData.title}</h3>
          
          <div class="detail-meta">
            <div class="meta-row">
              <i class="fas fa-calendar"></i>
              <span><strong>Tanggal Kejadian:</strong> ${formattedDate}</span>
            </div>
            <div class="meta-row">
              <i class="fas fa-map-marker-alt"></i>
              <span><strong>Lokasi:</strong> ${itemData.location}</span>
            </div>
            <div class="meta-row">
              <i class="fas fa-user"></i>
              <span><strong>Dilaporkan oleh:</strong> ${itemData.user_name}</span>
            </div>
            <div class="meta-row">
              <i class="fas fa-clock"></i>
              <span><strong>Tanggal Laporan:</strong> ${formattedCreatedAt}</span>
            </div>
          </div>
          
          <div class="detail-description">
            <h4>Deskripsi:</h4>
            <p>${itemData.description}</p>
          </div>
          
          <div class="detail-actions">
            <a href="https://wa.me/${itemData.contact_info.replace(/[^0-9]/g, "")}" 
               target="_blank" 
               class="contact-btn-large">
              <i class="fab fa-whatsapp"></i>
              Hubungi via WhatsApp
            </a>
            <button class="share-btn" onclick="window.shareItem('${itemData.title.replace(/'/g, "\\'")}', '${itemData.description.replace(/'/g, "\\'")}')">
              <i class="fas fa-share"></i>
              Bagikan
            </button>
          </div>
        </div>
      </div>
    `

    // Tampilkan modal
    window.openModal("detail-modal")
  }

  // Share function
  window.shareItem = (title, description) => {
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
          alert("Link item berhasil disalin!")
        })
        .catch(() => {
          // Fallback untuk browser lama
          const textArea = document.createElement("textarea")
          textArea.value = text
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand("copy")
          document.body.removeChild(textArea)
          alert("Link item berhasil disalin!")
        })
    }
  }
})
