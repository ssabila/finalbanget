// Profile page functionality
document.addEventListener("DOMContentLoaded", () => {
  // Initialize profile page
  init()
})

function init() {
  setupEventListeners()
  setupTabs()
}

function setupEventListeners() {
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

// Avatar Upload Functions
function openAvatarModal() {
  const modal = document.getElementById("avatar-modal")
  if (modal) {
    // Reset form and preview
    const form = modal.querySelector("form")
    if (form) {
      form.reset()
    }
    
    // Hide new preview and show placeholder
    const newPreview = document.getElementById("new-avatar-preview")
    const placeholder = document.getElementById("no-preview-placeholder")
    const saveBtn = document.getElementById("save-avatar-btn")
    
    if (newPreview) newPreview.style.display = "none"
    if (placeholder) placeholder.style.display = "flex"
    if (saveBtn) saveBtn.disabled = true
    
    modal.classList.add("active")
  }
}

function previewAvatar(input) {
  const newPreview = document.getElementById("new-avatar-preview")
  const newAvatarImg = document.getElementById("new-avatar-img")
  const placeholder = document.getElementById("no-preview-placeholder")
  const saveBtn = document.getElementById("save-avatar-btn")
  
  if (input.files && input.files[0]) {
    const file = input.files[0]
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      alert('Hanya file gambar (JPG, PNG, GIF) yang diperbolehkan!')
      input.value = ''
      return
    }
    
    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      alert('Ukuran file terlalu besar! Maksimal 2MB untuk foto profil.')
      input.value = ''
      return
    }
    
    // Preview the image
    const reader = new FileReader()
    reader.onload = function(e) {
      if (newAvatarImg) {
        newAvatarImg.src = e.target.result
      }
      
      if (newPreview) {
        newPreview.style.display = "block"
        newPreview.classList.add("avatar-upload-success")
      }
      
      if (placeholder) {
        placeholder.style.display = "none"
      }
      
      if (saveBtn) {
        saveBtn.disabled = false
      }
      
      // Add validation feedback
      showValidationMessage("Foto terlihat bagus! Klik 'Simpan Foto' untuk menggunakan foto ini.", "success")
    }
    
    reader.onerror = function() {
      alert('Terjadi kesalahan saat membaca file.')
      input.value = ''
    }
    
    reader.readAsDataURL(file)
  } else {
    // Reset preview if no file selected
    if (newPreview) newPreview.style.display = "none"
    if (placeholder) placeholder.style.display = "flex"
    if (saveBtn) saveBtn.disabled = true
  }
}

function showValidationMessage(message, type) {
  // Remove existing validation messages
  const existingMessages = document.querySelectorAll('.validation-message')
  existingMessages.forEach(msg => msg.remove())
  
  // Create new validation message
  const messageEl = document.createElement('div')
  messageEl.className = `validation-message validation-${type}`
  messageEl.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    <span>${message}</span>
  `
  
  // Add styles
  messageEl.style.cssText = `
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    margin: 1rem 0;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    background: ${type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)'};
    color: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
    border: 1px solid ${type === 'success' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'};
    animation: slideIn 0.3s ease;
  `
  
  // Insert after avatar upload section
  const avatarSection = document.querySelector('.avatar-upload-section')
  if (avatarSection) {
    avatarSection.parentNode.insertBefore(messageEl, avatarSection.nextSibling)
  }
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.remove()
    }
  }, 5000)
}

// Modal functions
function openModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.add("active")
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.remove("active")
    
    // Reset form if it's the avatar modal
    if (modalId === 'avatar-modal') {
      const form = modal.querySelector('form')
      if (form) {
        form.reset()
      }
      
      // Reset preview state
      const newPreview = document.getElementById("new-avatar-preview")
      const placeholder = document.getElementById("no-preview-placeholder")
      const saveBtn = document.getElementById("save-avatar-btn")
      
      if (newPreview) newPreview.style.display = "none"
      if (placeholder) placeholder.style.display = "flex"
      if (saveBtn) saveBtn.disabled = true
      
      // Remove validation messages
      const validationMessages = document.querySelectorAll('.validation-message')
      validationMessages.forEach(msg => msg.remove())
    }
  }
}

function closeModals() {
  const modals = document.querySelectorAll(".modal")
  modals.forEach((modal) => {
    modal.classList.remove("active")
  })
  
  // Reset avatar modal specifically
  const avatarModal = document.getElementById('avatar-modal')
  if (avatarModal) {
    closeModal('avatar-modal')
  }
}

// Image preview functions (for lost & found and activities)
function previewImage(input, previewId) {
  if (input.files && input.files[0]) {
    const reader = new FileReader()
    reader.onload = function(e) {
      const imgElement = document.querySelector(`#${previewId} img`)
      if (imgElement) {
        imgElement.src = e.target.result
        document.getElementById(previewId).style.display = 'block'
      }
    }
    reader.readAsDataURL(input.files[0])
  }
}

function removeImage(inputId, previewId) {
  const input = document.getElementById(inputId)
  const preview = document.getElementById(previewId)
  
  if (input) input.value = ''
  if (preview) preview.style.display = 'none'
}

// Enhanced avatar upload with loading state
function handleAvatarUpload(form) {
  const submitBtn = form.querySelector('button[type="submit"]')
  const currentAvatar = document.getElementById('current-avatar')
  
  if (submitBtn) {
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'
    submitBtn.disabled = true
    
    // Add loading class to current avatar
    if (currentAvatar) {
      currentAvatar.classList.add('avatar-uploading')
    }
  }
  
  // Form will submit naturally, PHP will handle the upload
  return true
}

// Add form submit handler for avatar form
document.addEventListener('DOMContentLoaded', function() {
  const avatarForm = document.querySelector('#avatar-modal form')
  if (avatarForm) {
    avatarForm.addEventListener('submit', function(e) {
      // Let the form submit naturally, but add loading state
      handleAvatarUpload(this)
    })
  }
})

// Utility function to update avatar display after successful upload
function updateAvatarDisplay(newAvatarUrl) {
  const currentAvatar = document.getElementById('current-avatar')
  const currentAvatarPreview = document.getElementById('current-avatar-preview')
  
  if (currentAvatar) {
    currentAvatar.src = newAvatarUrl
    currentAvatar.classList.remove('avatar-uploading')
  }
  
  if (currentAvatarPreview) {
    currentAvatarPreview.innerHTML = `<img src="${newAvatarUrl}" alt="Current Avatar">`
  }
}

// Enhanced error handling for avatar upload
function handleAvatarError(errorMessage) {
  showValidationMessage(errorMessage, 'error')
  
  // Reset button state
  const saveBtn = document.getElementById("save-avatar-btn")
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Foto'
    saveBtn.disabled = false 
  }
  
  // Remove loading state from current avatar
  const currentAvatar = document.getElementById('current-avatar')
  if (currentAvatar) {
    currentAvatar.classList.remove('avatar-uploading')
  }
}

// Global functions for backward compatibility
window.openModal = openModal
window.closeModal = closeModal
window.previewImage = previewImage
window.removeImage = removeImage
window.openAvatarModal = openAvatarModal
window.previewAvatar = previewAvatar

// Add CSS animation for validation messages
const style = document.createElement('style')
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .validation-message {
    animation: slideIn 0.3s ease;
  }
`
document.head.appendChild(style)