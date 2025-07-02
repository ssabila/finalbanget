// Profile page functionality - WITH WORKING AVATAR UPLOAD
document.addEventListener("DOMContentLoaded", () => {
  // Initialize profile page langsung tanpa JavaScript auth check
  init()
})

async function init() {
  setupEventListeners()
  setupTabs()
  initAvatarUpload()
}

function setupEventListeners() {
  // Edit profile button
  const editProfileBtn = document.querySelector(".edit-profile-btn")
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => openModal('edit-profile-modal'))
  }

  // Modal controls
  const closeModalBtns = document.querySelectorAll(".close-modal")
  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", closeModals)
  })

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
    })
  })
}

// ==========================================
// AVATAR UPLOAD FUNCTIONALITY - WORKING
// ==========================================

function initAvatarUpload() {
  const changeAvatarBtn = document.querySelector('.change-avatar-btn')
  if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener('click', () => openModal('avatar-modal'))
  }
  
  // Initialize drag and drop
  initAvatarDragDrop()
}

function initAvatarDragDrop() {
  const dropZone = document.getElementById('avatar-drop-zone')
  const fileInput = document.getElementById('avatar-input')
  
  if (!dropZone || !fileInput) return
  
  // Prevent default drag behaviors
  ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false)
    document.body.addEventListener(eventName, preventDefaults, false)
  })
  
  // Highlight drop zone when item is dragged over it
  ;['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false)
  })
  
  ;['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false)
  })
  
  // Handle dropped files
  dropZone.addEventListener('drop', handleDrop, false)
  
  function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
  }
  
  function highlight(e) {
    dropZone.classList.add('dragover')
  }
  
  function unhighlight(e) {
    dropZone.classList.remove('dragover')
  }
  
  function handleDrop(e) {
    const dt = e.dataTransfer
    const files = dt.files
    
    if (files.length > 0) {
      fileInput.files = files
      handleAvatarSelection(fileInput)
    }
  }
}

// Handle avatar file selection
function handleAvatarSelection(input) {
  const file = input.files[0]
  if (!file) return
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    showNotification('Hanya file gambar (JPG, PNG, GIF) yang diperbolehkan!', 'error')
    input.value = ''
    return
  }
  
  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showNotification('Ukuran file terlalu besar! Maksimal 5MB.', 'error')
    input.value = ''
    return
  }
  
  // Show preview
  const reader = new FileReader()
  reader.onload = function(e) {
    const preview = document.getElementById('avatar-preview')
    const previewImg = document.getElementById('avatar-preview-img')
    const uploadBtn = document.getElementById('upload-avatar-btn')
    
    if (previewImg && preview && uploadBtn) {
      previewImg.src = e.target.result
      preview.style.display = 'block'
      uploadBtn.disabled = false
      uploadBtn.classList.remove('btn-disabled')
    }
  }
  reader.readAsDataURL(file)
}

