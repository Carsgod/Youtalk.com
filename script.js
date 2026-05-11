// ==========================================
// YOUTALK Website - JavaScript
// ==========================================

// DOM Elements
const navbar = document.getElementById('navbar');
const themeToggle = document.getElementById('theme-toggle');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// ============ THEME MANAGEMENT ============

// Theme Initialization
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Toggle Theme
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.innerHTML = newTheme === 'dark'
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
});

// ============ NAVBAR SCROLL EFFECT ============

let lastScroll = 0;

function handleScroll() {
    const currentScroll = window.pageYOffset;

    // Add/remove scrolled class for background change
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
}

window.addEventListener('scroll', handleScroll);

// ============ MOBILE MENU ============

function toggleMobileMenu() {
    mobileMenuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
}

mobileMenuToggle.addEventListener('click', toggleMobileMenu);

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (navMenu.classList.contains('active')) {
            toggleMobileMenu();
        }
    });
});

// Close mobile menu on resize (if desktop)
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
        toggleMobileMenu();
    }
});

// ============ SMOOTH SCROLLING ============

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            const navbarHeight = navbar.offsetHeight;
            const targetPosition = targetElement.offsetTop - navbarHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // Update active nav link
            navLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// ============ SCROLL-BASED NAV LINK HIGHLIGHTING ============

function highlightNavOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.pageYOffset + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', highlightNavOnScroll);

// ============ ANIMATION ON SCROLL (AOS-like) ============

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Add delay if specified
            const delay = entry.target.getAttribute('data-aos-delay') || 0;
            setTimeout(() => {
                entry.target.classList.add('aos-animate');
            }, delay);
        }
    });
}, observerOptions);

// Observe all elements with data-aos attribute
document.querySelectorAll('[data-aos]').forEach(el => {
    observer.observe(el);
});

// ============ MULTI-STEP BOOKING WIZARD ============

// Stripe variables (initialized in initStripe)
let stripe = null;
let elements = null;
let cardElement = null;
let STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY';

// Available Counselors (simulated)
const counselors = [
    { id: 1, name: 'Dr. Sarah Mensah', role: 'Career Counselor', specialty: 'cd', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', rating: 4.9, reviews: 127, available: [1,2,3,4,5] },
    { id: 2, name: 'Prof. James Osei', role: 'Guidance Counselor', specialty: 'gc', avatar: 'https://randomuser.me/api/portraits/men/2.jpg', rating: 4.8, reviews: 98, available: [1,2,3,5] },
    { id: 3, name: 'Ms. Abigail Asante', role: 'Youth Advisor', specialty: 'teen', avatar: 'https://randomuser.me/api/portraits/women/3.jpg', rating: 4.9, reviews: 156, available: [2,3,4,5] },
    { id: 4, name: 'Dr. Michael Boateng', role: 'Career Counselor', specialty: 'cd', avatar: 'https://randomuser.me/api/portraits/men/4.jpg', rating: 4.7, reviews: 89, available: [1,3,4] },
    { id: 5, name: 'Mrs. Grace Ntim', role: 'Guidance Counselor', specialty: 'gc', avatar: 'https://randomuser.me/api/portraits/women/5.jpg', rating: 4.8, reviews: 112, available: [1,2,4,5] }
];

// Available Time Slots
const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
];

// Wizard State
const wizardState = {
    currentStep: 1,
    totalSteps: 4,
    service: '',
    date: '',
    time: '',
    counselor: null,
    userInfo: {
        name: '',
        email: '',
        phone: '',
        message: ''
    },
    payment: {
        method: 'card',
        cardNumber: '',
        expiry: '',
        cvv: ''
    }
};

// Initialize Stripe
function initStripe() {
    // Read from meta tag (set in index.html)
    const metaKey = document.querySelector('meta[name="stripe-publishable-key"]');
    STRIPE_PUBLISHABLE_KEY = metaKey ? metaKey.content : 'pk_test_YOUR_PUBLISHABLE_KEY';

    if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === 'pk_test_YOUR_PUBLISHABLE_KEY') {
        console.warn('⚠️ Stripe not configured. Using simulation mode.');
        console.log('   Add your Stripe publishable key to index.html meta tag');
        console.log('   Format: <meta name="stripe-publishable-key" content="pk_test_...">');
        return false;
    }

    try {
        stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
        elements = stripe.elements();
        cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': { color: '#aab7c4' },
                    iconColor: '#6772e5'
                },
                invalid: { color: '#dc3545', iconColor: '#dc3545' }
            }
        });
        console.log('✅ Stripe initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Stripe initialization error:', error);
        return false;
    }
}

