"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { ChatMessage } from "@/types/noema"

interface AiChatProps {
  courseId: string
  courseName: string
  courseContext: string
  userId: string
}

export function AiChat({ courseId, courseName, courseContext, userId }: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou o Darwin, seu tutor para " +
        courseName +
        ". Estou aqui para te ajudar a entender os conteúdos. O que você quer explorar hoje?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setLoading(true)

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          courseId,
          courseName,
          courseContext,
          userId,
          history,
        }),
      })

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Tente novamente.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1a2e]">
            Darwin — Tutor de {courseName}
          </h3>
        </div>
        <Badge
          variant="secondary"
          className="bg-[#0a1a4a]/10 text-[#0a1a4a] text-xs cursor-help"
          title="O Darwin usa o método socrático: ele nunca dá respostas prontas, mas guia seu raciocínio com perguntas."
        >
          Método Socrático Ativo
        </Badge>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-[#0a1a4a] text-white rounded-br-md"
                  : "bg-gray-100 text-[#1a1a2e] rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 text-sm text-gray-400">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
              </span>{" "}
              Darwin está pensando...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Digite sua dúvida..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-[#071245] hover:bg-[#071245] text-white px-6"
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  )
}