// Upload avatar to server
async function uploadAvatar() {
  const fileInput = document.getElementById('avatar-input')
  const uploadBtn = document.getElementById('upload-avatar-btn')
  
  if (!fileInput.files[0]) {
    showNotification('Pilih foto terlebih dahulu', 'error')
    return
  }
  
  const formData = new FormData()
  formData.append('avatar', fileInput.files[0])
  
  // Show loading
  uploadBtn.classList.add('loading')
  uploadBtn.disabled = true
  uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...'
  
  try {
    const response = await fetch('api/user/avatar.php', {
      method: 'POST',
      body: formData
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      showNotification(data.message || 'Avatar berhasil diupload!', 'success')
      
      // Update avatar display
      updateAvatarDisplay(data.avatar_url)
      
      // Close modal
      closeModal('avatar-modal')
      
      // Reset form
      resetAvatarForm()
      
      // Reload page setelah 1 detik untuk memastikan perubahan terlihat
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } else {
      showNotification(data.error || 'Gagal upload avatar', 'error')
    }
  } catch (error) {
    console.error('Upload error:', error)
    showNotification('Terjadi kesalahan saat upload. Silakan coba lagi.', 'error')
  } finally {
    uploadBtn.classList.remove('loading')
    uploadBtn.disabled = false
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Foto'
  }
}

// Remove avatar
async function removeAvatar() {
  if (!confirm('Apakah Anda yakin ingin menghapus foto profil?')) {
    return
  }
  
  const removeBtn = document.getElementById('remove-avatar-btn')
  removeBtn.classList.add('loading')
  removeBtn.disabled = true
  removeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...'
  
  try {
    const response = await fetch('api/user/avatar.php', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      showNotification(data.message || 'Avatar berhasil dihapus!', 'success')
      
      // Update avatar to default
      updateAvatarDisplay(null)
      
      // Close modal
      closeModal('avatar-modal')
      
      // Reload page setelah 1 detik
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } else {
      showNotification(data.error || 'Gagal hapus avatar', 'error')
    }
  } catch (error) {
    console.error('Remove error:', error)
    showNotification('Terjadi kesalahan saat menghapus avatar', 'error')
  } finally {
    removeBtn.classList.remove('loading')
    removeBtn.disabled = false
    removeBtn.innerHTML = '<i class="fas fa-trash"></i> Hapus Foto'
  }
}

// Update avatar display in UI
function updateAvatarDisplay(avatarUrl) {
  const avatarImages = document.querySelectorAll('.profile-avatar img, .nav-auth img')
  const defaultAvatar = getDefaultAvatarSVG()
  
  avatarImages.forEach(img => {
    if (avatarUrl) {
      img.src = avatarUrl
      img.onerror = () => img.src = defaultAvatar
    } else {
      img.src = defaultAvatar
    }
  })
}

// Reset avatar form
function resetAvatarForm() {
  const fileInput = document.getElementById('avatar-input')
  const preview = document.getElementById('avatar-preview')
  const uploadBtn = document.getElementById('upload-avatar-btn')
  
  if (fileInput) fileInput.value = ''
  if (preview) preview.style.display = 'none'
  if (uploadBtn) {
    uploadBtn.disabled = true
    uploadBtn.classList.add('btn-disabled')
  }
}

// Get default avatar SVG
function getDefaultAvatarSVG() {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjhGOUZBIi8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjN0Y4QzhEIi8+CjxwYXRoIGQ9Ik0yMCA5MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA2MCA2MEM2MCA2MCA2MCA2MCA5MCA5MEgyMFoiIGZpbGw9IiM3RjhDOEQiLz4KPC9zdmc+'
}

// ==========================================
// OTHER PROFILE FUNCTIONS
// ==========================================

// Edit item function dengan konfirmasi
async function editItem(id, type) {
  if (!confirm('Fitur edit sedang dalam pengembangan. Apakah Anda ingin melanjutkan?')) {
    return
  }
  
  try {
    showNotification(`Edit ${type} dengan ID: ${id} akan segera tersedia`, "info")
  } catch (error) {
    console.error('Error editing item:', error)
    showNotification('Terjadi kesalahan saat edit item', 'error')
  }
}

// Delete item function
async function deleteItem(id, type) {
  if (!confirm('Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.')) {
    return
  }
  
  try {
    const itemElement = document.querySelector(`[data-id="${id}"][data-type="${type}"]`)
    if (itemElement) {
      itemElement.style.opacity = '0.5'
      showNotification('Fitur delete akan segera tersedia', 'info')
      
      setTimeout(() => {
        if (itemElement) {
          itemElement.style.opacity = '1'
        }
      }, 3000)
    }
  } catch (error) {
    console.error('Error deleting item:', error)
    showNotification('Terjadi kesalahan saat menghapus item', 'error')
  }
}

// Modal functions
function openModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.add('active')
    
    // Reset avatar form when opening avatar modal
    if (modalId === 'avatar-modal') {
      resetAvatarForm()
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.remove('active')
  }
}

function closeModals() {
  const modals = document.querySelectorAll(".modal")
  modals.forEach((modal) => {
    modal.classList.remove("active")
  })
}

// Notification function
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification")
  existingNotifications.forEach((notification) => notification.remove())

  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    min-width: 300px;
    max-width: 400px;
    animation: slideInRight 0.3s ease;
    border-left: 4px solid ${getNotificationColor(type)};
  `

  const iconMap = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle", 
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  }

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem;">
      <i class="${iconMap[type]}" style="font-size: 1.2rem; color: ${getNotificationColor(type)};"></i>
      <span style="flex: 1; color: #2c3e50; font-weight: 500;">${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #7f8c8d; cursor: pointer; padding: 0.25rem; border-radius: 4px; transition: all 0.3s ease;">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `

  // Add to page
  document.body.appendChild(notification)

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove()
    }
  }, 5000)
}

function getNotificationColor(type) {
  const colors = {
    success: "#2ecc71",
    error: "#e74c3c", 
    warning: "#f39c12",
    info: "#4bc3ff",
  }
  return colors[type] || colors.info
}

// Global functions
window.editItem = editItem
window.deleteItem = deleteItem
window.showNotification = showNotification
window.openModal = openModal
window.closeModal = closeModal
window.handleAvatarSelection = handleAvatarSelection
window.uploadAvatar = uploadAvatar
window.removeAvatar = removeAvatar

// Add animation styles
const style = document.createElement("style")
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .btn-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .loading {
    position: relative;
    pointer-events: none;
  }
  
  .dragover {
    border-color: #4bc3ff !important;
    background-color: rgba(75, 195, 255, 0.1) !important;
  }
`
document.head.appendChild(style)