// Mount Stripe Card Element
function mountCardElement() {
    if (!cardElement) return;

    const cardContainer = document.getElementById('card-element-container');
    if (cardContainer) {
        cardElement.mount('#card-element-container');

        // Real-time validation
        cardElement.on('change', (event) => {
            const displayError = document.getElementById('card-errors');
            if (displayError) {
                if (event.error) {
                    displayError.textContent = event.error.message;
                } else {
                    displayError.textContent = '';
                }
            }
        });
    }
}

// API Configuration
const API_BASE_URL = window.location.origin.includes('localhost')
    ? 'http://localhost:5000/api'
    : window.location.origin + '/api';

// New booking data
let currentBookingReference = null;

// Payment processing with Stripe
async function processStripePayment(paymentData) {
    try {
        // Create payment intent
        const response = await fetch(`${API_BASE_URL}/payments/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Payment creation failed');
        }

        currentBookingReference = result.bookingReference;

        // Confirm payment with Stripe
        const { error, paymentIntent } = await stripe.confirmCardPayment(
            result.clientSecret,
            {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: paymentData.userName,
                        email: paymentData.userEmail,
                        phone: paymentData.userPhone
                    }
                }
            }
        );

        if (error) {
            throw new Error(error.message);
        }

        if (paymentIntent.status !== 'succeeded') {
            throw new Error('Payment not completed');
        }

        // Confirm on backend
        const confirmResponse = await fetch(`${API_BASE_URL}/payments/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                bookingReference: result.bookingReference
            })
        });

        return { success: true, bookingReference: result.bookingReference };

    } catch (error) {
        console.error('Payment error:', error);
        return { success: false, error: error.message };
    }
}

// Process Mobile Money (Simulated)
async function processMobileMoney(paymentData) {
    try {
        showNotification('Mobile Money payment initiated. You will receive a prompt on your phone.', 'info');

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Call backend (would integrate with MTN/Vodafone APIs in production)
        const response = await fetch(`${API_BASE_URL}/payments/mobile-money`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Payment confirmed! Check your phone for the prompt.', 'success');
            return { success: true, bookingReference: result.bookingReference };
        } else {
            throw new Error(result.error || 'Mobile Money payment failed');
        }

    } catch (error) {
        console.error('Mobile Money error:', error);
        return { success: false, error: error.message };
    }
}

// Initialize Wizard
function initBookingWizard() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) {
        console.error('Contact form not found');
        return;
    }

    // Initialize Stripe
    initStripe();

    const wizardHTML = createWizardHTML();
    contactForm.outerHTML = wizardHTML;

    attachWizardEventListeners();
    updateWizardProgress();

    // Mount Stripe card element after DOM is ready
    setTimeout(() => {
        mountCardElement();
    }, 100);
}

