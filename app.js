/* ==========================================
   BloodLink - Main Application Logic
   Phase 1 Frontend Foundation + Phase 2 Supabase Auth
   ========================================== */

import { STATES_AND_DISTRICTS, MOCK_DONORS } from './mockData.js';
import {
  signUpUser,
  sendPhoneOtp,
  verifyPhoneOtp,
  signInUser,
  signOutUser,
  getCurrentSession,
  subscribeAuthState,
  isSupabaseConfigured,
  createBloodRequest,
  fetchUserBloodRequests
} from './supabaseClient.js';

// Application State
const state = {
  selectedBloodGroup: '',
  selectedState: '',
  selectedDistrict: '',
  selectedArea: '',
  donors: [...MOCK_DONORS],
  filteredDonors: [...MOCK_DONORS],
  currentUser: null,
  currentSession: null,
  userProfile: null,
  pendingRegistration: null,
  localSubmittedRequests: []
};

// DOM Elements
const elements = {
  // Filters
  filterBloodGroup: document.getElementById('filter-blood-group'),
  filterState: document.getElementById('filter-state'),
  filterDistrict: document.getElementById('filter-district'),
  filterArea: document.getElementById('filter-area'),
  searchBtn: document.getElementById('search-btn'),
  activeFiltersBar: document.getElementById('active-filters-bar'),
  filterTagsContainer: document.getElementById('filter-tags-container'),
  clearFiltersBtn: document.getElementById('clear-filters-btn'),
  
  // Results
  resultsCountText: document.getElementById('results-count-text'),
  donorCardsGrid: document.getElementById('donor-cards-grid'),
  
  // Navigation & Header Auth State
  mobileToggle: document.getElementById('mobile-toggle'),
  mainNav: document.getElementById('main-nav'),
  navHome: document.getElementById('nav-home'),
  navFind: document.getElementById('nav-find'),
  navRequest: document.getElementById('nav-request'),
  navHospitals: document.getElementById('nav-hospitals'),
  userProfileContainer: document.getElementById('user-profile-container'),
  userChipAvatar: document.getElementById('user-chip-avatar'),
  userChipName: document.getElementById('user-chip-name'),
  userChipType: document.getElementById('user-chip-type'),
  phoneStatusPill: document.getElementById('phone-status-pill'),
  emailStatusPill: document.getElementById('email-status-pill'),
  logoutBtn: document.getElementById('logout-btn'),
  
  // Modals & Auth Controls
  authBtn: document.getElementById('auth-btn'),
  authModal: document.getElementById('auth-modal'),
  closeAuthModal: document.getElementById('close-auth-modal'),
  authModalTitle: document.getElementById('auth-modal-title'),
  authModalTabs: document.getElementById('auth-modal-tabs'),
  tabLogin: document.getElementById('tab-login'),
  tabSignup: document.getElementById('tab-signup'),
  loginForm: document.getElementById('login-form'),
  signupForm: document.getElementById('signup-form'),
  loginSubmitBtn: document.getElementById('login-submit-btn'),
  signupSubmitBtn: document.getElementById('signup-submit-btn'),
  authAlertContainer: document.getElementById('auth-alert-container'),

  // OTP Step UI
  phoneOtpContainer: document.getElementById('phone-otp-container'),
  otpPhoneDisplay: document.getElementById('otp-phone-display'),
  otpInput: document.getElementById('otp-input'),
  verifyOtpBtn: document.getElementById('verify-otp-btn'),
  resendOtpBtn: document.getElementById('resend-otp-btn'),
  otpNoticeArea: document.getElementById('otp-notice-area'),

  // Email Verification UI
  emailNoticeContainer: document.getElementById('email-notice-container'),
  emailNoticeDisplay: document.getElementById('email-notice-display'),
  closeEmailNoticeBtn: document.getElementById('close-email-notice-btn'),

  // Request Modal Elements (Phase 3)
  heroRequestBtn: document.getElementById('hero-request-btn'),
  sideRequestBtn: document.getElementById('side-request-btn'),
  requestModal: document.getElementById('request-modal'),
  closeRequestModal: document.getElementById('close-request-modal'),
  requestAuthGuard: document.getElementById('request-auth-guard'),
  requestGuardLoginBtn: document.getElementById('request-guard-login-btn'),
  requestAuthenticatedView: document.getElementById('request-authenticated-view'),
  requestModalTabs: document.getElementById('request-modal-tabs'),
  tabNewRequest: document.getElementById('tab-new-request'),
  tabMyRequests: document.getElementById('tab-my-requests'),
  requestAlertContainer: document.getElementById('request-alert-container'),
  requestForm: document.getElementById('request-form'),
  reqBlood: document.getElementById('req-blood'),
  reqUnits: document.getElementById('req-units'),
  reqState: document.getElementById('req-state'),
  reqDistrict: document.getElementById('req-district'),
  reqArea: document.getElementById('req-area'),
  reqHospital: document.getElementById('req-hospital'),
  reqDate: document.getElementById('req-date'),
  reqTime: document.getElementById('req-time'),
  reqContact: document.getElementById('req-contact'),
  reqSubmitBtn: document.getElementById('req-submit-btn'),
  myRequestsContainer: document.getElementById('my-requests-container'),
  myRequestsList: document.getElementById('my-requests-list'),

  // Hospitals Modal
  sideHospitalsBtn: document.getElementById('side-hospitals-btn'),
  hospitalsModal: document.getElementById('hospitals-modal'),
  closeHospitalsModal: document.getElementById('close-hospitals-modal'),

  // Become a Donor
  sideDonorBtn: document.getElementById('side-donor-btn'),

  // Contact Donor Modal
  contactModal: document.getElementById('contact-modal'),
  closeContactModal: document.getElementById('close-contact-modal'),
  contactModalContent: document.getElementById('contact-modal-content')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Populate States & Initial Grid
  populateStates();
  populateRequestStates();
  renderDonorGrid(state.filteredDonors);

  // Setup UI Listeners
  setupEventListeners();

  // Initialize Supabase Auth State
  await initSupabaseAuth();
});

