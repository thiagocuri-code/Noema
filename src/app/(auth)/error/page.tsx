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
  const rawError = searchParams.get("error")
  const error = rawError && rawError !== "undefined" ? rawError : "Default"

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#071245]">Erro de Autenticação</h1>
          <p className="text-sm text-gray-500">
            {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default}
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block rounded-xl bg-[#071245] px-6 py-3 text-sm font-medium text-white hover:bg-[#0a1a5a] transition-colors"
          >
            Tentar novamente
          </Link>
          <a
            href="/api/auth/signin/google"
            className="block rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-[#071245] hover:bg-gray-50 transition-colors"
          >
            Login direto com Google
          </a>
        </div>
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
