// Lê o conteúdo textual de um arquivo do Google Drive.
// Suporta: Google Docs, Google Slides, Google Sheets, PDFs e arquivos de texto.

const EXPORTABLE_MIME: Record<string, string> = {
  "application/vnd.google-apps.document": "text/plain",
  "application/vnd.google-apps.presentation": "text/plain",
  "application/vnd.google-apps.spreadsheet": "text/csv",
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accessToken = searchParams.get("accessToken")
  const fileId = searchParams.get("fileId")

  if (!accessToken || !fileId) {
    return Response.json({ error: "Parâmetros ausentes." }, { status: 400 })
  }

  const headers = { Authorization: `Bearer ${accessToken}` }

  // 1. Fetch file metadata to get mimeType and name
  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`,
    { headers }
  )
  if (!metaRes.ok) {
    return Response.json({ error: "Arquivo não encontrado ou sem permissão." }, { status: metaRes.status })
  }
  const meta = await metaRes.json()
  const { name, mimeType } = meta

  let text = ""

  // 2. Google Workspace files — export as plain text
  if (EXPORTABLE_MIME[mimeType]) {
    const exportMime = EXPORTABLE_MIME[mimeType]
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMime)}`,
      { headers }
    )
    if (exportRes.ok) {
      text = await exportRes.text()
    }
  }
  // 3. Plain text / PDF — download directly (PDF parsing returns raw bytes, best effort)
  else if (mimeType === "text/plain" || mimeType === "application/pdf" || mimeType?.startsWith("text/")) {
    const dlRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers }
    )
    if (dlRes.ok) {
      // For PDFs this will be binary — we do best-effort text extraction
      const buf = await dlRes.arrayBuffer()
      text = new TextDecoder("utf-8", { fatal: false }).decode(buf)
      // Strip non-printable chars left by PDF binary
      text = text.replace(/[^\x20-\x7E\u00C0-\u024F\n\r\t]/g, " ").replace(/\s{3,}/g, " ").trim()
    }
  }

  // Truncate to avoid overwhelming the AI context (~8k chars)
  const MAX = 8000
  if (text.length > MAX) {
    text = text.slice(0, MAX) + "\n[... conteúdo truncado]"
  }

  return Response.json({ name, mimeType, text })
}