// Initialize Supabase Auth & Session
async function initSupabaseAuth() {
  try {
    const { session, user, profile } = await getCurrentSession();
    updateHeaderAuthState(session, user, profile);

    // Subscribe to Auth state updates
    await subscribeAuthState((event, session, profile) => {
      updateHeaderAuthState(session, session?.user, profile);
    });
  } catch (err) {
    console.warn('Auth initialization notice:', err.message);
  }
}

// Update Header Authentication State UI
function updateHeaderAuthState(session, user, profile) {
  state.currentSession = session;
  state.currentUser = user;
  state.userProfile = profile;

  if (session && user) {
    // Show user profile chip, hide login button
    if (elements.authBtn) elements.authBtn.style.display = 'none';
    if (elements.userProfileContainer) elements.userProfileContainer.style.display = 'flex';

    const displayName = profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0];
    const userType = profile?.user_type || user.user_metadata?.user_type || 'User';

    if (elements.userChipName) elements.userChipName.textContent = displayName;
    if (elements.userChipType) elements.userChipType.textContent = userType;
    if (elements.userChipAvatar) elements.userChipAvatar.textContent = displayName.charAt(0).toUpperCase();

    // Update Verification Badges
    const isEmailVerified = !!user.email_confirmed_at || !!profile?.email_verified;
    const isPhoneVerified = !!profile?.phone_verified;

    if (elements.emailStatusPill) {
      elements.emailStatusPill.className = `verification-pill ${isEmailVerified ? 'verified' : 'unverified'}`;
      elements.emailStatusPill.innerHTML = `<i data-lucide="${isEmailVerified ? 'check-circle' : 'mail'}"></i> ${isEmailVerified ? 'Email' : 'Verify Email'}`;
    }

    if (elements.phoneStatusPill) {
      elements.phoneStatusPill.className = `verification-pill ${isPhoneVerified ? 'verified' : 'unverified'}`;
      elements.phoneStatusPill.innerHTML = `<i data-lucide="${isPhoneVerified ? 'check-circle' : 'smartphone'}"></i> ${isPhoneVerified ? 'Phone' : 'Verify Phone'}`;
    }

  } else {
    // Logged-out state
    if (elements.authBtn) elements.authBtn.style.display = 'inline-flex';
    if (elements.userProfileContainer) elements.userProfileContainer.style.display = 'none';
  }

  if (window.lucide) window.lucide.createIcons();
}