// Create Wizard HTML (returns string)
function createWizardHTML() {
    return `
        <div class="booking-wizard" id="booking-wizard">
            <!-- Progress Bar -->
            <div class="wizard-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill"></div>
                </div>
                <div class="progress-steps">
                    <div class="progress-step active" data-step="1">
                        <div class="step-number">1</div>
                        <span class="step-label">Service</span>
                    </div>
                    <div class="progress-step" data-step="2">
                        <div class="step-number">2</div>
                        <span class="step-label">Schedule</span>
                    </div>
                    <div class="progress-step" data-step="3">
                        <div class="step-number">3</div>
                        <span class="step-label">Details</span>
                    </div>
                    <div class="progress-step" data-step="4">
                        <div class="step-number">4</div>
                        <span class="step-label">Payment</span>
                    </div>
                </div>
            </div>

            <!-- Step 1: Service Selection -->
            <div class="wizard-step active" data-step="1">
                <h3>Select a Service</h3>
                <p class="step-description">Choose the service that best fits your needs</p>
                <div class="service-options">
                    <div class="service-option" data-service="cd">
                        <div class="service-icon"><i class="fas fa-briefcase"></i></div>
                        <h4>Career Development</h4>
                        <p>Navigate academic transitions and prepare for your career</p>
                        <span class="service-price">Free Session</span>
                    </div>
                    <div class="service-option" data-service="gc">
                        <div class="service-icon"><i class="fas fa-heart"></i></div>
                        <h4>Guidance & Counselling</h4>
                        <p>Develop self-awareness and navigate life's challenges</p>
                        <span class="service-price">Free Session</span>
                    </div>
                    <div class="service-option" data-service="teen">
                        <div class="service-icon"><i class="fas fa-comments"></i></div>
                        <h4>Teen Talk</h4>
                        <p>Open discussions about personal concerns and questions</p>
                        <span class="service-price">Free Session</span>
                    </div>
                </div>
            </div>

            <!-- Step 2: Schedule Selection -->
            <div class="wizard-step" data-step="2">
                <h3>Select Date & Time</h3>
                <p class="step-description">Choose your preferred counselor and available slot</p>

                <!-- Live Availability Indicator -->
                <div class="availability-indicator">
                    <div class="live-status">
                        <span class="status-dot pulse"></span>
                        <span>Live Availability</span>
                    </div>
                </div>

                <!-- Counselor Selection -->
                <div class="form-group">
                    <label>Select Counselor</label>
                    <div class="counselor-grid" id="counselor-grid"></div>
                </div>

                <!-- Date Picker -->
                <div class="form-group">
                    <label for="session-date">Select Date</label>
                    <input type="date" id="session-date" name="date" min="${getMinDate()}" max="${getMaxDate()}">
                </div>

                <!-- Time Slots -->
                <div class="form-group">
                    <label>Available Time Slots</label>
                    <div class="time-slots" id="time-slots"></div>
                </div>
            </div>

            <!-- Step 3: Personal Details -->
            <div class="wizard-step" data-step="3">
                <h3>Your Information</h3>
                <p class="step-description">Tell us a bit about yourself</p>
                <div class="form-group">
                    <label for="wizard-name">Full Name *</label>
                    <input type="text" id="wizard-name" name="name" placeholder="Enter your full name" required>
                </div>
                <div class="form-group">
                    <label for="wizard-email">Email Address *</label>
                    <input type="email" id="wizard-email" name="email" placeholder="your@email.com" required>
                </div>
                <div class="form-group">
                    <label for="wizard-phone">Phone Number *</label>
                    <input type="tel" id="wizard-phone" name="phone" placeholder="+233 00 000 0000" required>
                </div>
                <div class="form-group">
                    <label for="wizard-message">Additional Information (Optional)</label>
                    <textarea id="wizard-message" name="message" rows="4" placeholder="Anything you'd like us to know..."></textarea>
                </div>
            </div>

            <!-- Step 4: Payment -->
            <div class="wizard-step" data-step="4">
                <h3>Payment</h3>
                <p class="step-description">Secure payment gateway</p>

                <!-- Order Summary -->
                <div class="order-summary">
                    <h4>Order Summary</h4>
                    <div class="summary-item">
                        <span id="summary-service">Career Development</span>
                        <span class="free-badge">FREE</span>
                    </div>
                    <div class="summary-item">
                        <span id="summary-datetime">May 15, 2025 at 10:00 AM</span>
                    </div>
                    <div class="summary-total">
                        <span>Total</span>
                        <span class="amount">$0.00</span>
                    </div>
                    <p class="note">All sessions are currently free thanks to our sponsors</p>
                </div>

                <!-- Payment Method -->
                <div class="payment-methods">
                    <div class="payment-option active" data-method="card">
                        <i class="far fa-credit-card"></i>
                        <span>Credit/Debit Card</span>
                    </div>
                    <div class="payment-option" data-method="mobile">
                        <i class="fas fa-mobile-alt"></i>
                        <span>Mobile Money</span>
                    </div>
                </div>

                <!-- Card Payment Form -->
                <div class="payment-form" id="card-payment-form">
                    <div class="form-group">
                        <label for="card-element">Card Details</label>
                        <div id="card-element-container" style="padding: 12px; border: 2px solid var(--gray-200); border-radius: var(--radius-md); background: white;">
                            <!-- Stripe Card Element will be inserted here -->
                        </div>
                        <div id="card-errors" style="color: #dc3545; font-size: 0.85rem; margin-top: 8px;"></div>
                    </div>
                    <div class="form-group">
                        <label for="card-name">Cardholder Name</label>
                        <input type="text" id="card-name" name="cardName" placeholder="Name on card" required>
                    </div>
                </div>

                <!-- Mobile Money Form -->
                <div class="payment-form hidden" id="mobile-payment-form">
                    <div class="form-group">
                        <label for="mobile-number">Mobile Money Number</label>
                        <input type="tel" id="mobile-number" placeholder="+233 00 000 0000">
                    </div>
                    <div class="form-group">
                        <label for="mobile-provider">Provider</label>
                        <select id="mobile-provider">
                            <option value="">Select Provider</option>
                            <option value="mtn">MTN Mobile Money</option>
                            <option value="vodafone">Vodafone Cash</option>
                            <option value="airtel">AirtelTigo Money</option>
                        </select>
                    </div>
                    <div class="payment-note">
                        <i class="fas fa-info-circle"></i>
                        You'll receive a payment prompt on your phone to confirm the transaction.
                    </div>
                </div>

                <!-- Security Badge -->
                <div class="security-badge">
                    <i class="fas fa-lock"></i>
                    <span>SSL Encrypted Payment</span>
                </div>
            </div>

            <!-- Wizard Navigation -->
            <div class="wizard-navigation">
                <button type="button" class="btn btn-outline" id="prev-btn" disabled>
                    <i class="fas fa-arrow-left"></i> Previous
                </button>
                <button type="button" class="btn btn-primary" id="next-btn">
                    Next <i class="fas fa-arrow-right"></i>
                </button>
                <button type="button" class="btn btn-primary hidden" id="submit-booking">
                    Complete Booking <i class="fas fa-check"></i>
                </button>
            </div>
        </div>
    `;
}

