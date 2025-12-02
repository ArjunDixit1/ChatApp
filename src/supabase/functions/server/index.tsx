import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

// Initialize storage buckets
async function initializeStorage() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    
    const avatarBucketName = 'make-a8b30827-avatars'
    const chatImagesBucketName = 'make-a8b30827-chat-images'
    
    const avatarBucketExists = buckets?.some(bucket => bucket.name === avatarBucketName)
    if (!avatarBucketExists) {
      await supabase.storage.createBucket(avatarBucketName, { public: false })
      console.log('Created avatars bucket')
    }
    
    const chatImagesBucketExists = buckets?.some(bucket => bucket.name === chatImagesBucketName)
    if (!chatImagesBucketExists) {
      await supabase.storage.createBucket(chatImagesBucketName, { public: false })
      console.log('Created chat images bucket')
    }
  } catch (error) {
    console.log('Error initializing storage:', error)
  }
}

// Initialize default rooms
async function initializeRooms() {
  const existingRooms = await kv.get('rooms')
  if (!existingRooms) {
    const defaultRooms = [
      { id: 'general', name: 'General', description: 'General discussion' },
      { id: 'random', name: 'Random', description: 'Random chat' },
      { id: 'tech', name: 'Tech', description: 'Technology talk' },
      { id: 'gaming', name: 'Gaming', description: 'Gaming discussion' },
    ]
    await kv.set('rooms', defaultRooms)
  }
}

initializeStorage()
initializeRooms()

// Sign up
app.post('/make-server-a8b30827/signup', async (c) => {
  try {
    const { email, password, username } = await c.req.json()
    
    if (!email || !password || !username) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    // Check if username is already taken
    const existingUser = await kv.get(`username:${username.toLowerCase()}`)
    if (existingUser) {
      return c.json({ error: 'Username already taken' }, 400)
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    })

    if (error) {
      console.log('Error creating user:', error)
      return c.json({ error: error.message }, 400)
    }

    // Store username mapping
    await kv.set(`username:${username.toLowerCase()}`, data.user.id)
    
    // Store user profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      username,
      email,
      avatarUrl: null,
      createdAt: Date.now()
    })

    return c.json({ 
      success: true,
      userId: data.user.id,
      username 
    })
  } catch (error) {
    console.log('Error in signup:', error)
    return c.json({ error: 'Failed to sign up' }, 500)
  }
})

// Upload avatar
app.post('/make-server-a8b30827/upload-avatar', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return c.json({ error: 'Missing file or userId' }, 400)
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const bucketName = 'make-a8b30827-avatars'

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.log('Error uploading avatar:', uploadError)
      return c.json({ error: 'Failed to upload avatar' }, 500)
    }

    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year

    if (!urlData) {
      return c.json({ error: 'Failed to get signed URL' }, 500)
    }

    // Update user profile
    const userProfile = await kv.get(`user:${userId}`)
    if (userProfile) {
      userProfile.avatarUrl = urlData.signedUrl
      await kv.set(`user:${userId}`, userProfile)
    }

    return c.json({ success: true, avatarUrl: urlData.signedUrl })
  } catch (error) {
    console.log('Error uploading avatar:', error)
    return c.json({ error: 'Failed to upload avatar' }, 500)
  }
})

// Upload chat image
app.post('/make-server-a8b30827/upload-chat-image', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return c.json({ error: 'Missing file or userId' }, 400)
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const bucketName = 'make-a8b30827-chat-images'

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.log('Error uploading chat image:', uploadError)
      return c.json({ error: 'Failed to upload image' }, 500)
    }

    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year

    if (!urlData) {
      return c.json({ error: 'Failed to get signed URL' }, 500)
    }

    return c.json({ success: true, imageUrl: urlData.signedUrl })
  } catch (error) {
    console.log('Error uploading chat image:', error)
    return c.json({ error: 'Failed to upload image' }, 500)
  }
})