// UI Alert Helper in Modal
function showAuthAlert(message, type = 'error') {
  if (!elements.authAlertContainer) return;
  elements.authAlertContainer.className = `auth-alert alert-${type}`;
  elements.authAlertContainer.style.display = 'flex';
  const icon = type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle-2' : type === 'warning' ? 'alert-triangle' : 'info';
  elements.authAlertContainer.innerHTML = `
    <i data-lucide="${icon}"></i>
    <div>${message}</div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

function hideAuthAlert() {
  if (elements.authAlertContainer) {
    elements.authAlertContainer.style.display = 'none';
    elements.authAlertContainer.innerHTML = '';
  }
}

// Loading State Helper for Buttons
function setBtnLoading(btn, isLoading, defaultText) {
  if (!btn) return;
  btn.disabled = isLoading;
  if (isLoading) {
    btn.innerHTML = `<span class="spinner"></span> Loading...`;
  } else {
    btn.innerHTML = `<span>${defaultText}</span>`;
  }
  if (window.lucide) window.lucide.createIcons();
}

// Reset Auth Modal Views
function resetAuthModalViews() {
  hideAuthAlert();
  if (elements.authModalTabs) elements.authModalTabs.style.display = 'flex';
  if (elements.loginForm) elements.loginForm.style.display = 'flex';
  if (elements.signupForm) elements.signupForm.style.display = 'none';
  if (elements.phoneOtpContainer) elements.phoneOtpContainer.style.display = 'none';
  if (elements.emailNoticeContainer) elements.emailNoticeContainer.style.display = 'none';
  if (elements.tabLogin) elements.tabLogin.classList.add('active');
  if (elements.tabSignup) elements.tabSignup.classList.remove('active');
  if (elements.authModalTitle) elements.authModalTitle.textContent = 'Welcome to BloodLink';
}

// Populate States
function populateStates() {
  const states = Object.keys(STATES_AND_DISTRICTS);
  states.forEach(st => {
    const opt = document.createElement('option');
    opt.value = st;
    opt.textContent = st;
    elements.filterState.appendChild(opt);
  });
}

// Handle State Dropdown Change
function handleStateChange() {
  const selectedSt = elements.filterState.value;
  state.selectedState = selectedSt;
  state.selectedDistrict = '';
  state.selectedArea = '';

  elements.filterDistrict.innerHTML = '<option value="">All Districts</option>';
  elements.filterArea.innerHTML = '<option value="">All Areas</option>';
  elements.filterArea.disabled = true;

  if (selectedSt && STATES_AND_DISTRICTS[selectedSt]) {
    elements.filterDistrict.disabled = false;
    const districts = Object.keys(STATES_AND_DISTRICTS[selectedSt]);
    districts.forEach(dist => {
      const opt = document.createElement('option');
      opt.value = dist;
      opt.textContent = dist;
      elements.filterDistrict.appendChild(opt);
    });
  } else {
    elements.filterDistrict.disabled = true;
    elements.filterDistrict.innerHTML = '<option value="">Select State First</option>';
    elements.filterArea.innerHTML = '<option value="">Select District First</option>';
  }
}

// Handle District Dropdown Change
function handleDistrictChange() {
  const selectedSt = elements.filterState.value;
  const selectedDist = elements.filterDistrict.value;
  state.selectedDistrict = selectedDist;
  state.selectedArea = '';

  elements.filterArea.innerHTML = '<option value="">All Areas</option>';

  if (selectedSt && selectedDist && STATES_AND_DISTRICTS[selectedSt]?.[selectedDist]) {
    elements.filterArea.disabled = false;
    const areas = STATES_AND_DISTRICTS[selectedSt][selectedDist];
    areas.forEach(ar => {
      const opt = document.createElement('option');
      opt.value = ar;
      opt.textContent = ar;
      elements.filterArea.appendChild(opt);
    });
  } else {
    elements.filterArea.disabled = true;
    elements.filterArea.innerHTML = '<option value="">Select District First</option>';
  }
}

// Execute Search / Filter
function applyFilters() {
  state.selectedBloodGroup = elements.filterBloodGroup.value;
  state.selectedState = elements.filterState.value;
  state.selectedDistrict = elements.filterDistrict.value;
  state.selectedArea = elements.filterArea.value;

  state.filteredDonors = state.donors.filter(donor => {
    const matchBlood = !state.selectedBloodGroup || donor.bloodGroup === state.selectedBloodGroup;
    const matchState = !state.selectedState || donor.state === state.selectedState;
    const matchDistrict = !state.selectedDistrict || donor.district === state.selectedDistrict;
    const matchArea = !state.selectedArea || donor.area === state.selectedArea;

    return matchBlood && matchState && matchDistrict && matchArea;
  });

  updateActiveFiltersUI();
  renderDonorGrid(state.filteredDonors);
}

// Clear All Filters
function clearFilters() {
  elements.filterBloodGroup.value = '';
  elements.filterState.value = '';
  elements.filterDistrict.innerHTML = '<option value="">Select State First</option>';
  elements.filterDistrict.disabled = true;
  elements.filterArea.innerHTML = '<option value="">Select District First</option>';
  elements.filterArea.disabled = true;

  state.selectedBloodGroup = '';
  state.selectedState = '';
  state.selectedDistrict = '';
  state.selectedArea = '';

  state.filteredDonors = [...state.donors];
  updateActiveFiltersUI();
  renderDonorGrid(state.filteredDonors);
}

// Update Active Filter Tags UI
function updateActiveFiltersUI() {
  const activeTags = [];
  if (state.selectedBloodGroup) activeTags.push({ key: 'bloodGroup', label: `Group: ${state.selectedBloodGroup}` });
  if (state.selectedState) activeTags.push({ key: 'state', label: `State: ${state.selectedState}` });
  if (state.selectedDistrict) activeTags.push({ key: 'district', label: `District: ${state.selectedDistrict}` });
  if (state.selectedArea) activeTags.push({ key: 'area', label: `Area: ${state.selectedArea}` });

  if (activeTags.length > 0) {
    elements.activeFiltersBar.style.display = 'flex';
    elements.filterTagsContainer.innerHTML = activeTags.map(tag => `
      <span class="filter-tag">${tag.label}</span>
    `).join('');
  } else {
    elements.activeFiltersBar.style.display = 'none';
  }
}

// Render Donor Cards Grid
function renderDonorGrid(donorList) {
  elements.resultsCountText.textContent = `Showing ${donorList.length} Verified Donors`;

  if (donorList.length === 0) {
    elements.donorCardsGrid.innerHTML = `
      <div class="no-results">
        <i data-lucide="search-x" class="no-results-icon"></i>
        <h3>No donors found matching your criteria</h3>
        <p style="color: var(--text-muted); margin-top: 0.5rem; margin-bottom: 1.5rem;">
          Try expanding your location or selecting "All Blood Groups".
        </p>
        <button class="btn btn-secondary" id="reset-search-btn">Reset Filters</button>
      </div>
    `;
    document.getElementById('reset-search-btn')?.addEventListener('click', clearFilters);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  elements.donorCardsGrid.innerHTML = donorList.map(donor => {
    const isAvailable = donor.statusType === 'available';
    return `
      <div class="donor-card" id="donor-card-${donor.id}">
        <div class="donor-card-header">
          <div class="donor-profile">
            <div class="donor-avatar">
              ${donor.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div class="donor-name">${donor.name}</div>
              <div class="donor-gender-age">${donor.gender}, ${donor.age} yrs • Donated ${donor.totalDonations}x</div>
            </div>
          </div>
          <div class="blood-badge">
            ${donor.bloodGroup}
            <span>Donor</span>
          </div>
        </div>

        <div class="donor-details">
          <div class="detail-row">
            <i data-lucide="map-pin" style="width: 16px; height: 16px;"></i>
            <span>${donor.area}, ${donor.district}, ${donor.state}</span>
          </div>
          <div class="detail-row">
            <i data-lucide="clock" style="width: 16px; height: 16px;"></i>
            <span>Last Donated: ${donor.lastDonated}</span>
          </div>
          <div class="detail-row">
            <span class="availability-badge ${isAvailable ? 'available' : 'busy'}">
              <i data-lucide="${isAvailable ? 'check-circle-2' : 'alert-circle'}" style="width: 14px; height: 14px;"></i>
              ${donor.availability}
            </span>
          </div>
        </div>

        <div class="donor-card-actions">
          <button class="btn btn-primary btn-sm btn-block contact-donor-btn" data-id="${donor.id}">
            <i data-lucide="phone-call" style="width: 15px; height: 15px;"></i> Contact Donor
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();

  document.querySelectorAll('.contact-donor-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const donorId = e.currentTarget.getAttribute('data-id');
      openContactModal(donorId);
    });
  });
}

