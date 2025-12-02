import { useState, useRef } from 'react'
import { MessageCircle, Mail, Lock, User, Upload, Camera, Zap } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface AuthScreenProps {
  onAuthSuccess: (userId: string, username: string, accessToken: string) => void
}

const supabaseClient = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatar(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async (userId: string) => {
    if (!avatar) return null

    try {
      const formData = new FormData()
      formData.append('file', avatar)
      formData.append('userId', userId)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a8b30827/upload-avatar`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      )

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

      return data.avatarUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      return null
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a8b30827/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, username }),
        }
      )

      const data = await response.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      if (avatar) {
        await uploadAvatar(data.userId)
      }

      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      onAuthSuccess(data.userId, data.username, signInData.session.access_token)
    } catch (error) {
      setError('An error occurred during signup')
      console.error('Signup error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const username = data.user.user_metadata.username
      onAuthSuccess(data.user.id, username, data.session.access_token)
    } catch (error) {
      setError('An error occurred during login')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black cyber-grid scanlines flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Glowing Border Container */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500 opacity-75 blur-lg group-hover:opacity-100 transition duration-1000 animate-borderGlow"></div>
          
          <div className="relative bg-black/90 border-2 border-cyan-500/30 p-8 backdrop-blur-xl">
            {/* Corner Decorations */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-fuchsia-400"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-fuchsia-400"></div>

            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 blur-xl opacity-75 animate-neonPulse"></div>
                <div className="relative bg-gradient-to-br from-cyan-500 to-fuchsia-500 p-4 clip-hexagon">
                  <MessageCircle className="w-12 h-12 text-black" />
                </div>
              </div>
            </div>

            <h1 className="text-center text-cyan-400 neon-text mb-2 tracking-wider uppercase">
              {mode === 'login' ? 'Access Terminal' : 'New User Registration'}
            </h1>
            <p className="text-center text-gray-400 mb-8 font-mono text-sm">
              {mode === 'login' 
                ? '> INITIALIZING SECURE CONNECTION...' 
                : '> CREATE NEW IDENTITY...'}
            </p>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 border border-cyan-500/20">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError('')
                }}
                className={`flex-1 py-2 transition-all font-mono uppercase tracking-wider ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                    : 'text-gray-500 hover:text-cyan-400'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setError('')
                }}
                className={`flex-1 py-2 transition-all font-mono uppercase tracking-wider ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                    : 'text-gray-500 hover:text-cyan-400'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-5">
              {mode === 'signup' && (
                <>
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center mb-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-24 h-24 cursor-pointer group"
                    >
                      {avatarPreview ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 blur-md opacity-75 group-hover:opacity-100 transition"></div>
                          <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="relative w-full h-full object-cover border-2 border-cyan-500 clip-hexagon"
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 blur-md"></div>
                          <div className="relative w-full h-full bg-gray-900 border-2 border-cyan-500/50 clip-hexagon flex items-center justify-center group-hover:border-cyan-400 transition">
                            <Camera className="w-8 h-8 text-cyan-500" />
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center clip-hexagon">
                        <Upload className="w-6 h-6 text-cyan-400" />
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <p className="text-cyan-400/70 mt-2 font-mono text-xs uppercase tracking-wider">Upload Avatar</p>
                  </div>

                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="block text-cyan-400 mb-2 font-mono text-sm uppercase tracking-wider">
                      <Zap className="inline w-3 h-3 mr-1" /> Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-500/50" />
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="ENTER_USERNAME"
                        className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-cyan-500/30 text-cyan-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all font-mono"
                        maxLength={20}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-cyan-400 mb-2 font-mono text-sm uppercase tracking-wider">
                  <Zap className="inline w-3 h-3 mr-1" /> Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-500/50" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="EMAIL@DOMAIN.COM"
                    className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-cyan-500/30 text-cyan-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all font-mono"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-cyan-400 mb-2 font-mono text-sm uppercase tracking-wider">
                  <Zap className="inline w-3 h-3 mr-1" /> Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-500/50" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-cyan-500/30 text-cyan-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all font-mono"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 font-mono text-sm">
                  <span className="text-red-500">ERROR:</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="relative w-full group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition blur"></div>
                <div className="relative bg-gradient-to-r from-cyan-500/80 to-fuchsia-500/80 text-black py-3 border border-cyan-400 group-hover:border-fuchsia-400 transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)] group-hover:shadow-[0_0_30px_rgba(255,0,255,0.5)] font-mono uppercase tracking-wider">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>{mode === 'login' ? 'Authenticating...' : 'Creating...'}</span>
                    </div>
                  ) : (
                    <span>{mode === 'login' ? '> Access System' : '> Create Identity'}</span>
                  )}
                </div>
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-cyan-400/50 mt-6 font-mono text-xs">
          {mode === 'login' 
            ? '> NEW USER? SWITCH TO SIGN UP MODE' 
            : '> EXISTING USER? SWITCH TO LOGIN MODE'}
        </p>
      </div>
    </div>
  )
}