// Attach Wizard Event Listeners
function attachWizardEventListeners() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-booking');

    // Service Selection
    document.querySelectorAll('.service-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.service-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            wizardState.service = option.dataset.service;
            // Reset counselor selection when service changes
            wizardState.counselor = null;
            renderCounselors();
        });
    });

    // Counselor Selection (delegated)
    const counselorGrid = document.getElementById('counselor-grid');
    if (counselorGrid) {
        counselorGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.counselor-card');
            if (!card || card.classList.contains('busy')) return;

            document.querySelectorAll('.counselor-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            wizardState.counselor = parseInt(card.dataset.counselorId);

            // Update time slots if date already selected
            if (wizardState.date) {
                updateTimeSlots();
            }
        });
    }

    // Date Selection
    const dateInput = document.getElementById('session-date');
    if (dateInput) {
        dateInput.addEventListener('change', (e) => {
            wizardState.date = e.target.value;
            updateTimeSlots();
        });
    }

    // Payment Method Selection
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            wizardState.payment.method = option.dataset.method;

            // Show appropriate form
            document.querySelectorAll('.payment-form').forEach(form => form.classList.add('hidden'));
            if (option.dataset.method === 'card') {
                document.getElementById('card-payment-form').classList.remove('hidden');
            } else {
                document.getElementById('mobile-payment-form').classList.remove('hidden');
            }
        });
    });

    // Navigation
    if (prevBtn) prevBtn.addEventListener('click', () => navigateWizard(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateWizard(1));
    if (submitBtn) submitBtn.addEventListener('click', submitBooking);

    // Form Inputs
    const userInputs = ['wizard-name', 'wizard-email', 'wizard-phone', 'wizard-message'];
    userInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                const field = id.replace('wizard-', '');
                wizardState.userInfo[field] = e.target.value;
            });
        }
    });

    // Payment Inputs
    const paymentInputs = ['card-number', 'card-expiry', 'card-cvv', 'card-name', 'mobile-number', 'mobile-provider'];
    paymentInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                if (id === 'card-number') wizardState.payment.cardNumber = e.target.value;
                else if (id === 'card-expiry') wizardState.payment.expiry = e.target.value;
                else if (id === 'card-cvv') wizardState.payment.cvv = e.target.value;
                else if (id === 'card-name') wizardState.payment.cardName = e.target.value;
                else if (id === 'mobile-number') wizardState.payment.mobileNumber = e.target.value;
                else if (id === 'mobile-provider') wizardState.payment.mobileProvider = e.target.value;
            });
        }
    });

    // Card formatting
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCvvInput = document.getElementById('card-cvv');

    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', () => formatCardNumber(cardNumberInput));
    }
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', () => formatExpiry(cardExpiryInput));
    }
    if (cardCvvInput) {
        cardCvvInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
        });
    }
}

