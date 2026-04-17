"use client"

import { useState } from "react"

type Entry = {
  id: string
  grade: number
  subject: string
  title: string
  content: string
  createdAt: string
}

export default function KnowledgeBaseClient({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [grade, setGrade] = useState<number>(1)
  const [subject, setSubject] = useState("")
  const [title, setTitle] = useState("")
  const [textContent, setTextContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!subject.trim()) return setError("Informe a matéria.")
    if (!file && !textContent.trim()) return setError("Envie um PDF ou cole o texto.")

    if (file && file.size > 4 * 1024 * 1024) {
      return setError("Arquivo muito grande. O limite é 4 MB.")
    }

    setSaving(true)
    try {
      const form = new FormData()
      form.set("grade", String(grade))
      form.set("subject", subject.trim())
      form.set("title", title.trim())
      if (file) {
        form.set("file", file)
      } else {
        form.set("content", textContent)
      }

      const res = await fetch("/api/admin/knowledge-base", { method: "POST", body: form })
      let data: any
      const text = await res.text()
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(
          res.status === 413
            ? "Arquivo muito grande. O limite é 4 MB."
            : `Erro do servidor: ${text.slice(0, 120)}`
        )
      }
      if (!res.ok) throw new Error(data.error || "Erro ao salvar")

      setEntries((prev) => [data.entry, ...prev])
      setSubject("")
      setTitle("")
      setTextContent("")
      setFile(null)
      const fileInput = document.getElementById("kb-file") as HTMLInputElement | null
      if (fileInput) fileInput.value = ""
    } catch (err: any) {
      setError(err.message || "Erro")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta entrada?")) return
    const res = await fetch(`/api/admin/knowledge-base/${id}`, { method: "DELETE" })
    if (res.ok) setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const grouped = entries.reduce<Record<number, Entry[]>>((acc, e) => {
    ;(acc[e.grade] = acc[e.grade] || []).push(e)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0a1a4a]">Base de Conhecimento</h1>
        <p className="text-sm text-gray-500">Adicione materiais por ano e matéria. Usados pela IA nas provas.</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#0a1a4a]">Novo material</h2>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Ano</label>
            <select
              value={grade}
              onChange={(e) => setGrade(parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0a1a4a]"
            >
              <option value={1}>1º ano</option>
              <option value={2}>2º ano</option>
              <option value={3}>3º ano</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">Matéria</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex.: Matemática, Sociologia"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0a1a4a]"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-600">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Revolução Industrial — Resumo"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0a1a4a]"
          />
          <p className="mt-1 text-xs text-gray-400">Se enviar PDF e deixar em branco, usamos o nome do arquivo.</p>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-600">PDF (opcional)</label>
          <input
            id="kb-file"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0a1a4a] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-600">Ou cole o texto</label>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            disabled={!!file}
            rows={6}
            placeholder={file ? "Usando o PDF enviado" : "Cole aqui o conteúdo do material..."}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0a1a4a] disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#0a1a4a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Adicionar"}
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-[#0a1a4a]">Materiais cadastrados</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum material ainda.</p>
        ) : (
          [1, 2, 3].map((g) =>
            grouped[g]?.length ? (
              <div key={g} className="mb-6">
                <h3 className="mb-2 text-sm font-bold uppercase text-gray-400">{g}º ano</h3>
                <div className="space-y-2">
                  {grouped[g].map((e) => (
                    <div key={e.id} className="flex items-start justify-between rounded-xl border border-gray-100 bg-white p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0a1a4a]">{e.title}</p>
                        <p className="text-xs text-gray-500">
                          {e.subject} · {e.content.length.toLocaleString()} caracteres
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="ml-3 text-xs text-red-500 hover:text-red-700"
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null,
          )
        )}
      </div>
    </div>
  )
}