// Contact Donor Modal
function openContactModal(donorId) {
  const donor = state.donors.find(d => d.id === donorId);
  if (!donor) return;

  elements.contactModalContent.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <div class="blood-badge" style="margin: 0 auto 0.75rem auto; width: 64px; height: 64px; font-size: 1.5rem;">
        ${donor.bloodGroup}
      </div>
      <h3 style="font-size: 1.25rem; font-weight: 700;">${donor.name}</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem;">${donor.area}, ${donor.district}</p>
    </div>

    <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.95rem;">
        <span style="color: var(--text-muted);">Phone Number:</span>
        <strong style="color: var(--primary-red-dark);">${donor.phone}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.95rem;">
        <span style="color: var(--text-muted);">Email Address:</span>
        <strong>${donor.email}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
        <span style="color: var(--text-muted);">Current Availability:</span>
        <span class="availability-badge ${donor.statusType === 'available' ? 'available' : 'busy'}">${donor.availability}</span>
      </div>
    </div>

    <div style="display: flex; gap: 0.75rem;">
      <a href="tel:${donor.phone}" class="btn btn-primary btn-block" style="text-decoration: none;">
        <i data-lucide="phone"></i> Call Direct
      </a>
      <button class="btn btn-secondary btn-block" id="close-contact-action">Close</button>
    </div>
  `;

  openModal(elements.contactModal);
  if (window.lucide) window.lucide.createIcons();

  document.getElementById('close-contact-action')?.addEventListener('click', () => {
    closeModal(elements.contactModal);
  });
}

// Modal Helpers
function openModal(modalEl) {
  modalEl.classList.add('active');
}

function closeModal(modalEl) {
  modalEl.classList.remove('active');
}

// Setup Event Listeners
function setupEventListeners() {
  // Dropdown & Search Listeners
  elements.filterState.addEventListener('change', handleStateChange);
  elements.filterDistrict.addEventListener('change', handleDistrictChange);
  elements.searchBtn.addEventListener('click', applyFilters);
  elements.clearFiltersBtn.addEventListener('click', clearFilters);

  // Mobile Toggle
  elements.mobileToggle.addEventListener('click', () => {
    elements.mainNav.classList.toggle('active');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      e.target.classList.add('active');
      elements.mainNav.classList.remove('active');
    });
  });

  // Auth Modal Open/Close Controls
  elements.authBtn.addEventListener('click', () => {
    resetAuthModalViews();
    openModal(elements.authModal);
  });

  elements.closeAuthModal.addEventListener('click', () => {
    closeModal(elements.authModal);
  });

  // Tab Switchers
  elements.tabLogin.addEventListener('click', () => {
    hideAuthAlert();
    elements.tabLogin.classList.add('active');
    elements.tabSignup.classList.remove('active');
    elements.loginForm.style.display = 'flex';
    elements.signupForm.style.display = 'none';
    elements.authModalTitle.textContent = 'Login to BloodLink';
  });

  elements.tabSignup.addEventListener('click', () => {
    hideAuthAlert();
    elements.tabSignup.classList.add('active');
    elements.tabLogin.classList.remove('active');
    elements.signupForm.style.display = 'flex';
    elements.loginForm.style.display = 'none';
    elements.authModalTitle.textContent = 'Register Account';
  });

  // ==========================================
  // PHASE 2 - SUPABASE LOGIN HANDLER
  // ==========================================
  elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthAlert();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showAuthAlert('Please enter both Email Address and Password.', 'error');
      return;
    }

    setBtnLoading(elements.loginSubmitBtn, true, 'Login');

    try {
      const data = await signInUser(email, password);
      showAuthAlert('Login successful! Welcome back.', 'success');
      
      setTimeout(() => {
        closeModal(elements.authModal);
        resetAuthModalViews();
        setBtnLoading(elements.loginSubmitBtn, false, 'Login');
      }, 1000);
    } catch (err) {
      setBtnLoading(elements.loginSubmitBtn, false, 'Login');
      if (!isSupabaseConfigured()) {
        // Local dev session fallback when Supabase credentials are not configured in .env
        const demoUser = { id: 'usr_demo_101', email: email, user_metadata: { full_name: email.split('@')[0] } };
        const demoProfile = { full_name: email.split('@')[0], user_type: 'Blood Seeker', phone: '+91 9876543210', phone_verified: true, email_verified: true };
        updateHeaderAuthState({ access_token: 'demo' }, demoUser, demoProfile);
        showAuthAlert(`Notice: Using local dev session (${email}). Update .env for live Supabase integration.`, 'warning');
        setTimeout(() => {
          closeModal(elements.authModal);
          resetAuthModalViews();
        }, 1200);
      } else {
        showAuthAlert(err.message || 'Invalid email or password.', 'error');
      }
    }
  });

  // ==========================================
  // PHASE 2 - SUPABASE REGISTRATION HANDLER
  // ==========================================
  elements.signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthAlert();

    const fullName = document.getElementById('signup-name').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const userType = document.getElementById('signup-usertype').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    // Field Validations
    if (!fullName || !phone || !email || !userType || !password || !confirmPassword) {
      showAuthAlert('Please complete all required fields.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showAuthAlert('Passwords do not match. Please verify your password entry.', 'error');
      return;
    }

    if (password.length < 6) {
      showAuthAlert('Password must be at least 6 characters long.', 'error');
      return;
    }

    setBtnLoading(elements.signupSubmitBtn, true, 'Register Account');

    try {
      const { user } = await signUpUser({
        email,
        password,
        fullName,
        phone,
        userType
      });

      state.pendingRegistration = { user, phone, email, fullName, userType };
      setBtnLoading(elements.signupSubmitBtn, false, 'Register Account');

      // Hide Registration Form & Show Email Verification Notice
      elements.signupForm.style.display = 'none';
      if (elements.authModalTabs) elements.authModalTabs.style.display = 'none';
      if (elements.phoneOtpContainer) elements.phoneOtpContainer.style.display = 'none';
      if (elements.emailNoticeContainer) elements.emailNoticeContainer.style.display = 'block';
      if (elements.emailNoticeDisplay) elements.emailNoticeDisplay.textContent = email;
      if (elements.authModalTitle) elements.authModalTitle.textContent = 'Email Verification Required';

    } catch (err) {
      setBtnLoading(elements.signupSubmitBtn, false, 'Register Account');
      showAuthAlert(err.message || 'Registration failed. Please check your credentials.', 'error');
    }
  });

  // ==========================================
  // PHASE 2 - PHONE OTP VERIFICATION HANDLER
  // ==========================================
  elements.verifyOtpBtn?.addEventListener('click', async () => {
    const otpToken = elements.otpInput.value.trim();
    if (!otpToken || otpToken.length !== 6) {
      if (elements.otpNoticeArea) {
        elements.otpNoticeArea.innerHTML = `
          <div class="auth-alert alert-error"><i data-lucide="alert-circle"></i> Please enter a valid 6-digit OTP code.</div>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
      return;
    }

    const phone = state.pendingRegistration?.phone || '';
    const userId = state.pendingRegistration?.user?.id || state.currentUser?.id;

    setBtnLoading(elements.verifyOtpBtn, true, 'Verify OTP');

    try {
      await verifyPhoneOtp(phone, otpToken, userId);

      setBtnLoading(elements.verifyOtpBtn, false, 'Verify OTP');
      
      // Phone OTP Verified -> Transition to Email Verification Notice Step
      elements.phoneOtpContainer.style.display = 'none';
      elements.emailNoticeContainer.style.display = 'block';
      elements.emailNoticeDisplay.textContent = state.pendingRegistration?.email || 'your email';
      elements.authModalTitle.textContent = 'Email Verification Required';

    } catch (err) {
      setBtnLoading(elements.verifyOtpBtn, false, 'Verify OTP');
      if (elements.otpNoticeArea) {
        elements.otpNoticeArea.innerHTML = `
          <div class="auth-alert alert-error"><i data-lucide="alert-circle"></i> ${err.message}</div>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  });

  // Resend Phone OTP Handler
  elements.resendOtpBtn?.addEventListener('click', async () => {
    const phone = state.pendingRegistration?.phone || '';
    if (!phone) return;

    setBtnLoading(elements.resendOtpBtn, true, 'Resending...');
    try {
      await sendPhoneOtp(phone);
      setBtnLoading(elements.resendOtpBtn, false, 'Resend OTP');
      if (elements.otpNoticeArea) {
        elements.otpNoticeArea.innerHTML = `
          <div class="auth-alert alert-success"><i data-lucide="check-circle-2"></i> Real OTP request sent to ${phone}.</div>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
    } catch (err) {
      setBtnLoading(elements.resendOtpBtn, false, 'Resend OTP');
      if (elements.otpNoticeArea) {
        elements.otpNoticeArea.innerHTML = `
          <div class="auth-alert alert-warning"><i data-lucide="alert-triangle"></i> ${err.message}</div>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  });

  // Close Email Verification Notice
  elements.closeEmailNoticeBtn?.addEventListener('click', () => {
    closeModal(elements.authModal);
    resetAuthModalViews();
  });

  // LOGOUT HANDLER
  elements.logoutBtn?.addEventListener('click', async () => {
    try {
      await signOutUser();
      updateHeaderAuthState(null, null, null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  });

  // ==========================================
  // PHASE 3 - REQUEST BLOOD SYSTEM HANDLERS
  // ==========================================

  // Populate Request Form States & Dynamic Dropdowns
  elements.reqState?.addEventListener('change', handleReqStateChange);
  elements.reqDistrict?.addEventListener('change', handleReqDistrictChange);

  // Open Request Modal
  const openReqModal = () => openRequestModalView();
  elements.heroRequestBtn?.addEventListener('click', openReqModal);
  elements.sideRequestBtn?.addEventListener('click', openReqModal);
  elements.navRequest?.addEventListener('click', (e) => {
    e.preventDefault();
    openReqModal();
  });
  elements.closeRequestModal?.addEventListener('click', () => closeModal(elements.requestModal));

  // Request Guard Login Prompt Button
  elements.requestGuardLoginBtn?.addEventListener('click', () => {
    closeModal(elements.requestModal);
    resetAuthModalViews();
    openModal(elements.authModal);
  });

  // Request Modal Tabs Switcher
  elements.tabNewRequest?.addEventListener('click', () => {
    hideRequestAlert();
    elements.tabNewRequest.classList.add('active');
    elements.tabMyRequests.classList.remove('active');
    elements.requestForm.style.display = 'flex';
    elements.myRequestsContainer.style.display = 'none';
  });

  elements.tabMyRequests?.addEventListener('click', async () => {
    hideRequestAlert();
    elements.tabMyRequests.classList.add('active');
    elements.tabNewRequest.classList.remove('active');
    elements.requestForm.style.display = 'none';
    elements.myRequestsContainer.style.display = 'block';
    await loadUserSubmittedRequests();
  });

  // Blood Request Form Submission
  elements.requestForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideRequestAlert();

    const bloodGroup = elements.reqBlood.value;
    const unitsRequired = elements.reqUnits.value;
    const stateVal = elements.reqState.value;
    const districtVal = elements.reqDistrict.value;
    const areaVal = elements.reqArea.value;
    const hospitalName = elements.reqHospital.value.trim();
    const requiredDate = elements.reqDate.value;
    const requiredTime = elements.reqTime.value;
    const urgencyVal = document.querySelector('input[name="req-urgency"]:checked')?.value || 'Normal';
    const contactPhone = elements.reqContact.value.trim();

    // Field Validations (Requirement 8)
    if (!bloodGroup || !unitsRequired || !stateVal || !districtVal || !areaVal || !hospitalName || !requiredDate || !requiredTime || !urgencyVal || !contactPhone) {
      showRequestAlert('Please complete all required fields.', 'error');
      return;
    }

    if (parseInt(unitsRequired, 10) <= 0) {
      showRequestAlert('Units Required must be at least 1 unit.', 'error');
      return;
    }

    setBtnLoading(elements.reqSubmitBtn, true, 'Submit Blood Request');

    const requestData = {
      blood_group: bloodGroup,
      units_required: unitsRequired,
      state: stateVal,
      district: districtVal,
      area: areaVal,
      hospital_name: hospitalName,
      required_date: requiredDate,
      required_time: requiredTime,
      urgency: urgencyVal,
      contact_phone: contactPhone
    };

    try {
      let createdRecord = null;

      if (isSupabaseConfigured() && state.currentUser) {
        createdRecord = await createBloodRequest(requestData);
      } else {
        // Fallback / local record creation for seamless testing when Supabase credentials are placeholder
        const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req_${Math.random().toString(36).substring(2, 10)}`;
        createdRecord = {
          id: generatedId,
          requester_id: state.currentUser?.id || 'demo-user-id',
          ...requestData,
          status: 'Open',
          created_at: new Date().toISOString()
        };
      }

      if (!state.localSubmittedRequests) state.localSubmittedRequests = [];
      state.localSubmittedRequests.unshift(createdRecord);

      setBtnLoading(elements.reqSubmitBtn, false, 'Submit Blood Request');

      // Requirement 9: Save request, generate/show request ID, show clear success message
      showRequestAlert(`
        <strong style="display: block; font-size: 0.95rem;">Emergency Blood Request Created!</strong>
        <span style="font-size: 0.85rem;">Request ID: <code style="background: rgba(220,38,38,0.15); padding: 2px 6px; border-radius: 4px;">${createdRecord.id}</code></span>
        <div style="margin-top: 0.4rem; font-size: 0.8rem; color: var(--status-available-text);">Your request is now registered in the BloodLink system.</div>
      `, 'success');

      // Reset form fields
      elements.reqBlood.value = '';
      elements.reqUnits.value = '1';
      elements.reqHospital.value = '';

    } catch (err) {
      setBtnLoading(elements.reqSubmitBtn, false, 'Submit Blood Request');
      showRequestAlert(err.message || 'Failed to submit blood request. Please check form data.', 'error');
    }
  });

  // Hospitals Modal Controls
  const openHospModal = () => openModal(elements.hospitalsModal);
  elements.sideHospitalsBtn?.addEventListener('click', openHospModal);
  elements.navHospitals?.addEventListener('click', (e) => {
    e.preventDefault();
    openHospModal();
  });
  elements.closeHospitalsModal?.addEventListener('click', () => closeModal(elements.hospitalsModal));

  document.getElementById('hospital-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Phase 1 UI Notice: Hospital credentials verified for UI demo.');
    closeModal(elements.hospitalsModal);
  });

  // Become a Donor
  elements.sideDonorBtn?.addEventListener('click', () => {
    resetAuthModalViews();
    openModal(elements.authModal);
    elements.tabSignup.click();
  });

  // Contact Modal Close
  elements.closeContactModal?.addEventListener('click', () => closeModal(elements.contactModal));

  // Overlay click to close modals
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });
}