// Render Counselors
function renderCounselors() {
    const grid = document.getElementById('counselor-grid');
    if (!grid) return;

    // Show all if no service selected, else filter by service
    const filteredCounselors = wizardState.service
        ? counselors.filter(c => c.specialty === wizardState.service)
        : counselors;

    grid.innerHTML = filteredCounselors.map(counselor => `
        <div class="counselor-card" data-counselor-id="${counselor.id}">
            <div class="counselor-avatar">
                <img src="${counselor.avatar}" alt="${counselor.name}">
                <div class="availability-badge ${counselor.available.length > 0 ? 'available' : 'busy'}">
                    ${counselor.available.length > 0 ? 'Available' : 'Busy'}
                </div>
            </div>
            <h4>${counselor.name}</h4>
            <p class="counselor-role">${counselor.role}</p>
            <div class="counselor-rating">
                <i class="fas fa-star"></i> ${counselor.rating} (${counselor.reviews})
            </div>
            <button type="button" class="btn-select-counselor">Select</button>
        </div>
    `).join('');
}

// Update Time Slots
function updateTimeSlots() {
    const container = document.getElementById('time-slots');
    if (!container) return;

    const selectedCounselor = counselors.find(c => c.id === wizardState.counselor);
    const date = new Date(wizardState.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (!selectedCounselor) {
        container.innerHTML = '<p class="no-slots">Please select a counselor first</p>';
        return;
    }

    // Check if counselor is available on this day
    const isAvailable = selectedCounselor.available.includes(dayOfWeek);

    if (!isAvailable) {
        container.innerHTML = `<p class="no-slots">${selectedCounselor.name} is not available on ${date.toLocaleDateString('en-US', { weekday: 'long' })}. Please choose another date.</p>`;
        return;
    }

    // Generate time slots
    container.innerHTML = timeSlots.map(slot => `
        <div class="time-slot" data-time="${slot}">
            ${slot}
        </div>
    `).join('');

    // Re-attach click handlers using event delegation (handled globally)
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
            wizardState.time = slot.dataset.time;
        });
    });
}

// Get Minimum Date (tomorrow)
function getMinDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

// Get Maximum Date (30 days from now)
function getMaxDate() {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
}

// Navigate Wizard
function navigateWizard(direction) {
    const currentStep = wizardState.currentStep;
    const nextStep = currentStep + direction;

    // Validate current step before proceeding
    if (direction === 1 && !validateStep(currentStep)) {
        return;
    }

    // Update state
    wizardState.currentStep = nextStep;

    // Update UI
    updateWizardSteps();
    updateWizardProgress();

    // Update summary on last step
    if (nextStep === 4) {
        updateOrderSummary();
    }

    // Toggle navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-booking');

    prevBtn.disabled = nextStep === 1;
    nextBtn.classList.toggle('hidden', nextStep === 4);
    submitBtn.classList.toggle('hidden', nextStep !== 4);
}

