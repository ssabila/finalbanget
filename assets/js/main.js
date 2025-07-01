// Main JavaScript functionality
document.addEventListener("DOMContentLoaded", () => {
  // Initialize navigation
  setupNavigation()

  // Initialize authentication
  const initializeAuth = () => {
    // Placeholder for authentication initialization logic
    console.log("Authentication initialized")
  }
  if (typeof initializeAuth === "function") {
    initializeAuth()
  }

  // Setup global event listeners
  setupGlobalEventListeners()
})

function setupNavigation() {
  const hamburger = document.getElementById("hamburger")
  const navMenu = document.getElementById("nav-menu")

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active")
      navMenu.classList.toggle("active")
    })

    // Close menu when clicking on a link
    const navLinks = navMenu.querySelectorAll(".nav-link")
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active")
        navMenu.classList.remove("active")
      })
    })

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        hamburger.classList.remove("active")
        navMenu.classList.remove("active")
      }
    })
  }
}

function setupGlobalEventListeners() {
  // Handle escape key for modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const activeModals = document.querySelectorAll(".modal")
      activeModals.forEach((modal) => {
        modal.style.display = "none"
      })
    }
  })

  // Modal close functionality
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none"
    }
  })

  // Handle form validation
  const forms = document.querySelectorAll("form")
  forms.forEach((form) => {
    const inputs = form.querySelectorAll("input[required], select[required], textarea[required]")
    inputs.forEach((input) => {
      input.addEventListener("blur", validateField)
      input.addEventListener("input", clearFieldError)
    })
  })
}

function validateField(e) {
  const field = e.target
  const formGroup = field.closest(".form-group")

  if (!formGroup) return

  // Remove existing error state
  formGroup.classList.remove("error", "success")

  // Check if field is valid
  if (field.checkValidity()) {
    formGroup.classList.add("success")
  } else {
    formGroup.classList.add("error")

    // Show error message
    let errorMessage = formGroup.querySelector(".error-message")
    if (!errorMessage) {
      errorMessage = document.createElement("div")
      errorMessage.className = "error-message"
      formGroup.appendChild(errorMessage)
    }

    // Set appropriate error message
    if (field.validity.valueMissing) {
      errorMessage.textContent = "Field ini wajib diisi"
    } else if (field.validity.typeMismatch) {
      errorMessage.textContent = "Format tidak valid"
    } else if (field.validity.tooShort) {
      errorMessage.textContent = `Minimal ${field.minLength} karakter`
    } else if (field.validity.tooLong) {
      errorMessage.textContent = `Maksimal ${field.maxLength} karakter`
    } else {
      errorMessage.textContent = "Input tidak valid"
    }
  }
}

function clearFieldError(e) {
  const field = e.target
  const formGroup = field.closest(".form-group")

  if (formGroup && formGroup.classList.contains("error")) {
    formGroup.classList.remove("error")

    const errorMessage = formGroup.querySelector(".error-message")
    if (errorMessage) {
      errorMessage.style.display = "none"
    }
  }
}

// Global notification function
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

// Add CSS for slide animation
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
`
document.head.appendChild(style)

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

// Global utility functions
window.debounce = debounce
window.formatDate = formatDate
window.formatTime = formatTime
window.showNotification = showNotification
