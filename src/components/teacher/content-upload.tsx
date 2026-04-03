"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SyncPanelProps {
  accessToken: string
}

export function SyncPanel({ accessToken }: SyncPanelProps) {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [result, setResult] = useState<{ synced: number } | null>(null)

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch("/api/classroom/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      })
      const data = await res.json()
      setResult(data)
      setLastSync(new Date().toLocaleString("pt-BR"))
    } catch {
      setResult(null)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sincronização com Google Classroom</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="bg-[#6C47FF] hover:bg-[#5835e0] text-white"
          >
            {syncing ? "Sincronizando..." : "Sincronizar agora"}
          </Button>
          {lastSync && (
            <span className="text-xs text-gray-500">
              Última sincronização: {lastSync}
            </span>
          )}
        </div>
        {result && (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            {result.synced} turma{result.synced !== 1 ? "s" : ""} sincronizada{result.synced !== 1 ? "s" : ""}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
