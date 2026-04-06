"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Erro de configuração do servidor. Verifique as variáveis de ambiente.",
  AccessDenied: "Acesso negado. Você pode não ter permissão para entrar.",
  Verification: "O link de verificação expirou ou já foi usado.",
  OAuthSignin: "Erro ao iniciar o login com Google.",
  OAuthCallback: "Erro no retorno do Google. Verifique as URIs de redirecionamento.",
  OAuthCreateAccount: "Erro ao criar a conta.",
  EmailCreateAccount: "Erro ao criar a conta via email.",
  Callback: "Erro no callback de autenticação.",
  OAuthAccountNotLinked: "Esta conta já está vinculada a outro provedor.",
  Default: "Ocorreu um erro durante a autenticação.",
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error") ?? "Default"

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#071245]">Erro de Autenticação</h1>
          <p className="text-sm text-gray-500">
            {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default}
          </p>
          <p className="text-xs text-gray-400 font-mono mt-2">
            Código: {error}
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-[#071245] px-6 py-3 text-sm font-medium text-white hover:bg-[#0a1a5a] transition-colors"
        >
          Tentar novamente
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Carregando...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
