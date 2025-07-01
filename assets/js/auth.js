// Authentication functionality
class AuthManager {
  constructor() {
    this.baseUrl = "api"
    this.currentUser = null
    this.init()
  }

  init() {
    this.checkAuthStatus()
    this.setupAuthForms()
  }

  async checkAuthStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/user/profile.php`, {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        this.currentUser = data.user
        this.updateNavigation(true)
      } else {
        this.currentUser = null
        this.updateNavigation(false)
      }
    } catch (error) {
      console.error("Auth check error:", error)
      this.currentUser = null
      this.updateNavigation(false)
    }
  }

  updateNavigation(isAuthenticated) {
    const navAuth = document.querySelector(".nav-auth")
    if (!navAuth) return

    if (isAuthenticated && this.currentUser) {
      navAuth.innerHTML = `
                <a href="profile.html" class="btn-login">
                    <i class="fas fa-user"></i>
                    ${this.currentUser.first_name}
                </a>
                <a href="#" class="btn-register" onclick="authManager.logout()">
                    <i class="fas fa-sign-out-alt"></i>
                    Keluar
                </a>
            `
    } else {
      navAuth.innerHTML = `
                <a href="login.html" class="btn-login">Masuk</a>
                <a href="register.html" class="btn-register">Daftar</a>
            `
    }
  }

  setupAuthForms() {
    // Login form
    const loginForm = document.getElementById("login-form")
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e))
    }

    // Register form
    const registerForm = document.getElementById("register-form")
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => this.handleRegister(e))
    }

    // Password toggle buttons
    const toggleButtons = document.querySelectorAll(".toggle-password")
    toggleButtons.forEach((button) => {
      button.addEventListener("click", this.togglePassword)
    })
  }

  async handleLogin(e) {
    e.preventDefault()

    const form = e.target
    const submitBtn = form.querySelector('button[type="submit"]')
    const formData = new FormData(form)

    // Show loading state
    submitBtn.classList.add("loading")
    submitBtn.disabled = true

    try {
      const response = await fetch(`${this.baseUrl}/auth/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        this.currentUser = data.user
        this.showNotification("Login berhasil! Mengalihkan ke profil...", "success")

        // Redirect to profile page after short delay
        setTimeout(() => {
          window.location.href = "profile.html"
        }, 1500)
      } else {
        this.showNotification(data.error || "Login gagal", "error")
      }
    } catch (error) {
      console.error("Login error:", error)
      this.showNotification("Terjadi kesalahan saat login", "error")
    } finally {
      submitBtn.classList.remove("loading")
      submitBtn.disabled = false
    }
  }

  async handleRegister(e) {
    e.preventDefault()

    const form = e.target
    const submitBtn = form.querySelector('button[type="submit"]')
    const formData = new FormData(form)

    // Validate password confirmation
    const password = formData.get("password")
    const confirmPassword = formData.get("confirmPassword")

    if (password !== confirmPassword) {
      this.showNotification("Konfirmasi password tidak cocok", "error")
      return
    }

    // Show loading state
    submitBtn.classList.add("loading")
    submitBtn.disabled = true

    try {
      const response = await fetch(`${this.baseUrl}/auth/register.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          nim: formData.get("nim"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          password: password,
          confirmPassword: confirmPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        this.showNotification("Registrasi berhasil! Silakan login.", "success")

        // Redirect to login page after short delay
        setTimeout(() => {
          window.location.href = "login.html"
        }, 2000)
      } else {
        this.showNotification(data.error || "Registrasi gagal", "error")
      }
    } catch (error) {
      console.error("Register error:", error)
      this.showNotification("Terjadi kesalahan saat registrasi", "error")
    } finally {
      submitBtn.classList.remove("loading")
      submitBtn.disabled = false
    }
  }

  async logout() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/logout.php`, {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        this.currentUser = null
        this.showNotification("Logout berhasil", "success")

        // Redirect to home page
        setTimeout(() => {
          window.location.href = "index.html"
        }, 1000)
      } else {
        this.showNotification("Logout gagal", "error")
      }
    } catch (error) {
      console.error("Logout error:", error)
      this.showNotification("Terjadi kesalahan saat logout", "error")
    }
  }

  togglePassword(e) {
    const button = e.currentTarget
    const input = button.parentElement.querySelector("input")
    const icon = button.querySelector("i")

    if (input.type === "password") {
      input.type = "text"
      icon.classList.remove("fa-eye")
      icon.classList.add("fa-eye-slash")
    } else {
      input.type = "password"
      icon.classList.remove("fa-eye-slash")
      icon.classList.add("fa-eye")
    }
  }

  showNotification(message, type = "info") {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll(".notification")
    existingNotifications.forEach((notification) => notification.remove())

    // Create notification element
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`

    const iconMap = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    }

    notification.innerHTML = `
            <div class="notification-content">
                <i class="${iconMap[type]}"></i>
                <span>${message}</span>
                <button class="notification-close">
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

    // Close button functionality
    const closeBtn = notification.querySelector(".notification-close")
    closeBtn.addEventListener("click", () => {
      notification.remove()
    })
  }

  // Helper methods for other scripts
  isAuthenticated() {
    return this.currentUser !== null
  }

  getCurrentUser() {
    return this.currentUser
  }

  requireAuth() {
    if (!this.isAuthenticated()) {
      this.showNotification("Anda harus login terlebih dahulu", "warning")
      setTimeout(() => {
        window.location.href = "login.html"
      }, 2000)
      return false
    }
    return true
  }

  async authenticatedFetch(url, options = {}) {
    const defaultOptions = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }

    const response = await fetch(url, { ...defaultOptions, ...options })

    if (response.status === 401) {
      this.currentUser = null
      this.updateNavigation(false)
      this.showNotification("Sesi Anda telah berakhir. Silakan login kembali.", "warning")
      setTimeout(() => {
        window.location.href = "login.html"
      }, 2000)
      throw new Error("Authentication required")
    }

    return response
  }
}

// Initialize auth manager
const authManager = new AuthManager()

// Global functions for backward compatibility
window.isAuthenticated = () => authManager.isAuthenticated()
window.getCurrentUser = () => authManager.getCurrentUser()
window.requireAuth = () => authManager.requireAuth()
window.authenticatedFetch = (url, options) => authManager.authenticatedFetch(url, options)
window.showNotification = (message, type) => authManager.showNotification(message, type)
window.logout = () => authManager.logout()
