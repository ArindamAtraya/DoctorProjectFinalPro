// Reviews and Ratings System
class ReviewsSystem {
    constructor() {
        this.reviews = JSON.parse(localStorage.getItem('reviews')) || [];
        this.doctors = JSON.parse(localStorage.getItem('doctors')) || [
            { id: 'doc1', name: 'Dr. Sarah Wilson', specialty: 'Cardiology' },
            { id: 'doc2', name: 'Dr. Raj Sharma', specialty: 'Dermatology' },
            { id: 'doc3', name: 'Dr. Priya Mehta', specialty: 'Pediatrics' }
        ];
    }

    submitReview(reviewData) {
        const review = {
            id: this.generateId(),
            ...reviewData,
            createdAt: new Date().toISOString(),
            helpful: 0,
            verified: true
        };
        
        this.reviews.unshift(review);
        this.saveToStorage();
        return review;
    }

    getAllReviews() {
        return this.reviews;
    }

    getDoctorReviews(doctorId) {
        return this.reviews.filter(review => review.doctorId === doctorId);
    }

    getUserReviews(userId) {
        return this.reviews.filter(review => review.patientId === userId);
    }

    searchReviews(query) {
        return this.reviews.filter(review => 
            review.title.toLowerCase().includes(query.toLowerCase()) ||
            review.comment.toLowerCase().includes(query.toLowerCase()) ||
            review.doctorName.toLowerCase().includes(query.toLowerCase())
        );
    }

    markHelpful(reviewId) {
        const review = this.reviews.find(r => r.id === reviewId);
        if (review) {
            review.helpful = (review.helpful || 0) + 1;
            this.saveToStorage();
        }
    }

    deleteReview(reviewId) {
        this.reviews = this.reviews.filter(r => r.id !== reviewId);
        this.saveToStorage();
    }

    getRatingStats() {
        const reviews = this.getAllReviews();
        if (reviews.length === 0) {
            return {
                average: 0,
                total: 0,
                breakdown: {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
            };
        }

        const total = reviews.length;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        const average = sum / total;

        const breakdown = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
        reviews.forEach(review => {
            breakdown[review.rating]++;
        });

        return {
            average: parseFloat(average.toFixed(1)),
            total: total,
            breakdown: breakdown
        };
    }

    generateId() {
        return 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    saveToStorage() {
        localStorage.setItem('reviews', JSON.stringify(this.reviews));
    }
}

const reviewsSystem = new ReviewsSystem();

// Initialize Reviews Page
document.addEventListener('DOMContentLoaded', function() {
    loadReviews();
    setupEventListeners();
    populateDoctorFilters();
    updateRatingOverview();
});

function setupEventListeners() {
    // Review form submission
    document.getElementById('reviewForm').addEventListener('submit', handleReviewSubmit);
    
    // Search functionality
    document.getElementById('searchReviews').addEventListener('input', function() {
        if (this.value.length === 0) {
            loadReviews();
        }
    });
    
    // Modal controls
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Star rating input
    setupStarRating();
}

function setupStarRating() {
    const stars = document.querySelectorAll('.star-rating-input .star');
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            const rating = index + 1;
            document.getElementById('ratingValue').value = rating;
            
            // Update star display
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.innerHTML = '<i class="fas fa-star"></i>';
                } else {
                    s.innerHTML = '<i class="far fa-star"></i>';
                }
            });
        });
    });
}

function populateDoctorFilters() {
    const doctorFilter = document.getElementById('doctorFilter');
    const reviewDoctor = document.getElementById('reviewDoctor');
    
    reviewsSystem.doctors.forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor.id;
        option.textContent = `${doctor.name} - ${doctor.specialty}`;
        
        doctorFilter.appendChild(option.cloneNode(true));
        reviewDoctor.appendChild(option);
    });
}

