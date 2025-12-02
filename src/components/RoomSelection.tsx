import { useEffect, useState } from 'react'
import { Users, ArrowRight, LogOut, Hash, Sparkles, Code, Gamepad2, Zap } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface Room {
  id: string
  name: string
  description: string
}

interface RoomSelectionProps {
  username: string
  userId: string
  onSelectRoom: (roomId: string, roomName: string) => void
  onLogout: () => void
}

export function RoomSelection({ username, userId, onSelectRoom, onLogout }: RoomSelectionProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)

  useEffect(() => {
    fetchRooms()
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
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
      if (data.user?.avatarUrl) {
        setUserAvatar(data.user.avatarUrl)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a8b30827/rooms`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      )
      const data = await response.json()
      setRooms(data.rooms || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoomIcon = (roomId: string) => {
    switch (roomId) {
      case 'general':
        return <Hash className="w-6 h-6 text-black" />
      case 'random':
        return <Sparkles className="w-6 h-6 text-black" />
      case 'tech':
        return <Code className="w-6 h-6 text-black" />
      case 'gaming':
        return <Gamepad2 className="w-6 h-6 text-black" />
      default:
        return <Users className="w-6 h-6 text-black" />
    }
  }

  const getRoomColor = (index: number) => {
    const colors = [
      { from: 'from-cyan-500', to: 'to-blue-500', glow: 'rgba(0, 255, 255, 0.3)' },
      { from: 'from-fuchsia-500', to: 'to-pink-500', glow: 'rgba(255, 0, 255, 0.3)' },
      { from: 'from-cyan-400', to: 'to-cyan-600', glow: 'rgba(0, 200, 255, 0.3)' },
      { from: 'from-purple-500', to: 'to-fuchsia-600', glow: 'rgba(200, 0, 255, 0.3)' },
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="min-h-screen bg-black cyber-grid scanlines flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500 opacity-75 blur-lg group-hover:opacity-100 transition duration-1000 animate-borderGlow"></div>
          
          <div className="relative bg-black/90 border-2 border-cyan-500/30 p-8 backdrop-blur-xl">
            {/* Corner Decorations */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-fuchsia-400"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-fuchsia-400"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-cyan-500/20">
              <div className="flex items-center gap-4">
                {userAvatar ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 blur-md animate-neonPulse"></div>
                    <img
                      src={userAvatar}
                      alt={username}
                      className="relative w-16 h-16 object-cover border-2 border-cyan-400 clip-hexagon"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 blur-md animate-neonPulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-500 to-fuchsia-500 clip-hexagon flex items-center justify-center">
                      <span className="text-2xl text-black">{username[0].toUpperCase()}</span>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-cyan-400 font-mono text-sm uppercase tracking-wider mb-1">
                    <Zap className="inline w-3 h-3 mr-1" /> User ID
                  </p>
                  <h1 className="text-cyan-100 neon-text tracking-wide">{username}</h1>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 transition-all font-mono text-sm uppercase tracking-wider group"
              >
                <LogOut className="w-4 h-4 group-hover:animate-pulse" />
                <span>Logout</span>
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-cyan-400 neon-text uppercase tracking-wider mb-2 font-mono">
                Select Communication Channel
              </h2>
              <p className="text-gray-500 font-mono text-sm">{'>'} AVAILABLE_ROOMS.QUERY()</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-fuchsia-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {rooms.map((room, index) => {
                  const color = getRoomColor(index)
                  return (
                    <button
                      key={room.id}
                      onClick={() => onSelectRoom(room.id, room.name)}
                      className="group relative bg-gray-900/50 border border-cyan-500/20 p-6 hover:border-cyan-400 transition-all text-left overflow-hidden"
                    >
                      {/* Hover Glow Effect */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${color.from} ${color.to} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                      
                      {/* Top Edge Indicator */}
                      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${color.from} ${color.to} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className={`absolute inset-0 bg-gradient-to-r ${color.from} ${color.to} blur-md opacity-0 group-hover:opacity-75 transition-opacity`}></div>
                            <div className={`relative bg-gradient-to-br ${color.from} ${color.to} p-4 clip-hexagon group-hover:scale-110 transition-transform`}>
                              {getRoomIcon(room.id)}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Hash className="w-4 h-4 text-cyan-500" />
                              <h3 className="text-cyan-100 group-hover:text-cyan-400 transition-colors font-mono uppercase tracking-wider">
                                {room.name}
                              </h3>
                            </div>
                            <p className="text-gray-500 font-mono text-sm">
                              {'>'} {room.description.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden md:block text-right">
                            <div className="text-cyan-400/50 font-mono text-xs uppercase tracking-wider">Status</div>
                            <div className="text-green-400 font-mono text-sm flex items-center gap-1 justify-end">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(0,255,0,0.5)]"></div>
                              ACTIVE
                            </div>
                          </div>
                          <ArrowRight className={`w-6 h-6 text-gray-600 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all`} />
                        </div>
                      </div>

                      {/* Corner Accents */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/30 group-hover:border-cyan-400 transition-colors"></div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-cyan-400/50 font-mono text-xs">
            {'>'} SECURE_CONNECTION_ESTABLISHED | ENCRYPTION: AES-256
          </p>
        </div>
      </div>
    </div>
  )
}
