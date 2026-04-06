"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

// ── Print Placeholder ────────────────────────────────────────────────────────
function PrintPlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center ${className}`}>
      <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
      <span className="text-sm text-gray-400">[ {label} ]</span>
    </div>
  )
}

// ── Fade-in on scroll ────────────────────────────────────────────────────────
function FadeIn({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el) } },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </div>
  )
}

export default function LandingPage() {
  return (
    <>
      <title>athena — IA que ensina, não que faz</title>
      <meta name="description" content="Plataforma de IA educacional ética integrada ao Google Classroom. Aprenda de verdade com o método socrático." />

      <div className="min-h-screen overflow-x-hidden bg-white font-[var(--font-sans)]">

        {/* ━━━ NAVBAR ━━━ */}
        <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="mx-auto flex py-3 max-w-6xl items-center justify-between px-6">
            <img src="/athena-full.png" alt="athena" className="h-32 sm:h-40 object-contain" />
            <div className="flex items-center gap-6">
              <a href="#como-funciona" className="hidden text-sm font-medium text-gray-600 hover:text-[#1E3A7A] sm:block">Como funciona</a>
              <a href="#para-escolas" className="hidden text-sm font-medium text-gray-600 hover:text-[#1E3A7A] sm:block">Para escolas</a>
              <Link
                href="/acesso"
                className="rounded-full bg-[#3D5FC0] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-[#1E3A7A] active:scale-95"
              >
                Quero ter acesso →
              </Link>
            </div>
          </div>
        </nav>

        {/* ━━━ HERO ━━━ */}
        <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16 md:py-24">
          <div className="grid items-center gap-12 grid-cols-1 md:grid-cols-5">
            <div className="space-y-8 md:col-span-3">
              <span className="inline-block rounded-full bg-[#C5E4F8] px-4 py-1.5 text-xs font-semibold text-[#1E3A7A]">
                Integrado ao Google Classroom
              </span>

              <h1 className="font-[var(--font-heading)] text-3xl sm:text-4xl lg:text-[52px] font-bold leading-tight text-[#1E3A7A]">
                Pare de copiar respostas.<br />
                Comece a entender de verdade.
              </h1>

              <p className="max-w-lg text-base sm:text-lg leading-relaxed text-gray-600">
                A athena usa inteligência artificial para te ensinar o caminho até a resposta — não para te dar ela pronta. Porque no dia da prova, a IA não vai estar lá.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/acesso"
                  className="w-full sm:w-auto rounded-2xl bg-[#3D5FC0] px-8 py-4 text-center font-[var(--font-heading)] text-base font-semibold text-white shadow-lg shadow-[#3D5FC0]/25 transition-all hover:bg-[#1E3A7A] hover:shadow-[#1E3A7A]/30 active:scale-[0.97]"
                >
                  Quero aprender com a athena →
                </Link>
                <a href="#como-funciona" className="text-center text-sm font-medium text-gray-500 hover:text-[#3D5FC0]">
                  Ver como funciona ↓
                </a>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">🎓 22 turmas conectadas</span>
                <span className="flex items-center gap-1.5">🤖 Darwin — tutor socrático</span>
                <span className="flex items-center gap-1.5">✅ Integração direta com Classroom</span>
              </div>
            </div>

            <div className="relative md:col-span-2">
              <div className="rounded-2xl shadow-2xl shadow-[#1E3A7A]/10 overflow-hidden border border-[#E5E7EB]">
                <PrintPlaceholder label="Adicionar print do dashboard do aluno" className="min-h-[320px] sm:min-h-[400px]" />
              </div>
              <div className="absolute -bottom-3 -right-3 rounded-full bg-[#C5E4F8] px-4 py-2 text-xs font-semibold text-[#1E3A7A] shadow-md">
                ✓ Seus materiais do professor
              </div>
            </div>
          </div>
        </section>

        {/* ━━━ PROBLEMA ━━━ */}
        <section className="bg-[#C5E4F8]/30 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn className="text-center space-y-4 mb-14">
              <h2 className="font-[var(--font-heading)] text-3xl font-bold text-[#1E3A7A] sm:text-4xl">
                Você usa IA. Mas está de fato aprendendo?
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600">
                A maioria dos estudantes usa IA para completar tarefas. Mas completar não é o mesmo que compreender.
              </p>
            </FadeIn>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
              {[
                { icon: "⚡", title: "A resposta chega rápido", body: "O ChatGPT resolve em segundos. Mas você conseguiria resolver sozinho?" },
                { icon: "📉", title: "Na prova, o vazio aparece", body: "66% dos professores já notam queda no raciocínio crítico dos alunos.*" },
                { icon: "🎯", title: "O mercado vai cobrar", body: "Quem só sabe copiar resultados pode ser substituído pela própria IA." },
              ].map((card, i) => (
                <FadeIn key={i}>
                  <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 space-y-3 h-full">
                    <span className="text-3xl">{card.icon}</span>
                    <h3 className="font-[var(--font-heading)] text-lg font-bold text-[#1E3A7A]">{card.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600">{card.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ SOLUÇÃO ━━━ */}
        <section className="py-12 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn className="mb-14 space-y-3">
              <span className="inline-block rounded-full bg-[#C5E4F8] px-4 py-1.5 text-xs font-semibold text-[#1E3A7A]">
                Como a athena é diferente
              </span>
              <h2 className="font-[var(--font-heading)] text-3xl font-bold text-[#1E3A7A] sm:text-4xl">
                IA que te ensina.<br />Não que faz por você.
              </h2>
            </FadeIn>

            <div className="grid items-center gap-12 grid-cols-1 md:grid-cols-2">
              <FadeIn>
                <div className="rounded-2xl shadow-xl shadow-[#1E3A7A]/10 overflow-hidden border border-[#E5E7EB]">
                  <PrintPlaceholder label="Adicionar print do chat com Darwin" className="min-h-[350px]" />
                </div>
              </FadeIn>

              <FadeIn className="space-y-8">
                {[
                  { title: "Darwin — seu tutor socrático", body: "Ele nunca entrega a resposta. Ele faz a pergunta certa para que você mesmo chegue até ela." },
                  { title: "Contexto do seu professor", body: "Darwin conhece os materiais da sua turma. Não é uma IA genérica — é seu tutor personalizado." },
                  { title: "Perfil de aprendizado", body: "Na primeira vez que você acessa, a athena aprende como você estuda melhor e adapta tudo para você." },
                  { title: "Sem cola, com rastreamento", body: "O professor consegue verificar se uma resposta foi gerada pela athena — e ver todo o raciocínio que aconteceu antes dela." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#5BB3F0]/20">
                      <span className="text-sm font-bold text-[#5BB3F0]">✦</span>
                    </div>
                    <div>
                      <h4 className="font-[var(--font-heading)] text-base font-bold text-[#1E3A7A]">{item.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.body}</p>
                    </div>
                  </div>
                ))}
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ━━━ COMO FUNCIONA ━━━ */}
        <section id="como-funciona" className="bg-[#C5E4F8]/30 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn className="text-center mb-14">
              <h2 className="font-[var(--font-heading)] text-3xl font-bold text-[#1E3A7A] sm:text-4xl">
                Três formas de aprender mais em menos tempo
              </h2>
            </FadeIn>

            <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
              {[
                { icon: "🤖", title: "Tire dúvidas sem receber respostas prontas", body: "Darwin usa o método socrático: ele guia seu raciocínio com perguntas até você entender o conceito. Não é sobre a resposta. É sobre o caminho.", print: "Adicionar print do chat com Darwin" },
                { icon: "📚", title: "Resumos, flashcards e mapas mentais em segundos", body: "Gere materiais de revisão personalizados com base no conteúdo exato do seu professor. Flashcards para memorizar, mapas mentais para visualizar, guias para a prova.", print: "Adicionar print da tela de revisão" },
                { icon: "📝", title: "Simulados estilo ENEM com correção inteligente", body: "Gere questões no estilo ENEM baseadas no conteúdo da sua aula. A athena corrige, explica cada erro e registra sua evolução ao longo do tempo.", print: "Adicionar print da tela de simulado" },
              ].map((card, i) => (
                <FadeIn key={i}>
                  <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 space-y-5 h-full flex flex-col">
                    <span className="text-4xl">{card.icon}</span>
                    <h3 className="font-[var(--font-heading)] text-lg font-bold text-[#1E3A7A]">{card.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600 flex-1">{card.body}</p>
                    <PrintPlaceholder label={card.print} className="min-h-[200px]" />
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ PERFIL DE APRENDIZADO ━━━ */}
        <section className="py-12 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-12 grid-cols-1 md:grid-cols-2">
              <FadeIn className="space-y-6">
                <span className="inline-block rounded-full bg-[#C5E4F8] px-4 py-1.5 text-xs font-semibold text-[#1E3A7A]">
                  Personalização real
                </span>
                <h2 className="font-[var(--font-heading)] text-3xl font-bold text-[#1E3A7A] sm:text-4xl">
                  A athena aprende<br />como você aprende
                </h2>
                <p className="text-base leading-relaxed text-gray-600">
                  No primeiro acesso, você responde 7 perguntas rápidas. A partir daí, o Darwin adapta o tom, os exemplos e o nível de detalhe de cada resposta ao seu estilo único. Você prefere exemplos visuais? Explicações detalhadas? Respostas diretas? A athena se ajusta.
                </p>
                <ul className="space-y-3 text-sm text-gray-700">
                  {[
                    "Estilo de aprendizado personalizado",
                    "Objetivo de carreira considerado nas respostas",
                    "Nível de detalhe adaptado à sua forma",
                    "Pode alterar seu perfil a qualquer momento",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5BB3F0]/20 text-xs text-[#5BB3F0]">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>

              <FadeIn>
                <div className="rounded-2xl shadow-xl shadow-[#1E3A7A]/10 overflow-hidden border border-[#E5E7EB]">
                  <PrintPlaceholder label="Adicionar print do onboarding ou modal de perfil" className="min-h-[350px]" />
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ━━━ DEPOIMENTOS ━━━ */}
        <section id="para-escolas" className="bg-[#C5E4F8]/30 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn className="text-center mb-14">
              <h2 className="font-[var(--font-heading)] text-3xl font-bold text-[#1E3A7A] sm:text-4xl">
                O que professores dizem sobre IA e aprendizado
              </h2>
            </FadeIn>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <FadeIn key={n}>
                  <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 space-y-4 h-full flex flex-col">
                    <span className="text-4xl text-[#5BB3F0] leading-none">&ldquo;</span>
                    <p className="flex-1 text-sm italic leading-relaxed text-gray-600">
                      [ Depoimento {n} — adicionar texto aqui ]
                    </p>
                    <div className="border-t border-[#E5E7EB] pt-4">
                      <p className="text-sm font-bold text-[#1E3A7A]">Nome do Professor</p>
                      <p className="text-xs text-gray-500">Cargo / Escola</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-gray-400">
              Depoimentos coletados durante pesquisa de validação do produto
            </p>
          </div>
        </section>

        {/* ━━━ CTA FINAL ━━━ */}
        <section className="bg-gradient-to-br from-[#1E3A7A] to-[#152D6E] py-12 sm:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <FadeIn className="space-y-6">
              <h2 className="font-[var(--font-heading)] text-2xl sm:text-3xl lg:text-[44px] font-bold text-white leading-tight">
                Seu próximo passo não é<br />decorar a resposta.
              </h2>
              <p className="text-lg text-white/80">
                É entender o porquê. A athena te ensina isso.
              </p>
              <Link
                href="/acesso"
                className="inline-block rounded-2xl bg-[#5BB3F0] px-10 py-4 font-[var(--font-heading)] text-base font-bold text-[#1E3A7A] shadow-lg transition-all hover:bg-white hover:text-[#1E3A7A] active:scale-[0.97]"
              >
                Quero ter acesso à athena →
              </Link>
              <p className="text-sm text-white/60">
                Integrado ao Google Classroom · Gratuito para começar
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ━━━ FOOTER ━━━ */}
        <footer className="bg-[#1E3A7A] py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex items-center gap-3">
                <img src="/athena-symbol.png" alt="athena" className="h-32 sm:h-40 object-contain brightness-0 invert" />
                <span className="text-lg font-bold text-white">athena</span>
              </div>
              <p className="text-sm text-white/60 italic">understand the how, not just what</p>
              <div className="flex gap-6 text-sm">
                <a href="#como-funciona" className="text-white/70 hover:text-white">Como funciona</a>
                <a href="#para-escolas" className="text-white/70 hover:text-white">Para escolas</a>
                <Link href="/privacy" className="text-white/70 hover:text-white">Privacidade</Link>
              </div>
              <p className="text-xs text-white/40">
                © 2026 athena. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