function loadReviews() {
    const ratingFilter = document.getElementById('filterRating').value;
    const doctorFilter = document.getElementById('doctorFilter').value;
    const sortBy = document.getElementById('sortReviews').value;
    
    let reviews = reviewsSystem.getAllReviews();
    
    // Apply filters
    if (ratingFilter !== 'all') {
        reviews = reviews.filter(review => review.rating === parseInt(ratingFilter));
    }
    
    if (doctorFilter !== 'all') {
        reviews = reviews.filter(review => review.doctorId === doctorFilter);
    }

    // Sort reviews
    reviews.sort((a, b) => {
        switch(sortBy) {
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'highest':
                return b.rating - a.rating;
            case 'lowest':
                return a.rating - b.rating;
            default: // newest
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    displayReviews(reviews);
}

function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    
    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-medical"></i>
                <h3>No reviews found</h3>
                <p>Be the first to share your experience</p>
                <button class="btn btn-primary" onclick="showReviewModal()">
                    <i class="fas fa-pen"></i> Write a Review
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-avatar">
                        ${review.patientName.charAt(0).toUpperCase()}
                    </div>
                    <div class="reviewer-details">
                        <h4>${review.patientName}</h4>
                        <div class="review-date">${formatRelativeTime(review.createdAt)}</div>
                    </div>
                </div>
                <div class="review-rating">
                    <div class="star-rating">
                        ${generateStarRating(review.rating)}
                    </div>
                    <span class="rating-value">${review.rating.toFixed(1)}</span>
                </div>
            </div>

            <div class="review-content">
                <h3>${review.title}</h3>
                <div class="review-text">
                    ${review.comment}
                </div>
                
                <div class="review-meta">
                    <span class="doctor-name">Dr. ${review.doctorName}</span>
                    ${review.appointmentType ? `<span class="appointment-type">${review.appointmentType} appointment</span>` : ''}
                    ${review.waitTime ? `<span class="wait-time">Wait time: ${review.waitTime} mins</span>` : ''}
                </div>
            </div>

            <div class="review-actions">
                <button class="btn btn-outline btn-sm" onclick="markHelpful('${review.id}')">
                    <i class="fas fa-thumbs-up"></i> Helpful (${review.helpful || 0})
                </button>
                ${canDeleteReview(review) ? `
                <button class="btn btn-danger btn-sm" onclick="deleteReview('${review.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function updateRatingOverview() {
    const stats = reviewsSystem.getRatingStats();
    
    document.getElementById('overallRating').textContent = stats.average;
    document.getElementById('totalReviews').textContent = `Based on ${stats.total} reviews`;
    
    // Generate stars
    const starsContainer = document.getElementById('overallStars');
    starsContainer.innerHTML = generateStarRating(stats.average);
    
    // Generate rating breakdown
    const breakdownContainer = document.getElementById('ratingBreakdown');
    breakdownContainer.innerHTML = '';
    
    for (let rating = 5; rating >= 1; rating--) {
        const count = stats.breakdown[rating] || 0;
        const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
        
        const bar = document.createElement('div');
        bar.className = 'rating-bar';
        bar.innerHTML = `
            <div class="rating-label">${rating} Star</div>
            <div class="rating-progress">
                <div class="rating-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="rating-number">${count}</div>
        `;
        breakdownContainer.appendChild(bar);
    }
}

function generateStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function handleReviewSubmit(e) {
    e.preventDefault();
    
    const rating = parseInt(document.getElementById('ratingValue').value);
    const title = document.getElementById('reviewTitle').value;
    const comment = document.getElementById('reviewText').value;
    const doctorId = document.getElementById('reviewDoctor').value;
    const appointmentType = document.getElementById('appointmentType').value;
    const waitTime = document.getElementById('waitTime').value;

    if (!rating) {
        alert('Please select a rating');
        return;
    }

    const doctor = reviewsSystem.doctors.find(d => d.id === doctorId);
    if (!doctor) {
        alert('Please select a doctor');
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const reviewData = {
        doctorId: doctorId,
        doctorName: doctor.name,
        patientId: currentUser ? currentUser.id : 'user_' + Date.now(),
        patientName: currentUser ? currentUser.name : 'Anonymous User',
        rating: rating,
        title: title,
        comment: comment,
        appointmentType: appointmentType,
        waitTime: waitTime ? parseInt(waitTime) : null
    };

    // Submit review
    const newReview = reviewsSystem.submitReview(reviewData);
    
    // Show success message
    showNotification('Thank you for your review!', 'success');
    closeAllModals();
    
    // Reload reviews and update overview
    loadReviews();
    updateRatingOverview();
    
    // Reset form
    document.getElementById('reviewForm').reset();
    document.querySelectorAll('.star-rating-input .star').forEach(star => {
        star.innerHTML = '<i class="far fa-star"></i>';
    });
}

function markHelpful(reviewId) {
    reviewsSystem.markHelpful(reviewId);
    showNotification('Thanks for your feedback!', 'info');
    loadReviews();
}

function deleteReview(reviewId) {
    if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        reviewsSystem.deleteReview(reviewId);
        showNotification('Review deleted successfully', 'success');
        loadReviews();
        updateRatingOverview();
    }
}

function searchReviews() {
    const query = document.getElementById('searchReviews').value;
    if (query.trim() === '') {
        loadReviews();
        return;
    }
    
    const results = reviewsSystem.searchReviews(query);
    displayReviews(results);
}

function showReviewModal() {
    document.getElementById('writeReviewModal').style.display = 'flex';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function canDeleteReview(review) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return currentUser && (
        currentUser.role === 'admin' || 
        (currentUser.id === review.patientId)
    );
}

// Utility functions
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
        return 'Today';
    } else if (diffInDays === 1) {
        return 'Yesterday';
    } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
}

function showNotification(message, type = 'info') {
    alert(message);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}