// Validate Step
function validateStep(step) {
    let isValid = true;
    let message = '';

    switch(step) {
        case 1:
            if (!wizardState.service) {
                isValid = false;
                message = 'Please select a service';
            }
            break;
        case 2:
            if (!wizardState.counselor) {
                isValid = false;
                message = 'Please select a counselor';
            } else if (!wizardState.date) {
                isValid = false;
                message = 'Please select a date';
            } else if (!wizardState.time) {
                isValid = false;
                message = 'Please select a time slot';
            }
            break;
        case 3:
            const { name, email, phone } = wizardState.userInfo;
            if (!name || !email || !phone) {
                isValid = false;
                message = 'Please fill in all required fields';
            } else if (!isValidEmail(email)) {
                isValid = false;
                message = 'Please enter a valid email address';
            }
            break;
        case 4:
            // Validate payment based on method
            if (wizardState.payment.method === 'card') {
                const cardName = document.getElementById('card-name').value;
                if (!cardName || cardName.trim().length < 2) {
                    isValid = false;
                    message = 'Please enter cardholder name';
                } else if (!cardElement) {
                    isValid = false;
                    message = 'Stripe not initialized. Please check configuration.';
                }
            } else if (wizardState.payment.method === 'mobile') {
                const mobileNumber = document.getElementById('mobile-number').value;
                const provider = document.getElementById('mobile-provider').value;
                if (!mobileNumber) {
                    isValid = false;
                    message = 'Please enter your mobile money number';
                } else if (!provider) {
                    isValid = false;
                    message = 'Please select your mobile money provider';
                }
            }
            break;
    }

    if (!isValid) {
        showNotification(message, 'error');
        shakeStep();
    }

    return isValid;
}

// Update Order Summary
function updateOrderSummary() {
    const serviceNames = {
        'cd': 'Career Development',
        'gc': 'Guidance & Counselling',
        'teen': 'Teen Talk'
    };

    const counselor = counselors.find(c => c.id === wizardState.counselor);
    const serviceName = serviceNames[wizardState.service] || 'Career Development';

    document.getElementById('summary-service').textContent = serviceName;
    document.getElementById('summary-datetime').textContent = formatDateTime();
}

// Format Date & Time
function formatDateTime() {
    const date = new Date(wizardState.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `${formattedDate} at ${wizardState.time}`;
}

// Update Wizard Steps
function updateWizardSteps() {
    document.querySelectorAll('.wizard-step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.toggle('active', stepNum === wizardState.currentStep);
    });

    document.querySelectorAll('.progress-step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.toggle('active', stepNum <= wizardState.currentStep);
    });
}

// Update Progress Bar
function updateWizardProgress() {
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        const progress = ((wizardState.currentStep - 1) / (wizardState.totalSteps - 1)) * 100;
        progressFill.style.width = `${progress}%`;
    }
}

// Shake Animation for Validation
function shakeStep() {
    const activeStep = document.querySelector('.wizard-step.active');
    activeStep.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        activeStep.style.animation = '';
    }, 500);
}

// Submit Booking
async function submitBooking() {
    if (!validateStep(3) || !validateStep(4)) return;

    const submitBtn = document.getElementById('submit-booking');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    // Prepare payment data for API
    const counselor = counselors.find(c => c.id === wizardState.counselor);

    const paymentData = {
        service: wizardState.service,
        counselorId: wizardState.counselor,
        counselorName: counselor ? counselor.name : 'Unknown',
        date: wizardState.date,
        time: wizardState.time,
        userName: wizardState.userInfo.name,
        userEmail: wizardState.userInfo.email,
        userPhone: wizardState.userInfo.phone,
        userMessage: wizardState.userInfo.message,
        currency: 'usd', // Sessions are free, set to USD
        amount: 0 // Free sessions
    };

    let result;

    try {
        // Process based on payment method
        if (wizardState.payment.method === 'card') {
            result = await processStripePayment(paymentData);
        } else {
            result = await processMobileMoney(paymentData);
        }

        if (!result.success) {
            throw new Error(result.error || 'Payment failed');
        }

        // Save reference for confirmation
        currentBookingReference = result.bookingReference;

        // Show success
        await showBookingSuccess();

    } catch (error) {
        console.error('Booking error:', error);
        showNotification(`Payment failed: ${error.message}`, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Complete Booking <i class="fas fa-check"></i>';
    }
}

// Show Booking Success
async function showBookingSuccess() {
    const counselor = counselors.find(c => c.id === wizardState.counselor);
    const serviceNames = {
        'cd': 'Career Development',
        'gc': 'Guidance & Counselling',
        'teen': 'Teen Talk'
    };

    // Fetch booking details from backend
    let bookingDetails = wizardState;
    if (currentBookingReference) {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${currentBookingReference}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    bookingDetails = result.booking;
                }
            }
        } catch (error) {
            console.error('Error fetching booking:', error);
        }
    }

    const confirmationHTML = `
        <div class="booking-confirmation">
            <div class="confirmation-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>Booking Confirmed!</h3>
            <p>Your session has been scheduled</p>

            <div class="confirmation-details">
                <div class="detail-item">
                    <i class="fas fa-user-tie"></i>
                    <span>${counselor.name}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDateTime()}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-tag"></i>
                    <span>${serviceNames[wizardState.service]}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-envelope"></i>
                    <span>Confirmation sent to ${wizardState.userInfo.email}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-hashtag"></i>
                    <span>Ref: ${currentBookingReference || 'N/A'}</span>
                </div>
            </div>

            <div class="confirmation-actions">
                <button class="btn btn-primary" id="add-to-calendar">
                    <i class="far fa-calendar-alt"></i> Add to Calendar
                </button>
                <button class="btn btn-outline" id="new-booking">
                    Book Another Session
                </button>
            </div>
        </div>
    `;

    // Replace wizard with confirmation
    const wizard = document.getElementById('booking-wizard');
    wizard.innerHTML = confirmationHTML;

    // Attach confirmation handlers
    document.getElementById('add-to-calendar').addEventListener('click', () => {
        addToCalendar();
    });

    document.getElementById('new-booking').addEventListener('click', () => {
        resetWizard();
    });
}

