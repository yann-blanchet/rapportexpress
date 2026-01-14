<template>
  <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
    <div class="card bg-base-100 shadow-xl w-full max-w-md">
      <div class="card-body">
        <!-- Logo/Title -->
        <div class="text-center mb-6">
          <h1 class="text-3xl font-bold mb-2">RapportExpress</h1>
          <p class="text-base-content/70">Sign in with your email</p>
        </div>

        <!-- Step 1: Email Input -->
        <div v-if="step === 'email'" class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Email Address</span>
            </label>
            <input
              type="email"
              v-model="email"
              @keydown.enter="handleSendOTP"
              placeholder="your.email@example.com"
              class="input input-bordered w-full"
              :class="{ 'input-error': emailError }"
              :disabled="sending"
              autofocus
            />
            <label v-if="emailError" class="label">
              <span class="label-text-alt text-error">{{ emailError }}</span>
            </label>
          </div>

          <button
            @click="handleSendOTP"
            class="btn btn-primary w-full"
            :disabled="!email || sending || !isValidEmail"
          >
            <span v-if="sending" class="loading loading-spinner loading-sm"></span>
            <span v-else>Send Code</span>
          </button>
        </div>

        <!-- Step 2: OTP Verification -->
        <div v-if="step === 'otp'" class="space-y-4">
          <div class="text-center mb-4">
            <p class="text-sm text-base-content/70">
              We sent a 6-digit code to
            </p>
            <p class="font-semibold mt-1">{{ email }}</p>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Enter 6-digit code</span>
            </label>
            <input
              type="text"
              v-model="otpCode"
              @input="handleOTPInput"
              @keydown.enter="handleVerifyOTP"
              placeholder="000000"
              class="input input-bordered w-full text-center text-2xl tracking-widest font-mono"
              :class="{ 'input-error': otpError }"
              :disabled="verifying"
              maxlength="6"
              autofocus
            />
            <label v-if="otpError" class="label">
              <span class="label-text-alt text-error">{{ otpError }}</span>
            </label>
              <label v-else class="label">
                <span class="label-text-alt text-base-content/60">
                  Check your email for the 6-digit code
                </span>
              </label>
          </div>

          <button
            @click="handleVerifyOTP"
            class="btn btn-primary w-full"
            :disabled="!isValidOTP || verifying"
          >
            <span v-if="verifying" class="loading loading-spinner loading-sm"></span>
            <span v-else>Verify Code</span>
          </button>

          <div class="divider">OR</div>

          <button
            @click="step = 'email'; otpCode = ''; otpError = ''; emailForOTP = ''"
            class="btn btn-ghost w-full"
            :disabled="verifying"
          >
            Use different email
          </button>

          <button
            @click="handleResendOTP"
            class="btn btn-link w-full"
            :disabled="resending"
          >
            <span v-if="resending">Resending...</span>
            <span v-else>Resend code</span>
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="alert alert-error mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { sendOTP, verifyOTP } from '../services/auth'

const router = useRouter()

const step = ref('email') // 'email' or 'otp'
const email = ref('')
const emailForOTP = ref('') // Store normalized email used for OTP
const otpCode = ref('')
const sending = ref(false)
const verifying = ref(false)
const resending = ref(false)
const emailError = ref('')
const otpError = ref('')
const errorMessage = ref('')

// Email validation
const isValidEmail = computed(() => {
  if (!email.value) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value.trim())
})

// OTP validation (6 digits)
const isValidOTP = computed(() => {
  return /^\d{6}$/.test(otpCode.value)
})

// Handle OTP input (only allow digits)
function handleOTPInput(event) {
  // Remove any non-digit characters
  otpCode.value = event.target.value.replace(/\D/g, '')
  otpError.value = ''
  errorMessage.value = ''
}

// Send OTP code
async function handleSendOTP() {
  if (!isValidEmail.value) {
    emailError.value = 'Please enter a valid email address'
    return
  }

  sending.value = true
  emailError.value = ''
  errorMessage.value = ''

  // Store normalized email to ensure exact match during verification
  emailForOTP.value = email.value.trim().toLowerCase()
  
  const { error } = await sendOTP(email.value)

  if (error) {
    errorMessage.value = error.message || 'Failed to send code. Please try again.'
    emailError.value = error.message || 'Failed to send code'
  } else {
    // Success - move to OTP step
    step.value = 'otp'
    otpCode.value = ''
  }

  sending.value = false
}

// Verify OTP code
async function handleVerifyOTP() {
  if (!isValidOTP.value) {
    otpError.value = 'Please enter a valid 6-digit code'
    return
  }

  verifying.value = true
  otpError.value = ''
  errorMessage.value = ''

  // Use the stored normalized email to ensure exact match
  const emailToUse = emailForOTP.value || email.value.trim().toLowerCase()
  const { error } = await verifyOTP(emailToUse, otpCode.value)

  if (error) {
    otpError.value = error.message || 'Invalid code. Please try again.'
    errorMessage.value = error.message || 'Invalid code. Please try again.'
    // Clear OTP input on error
    otpCode.value = ''
  } else {
    // Success - redirect to dashboard
    router.push('/')
  }

  verifying.value = false
}

// Resend OTP code
async function handleResendOTP() {
  resending.value = true
  errorMessage.value = ''

  // Ensure we use the same normalized email
  const emailToUse = emailForOTP.value || email.value.trim().toLowerCase()
  emailForOTP.value = emailToUse
  
  const { error } = await sendOTP(email.value)

  if (error) {
    errorMessage.value = error.message || 'Failed to resend code. Please try again.'
  } else {
    // Show success message briefly
    errorMessage.value = ''
    // Clear OTP input
    otpCode.value = ''
  }

  resending.value = false
}

// Auto-focus OTP input when step changes
onMounted(() => {
  // Focus email input on mount
  if (step.value === 'email') {
    setTimeout(() => {
      const emailInput = document.querySelector('input[type="email"]')
      if (emailInput) emailInput.focus()
    }, 100)
  }
})
</script>
