import { useRef, useEffect } from 'react'
import { Send, Sparkles, User, Bot, Loader2, Trash2, Wifi, WifiOff } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chatStore'
import { isChatConfigured, type ChatResponseData } from '@/services/chatService'

// ---------- Sub-components ----------

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      <div className="bg-secondary rounded-xl px-4 py-3 flex items-center gap-1">
        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

function DataTable({ data }: { data: ChatResponseData }) {
  if (data.type !== 'table' || !data.columns || !data.rows) return null

  return (
    <div className="mt-3 rounded-lg border border-border overflow-hidden">
      {data.title && (
        <div className="px-3 py-2 bg-secondary/50 border-b border-border">
          <span className="text-xs font-medium">{data.title}</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {data.columns.map((col, i) => (
                <th key={i} className="px-3 py-2 text-left font-medium text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MetricsCards({ data }: { data: ChatResponseData }) {
  if (data.type !== 'metrics' || !data.items) return null

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {data.items.map((item, i) => (
        <div key={i} className="rounded-lg border border-border p-3 bg-background">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-semibold">{item.value}</span>
            {item.change && (
              <span className={cn(
                "text-xs",
                item.trend === 'up' && "text-success",
                item.trend === 'down' && "text-destructive",
                item.trend === 'stable' && "text-muted-foreground"
              )}>
                {item.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-like parsing for **bold**
  const parts = content.split(/(\*\*.*?\*\*)/g)
  
  return (
    <div className="text-sm whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return part
      })}
    </div>
  )
}

// ---------- Main Component ----------

export function Chat() {
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    addSuggestionClick, 
    clearChat 
  } = useChatStore()
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const isConnected = isChatConfigured()

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = inputRef.current
    if (input && input.value.trim()) {
      sendMessage(input.value)
      input.value = ''
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === 'Limpiar chat' || suggestion === 'Intentar de nuevo') {
      if (suggestion === 'Limpiar chat') {
        clearChat()
      } else {
        // Get last user message and retry
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
        if (lastUserMsg) {
          sendMessage(lastUserMsg.content)
        }
      }
      return
    }
    addSuggestionClick(suggestion)
  }

  return (
    <>
      <Header title="Chat" />
      
      <div className="p-6 h-[calc(100vh-3.5rem)]">
        <Card className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Asistente NODUS</h3>
              <p className="text-xs text-muted-foreground">
                {isConnected ? 'Conectado a Saturn Studio' : 'Modo demo'}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {isConnected ? (
                <Badge variant="success" className="gap-1">
                  <Wifi className="w-3 h-3" />
                  Online
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <WifiOff className="w-3 h-3" />
                  Demo
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={clearChat}
                title="Limpiar chat"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' && "flex-row-reverse"
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    message.role === 'user' ? "bg-secondary" : "bg-primary/10"
                  )}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4 text-primary" />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className={cn(
                    "max-w-[80%] rounded-xl px-4 py-3",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground" 
                      : message.isError 
                        ? "bg-destructive/10 border border-destructive/20"
                        : "bg-secondary"
                  )}>
                    <MessageContent content={message.content} />

                    {/* Data visualizations */}
                    {message.data && message.data.type === 'table' && (
                      <DataTable data={message.data} />
                    )}
                    {message.data && message.data.type === 'metrics' && (
                      <MetricsCards data={message.data} />
                    )}

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.suggestions.map((suggestion, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 bg-background"
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={isLoading}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && <TypingIndicator />}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
              <Input
                ref={inputRef}
                placeholder="Escribe tu pregunta..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Pregunta sobre metricas, agentes, alertas o reportes de coaching
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}
