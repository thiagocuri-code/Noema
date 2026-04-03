"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Relatórios da Escola</h1>
        <p className="text-sm text-gray-500">
          Visão geral de engajamento e uso da Noema.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total de alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#6C47FF]">--</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Interações totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#6C47FF]">--</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Turmas ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#6C47FF]">--</p>
          </CardContent>
        </Card>
      </div>
      <p className="text-sm text-gray-400 text-center py-10">
        Relatórios detalhados serão gerados após a sincronização com o Google Classroom.
      </p>
    </div>
  )
}
