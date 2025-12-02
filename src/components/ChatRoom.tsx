import { useEffect, useState, useRef } from 'react'
import { Send, ArrowLeft, Users, Circle, Image as ImageIcon, X, Zap, Activity } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface Message {
  id: string
  userId: string
  username: string
  message: string
  imageUrl?: string
  timestamp: number
}

interface User {
  userId: string
  username: string
  joinedAt: number
}

interface ChatRoomProps {
  roomId: string
  roomName: string
  username: string
  userId: string
  onLeave: () => void
}

interface UserProfile {
  avatarUrl?: string
}

export function ChatRoom({ roomId, roomName, username, userId, onLeave }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showUsers, setShowUsers] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    joinRoom()
    fetchMessages()
    fetchActiveUsers()

    const messageInterval = setInterval(fetchMessages, 1500)
    const usersInterval = setInterval(fetchActiveUsers, 3000)

    return () => {
      clearInterval(messageInterval)
      clearInterval(usersInterval)
      leaveRoom()
    }
  }, [roomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const userIds = Array.from(new Set(messages.map(m => m.userId)))
    userIds.forEach(id => {
      if (!userProfiles[id]) {
        fetchUserProfile(id)
      }
    })
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a8b30827/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      )
      const data = await response.json()
      if (data.user) {
        setUserProfiles(prev => ({
          ...prev,
          [userId]: { avatarUrl: data.user.avatarUrl }
        }))
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const joinRoom = async () => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a8b30827/join-room`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ roomId, username, userId }),
        }
      )
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  const leaveRoom = async () => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a8b30827/leave-room`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ roomId, userId }),
        }
      )
    } catch (error) {
      console.error('Error leaving room:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a8b30827/messages/${roomId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      )
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const fetchActiveUsers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a8b30827/active-users/${roomId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      )
      const data = await response.json()
      setActiveUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching active users:', error)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async () => {
    if (!selectedImage) return null

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedImage)
      formData.append('userId', userId)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a8b30827/upload-chat-image`,
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

      return data.imageUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    } finally {
      setUploading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!inputMessage.trim() && !selectedImage) || sending) return

    setSending(true)
    try {
      let imageUrl = null
      if (selectedImage) {
        imageUrl = await uploadImage()
      }

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a8b30827/send-message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            roomId,
            username,
            userId,
            message: inputMessage.trim() || '📷 Image',
            imageUrl,
          }),
        }
      )
      setInputMessage('')
      setSelectedImage(null)
      setImagePreview(null)
      await fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleLeave = () => {
    leaveRoom()
    onLeave()
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const getUserAvatar = (msgUserId: string, msgUsername: string) => {
    const profile = userProfiles[msgUserId]
    if (profile?.avatarUrl) {
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500 blur-sm opacity-50"></div>
          <img
            src={profile.avatarUrl}
            alt={msgUsername}
            className="relative w-10 h-10 object-cover border border-cyan-400 clip-hexagon"
          />
        </div>
      )
    }
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 blur-sm opacity-75"></div>
        <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-500 to-fuchsia-500 clip-hexagon flex items-center justify-center">
          <span className="text-black text-sm">{msgUsername[0].toUpperCase()}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black cyber-grid scanlines flex flex-col">
      {/* Header */}
      <div className="bg-black/90 border-b-2 border-cyan-500/30 px-4 py-4 shadow-[0_0_20px_rgba(0,255,255,0.2)] relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLeave}
              className="p-2 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all group"
            >
              <ArrowLeft className="w-5 h-5 text-cyan-400 group-hover:animate-pulse" />
            </button>
            <div>
              <h2 className="text-cyan-400 neon-text font-mono uppercase tracking-wider">
                {roomName}
              </h2>
              <p className="text-gray-500 font-mono text-sm flex items-center gap-2">
                <Activity className="w-3 h-3 text-green-400 animate-pulse" />
                {activeUsers.length} USERS_ONLINE
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUsers(!showUsers)}
            className={`flex items-center gap-2 px-4 py-2 border transition-all font-mono text-sm uppercase tracking-wider ${
              showUsers 
                ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-400' 
                : 'border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex max-w-6xl w-full mx-auto overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isOwnMessage = msg.userId === userId
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  {!isOwnMessage && getUserAvatar(msg.userId, msg.username)}
                  
                  <div
                    className={`max-w-xs lg:max-w-md relative group ${
                      isOwnMessage
                        ? 'bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/50'
                        : 'bg-gray-900/80 border border-cyan-500/20'
                    } p-4 clip-corner`}
                  >
                    {/* Glow Effect */}
                    {isOwnMessage && (
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 opacity-0 group-hover:opacity-20 transition-opacity clip-corner"></div>
                    )}

                    <div className="relative z-10">
                      {!isOwnMessage && (
                        <div className="flex items-center gap-1 mb-2">
                          <Zap className="w-3 h-3 text-cyan-500" />
                          <p className="text-cyan-400 font-mono text-sm uppercase tracking-wider">{msg.username}</p>
                        </div>
                      )}
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Shared image"
                          className="mb-2 max-w-full cursor-pointer hover:opacity-80 transition-opacity border border-cyan-500/30"
                          onClick={() => window.open(msg.imageUrl, '_blank')}
                        />
                      )}
                      {msg.message && msg.message !== '📷 Image' && (
                        <p className={`${isOwnMessage ? 'text-cyan-100' : 'text-gray-300'} font-mono`}>
                          {msg.message}
                        </p>
                      )}
                      <p className="mt-2 text-cyan-500/50 font-mono text-xs">
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>

                    {/* Corner Accent */}
                    <div className={`absolute bottom-0 right-0 w-2 h-2 ${isOwnMessage ? 'bg-fuchsia-500' : 'bg-cyan-500/50'}`}></div>
                  </div>
                  
                  {isOwnMessage && getUserAvatar(msg.userId, msg.username)}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-black/90 border-t-2 border-cyan-500/30 p-4 relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
            
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <div className="absolute inset-0 bg-cyan-500 blur-md opacity-50"></div>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="relative h-20 border-2 border-cyan-400"
                />
                <button
                  onClick={() => {
                    setSelectedImage(null)
                    setImagePreview(null)
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-black p-1 hover:bg-red-400 transition-colors border border-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-900 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 text-cyan-400 p-3 transition-all group"
              >
                <ImageIcon className="w-5 h-5 group-hover:animate-pulse" />
              </button>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="TYPE_MESSAGE..."
                className="flex-1 px-4 py-3 bg-gray-900/50 border border-cyan-500/30 text-cyan-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all font-mono uppercase"
                disabled={sending || uploading}
              />
              <button
                type="submit"
                disabled={(!inputMessage.trim() && !selectedImage) || sending || uploading}
                className="relative bg-gradient-to-r from-cyan-500/80 to-fuchsia-500/80 border border-cyan-400 text-black px-6 py-3 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {uploading ? (
                  <div className="relative w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="relative w-5 h-5 group-hover:animate-pulse" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Active Users Sidebar */}
        {showUsers && (
          <div className="w-64 bg-black/90 border-l-2 border-cyan-500/30 p-4 animate-slideIn relative">
            <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-fuchsia-500 to-cyan-500"></div>
            
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-cyan-500/20">
              <Users className="w-5 h-5 text-cyan-400" />
              <h3 className="text-cyan-400 font-mono uppercase tracking-wider">
                Online ({activeUsers.length})
              </h3>
            </div>
            
            <div className="space-y-3">
              {activeUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-3 p-2 border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-500/5 transition-all clip-corner-small"
                >
                  {userProfiles[user.userId]?.avatarUrl ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-500 blur-sm opacity-50"></div>
                      <img
                        src={userProfiles[user.userId].avatarUrl}
                        alt={user.username}
                        className="relative w-8 h-8 object-cover border border-cyan-400 clip-hexagon"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 blur-sm opacity-50"></div>
                      <div className="relative w-8 h-8 bg-gradient-to-br from-cyan-500 to-fuchsia-500 clip-hexagon flex items-center justify-center">
                        <span className="text-black text-xs">{user.username[0].toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Circle className="w-2 h-2 fill-green-400 text-green-400 animate-pulse" />
                      <span className={`font-mono text-sm ${user.userId === userId ? 'text-cyan-400' : 'text-gray-400'}`}>
                        {user.username}
                      </span>
                    </div>
                    {user.userId === userId && (
                      <span className="text-fuchsia-400 font-mono text-xs">YOU</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