// Add to Calendar (generate .ics file)
function addToCalendar() {
    const serviceNames = {
        'cd': 'Career Development',
        'gc': 'Guidance & Counselling',
        'teen': 'Teen Talk'
    };

    const counselor = counselors.find(c => c.id === wizardState.counselor);
    const startDate = new Date(`${wizardState.date}T${convertTo24Hour(wizardState.time)}`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour session

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//YOUTALK//Session Booking//EN
BEGIN:VEVENT
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:YOUTALK ${serviceNames[wizardState.service]} Session
DESCRIPTION:Session with ${counselor.name} at YOUTALK Centre
LOCATION:Accra, Ghana
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'youtalk-session.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Calendar event downloaded!', 'success');
}

function formatICSDate(date) {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
}

function convertTo24Hour(time12h) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (modifier === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
    if (modifier === 'AM' && hours === '12') hours = '00';
    return `${hours}:${minutes}:00`;
}

// Reset Wizard
function resetWizard() {
    // Reset state
    wizardState.currentStep = 1;
    wizardState.service = '';
    wizardState.date = '';
    wizardState.time = '';
    wizardState.counselor = null;
    wizardState.userInfo = { name: '', email: '', phone: '', message: '' };
    wizardState.payment = { method: 'card', cardNumber: '', expiry: '', cvv: '' };

    // Replace wizard with fresh HTML
    const existingWizard = document.getElementById('booking-wizard');
    if (existingWizard) {
        const wizardHTML = createWizardHTML();
        existingWizard.outerHTML = wizardHTML;
    }

    // Re-attach event listeners
    attachWizardEventListeners();
    updateWizardProgress();
    initLiveAvailability();
}

