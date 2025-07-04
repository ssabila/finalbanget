// Home page functionality
document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const slider = document.getElementById("posts-slider")
  const prevBtn = document.getElementById("prev-btn")
  const nextBtn = document.getElementById("next-btn")
  const dotsContainer = document.getElementById("slider-dots")

  let currentSlide = 0
  let slidesPerView = 3
  let totalSlides = 0
  let totalPosts = 0

  // Initialize slider if elements exist
  if (slider) {
    init()
  }

  function init() {
    totalPosts = slider.children.length
    updateSlidesPerView()
    totalSlides = Math.ceil(totalPosts / slidesPerView)

    if (totalSlides > 1) {
      createDots()
      setupEventListeners()
      updateSlider()

      // Auto-slide every 5 seconds
      setInterval(() => {
        if (totalSlides > 1) {
          currentSlide = currentSlide < totalSlides - 1 ? currentSlide + 1 : 0
          updateSlider()
        }
      }, 5000)
    } else {
      // Hide controls if only one slide
      if (prevBtn) prevBtn.style.display = "none"
      if (nextBtn) nextBtn.style.display = "none"
      if (dotsContainer) dotsContainer.style.display = "none"
    }
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

  function createDots() {
    if (!dotsContainer || totalSlides <= 1) return

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
    if (!slider) return

    const slideWidth = 100 / slidesPerView
    const translateX = -(currentSlide * slideWidth * slidesPerView)

    // Update slider position
    slider.style.transform = `translateX(${translateX}%)`

    // Set width for each post card
    Array.from(slider.children).forEach((card) => {
      card.style.flex = `0 0 calc(${slideWidth}% - 1rem)`
    })

    // Update active dot
    const dots = document.querySelectorAll(".dot")
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentSlide)
    })
  }

  function setupEventListeners() {
    // Previous button
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        currentSlide = currentSlide > 0 ? currentSlide - 1 : totalSlides - 1
        updateSlider()
      })
    }

    // Next button
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        currentSlide = currentSlide < totalSlides - 1 ? currentSlide + 1 : 0
        updateSlider()
      })
    }

    // Responsive slider
    window.addEventListener("resize", () => {
      updateSlidesPerView()
      const newTotalSlides = Math.ceil(totalPosts / slidesPerView)

      if (newTotalSlides !== totalSlides) {
        totalSlides = newTotalSlides
        currentSlide = Math.min(currentSlide, totalSlides - 1)
        createDots()
      }

      updateSlider()
    })

    // Touch/swipe support for mobile
    let startX = 0
    let endX = 0

    slider.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX
    })

    slider.addEventListener("touchend", (e) => {
      endX = e.changedTouches[0].clientX
      handleSwipe()
    })

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

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        currentSlide = currentSlide > 0 ? currentSlide - 1 : totalSlides - 1
        updateSlider()
      } else if (e.key === "ArrowRight") {
        currentSlide = currentSlide < totalSlides - 1 ? currentSlide + 1 : 0
        updateSlider()
      }
    })
  }
})
