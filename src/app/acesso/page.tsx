"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef, useEffect, useState } from "react"

function PrintPlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center ${className}`}>
      <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
      <span className="text-sm text-gray-400">[ {label} ]</span>
    </div>
  )
}

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

export default function AcessoPage() {
  return (
    <>
      <title>Como acessar a athena | Guia de primeiro acesso</title>
      <meta name="description" content="Guia passo a passo para acessar a athena. Entenda o aviso do Google e como prosseguir com segurança." />

      <div className="min-h-screen bg-white font-[var(--font-sans)] overflow-x-hidden">
        {/* ── Topbar ── */}
        <nav className="border-b border-[#E5E7EB] bg-white">
          <div className="mx-auto flex py-3 max-w-4xl items-center justify-between px-6">
            <img src="/athena-logo.png" alt="athena" className="h-8 w-auto object-contain" />
            <Link href="/landing" className="text-sm font-medium text-gray-500 hover:text-[#071245]">
              ← Voltar
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="mx-auto max-w-3xl px-6 py-10 sm:py-16 text-center">
          <FadeIn className="space-y-5">
            <span className="inline-block rounded-full bg-green-100 px-4 py-1.5 text-xs font-semibold text-green-700">
              ✓ Plataforma segura
            </span>

            <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-bold text-[#071245] lg:text-[40px] leading-tight">
              Você está a um passo<br />de acessar a athena
            </h1>

            <p className="mx-auto max-w-xl text-base sm:text-lg text-gray-600">
              Antes de entrar, precisa entender algo importante sobre a tela que vai aparecer.
            </p>
          </FadeIn>
        </section>

        {/* ── Bloco de aviso ── */}
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <FadeIn>
            <div className="rounded-2xl border-2 border-[#6B8EC4]/40 bg-[#F0F4FF]/15 p-6 sm:p-8 md:p-10 space-y-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <span className="text-3xl">🔒</span>
                <div className="space-y-4">
                  <h2 className="font-[var(--font-heading)] text-xl font-bold text-[#071245]">
                    Por que aparece um aviso do Google?
                  </h2>
                  <div className="space-y-4 text-sm leading-relaxed text-gray-700">
                    <p>
                      Quando você clicar em &ldquo;Entrar com Google&rdquo;, o Google pode exibir uma tela dizendo que o aplicativo não foi verificado ainda.
                    </p>
                    <p>
                      Isso acontece porque a athena está em fase de acesso antecipado — o processo de verificação do Google leva semanas e ainda está em andamento.
                    </p>
                    <p className="font-semibold text-[#071245]">
                      Isso NÃO significa que o app é perigoso.
                    </p>
                    <div className="rounded-xl bg-white p-5 border border-[#E5E7EB]">
                      <p className="font-semibold text-[#071245] mb-3">A athena:</p>
                      <ul className="space-y-2">
                        {[
                          "Não armazena sua senha do Google",
                          "Acessa apenas seus cursos do Classroom (somente leitura)",
                          "Não compartilha seus dados com terceiros",
                          "Usa criptografia em todas as comunicações",
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── Passo a passo ── */}
        <section className="bg-[#F0F4FF]/20 py-10 sm:py-16">
          <div className="mx-auto max-w-3xl px-6">
            <FadeIn className="text-center mb-12">
              <h2 className="font-[var(--font-heading)] text-2xl font-bold text-[#071245] sm:text-3xl">
                Como acessar em 3 passos
              </h2>
            </FadeIn>

            <div className="space-y-8">
              {[
                { step: 1, src: "/prints/aviso-google.jpeg", alt: "Tela de aviso do Google", w: 961, h: 1600, text: "Clique em \"Configurações avançadas\" ou \"Mostrar informações avançadas\"" },
                { step: 2, src: "/prints/aviso-google-passo2.jpeg", alt: "Link para acessar a athena", w: 888, h: 1600, text: "Clique em \"Ir para athena (não seguro)\" — o aviso é padrão do Google para apps em verificação" },
                { step: 3, src: "/prints/permissoes-google.jpeg", alt: "Tela de permissões do Google", w: 924, h: 1600, text: "Confirme as permissões — a athena só pede acesso de leitura aos seus cursos do Classroom" },
              ].map((item) => (
                <FadeIn key={item.step}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#4169D4] text-lg font-bold text-white">
                        {item.step}
                      </div>
                      <h3 className="font-[var(--font-heading)] text-lg font-bold text-[#071245]">
                        Passo {item.step}
                      </h3>
                    </div>
                    <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 w-full max-w-2xl mx-auto">
                      <Image
                        src={item.src}
                        alt={item.alt}
                        width={item.w}
                        height={item.h}
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed pl-[52px]">
                      {item.text}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Final ── */}
        <section className="py-10 sm:py-16">
          <div className="mx-auto max-w-xl px-6 text-center">
            <FadeIn className="space-y-6">
              <h2 className="font-[var(--font-heading)] text-2xl font-bold text-[#071245] sm:text-3xl">
                Pronto para começar?
              </h2>

              <Link
                href="/login"
                className="inline-block w-full max-w-sm rounded-2xl bg-[#4169D4] px-10 py-4 font-[var(--font-heading)] text-base font-bold text-white shadow-lg shadow-[#4169D4]/25 transition-all hover:bg-[#071245] active:scale-[0.97]"
              >
                Acessar a athena agora →
              </Link>

              <p className="text-sm text-gray-400">
                Qualquer dúvida? Entre em contato: thiago10374@edu.sebrae.com.br
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-[#E5E7EB] bg-white py-8">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="text-xs text-gray-400">
              © 2026 athena. Todos os direitos reservados. ·{" "}
              <Link href="/privacy" className="hover:text-[#4169D4] underline">Política de Privacidade</Link>
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
