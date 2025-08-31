'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './auth-context'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinCompany: (companyId: string) => void
  leaveCompany: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, token } = useAuth()

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Initialize socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: {
        token
      }
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Socket connected')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Socket disconnected')
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [token, user])

  const joinCompany = (companyId: string) => {
    if (socket && isConnected) {
      socket.emit('join-company', companyId)
    }
  }

  const leaveCompany = () => {
    if (socket && isConnected) {
      // Leave all company rooms
      socket.emit('leave-company')
    }
  }

  const value = {
    socket,
    isConnected,
    joinCompany,
    leaveCompany,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
