export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F8F7FF] px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6C47FF]">
            <span className="text-lg font-bold text-white">N</span>
          </div>
          <h1 className="font-['Sora',sans-serif] text-3xl font-bold text-[#1a1a2e]">
            Noema — Politica de Privacidade
          </h1>
        </div>

        <p className="text-sm text-gray-500">
          Ultima atualização: 5 de abril de 2026
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="mb-2 text-lg font-bold text-[#1a1a2e]">1. Introdução</h2>
            <p>
              A Noema é uma plataforma educacional que utiliza inteligência artificial para
              personalizar a experiência de aprendizado de estudantes do ensino médio. Esta
              política descreve quais dados coletamos, como os utilizamos e como os protegemos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#1a1a2e]">2. Dados que coletamos</h2>
            <p>Ao utilizar a Noema, coletamos os seguintes dados:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Dados da conta Google:</strong> nome, email e foto de perfil,
                obtidos através do login com Google OAuth.
              </li>
              <li>
                <strong>Dados do Google Classroom:</strong> lista de turmas em que o aluno
                está matriculado, tarefas e avisos dos professores. Esses dados são
                acessados em modo somente leitura e nunca são modificados.
              </li>
              <li>
                <strong>Perfil de aprendizado:</strong> respostas ao questionário de
                onboarding (perfil de estudante, objetivo, dificuldades, preferências
                de estudo).
              </li>
              <li>
                <strong>Dados de desempenho:</strong> resultados de simulados, interações
                com a IA (Darwin) e materiais de estudo gerados.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#1a1a2e]">3. Como usamos os dados</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Personalização:</strong> adaptar o conteúdo, feedback e método
                de ensino da IA com base no perfil do estudante.
              </li>
              <li>
                <strong>Integração com Classroom:</strong> exibir as turmas, tarefas e
                avisos do aluno dentro da plataforma Noema.
              </li>
              <li>
                <strong>Acompanhamento de desempenho:</strong> gerar relatórios de
                progresso para o aluno e, quando aplicável, para o professor.
              </li>
              <li>
                <strong>Melhoria do produto:</strong> entender padrões de uso para
                melhorar a experiência educacional.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#1a1a2e]">4. Uso de dados do Google</h2>
            <p>
              A Noema acessa dados do Google Classroom exclusivamente para fins
              educacionais. Especificamente:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>classroom.courses.readonly:</strong> para listar as turmas em
                que o aluno está matriculado e exibi-las no painel.
              </li>
              <li>
                <strong>classroom.coursework.me:</strong> para ler as tarefas atribuídas
                ao aluno e acompanhar entregas.
              </li>
              <li>
                <strong>classroom.announcements.readonly:</strong> para exibir avisos
                e comunicados dos professores.
              </li>
            </ul>
            <p className="mt-2">
              Nenhum dado do Google é vendido, compartilhado com terceiros para fins
              publicitários ou utilizado fora do contexto educacional descrito acima.
              Os dados são acessados em modo somente leitura — a Noema nunca cria,
              modifica ou exclui conteúdo no Google Classroom do usuário.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#1a1a2e]">5. Armazenamento e segurança</h2>
            <p>
              Os dados são armazenados em servidores seguros (Supabase/PostgreSQL) com
              criptografia em trânsito (TLS) e em repouso. Tokens de acesso do Google
              são armazenados de forma segura e utilizados apenas para as operações
              descritas nesta política.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#1a1a2e]">6. Compartilhamento de dados</h2>
            <p>
              Não vendemos, alugamos ou compartilhamos dados pessoais com terceiros,
              exceto:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>OpenAI:</strong> mensagens enviadas ao assistente Darwin são
                processadas pela API da OpenAI para gerar respostas. Nenhum dado
                pessoal identificável é enviado além do conteúdo da conversa.
              </li>
              <li>
                <strong>Professores:</strong> dados de desempenho agregados podem ser
                visíveis para professores autorizados no painel do professor.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#1a1a2e]">7. Direitos do usuário</h2>
            <p>O usuário pode a qualquer momento:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Revogar o acesso da Noema à sua conta Google em <a href="https://myaccount.google.com/permissions" className="text-[#6C47FF] underline" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a></li>
              <li>Solicitar a exclusão de seus dados enviando email para o contato abaixo</li>
              <li>Editar seu perfil de aprendizado a qualquer momento na plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#1a1a2e]">8. Menores de idade</h2>
            <p>
              A Noema é destinada a estudantes do ensino médio. O uso da plataforma por
              menores de 18 anos deve ser consentido por um responsável legal. A Noema
              está em conformidade com a Lei Geral de Proteção de Dados (LGPD) no que
              diz respeito ao tratamento de dados de menores.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#1a1a2e]">9. Contato</h2>
            <p>
              Para dúvidas, solicitações ou exercício de direitos relacionados a esta
              política, entre em contato:
            </p>
            <p className="mt-2 font-semibold text-[#1a1a2e]">
              Email: thiago10374@edu.sebrae.com.br
            </p>
          </section>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <a
            href="/"
            className="text-sm font-medium text-[#6C47FF] hover:underline"
          >
            ← Voltar para a Noema
          </a>
        </div>
      </div>
    </div>
  )
}
