"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function VerificationPanel() {
  const [text, setText] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleVerify() {
    if (!text.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/ai/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: true, message: "Erro ao verificar" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Verificação de Autoria</CardTitle>
        <p className="text-xs text-gray-500">
          Cole um trecho de trabalho entregue para verificar se a athena gerou este conteúdo.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cole aqui um trecho de trabalho entregue..."
          rows={4}
        />
        <Button
          onClick={handleVerify}
          disabled={!text.trim() || loading}
          className="bg-[#071245] hover:bg-[#071245] text-white"
        >
          {loading ? "Verificando..." : "Verificar com athena"}
        </Button>

        {result && (
          <div
            className={`rounded-lg border p-4 ${
              result.generated
                ? "border-amber-300 bg-amber-50"
                : result.error
                  ? "border-red-300 bg-red-50"
                  : "border-green-300 bg-green-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={result.generated ? "destructive" : "secondary"}
                className={
                  result.generated
                    ? ""
                    : "bg-green-100 text-green-700"
                }
              >
                {result.generated ? "Gerado pela athena" : "Não gerado"}
              </Badge>
            </div>
            <p className="text-sm text-gray-700">{result.message}</p>
            {result.generated && (
              <div className="mt-2 space-y-1 text-xs text-gray-500">
                <p>Data: {new Date(result.timestamp).toLocaleString("pt-BR")}</p>
                <p>Matéria: {result.course}</p>
                <p>Pergunta original: &quot;{result.originalPrompt}&quot;</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