// Utility Functions
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <p>${message}</p>
        </div>
        <button class="notification-close">&times;</button>
    `;

    // Add notification styles if not already added
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                max-width: 400px;
                padding: 16px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                z-index: 10000;
                animation: slideIn 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            [data-theme="dark"] .notification {
                background: var(--gray-200, #1a1a1a);
                color: var(--white, #ffffff);
            }
            .notification-success { border-left: 4px solid #10b981; }
            .notification-error { border-left: 4px solid #ef4444; }
            .notification-info { border-left: 4px solid #3b82f6; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .notification-content i {
                font-size: 1.2rem;
            }
            .notification-success .notification-content i { color: #10b981; }
            .notification-error .notification-content i { color: #ef4444; }
            .notification-info .notification-content i { color: #3b82f6; }
            .notification-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #6b7280;
                line-height: 1;
            }
            [data-theme="dark"] .notification-close { color: var(--gray-600, #aaaaaa); }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// ============ COUNSELOR LIVE AVAILABILITY INDICATOR ============

let liveAvailabilityInterval = null;

function initLiveAvailability() {
    const indicator = document.querySelector('.availability-indicator');
    if (!indicator) return;

    // Clear existing interval to avoid duplicates
    if (liveAvailabilityInterval) {
        clearInterval(liveAvailabilityInterval);
    }

    // Simulate live updates
    liveAvailabilityInterval = setInterval(() => {
        const statusDot = indicator.querySelector('.status-dot');
        const statusText = indicator.querySelector('.live-status span:last-child');

        if (!statusDot || !statusText) return;

        // Randomly change availability (just for demo)
        const isLive = Math.random() > 0.3;
        statusDot.classList.toggle('pulse', isLive);
        statusText.textContent = isLive ? 'Live Availability' : 'Updating...';
    }, 5000);
}

// ============ PAYMENT FORMATTING ============

// Format card number with spaces
function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '').replace(/\D/g, '');
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) formattedValue += ' ';
        formattedValue += value[i];
    }
    input.value = formattedValue;
}

// Format expiry date (MM/YY)
function formatExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
}

// ============ INITIALIZATION ============

function initAll() {
    initTheme();
    highlightNavOnScroll();
    initScrollProgress();
    initScrollIndicator();
    initBackToTop();
    initStatsCounter();

    // Simple contact form handler
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            console.log('Contact form submitted:', data);
            showNotification('Thank you! We have received your message and will get back to you soon.', 'success');
            this.reset();
        });
    }

    initLiveAvailability();

    // Recalculate orbital positions on window resize (debounced)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Removed orbital layout recalculation
        }, 250);
    });

    // Trigger initial animations for elements in view
    document.querySelectorAll('[data-aos]').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            const delay = el.getAttribute('data-aos-delay') || 0;
            setTimeout(() => el.classList.add('aos-animate'), delay);
        }
    });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
} else {
    // DOM already loaded
    initAll();
}

// ============ SCROLL PROGRESS BAR ============

function initScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        progressBar.style.width = `${Math.min(progress, 100)}%`;
    });
}

// ============ FLOATING SCROLL INDICATOR ============

function initScrollIndicator() {
    const indicator = document.getElementById('scroll-indicator');
    const dots = document.querySelectorAll('.indicator-dot');
    const sections = document.querySelectorAll('section[id]');

    // Show indicator after scrolling past hero
    const heroSection = document.getElementById('home');
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                indicator.classList.remove('visible');
            } else {
                indicator.classList.add('visible');
            }
        });
    }, { threshold: 0.3 });

    if (heroSection) heroObserver.observe(heroSection);

    // Click to scroll to section
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const targetId = dot.getAttribute('data-target');
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                const navbarHeight = document.getElementById('navbar').offsetHeight;
                window.scrollTo({
                    top: targetEl.offsetTop - navbarHeight,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Update active dot on scroll
    const observerOptions = {
        root: null,
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                dots.forEach(dot => {
                    dot.classList.toggle('active', dot.getAttribute('data-target') === `#${id}`);
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));
}

// ============ BACK TO TOP BUTTON ============

function initBackToTop() {
    const btn = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============ STATS COUNTER ANIMATION ============

function initStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number');

    const animateCounter = (el) => {
        const target = parseInt(el.getAttribute('data-count'));
        if (!target || isNaN(target)) return;

        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                el.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                el.textContent = target;
            }
        };

        updateCounter();
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => {
        // Check if data-count exists (set in HTML)
        if (stat.hasAttribute('data-count')) {
            observer.observe(stat);
        }
    });
}

// ============ KEYBOARD ACCESSIBILITY ============

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        toggleMobileMenu();
    }
});

// ============ PERFORMANCE OPTIMIZATION ============

let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            handleScroll();
            highlightNavOnScroll();
            ticking = false;
        });
        ticking = true;
    }
});



// ============ PRISM/PARTICLE EFFECT ============

function createPrismEffect() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'prism-canvas';
    canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        opacity: 0.3;
    `;
    hero.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.color = Math.random() > 0.5 ? '#FF6B35' : '#800020';
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    ctx.strokeStyle = `rgba(255, 107, 53, ${0.2 * (1 - distance / 100)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });
        });

        requestAnimationFrame(animate);
    }

    animate();
}

window.addEventListener('load', () => {
    setTimeout(createPrismEffect, 1000);
});