// Request System Helper Functions (Phase 3)
function populateRequestStates() {
  if (!elements.reqState) return;
  elements.reqState.innerHTML = '<option value="">Select State</option>';
  const states = Object.keys(STATES_AND_DISTRICTS);
  states.forEach(st => {
    const opt = document.createElement('option');
    opt.value = st;
    opt.textContent = st;
    elements.reqState.appendChild(opt);
  });
}

function handleReqStateChange() {
  const selectedSt = elements.reqState.value;
  elements.reqDistrict.innerHTML = '<option value="">Select District</option>';
  elements.reqArea.innerHTML = '<option value="">Select Area</option>';
  elements.reqArea.disabled = true;

  if (selectedSt && STATES_AND_DISTRICTS[selectedSt]) {
    elements.reqDistrict.disabled = false;
    const districts = Object.keys(STATES_AND_DISTRICTS[selectedSt]);
    districts.forEach(dist => {
      const opt = document.createElement('option');
      opt.value = dist;
      opt.textContent = dist;
      elements.reqDistrict.appendChild(opt);
    });
  } else {
    elements.reqDistrict.disabled = true;
    elements.reqDistrict.innerHTML = '<option value="">Select State First</option>';
    elements.reqArea.innerHTML = '<option value="">Select District First</option>';
  }
}

