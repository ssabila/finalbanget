// Home page functionality
document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const recentPostsContainer = document.getElementById("recent-posts")
  const prevBtn = document.querySelector(".slider-btn.prev")
  const nextBtn = document.querySelector(".slider-btn.next")
  const dotsContainer = document.querySelector(".slider-dots")

  let currentSlide = 0
  let recentPosts = []
  let slidesPerView = 3
  let totalSlides = 0

  // Initialize
  init()

  async function init() {
    await loadRecentPosts()
    setupSlider()
    setupEventListeners()
    updateSlidesPerView()
  }

  async function loadRecentPosts() {
    try {
      // Fetch both Lost & Found and Activities data
      const [lostFoundResponse, activitiesResponse] = await Promise.all([
        fetch("api/lost-found/index.php?limit=10"),
        fetch("api/activities/index.php?limit=10"),
      ])

      const lostFoundData = await lostFoundResponse.json()
      const activitiesData = await activitiesResponse.json()

      // Combine and format data
      const combinedPosts = []

      // Add Lost & Found items
      if (Array.isArray(lostFoundData)) {
        lostFoundData.forEach((item) => {
          combinedPosts.push({
            id: `lf-${item.id}`,
            title: item.title,
            description: item.description,
            category: item.type === "hilang" ? "Barang Hilang" : "Barang Ditemukan",
            categoryClass: item.type === "hilang" ? "lost" : "found",
            date: item.date_occurred || item.created_at,
            location: item.location,
            user: item.user_name,
            type: "lost-found",
            icon: "fas fa-search",
            link: "lost-found.html",
          })
        })
      }

      // Add Activities
      if (Array.isArray(activitiesData)) {
        activitiesData.forEach((activity) => {
          combinedPosts.push({
            id: `act-${activity.id}`,
            title: activity.title,
            description: activity.description,
            category: activity.category_name,
            categoryClass: "activity",
            date: activity.event_date,
            location: activity.location,
            user: activity.user_name,
            type: "activity",
            icon: "fas fa-calendar-alt",
            link: "activities.html",
          })
        })
      }

      // Sort by date (newest first) and take first 12
      recentPosts = combinedPosts.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12)

      displayRecentPosts()
    } catch (error) {
      console.error("Error loading recent posts:", error)
      showErrorState()
    }
  }

  function displayRecentPosts() {
    if (!recentPostsContainer || recentPosts.length === 0) {
      showEmptyState()
      return
    }

    const postsHTML = recentPosts.map((post) => createPostCard(post)).join("")

    recentPostsContainer.innerHTML = `
      <div class="slider-container">
        <div class="slider-wrapper">
          <div class="posts-slider" id="posts-slider">
            ${postsHTML}
          </div>
        </div>
        <button class="slider-btn prev" id="prev-btn">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="slider-btn next" id="next-btn">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div class="slider-dots" id="slider-dots"></div>
    `

    setupSlider()
  }

  function createPostCard(post) {
    const formattedDate = new Date(post.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

    return `
      <div class="post-card" data-type="${post.type}" onclick="window.location.href='${post.link}'">
        <div class="post-image">
          <i class="${post.icon}"></i>
          <div class="post-type-badge ${post.type}">
            ${post.type === "lost-found" ? "Lost & Found" : "Kegiatan"}
          </div>
        </div>
        <div class="post-content">
          <div class="post-category ${post.categoryClass}">
            ${post.category}
          </div>
          <h3 class="post-title">${post.title}</h3>
          <div class="post-meta">
            <div class="meta-item">
              <i class="fas fa-calendar"></i>
              <span>${formattedDate}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>${post.location}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-user"></i>
              <span>${post.user}</span>
            </div>
          </div>
          <p class="post-description">${post.description}</p>
        </div>
      </div>
    `
  }

  function setupSlider() {
    const slider = document.getElementById("posts-slider")
    const prevButton = document.getElementById("prev-btn")
    const nextButton = document.getElementById("next-btn")
    const dotsContainer = document.getElementById("slider-dots")

    if (!slider || recentPosts.length === 0) return

    updateSlidesPerView()
    totalSlides = Math.ceil(recentPosts.length / slidesPerView)

    // Create dots
    createDots()

    // Update slider position
    updateSlider()

    // Event listeners
    if (prevButton) {
      prevButton.addEventListener("click", () => {
        currentSlide = currentSlide > 0 ? currentSlide - 1 : totalSlides - 1
        updateSlider()
      })
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        currentSlide = currentSlide < totalSlides - 1 ? currentSlide + 1 : 0
        updateSlider()
      })
    }

    // Auto-slide every 5 seconds
    setInterval(() => {
      currentSlide = currentSlide < totalSlides - 1 ? currentSlide + 1 : 0
      updateSlider()
    }, 5000)
  }

  function createDots() {
    const dotsContainer = document.getElementById("slider-dots")
    if (!dotsContainer) return

    const dotsHTML = Array.from(
      { length: totalSlides },
      (_, index) => `<button class="dot ${index === 0 ? "active" : ""}" data-slide="${index}"></button>`,
    ).join("")

    dotsContainer.innerHTML = dotsHTML

    // Add click events to dots
    dotsContainer.querySelectorAll(".dot").forEach((dot, index) => {
      dot.addEventListener("click", () => {
        currentSlide = index
        updateSlider()
      })
    })
  }

  function updateSlider() {
    const slider = document.getElementById("posts-slider")
    const dots = document.querySelectorAll(".dot")

    if (!slider) return

    const translateX = -(currentSlide * 100)
    slider.style.transform = `translateX(${translateX}%)`

    // Update active dot
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentSlide)
    })
  }

  function updateSlidesPerView() {
    const width = window.innerWidth
    if (width <= 480) {
      slidesPerView = 1
    } else if (width <= 768) {
      slidesPerView = 2
    } else {
      slidesPerView = 3
    }
  }

  function setupEventListeners() {
    // Responsive slider
    window.addEventListener("resize", () => {
      updateSlidesPerView()
      totalSlides = Math.ceil(recentPosts.length / slidesPerView)
      currentSlide = Math.min(currentSlide, totalSlides - 1)
      createDots()
      updateSlider()
    })

    // Touch/swipe support for mobile
    let startX = 0
    let endX = 0

    const slider = document.getElementById("posts-slider")
    if (slider) {
      slider.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX
      })

      slider.addEventListener("touchend", (e) => {
        endX = e.changedTouches[0].clientX
        handleSwipe()
      })
    }

    function handleSwipe() {
      const threshold = 50
      const diff = startX - endX

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          // Swipe left - next slide
          currentSlide = currentSlide < totalSlides - 1 ? currentSlide + 1 : 0
        } else {
          // Swipe right - previous slide
          currentSlide = currentSlide > 0 ? currentSlide - 1 : totalSlides - 1
        }
        updateSlider()
      }
    }
  }

  function showEmptyState() {
    if (recentPostsContainer) {
      recentPostsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <h3>Belum Ada Postingan</h3>
          <p>Belum ada postingan terbaru untuk ditampilkan</p>
        </div>
      `
    }
  }

  function showErrorState() {
    if (recentPostsContainer) {
      recentPostsContainer.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Gagal Memuat Data</h3>
          <p>Terjadi kesalahan saat memuat postingan terbaru</p>
          <button class="btn-primary" onclick="location.reload()">Coba Lagi</button>
        </div>
      `
    }
  }
})
