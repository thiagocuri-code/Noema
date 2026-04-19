"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

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

export default function Home() {
  return (
    <>
      <title>lótus — IA que ensina, não que faz</title>
      <meta name="description" content="Plataforma de IA educacional ética integrada ao Google Classroom. Aprenda de verdade com o método socrático." />

      <div className="min-h-screen overflow-x-hidden bg-white font-[var(--font-sans)]">

        {/* ━━━ NAVBAR ━━━ */}
        <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="mx-auto flex py-3 max-w-6xl items-center justify-between px-6">
            <img src="/lotus-logo.png" alt="lótus" className="h-32 w-auto object-contain" />
            <div className="flex items-center gap-6">
              <a href="#como-funciona" className="hidden text-sm font-medium text-gray-600 hover:text-[#071245] sm:block">Como funciona</a>
              <a href="#para-escolas" className="hidden text-sm font-medium text-gray-600 hover:text-[#071245] sm:block">Para escolas</a>
              <Link
                href="/acesso"
                className="rounded-full bg-[#4169D4] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-[#071245] active:scale-95"
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
              <span className="inline-block rounded-full bg-[#F0F4FF] px-4 py-1.5 text-xs font-semibold text-[#071245]">
                Integrado ao Google Classroom
              </span>

              <h1 className="font-[var(--font-heading)] text-3xl sm:text-4xl lg:text-[52px] font-bold leading-tight text-[#071245]">
                Pare de copiar respostas.<br />
                Comece a entender de verdade.
              </h1>

              <p className="max-w-lg text-base sm:text-lg leading-relaxed text-gray-600">
                A lótus usa inteligência artificial para te ensinar o caminho até a resposta — não para te dar ela pronta. Porque no dia da prova, a IA não vai estar lá.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/acesso"
                  className="w-full sm:w-auto rounded-2xl bg-[#00E87A] px-8 py-4 text-center font-[var(--font-heading)] text-base font-semibold text-[#071245] shadow-lg shadow-[#00E87A]/25 transition-all hover:brightness-90 active:scale-[0.97]"
                >
                  Quero aprender com a lótus →
                </Link>
                <a href="#como-funciona" className="text-center text-sm font-medium text-gray-500 hover:text-[#4169D4]">
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
              <div className="rounded-2xl shadow-2xl shadow-[#071245]/10 overflow-hidden border border-gray-100 w-full">
                <Image
                  src="/prints/dashboard-aluno.jpeg"
                  alt="Dashboard do aluno na lótus"
                  width={1179}
                  height={1253}
                  className="w-full h-auto"
                  priority
                />
              </div>
              <div className="absolute -bottom-3 -right-3 rounded-full bg-[#F0F4FF] px-4 py-2 text-xs font-semibold text-[#071245] shadow-md">
                ✓ Seus materiais do professor
              </div>
            </div>
          </div>
        </section>

        {/* ━━━ PROBLEMA ━━━ */}
        <section className="bg-[#F0F4FF]/30 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn className="text-center space-y-4 mb-14">
              <h2 className="font-[var(--font-heading)] text-3xl font-bold text-[#071245] sm:text-4xl">
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
                    <h3 className="font-[var(--font-heading)] text-lg font-bold text-[#071245]">{card.title}</h3>
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
              <span className="inline-block rounded-full bg-[#F0F4FF] px-4 py-1.5 text-xs font-semibold text-[#071245]">
                Como a lótus é diferente
              </span>
              <h2 className="font-[var(--font-heading)] text-3xl font-bold text-[#071245] sm:text-4xl">
                IA que te ensina.<br />Não que faz por você.
              </h2>
            </FadeIn>

            <div className="grid items-center gap-12 grid-cols-1 md:grid-cols-2">
              <FadeIn>
                <div className="rounded-2xl shadow-xl shadow-[#071245]/10 overflow-hidden border border-blue-100 w-full">
                  <Image
                    src="/prints/conversa-darwin.jpeg"
                    alt="Conversa com o Darwin — tutor socrático"
                    width={676}
                    height={1280}
                    className="w-full h-auto"
                  />
                </div>
              </FadeIn>

              <FadeIn className="space-y-8">
                {[
                  { title: "Darwin — seu tutor socrático", body: "Ele nunca entrega a resposta. Ele faz a pergunta certa para que você mesmo chegue até ela." },
                  { title: "Contexto do seu professor", body: "Darwin conhece os materiais da sua turma. Não é uma IA genérica — é seu tutor personalizado." },
                  { title: "Perfil de aprendizado", body: "Na primeira vez que você acessa, a lótus aprende como você estuda melhor e adapta tudo para você." },
                  { title: "Sem cola, com rastreamento", body: "O professor consegue verificar se uma resposta foi gerada pela lótus — e ver todo o raciocínio que aconteceu antes dela." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#6B8EC4]/20">
                      <span className="text-sm font-bold text-[#6B8EC4]">✦</span>
                    </div>
                    <div>
                      <h4 className="font-[var(--font-heading)] text-base font-bold text-[#071245]">{item.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.body}</p>
                    </div>
                  </div>
                ))}
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ━━━ COMO FUNCIONA ━━━ */}
        <section id="como-funciona" className="bg-[#F0F4FF]/30 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn className="text-center mb-14">
              <h2 className="font-[var(--font-heading)] text-3xl font-bold text-[#071245] sm:text-4xl">
                Três formas de aprender mais em menos tempo
              </h2>
            </FadeIn>

            <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
              {[
                { icon: "🤖", title: "Tire dúvidas sem receber respostas prontas", body: "Darwin usa o método socrático: ele guia seu raciocínio com perguntas até você entender o conceito. Não é sobre a resposta. É sobre o caminho.", src: "/prints/conversa-darwin.jpeg", alt: "Chat com o Darwin", w: 676, h: 1280 },
                { icon: "📚", title: "Resumos, flashcards e mapas mentais em segundos", body: "Gere materiais de revisão personalizados com base no conteúdo exato do seu professor. Flashcards para memorizar, mapas mentais para visualizar, guias para a prova.", src: "/prints/revisar-materia.jpeg", alt: "Tela de revisão de matéria", w: 692, h: 1280 },
                { icon: "📝", title: "Simulados estilo ENEM com correção inteligente", body: "Gere questões no estilo ENEM baseadas no conteúdo da sua aula. A lótus corrige, explica cada erro e registra sua evolução ao longo do tempo.", src: "/prints/simulado.jpeg", alt: "Tela de simulado ENEM", w: 706, h: 1280 },
              ].map((card, i) => (
                <FadeIn key={i}>
                  <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 space-y-5 h-full flex flex-col">
                    <span className="text-4xl">{card.icon}</span>
                    <h3 className="font-[var(--font-heading)] text-lg font-bold text-[#071245]">{card.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600 flex-1">{card.body}</p>
                    <div className="rounded-xl overflow-hidden shadow-md border border-gray-100 w-full mt-4">
                      <Image
                        src={card.src}
                        alt={card.alt}
                        width={card.w}
                        height={card.h}
                        className="w-full h-auto"
                      />
                    </div>
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
                <span className="inline-block rounded-full bg-[#F0F4FF] px-4 py-1.5 text-xs font-semibold text-[#071245]">
                  Personalização real
                </span>
                <h2 className="font-[var(--font-heading)] text-3xl font-bold text-[#071245] sm:text-4xl">
                  A lótus aprende<br />como você aprende
                </h2>
                <p className="text-base leading-relaxed text-gray-600">
                  No primeiro acesso, você responde 7 perguntas rápidas. A partir daí, o Darwin adapta o tom, os exemplos e o nível de detalhe de cada resposta ao seu estilo único. Você prefere exemplos visuais? Explicações detalhadas? Respostas diretas? A lótus se ajusta.
                </p>
                <ul className="space-y-3 text-sm text-gray-700">
                  {[
                    "Estilo de aprendizado personalizado",
                    "Objetivo de carreira considerado nas respostas",
                    "Nível de detalhe adaptado à sua forma",
                    "Pode alterar seu perfil a qualquer momento",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6B8EC4]/20 text-xs text-[#6B8EC4]">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>

              <FadeIn>
                <div className="rounded-2xl shadow-xl shadow-[#071245]/10 overflow-hidden border border-blue-100 w-full">
                  <Image
                    src="/prints/personalizar-perfil.jpeg"
                    alt="Personalização do perfil de aprendizado"
                    width={696}
                    height={1280}
                    className="w-full h-auto"
                  />
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ━━━ CTA FINAL ━━━ */}
        <section className="bg-gradient-to-br from-[#071245] to-[#071245] py-12 sm:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <FadeIn className="space-y-6">
              <h2 className="font-[var(--font-heading)] text-2xl sm:text-3xl lg:text-[44px] font-bold text-white leading-tight">
                Seu próximo passo não é<br />decorar a resposta.
              </h2>
              <p className="text-lg text-white/80">
                É entender o porquê. A lótus te ensina isso.
              </p>
              <Link
                href="/acesso"
                className="inline-block rounded-2xl bg-[#00E87A] px-10 py-4 font-[var(--font-heading)] text-base font-bold text-[#071245] shadow-lg shadow-[#00E87A]/20 transition-all hover:brightness-90 active:scale-[0.97]"
              >
                Quero ter acesso à lótus →
              </Link>
              <p className="text-sm text-white/60">
                Integrado ao Google Classroom · Gratuito para começar
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ━━━ FOOTER ━━━ */}
        <footer className="bg-[#071245] py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex items-center gap-3">
                <img src="/lotus-logo.png" alt="lótus" className="h-16 w-auto object-contain brightness-0 invert" />
                <span className="text-lg font-bold text-white">lótus</span>
              </div>
              <p className="text-sm text-white/60 italic">understand the how, not just what</p>
              <div className="flex gap-6 text-sm">
                <a href="#como-funciona" className="text-white/70 hover:text-white">Como funciona</a>
                <a href="#para-escolas" className="text-white/70 hover:text-white">Para escolas</a>
                <Link href="/privacy" className="text-white/70 hover:text-white">Privacidade</Link>
              </div>
              <p className="text-xs text-white/40">
                © 2026 lótus. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