function handleReqDistrictChange() {
  const selectedSt = elements.reqState.value;
  const selectedDist = elements.reqDistrict.value;
  elements.reqArea.innerHTML = '<option value="">Select Area</option>';

  if (selectedSt && selectedDist && STATES_AND_DISTRICTS[selectedSt]?.[selectedDist]) {
    elements.reqArea.disabled = false;
    const areas = STATES_AND_DISTRICTS[selectedSt][selectedDist];
    areas.forEach(ar => {
      const opt = document.createElement('option');
      opt.value = ar;
      opt.textContent = ar;
      elements.reqArea.appendChild(opt);
    });
  } else {
    elements.reqArea.disabled = true;
    elements.reqArea.innerHTML = '<option value="">Select District First</option>';
  }
}

function showRequestAlert(message, type = 'error') {
  if (!elements.requestAlertContainer) return;
  elements.requestAlertContainer.className = `auth-alert alert-${type}`;
  elements.requestAlertContainer.style.display = 'flex';
  const icon = type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle-2' : 'info';
  elements.requestAlertContainer.innerHTML = `
    <i data-lucide="${icon}"></i>
    <div>${message}</div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

function hideRequestAlert() {
  if (elements.requestAlertContainer) {
    elements.requestAlertContainer.style.display = 'none';
    elements.requestAlertContainer.innerHTML = '';
  }
}

function openRequestModalView() {
  hideRequestAlert();

  if (!state.currentUser && !state.currentSession) {
    elements.requestAuthGuard.style.display = 'block';
    elements.requestAuthenticatedView.style.display = 'none';
  } else {
    elements.requestAuthGuard.style.display = 'none';
    elements.requestAuthenticatedView.style.display = 'block';

    elements.tabNewRequest.classList.add('active');
    elements.tabMyRequests.classList.remove('active');
    elements.requestForm.style.display = 'flex';
    elements.myRequestsContainer.style.display = 'none';

    if (elements.reqContact && !elements.reqContact.value) {
      elements.reqContact.value = state.userProfile?.phone || state.currentUser?.phone || '';
    }

    if (elements.reqDate && !elements.reqDate.value) {
      const today = new Date().toISOString().split('T')[0];
      elements.reqDate.value = today;
    }
  }

  openModal(elements.requestModal);
  if (window.lucide) window.lucide.createIcons();
}

async function loadUserSubmittedRequests() {
  if (!state.currentUser) return;

  elements.myRequestsList.innerHTML = `
    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
      <span class="spinner" style="border-top-color: var(--primary-red);"></span> Loading submitted requests...
    </div>
  `;

  try {
    let requests = await fetchUserBloodRequests(state.currentUser.id);

    if (state.localSubmittedRequests && state.localSubmittedRequests.length > 0) {
      const existingIds = new Set(requests.map(r => r.id));
      state.localSubmittedRequests.forEach(r => {
        if (!existingIds.has(r.id)) requests.unshift(r);
      });
    }

    renderUserSubmittedRequests(requests);
  } catch (err) {
    console.error('Error fetching user requests:', err);
    elements.myRequestsList.innerHTML = `
      <div class="auth-alert alert-error">
        <i data-lucide="alert-circle"></i> ${err.message || 'Failed to load requests.'}
      </div>
    `;
  }
}

function renderUserSubmittedRequests(requests) {
  if (!requests || requests.length === 0) {
    elements.myRequestsList.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; background: var(--bg-main); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
        <i data-lucide="file-x" style="width: 36px; height: 36px; color: var(--text-light); margin-bottom: 0.5rem;"></i>
        <h4 style="font-size: 1rem; color: var(--text-main); margin-bottom: 0.25rem;">No Blood Requests Found</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">You haven't submitted any blood requests yet.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  elements.myRequestsList.innerHTML = requests.map(req => {
    const isEmergency = req.urgency === 'Emergency';
    const statusClass = (req.status || 'open').toLowerCase();
    const formattedDate = req.required_date ? new Date(req.required_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const formattedCreated = req.created_at ? new Date(req.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now';

    return `
      <div class="request-card" id="req-card-${req.id}">
        <div class="request-card-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="request-id-badge" title="Request ID">ID: ${req.id ? req.id.slice(0, 8) : 'REQ'}</span>
            <span class="availability-badge ${isEmergency ? 'busy' : 'available'}" style="font-size: 0.75rem; padding: 0.15rem 0.5rem;">
              <i data-lucide="${isEmergency ? 'alert-triangle' : 'clock'}" style="width: 12px; height: 12px;"></i>
              ${req.urgency || 'Normal'}
            </span>
          </div>
          <span class="status-badge ${statusClass}">
            ${req.status || 'Open'}
          </span>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div class="blood-badge" style="min-width: 44px; height: 44px; font-size: 1.1rem;">
              ${req.blood_group}
            </div>
            <div>
              <strong style="font-size: 0.95rem; display: block; color: var(--text-main);">${req.units_required} Unit(s) Required</strong>
              <span style="font-size: 0.82rem; color: var(--text-muted);">${req.hospital_name}</span>
            </div>
          </div>
        </div>

        <div class="request-card-details">
          <div><span style="color: var(--text-muted);">Location:</span> <strong>${req.area}, ${req.district}</strong></div>
          <div><span style="color: var(--text-muted);">Required:</span> <strong>${formattedDate} ${req.required_time || ''}</strong></div>
          <div><span style="color: var(--text-muted);">Contact:</span> <strong>${req.contact_phone}</strong></div>
          <div><span style="color: var(--text-muted);">State:</span> <strong>${req.state}</strong></div>
        </div>

        <div class="request-card-meta">
          <span>Submitted: ${formattedCreated}</span>
          <span style="color: var(--primary-red); font-weight: 600;">ID: ${req.id}</span>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

