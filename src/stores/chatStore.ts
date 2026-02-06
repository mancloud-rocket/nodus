// ============================================
// NODUS - Chat Store (Zustand)
// Estado del chat conversacional
// ============================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  sendChatMessage, 
  generateConversationId,
  isChatConfigured,
  type ChatMessage,
  type ChatResponseData
} from '@/services/chatService'

// ---------- Types ----------

interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  data?: ChatResponseData
  suggestions?: string[]
  isError?: boolean
}

interface ChatState {
  // Estado
  messages: StoredMessage[]
  conversationId: string
  isLoading: boolean
  isConnected: boolean
  error: string | null
  
  // Acciones
  sendMessage: (content: string) => Promise<void>
  addSuggestionClick: (suggestion: string) => Promise<void>
  clearChat: () => void
  setError: (error: string | null) => void
}

// ---------- Initial Message ----------

const getWelcomeMessage = (): StoredMessage => ({
  id: 'welcome',
  role: 'assistant',
  content: 'Hola! Soy el asistente de NODUS. Puedo ayudarte a analizar datos de tu equipo de cobranza, revisar metricas, consultar alertas y mas. Que te gustaria saber?',
  timestamp: new Date().toISOString(),
  suggestions: [
    'Como esta Maria Lopez?',
    'Hay alertas criticas?',
    'Cual es el score promedio?',
    'Quien necesita coaching?'
  ]
})

// ---------- Store ----------

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      messages: [getWelcomeMessage()],
      conversationId: generateConversationId(),
      isLoading: false,
      isConnected: isChatConfigured(),
      error: null,

      // Enviar mensaje
      sendMessage: async (content: string) => {
        const { messages, conversationId, isLoading } = get()
        
        if (isLoading || !content.trim()) return

        // Agregar mensaje del usuario
        const userMessage: StoredMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: content.trim(),
          timestamp: new Date().toISOString()
        }

        set({ 
          messages: [...messages, userMessage],
          isLoading: true,
          error: null
        })

        try {
          // Preparar historial para el webhook
          const history: ChatMessage[] = messages
            .filter(m => m.id !== 'welcome')
            .map(m => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
              data: m.data
            }))

          // Enviar al webhook
          const response = await sendChatMessage({
            message: content.trim(),
            conversation_id: conversationId,
            history,
            context: {
              current_page: window.location.pathname,
              date_range: {
                from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                to: new Date().toISOString().split('T')[0]
              }
            }
          })

          // Crear mensaje de respuesta
          const assistantMessage: StoredMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response.response.message,
            timestamp: response.timestamp || new Date().toISOString(),
            data: response.response.data,
            suggestions: response.response.suggestions,
            isError: response.response.type === 'error'
          }

          set(state => ({
            messages: [...state.messages, assistantMessage],
            isLoading: false
          }))

        } catch (error) {
          console.error('Error sending message:', error)
          
          const errorMessage: StoredMessage = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: 'Lo siento, hubo un problema al procesar tu mensaje. Por favor intenta de nuevo.',
            timestamp: new Date().toISOString(),
            isError: true,
            suggestions: ['Intentar de nuevo', 'Limpiar chat']
          }

          set(state => ({
            messages: [...state.messages, errorMessage],
            isLoading: false,
            error: (error as Error).message
          }))
        }
      },

      // Click en sugerencia
      addSuggestionClick: async (suggestion: string) => {
        await get().sendMessage(suggestion)
      },

      // Limpiar chat
      clearChat: () => {
        set({
          messages: [getWelcomeMessage()],
          conversationId: generateConversationId(),
          error: null
        })
      },

      // Set error
      setError: (error: string | null) => {
        set({ error })
      }
    }),
    {
      name: 'nodus-chat-storage',
      partialize: (state) => ({
        messages: state.messages.slice(-50), // Guardar ultimos 50 mensajes
        conversationId: state.conversationId
      })
    }
  )
)

// ---------- Selectors ----------

export const useMessages = () => useChatStore(state => state.messages)
export const useIsLoading = () => useChatStore(state => state.isLoading)
export const useIsConnected = () => useChatStore(state => state.isConnected)




