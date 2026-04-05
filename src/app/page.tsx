import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C47FF]">
              <span className="text-sm font-bold text-white">N</span>
            </div>
            <span className="font-['Sora',sans-serif] text-lg font-bold text-[#1a1a2e]">
              Noema
            </span>
          </div>
          <Link
            href="/login"
            className="rounded-xl bg-[#6C47FF] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#5a3de0]"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#6C47FF] shadow-lg shadow-[#6C47FF]/30">
              <span className="font-['Sora',sans-serif] text-3xl font-bold text-white">N</span>
            </div>
          </div>

          <h1 className="font-['Sora',sans-serif] text-4xl font-bold leading-tight text-[#1a1a2e] sm:text-5xl">
            Aprenda do seu jeito com inteligência artificial
          </h1>

          <p className="mx-auto max-w-lg text-lg leading-relaxed text-gray-500">
            A Noema personaliza sua experiência de estudo integrando o Google Classroom
            com IA. Converse com o Darwin, revise matérias, teste seus conhecimentos —
            tudo adaptado ao seu perfil.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-2xl bg-[#6C47FF] px-8 py-4 font-['Sora',sans-serif] text-base font-semibold text-white shadow-lg shadow-[#6C47FF]/30 transition-all hover:bg-[#5a3de0] hover:shadow-[#6C47FF]/40"
            >
              Começar agora →
            </Link>
          </div>

          {/* Features */}
          <div className="grid gap-4 pt-8 sm:grid-cols-3">
            {[
              {
                icon: "🤖",
                title: "Darwin IA",
                desc: "Assistente socrático que te guia sem dar a resposta pronta",
              },
              {
                icon: "📚",
                title: "Revisão inteligente",
                desc: "Resumos, flashcards e mapas mentais gerados por IA",
              },
              {
                icon: "🎯",
                title: "Simulados ENEM",
                desc: "Questões no estilo ENEM geradas para cada matéria",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 text-left"
              >
                <span className="text-2xl">{f.icon}</span>
                <h3 className="mt-3 text-sm font-bold text-[#1a1a2e]">{f.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-400">
            © 2026 Noema. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="text-xs text-gray-400 hover:text-[#6C47FF] hover:underline"
            >
              Política de Privacidade
            </Link>
            <Link
              href="/login"
              className="text-xs text-gray-400 hover:text-[#6C47FF] hover:underline"
            >
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
