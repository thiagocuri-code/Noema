import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex py-3 max-w-5xl items-center justify-between px-6">
          <img src="/athena-logo.png" alt="athena" className="h-16 w-auto object-contain" />
          <Link
            href="/login"
            className="rounded-xl bg-[#071245] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#071245]"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:py-16 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex justify-center">
            <img src="/athena-logo.png" alt="athena" className="h-24 w-auto object-contain" />
          </div>

          <h1 className="font-[var(--font-heading)] text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#071245]">
            Aprenda do seu jeito com inteligência artificial
          </h1>

          <p className="mx-auto max-w-lg text-lg leading-relaxed text-gray-500">
            A athena personaliza sua experiência de estudo integrando o Google Classroom
            com IA. Converse com o Darwin, revise matérias, teste seus conhecimentos —
            tudo adaptado ao seu perfil.
          </p>

          <p className="text-sm text-gray-400 font-medium tracking-wide italic">
            understand the how, not just what
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-2xl bg-[#071245] px-8 py-4 font-[var(--font-heading)] text-base font-semibold text-white shadow-lg shadow-[#071245]/30 transition-all hover:bg-[#071245] hover:shadow-[#071245]/40"
            >
              Começar agora →
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
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
                className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-left"
              >
                <span className="text-2xl">{f.icon}</span>
                <h3 className="mt-3 text-sm font-bold text-[#071245]">{f.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-400">
            © 2026 athena. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="text-xs text-gray-400 hover:text-[#071245] hover:underline"
            >
              Política de Privacidade
            </Link>
            <Link
              href="/login"
              className="text-xs text-gray-400 hover:text-[#071245] hover:underline"
            >
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