// Get user profile
app.get('/make-server-a8b30827/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const userProfile = await kv.get(`user:${userId}`)
    
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({ user: userProfile })
  } catch (error) {
    console.log('Error fetching user profile:', error)
    return c.json({ error: 'Failed to fetch user profile' }, 500)
  }
})

// Get all rooms
app.get('/make-server-a8b30827/rooms', async (c) => {
  try {
    const rooms = await kv.get('rooms') || []
    return c.json({ rooms })
  } catch (error) {
    console.log('Error fetching rooms:', error)
    return c.json({ error: 'Failed to fetch rooms' }, 500)
  }
})

// Join a room
app.post('/make-server-a8b30827/join-room', async (c) => {
  try {
    const { roomId, username, userId } = await c.req.json()
    
    if (!roomId || !username || !userId) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const usersKey = `room:${roomId}:users`
    const users = (await kv.get(usersKey)) || []
    
    // Remove user if they were already in the room
    const filteredUsers = users.filter((u: any) => u.userId !== userId)
    
    // Add user with timestamp
    const newUser = { userId, username, joinedAt: Date.now() }
    filteredUsers.push(newUser)
    
    await kv.set(usersKey, filteredUsers)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error joining room:', error)
    return c.json({ error: 'Failed to join room' }, 500)
  }
})

// Leave a room
app.post('/make-server-a8b30827/leave-room', async (c) => {
  try {
    const { roomId, userId } = await c.req.json()
    
    if (!roomId || !userId) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const usersKey = `room:${roomId}:users`
    const users = (await kv.get(usersKey)) || []
    
    const filteredUsers = users.filter((u: any) => u.userId !== userId)
    await kv.set(usersKey, filteredUsers)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error leaving room:', error)
    return c.json({ error: 'Failed to leave room' }, 500)
  }
})

// Get active users in a room
app.get('/make-server-a8b30827/active-users/:roomId', async (c) => {
  try {
    const roomId = c.req.param('roomId')
    const usersKey = `room:${roomId}:users`
    
    const users = (await kv.get(usersKey)) || []
    
    // Filter out users who haven't been active in the last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const activeUsers = users.filter((u: any) => u.joinedAt > fiveMinutesAgo)
    
    // Update the list to remove inactive users
    if (activeUsers.length !== users.length) {
      await kv.set(usersKey, activeUsers)
    }
    
    return c.json({ users: activeUsers })
  } catch (error) {
    console.log('Error fetching active users:', error)
    return c.json({ error: 'Failed to fetch active users' }, 500)
  }
})

// Send a message
app.post('/make-server-a8b30827/send-message', async (c) => {
  try {
    const { roomId, username, userId, message, imageUrl } = await c.req.json()
    
    if (!roomId || !username || !userId || !message) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const messagesKey = `room:${roomId}:messages`
    const messages = (await kv.get(messagesKey)) || []
    
    const newMessage = {
      id: `${Date.now()}-${userId}`,
      userId,
      username,
      message,
      imageUrl: imageUrl || undefined,
      timestamp: Date.now(),
    }
    
    messages.push(newMessage)
    
    // Keep only last 100 messages per room
    if (messages.length > 100) {
      messages.splice(0, messages.length - 100)
    }
    
    await kv.set(messagesKey, messages)
    
    return c.json({ success: true, message: newMessage })
  } catch (error) {
    console.log('Error sending message:', error)
    return c.json({ error: 'Failed to send message' }, 500)
  }
})

// Get messages for a room
app.get('/make-server-a8b30827/messages/:roomId', async (c) => {
  try {
    const roomId = c.req.param('roomId')
    const messagesKey = `room:${roomId}:messages`
    
    const messages = (await kv.get(messagesKey)) || []
    
    return c.json({ messages })
  } catch (error) {
    console.log('Error fetching messages:', error)
    return c.json({ error: 'Failed to fetch messages' }, 500)
  }
})

Deno.serve(app.fetch)