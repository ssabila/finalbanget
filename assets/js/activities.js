// Activities page functionality - Complete implementation
document.addEventListener("DOMContentLoaded", () => {
  // Setup event listeners untuk cards yang sudah ada dari PHP
  setupExistingCards();
  
  // Setup modal functionality
  setupModalHandlers();
  
  // Setup form handlers
  setupFormHandlers();
  
  // Handle PHP messages
  handlePhpMessages();
});

function setupExistingCards() {
  // Setup click events untuk activity cards yang sudah di-render oleh PHP
  const activityCards = document.querySelectorAll('.activity-item');
  activityCards.forEach(card => {
    // Event sudah ditambahkan via onclick di HTML, jadi kita tidak perlu menambahkan lagi
    // Tapi kita bisa menambahkan hover effects atau hal lain jika diperlukan
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
}

function setupModalHandlers() {
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
    }
  });

  // Close modal with escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const activeModals = document.querySelectorAll('.modal.active');
      activeModals.forEach(modal => {
        modal.classList.remove('active');
      });
    }
  });

  // Setup close button handlers
  const closeButtons = document.querySelectorAll('.close-modal');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
      }
    });
  });
}

function setupFormHandlers() {
  // Image preview functionality
  const imageInput = document.getElementById('image');
  if (imageInput) {
    imageInput.addEventListener('change', function() {
      previewImage(this);
    });
  }

  // Form validation
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      if (!validateForm(this)) {
        e.preventDefault();
        return false;
      }
    });
  });
}

function handlePhpMessages() {
  // Handle messages passed from PHP
  if (window.phpMessage) {
    const { text, type } = window.phpMessage;
    
    // Show notification instead of alert for better UX
    if (typeof showNotification === 'function') {
      showNotification(text, type);
    } else {
      // Fallback to alert if showNotification is not available
      const icon = type === 'success' ? '✅' : '❌';
      alert(icon + ' ' + text);
    }
    
    // Clean up
    delete window.phpMessage;
  }
}

function validateForm(form) {
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      showFieldError(field, 'Field ini wajib diisi');
      isValid = false;
    } else {
      clearFieldError(field);
    }
  });

  // Validasi khusus untuk tanggal
  const eventDate = form.querySelector('#event_date');
  if (eventDate && eventDate.value) {
    const selectedDate = new Date(eventDate.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      showFieldError(eventDate, 'Tanggal kegiatan tidak boleh di masa lalu');
      isValid = false;
    }
  }

  return isValid;
}

function showFieldError(field, message) {
  const formGroup = field.closest('.form-group');
  if (!formGroup) return;

  formGroup.classList.add('error');
  
  let errorMessage = formGroup.querySelector('.error-message');
  if (!errorMessage) {
    errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    formGroup.appendChild(errorMessage);
  }
  
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

function clearFieldError(field) {
  const formGroup = field.closest('.form-group');
  if (!formGroup) return;

  formGroup.classList.remove('error');
  
  const errorMessage = formGroup.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.style.display = 'none';
  }
}

// Global functions yang dipanggil dari HTML
window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    
    // Focus ke form pertama jika ada
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    
    // Reset form jika ada
    const form = modal.querySelector('form');
    if (form) {
      form.reset();
      
      // Clear form errors
      const errorElements = form.querySelectorAll('.error-message');
      errorElements.forEach(error => error.style.display = 'none');
      
      const formGroups = form.querySelectorAll('.form-group.error');
      formGroups.forEach(group => group.classList.remove('error'));
      
      // Hide image preview
      const imagePreview = form.querySelector('#image-preview');
      if (imagePreview) {
        imagePreview.style.display = 'none';
      }
    }
  }
}

window.previewImage = function(input) {
  const preview = document.getElementById('image-preview');
  const previewImg = document.getElementById('preview-img');
  
  if (input.files && input.files[0]) {
    const file = input.files[0];
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Hanya file gambar (JPG, PNG, GIF) yang diperbolehkan!');
      input.value = '';
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Ukuran file terlalu besar! Maksimal 5MB.');
      input.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      if (previewImg) {
        previewImg.src = e.target.result;
      }
      if (preview) {
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
}

window.removeImage = function() {
  const input = document.getElementById('image');
  const preview = document.getElementById('image-preview');
  
  if (input) input.value = '';
  if (preview) preview.style.display = 'none';
}

window.showActivityDetail = function(activityId) {
  const activityCard = document.querySelector(`[data-id="${activityId}"]`);
  if (!activityCard) return;
  
  const activityDataScript = activityCard.querySelector('.activity-data');
  if (!activityDataScript) return;
  
  try {
    const activityData = JSON.parse(activityDataScript.textContent);
    
    // Format tanggal dan waktu
    const eventDate = new Date(activityData.event_date);
    const formattedDate = eventDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric", 
      month: "long",
      year: "numeric"
    });
    
    const formattedTime = activityData.event_time.substring(0, 5);
    
    const formattedCreatedAt = new Date(activityData.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    
    // Buat konten modal
    const modalBody = document.getElementById('detail-modal-body');
    const modalTitle = document.getElementById('detail-modal-title');
    
    modalTitle.textContent = activityData.title;
    
    modalBody.innerHTML = `
      <div class="activity-detail-content">
        <div class="activity-detail-image-section">
          ${activityData.image && activityData.image.trim() !== '' ? `
            <div class="activity-detail-image-container">
              <img src="${activityData.image}" 
                   alt="${activityData.title}" 
                   class="activity-detail-image-large"
                   onerror="this.parentElement.innerHTML = '<div class=\\'activity-detail-image-placeholder\\'><i class=\\'fas fa-calendar-alt\\' style=\\'font-size: 5rem; color: white;\\'></i></div>';">
            </div>
          ` : `
            <div class="activity-detail-image-container no-image">
              <div class="activity-detail-image-placeholder">
                <i class="fas fa-calendar-alt" style="font-size: 5rem; color: white; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);"></i>
              </div>
            </div>
          `}
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
            <a href="https://wa.me/${activityData.contact_info.replace(/[^0-9]/g, '')}" 
               target="_blank" 
               class="contact-btn-large">
              <i class="fab fa-whatsapp"></i>
              Hubungi Penyelenggara
            </a>
            <button class="share-btn" onclick="shareActivity('${activityData.title.replace(/'/g, "\\'")}', '${activityData.description.replace(/'/g, "\\'")}')">
              <i class="fas fa-share"></i>
              Bagikan
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Tampilkan modal
    openModal('detail-modal');
  } catch (error) {
    console.error('Error parsing activity data:', error);
    alert('Terjadi kesalahan saat menampilkan detail kegiatan.');
  }
}

window.shareActivity = function(title, description) {
  if (navigator.share) {
    navigator.share({
      title: title,
      text: description,
      url: window.location.href,
    });
  } else {
    // Fallback - copy to clipboard
    const text = `${title}\n\n${description}\n\n${window.location.href}`;
    navigator.clipboard.writeText(text).then(() => {
      alert("Link kegiatan berhasil disalin!");
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert("Link kegiatan berhasil disalin!");
    });
  }
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeString) {
  return timeString.substring(0, 5);
}

// Export utility functions to global scope
window.debounce = debounce;
window.formatDate = formatDate;
window.formatTime = formatTime;