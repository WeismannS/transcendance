import Miku, { useState, useEffect, useRef } from "Miku"
import { redirect } from "Miku/Router"
import { API_URL } from "../../src/services/api.ts"

export default function AuthPage({setIsLoggedIn} : any) {
  const [isVisible, setIsVisible] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  })
  const [ballPosition, setBallPosition] = useState({ x: 20, y: 30 })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [oauthLoading, setOauthLoading] = useState({
    google: false,
    discord: false
  })
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [twoFACode, setTwoFACode] = useState("")
  const [tempToken, setTempToken] = useState("")
  const [pendingUser, setPendingUser] = useState(null)

  useEffect(() => {
    setIsVisible(true)

    // Animated ping pong ball
    const interval = setInterval(() => {
      setBallPosition((prev) => ({
        x: Math.random() * 60 + 20,
        y: Math.random() * 40 + 30,
      }))
    }, 3000)

    // Listen for OAuth messages from popup
    const handleMessage = (event) => {
      // Be more permissive with origins during development
      if (event.origin !== window.location.origin && event.origin !== 'http://localhost:3001') {
        console.log('Message rejected due to origin mismatch')
        return
      }

      console.log('Processing message:', event.data)

      switch (event.data.type) {
        case 'GOOGLE_AUTH_SUCCESS':
          console.log('Google auth success received')
          setOauthLoading(prev => ({ ...prev, google: false }))
          setToast({ message: "Google sign-in successful!", type: "success" })
          // Handle successful login - redirect or update app state
          setTimeout(() => {
            setIsLoggedIn(true)
            redirect('/dashboard') // Redirect to dashboard or home page
          }, 1000)
          break

        case 'GOOGLE_AUTH_2FA_REQUIRED':
          console.log('Google auth 2FA required')
          setOauthLoading(prev => ({ ...prev, google: false }))
          setTempToken(event.data.tempToken)
          setPendingUser(event.data.user)
          setShow2FAModal(true)
          setToast({ message: "2FA verification required", type: "info" })
          break

        case 'GOOGLE_AUTH_ERROR':
          console.log('Google auth error received')
          setOauthLoading(prev => ({ ...prev, google: false }))
          setToast({ message: event.data.error || "Google sign-in failed", type: "error" })
          break

        default:
          console.log('Unknown message type:', event.data.type)
          break
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      clearInterval(interval)
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const [toast, setToast] = useState({ message: "", type: "" })
  const toastTimeoutRef = useRef(null)

  useEffect(() => {
    if (toast.message) {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = setTimeout(() => setToast({ message: "", type: "" }), 3000)
    }
  }, [toast])

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    }

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (isSignUp) {
      if (!formData.name) {
        newErrors.name = "Name is required"
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords don't match"
      }
    }

    setErrors(newErrors)
    return !newErrors.email && !newErrors.password && (!isSignUp || (!newErrors.confirmPassword && !newErrors.name))
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setIsLoading(true)

    try {
      const url = isSignUp ? API_URL + "/api/auth/signup" : API_URL + "/api/auth/login"
      const payload = isSignUp
        ? {
            email: formData.email,
            password: formData.password,
            name: formData.name,
          }
        : {
            email: formData.email,
            password: formData.password,
          }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setToast({ message: isSignUp ? "Sign up successful" : "Login successful", type: "success" })
          setTimeout(() => {
            setIsLoggedIn(true)
            redirect("/dashboard") // Redirect to dashboard or home page
          }, 1000)
        
      } else {
        const errorData = await res.json()
        setToast({ message: errorData.message || "Authentication failed", type: "error" })
        setErrors((prev) => ({
          ...prev,
          email: errorData.message || "Authentication failed",
        }))
      }
    } catch (err) {
      setToast({ message: "Network error", type: "error" })
    }

    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleGoogleLogin = () => {
    setOauthLoading(prev => ({ ...prev, google: true }))
    
    console.log('Opening Google OAuth popup...')
    
    // Open Google OAuth popup
    const popup = window.open(
      API_URL + '/auth/google',
      'google-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    )

    // Check if popup was blocked
    if (!popup) {
      console.log('Popup was blocked')
      setOauthLoading(prev => ({ ...prev, google: false }))
      setToast({ message: "Popup blocked. Please allow popups for this site.", type: "error" })
      return
    }

    console.log('Popup opened successfully')



    // Add timeout fallback
    setTimeout(() => {
      if (!popup.closed) {
        console.log('OAuth timeout - closing popup')
        popup.close()
        clearInterval(checkClosed)
        setOauthLoading(prev => ({ ...prev, google: false }))
        setToast({ message: "OAuth timeout. Please try again.", type: "error" })
      }
    }, 60000) // 1 minute timeout
  }

  const handleDiscordLogin = () => {
    setOauthLoading(prev => ({ ...prev, discord: true }))
    
    // You'll need to implement Discord OAuth similar to Google
    setTimeout(() => {
      setOauthLoading(prev => ({ ...prev, discord: false }))
      setToast({ message: "Discord OAuth not implemented yet", type: "error" })
    }, 1000)
  }

  const handle2FASubmit = async () => {
    if (!twoFACode || twoFACode.length !== 6) {
      setToast({ message: "Please enter a valid 6-digit code", type: "error" })
      return
    }

    try {
      const response = await fetch(API_URL + '/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        credentials: 'include',
        body: JSON.stringify({ code: twoFACode })
      })

      if (response.ok) {
        const data = await response.json()
        setShow2FAModal(false)
        setTwoFACode("")
        setTempToken("")
        setPendingUser(null)
        setToast({ message: "2FA verification successful!", type: "success" })
        // Handle successful login
        console.log('User fully authenticated:', data.user)
      } else {
        const errorData = await response.json()
        setToast({ message: errorData.message || "Invalid 2FA code", type: "error" })
      }
    } catch (error) {
      setToast({ message: "2FA verification failed", type: "error" })
    }
  }

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp)
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    })
    setErrors({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    })
  }

  // Create consistent component arrays to help reconciliation
  const backgroundElements = [
    <div key="bg-dot-1" className="absolute top-20 left-10 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>,
    <div key="bg-dot-2" className="absolute top-40 right-20 w-1 h-1 bg-cyan-400 rounded-full animate-ping"></div>,
    <div key="bg-dot-3" className="absolute bottom-32 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-bounce"></div>,
    <div
      key="ping-pong-ball"
      className="absolute w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-lg transition-all duration-3000 ease-in-out"
      style={{
        left: `${ballPosition.x}%`,
        top: `${ballPosition.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    ></div>,
    <div key="shape-1" className="absolute top-1/4 left-1/4 w-32 h-32 border border-orange-500/20 rounded-full"></div>,
    <div key="shape-2" className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-pink-500/20 rounded-full"></div>
  ]

  // Build form fields array consistently
  const formFields = []
  
  // Always add name field but conditionally show it
  formFields.push(
    <div key="name-field" style={{ display: isSignUp ? 'block' : 'none' }}>
      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
        Full Name
      </label>
      <input
        type="text"
        id="name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
          errors.name
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-600 focus:ring-orange-500 focus:border-orange-500"
        }`}
        placeholder="Enter your full name"
      />
      {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
    </div>
  )

  // Email field
  formFields.push(
    <div key="email-field">
      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
        Email Address
      </label>
      <input
        type="email"
        id="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
          errors.email
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-600 focus:ring-orange-500 focus:border-orange-500"
        }`}
        placeholder="Enter your email"
      />
      {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
    </div>
  )

  // Password field
  formFields.push(
    <div key="password-field">
      <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
        Password
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all pr-12 ${
            errors.password
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-600 focus:ring-orange-500 focus:border-orange-500"
          }`}
          placeholder="Enter your password"
        />
        <button
          key="password-toggle"
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
        >
          {showPassword ? "👁️" : "👁️‍🗨️"}
        </button>
      </div>
      {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
    </div>
  )

  // Always add confirm password field but conditionally show it
  formFields.push(
    <div key="confirm-password-field" style={{ display: isSignUp ? 'block' : 'none' }}>
      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
        Confirm Password
      </label>
      <div className="relative">
        <input
          type={showConfirmPassword ? "text" : "password"}
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all pr-12 ${
            errors.confirmPassword
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-600 focus:ring-orange-500 focus:border-orange-500"
          }`}
          placeholder="Confirm your password"
        />
        <button
          key="confirm-password-toggle"
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
        >
          {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
        </button>
      </div>
      {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
    </div>
  )

  return (
    <div key="auth-page" className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div key="background-container" className="absolute inset-0 overflow-hidden">
        {backgroundElements}
      </div>

      {/* Header */}
      <header key="header" className="relative z-10 px-6 py-8">
        <nav key="nav" className="flex items-center justify-between max-w-7xl mx-auto">
          <div key="logo" className="flex items-center space-x-2">
            <div key="logo-icon" className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">🏓</span>
            </div>
            <span key="logo-text" className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              PingPong Pro
            </span>
          </div>

          <div key="nav-actions" className="flex items-center space-x-4">
            <span key="nav-text" className="text-gray-300">
              {isSignUp ? "Already have an account?" : "New here?"}
            </span>
            <button 
              key="nav-toggle"
              onClick={toggleAuthMode}
              className="border-2 border-orange-500 text-orange-400 px-6 py-2 rounded-full font-semibold hover:bg-orange-500 hover:text-white transition-all"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main key="main" className="relative z-10 px-6 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div key="main-container" className="max-w-md w-full">
          <div
            key="animated-wrapper"
            className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            {/* Auth Card */}
            <div key="auth-card" className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-3xl p-8 shadow-2xl">
              <div key="card-header" className="text-center mb-8">
                <h1 key="card-title" className="text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                    {isSignUp ? "Join the Game" : "Welcome Back"}
                  </span>
                </h1>
                <p key="card-subtitle" className="text-gray-300">
                  {isSignUp ? "Create your account and start playing!" : "Ready to dominate the table?"}
                </p>
              </div>

              {/* Social Login Buttons */}
              <div key="social-buttons" className="space-y-3 mb-6">
                <button
                  key="google-btn"
                  onClick={handleGoogleLogin}
                  disabled={oauthLoading.google}
                  className="w-full bg-white text-gray-900 py-3 px-4 rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {oauthLoading.google ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
                <button
                  key="discord-btn"
                  onClick={handleDiscordLogin}
                  disabled={oauthLoading.discord}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {oauthLoading.discord ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>💬</span>
                      <span>Continue with Discord</span>
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div key="divider" className="flex items-center my-6">
                <div key="divider-left" className="flex-1 border-t border-gray-600"></div>
                <span key="divider-text" className="px-4 text-gray-400 text-sm">or</span>
                <div key="divider-right" className="flex-1 border-t border-gray-600"></div>
              </div>

              {/* Auth Form */}
              <div key="auth-form" className="space-y-6">
                {formFields}

                <div key="form-options" className="flex items-center justify-between">
                  <label key="checkbox-label" className="flex items-center">
                    <input
                      key="checkbox"
                      type="checkbox"
                      className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                    />
                    <span key="checkbox-text" className="ml-2 text-sm text-gray-300">
                      {isSignUp ? "I agree to the Terms of Service" : "Remember me"}
                    </span>
                  </label>
                  <button 
                    key="forgot-password" 
                    type="button" 
                    className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                    style={{ display: !isSignUp ? 'block' : 'none' }}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  key="submit-btn"
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 py-3 px-4 rounded-xl font-bold text-white hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div key="loading-content" className="flex items-center justify-center space-x-2">
                      <div key="spinner" className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span key="loading-text">{isSignUp ? "Creating Account..." : "Signing In..."}</span>
                    </div>
                  ) : (
                    isSignUp ? "Create Account" : "Sign In"
                  )}
                </button>
              </div>

              {/* Footer */}
              <div key="card-footer" className="text-center mt-6">
                <p key="footer-text" className="text-gray-400 text-sm">
                  {isSignUp ? "Already have an account? " : "Don't have an account? "}
                  <button 
                    key="footer-toggle"
                    onClick={toggleAuthMode}
                    className="text-orange-400 hover:text-orange-300 transition-colors font-semibold"
                  >
                    {isSignUp ? "Sign in here" : "Sign up for free"}
                  </button>
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div key="additional-info" className="text-center mt-8">
              <p key="terms-text" className="text-gray-400 text-sm">
                By {isSignUp ? "creating an account" : "signing in"}, you agree to our{" "}
                <button key="terms-link" className="text-orange-400 hover:text-orange-300 transition-colors">Terms of Service</button>
                {" and "}
                <button key="privacy-link" className="text-orange-400 hover:text-orange-300 transition-colors">Privacy Policy</button>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h2>
              <p className="text-gray-300">
                Please enter the 6-digit code from your authenticator app
              </p>
              {pendingUser && (
                <p className="text-sm text-orange-400 mt-2">
                  Signing in as {pendingUser.email}
                </p>
              )}
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500"
                maxLength={6}
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShow2FAModal(false)
                  setTwoFACode("")
                  setTempToken("")
                  setPendingUser(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handle2FASubmit}
                disabled={twoFACode.length !== 6}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.message && (
        <div
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg text-sm font-semibold z-50 transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : toast.type === "info"
              ? "bg-blue-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}