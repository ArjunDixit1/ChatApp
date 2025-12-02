import { useState, useEffect } from 'react'
import { AuthScreen } from './components/AuthScreen'
import { RoomSelection } from './components/RoomSelection'
import { ChatRoom } from './components/ChatRoom'

type Screen = 'auth' | 'rooms' | 'chat'

export default function App() {
  const [screen, setScreen] = useState<Screen>('auth')
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [currentRoom, setCurrentRoom] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const storedUserId = localStorage.getItem('chatUserId')
    const storedUsername = localStorage.getItem('chatUsername')
    const storedToken = localStorage.getItem('chatAccessToken')
    
    if (storedUserId && storedUsername && storedToken) {
      setUserId(storedUserId)
      setUsername(storedUsername)
      setAccessToken(storedToken)
      setScreen('rooms')
    }
  }, [])

  const handleAuthSuccess = (userId: string, username: string, accessToken: string) => {
    setUserId(userId)
    setUsername(username)
    setAccessToken(accessToken)
    
    // Store in localStorage
    localStorage.setItem('chatUserId', userId)
    localStorage.setItem('chatUsername', username)
    localStorage.setItem('chatAccessToken', accessToken)
    
    setScreen('rooms')
  }

  const handleRoomSelect = (roomId: string, roomName: string) => {
    setCurrentRoom({ id: roomId, name: roomName })
    setScreen('chat')
  }

  const handleLeaveRoom = () => {
    setCurrentRoom(null)
    setScreen('rooms')
  }

  const handleLogout = () => {
    setUsername('')
    setUserId('')
    setAccessToken('')
    setCurrentRoom(null)
    
    // Clear localStorage
    localStorage.removeItem('chatUserId')
    localStorage.removeItem('chatUsername')
    localStorage.removeItem('chatAccessToken')
    
    setScreen('auth')
  }

  return (
    <>
      {screen === 'auth' && <AuthScreen onAuthSuccess={handleAuthSuccess} />}
      
      {screen === 'rooms' && (
        <RoomSelection
          username={username}
          userId={userId}
          onSelectRoom={handleRoomSelect}
          onLogout={handleLogout}
        />
      )}
      
      {screen === 'chat' && currentRoom && (
        <ChatRoom
          roomId={currentRoom.id}
          roomName={currentRoom.name}
          username={username}
          userId={userId}
          onLeave={handleLeaveRoom}
        />
      )}
    </>
  )
}
