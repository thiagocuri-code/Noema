export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white px-4 py-8 sm:py-12 overflow-x-hidden">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center gap-3">
          <img src="/lotus-logo.png" alt="lótus" className="h-8 w-auto object-contain" />
          <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-bold text-[#071245]">
            Política de Privacidade
          </h1>
        </div>

        <p className="text-sm text-gray-500">
          Ultima atualização: 5 de abril de 2026
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="mb-2 text-base sm:text-lg font-bold text-[#071245]">1. Introdução</h2>
            <p>
              A lótus é uma plataforma educacional que utiliza inteligência artificial para
              personalizar a experiência de aprendizado de estudantes do ensino médio. Esta
              política descreve quais dados coletamos, como os utilizamos e como os protegemos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base sm:text-lg font-bold text-[#071245]">2. Dados que coletamos</h2>
            <p>Ao utilizar a lótus, coletamos os seguintes dados:</p>
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
            <h2 className="mb-2 text-base sm:text-lg font-bold text-[#071245]">3. Como usamos os dados</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Personalização:</strong> adaptar o conteúdo, feedback e método
                de ensino da IA com base no perfil do estudante.
              </li>
              <li>
                <strong>Integração com Classroom:</strong> exibir as turmas, tarefas e
                avisos do aluno dentro da plataforma lótus.
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
            <h2 className="mb-2 text-base sm:text-lg font-bold text-[#071245]">4. Uso de dados do Google</h2>
            <p>
              A lótus acessa dados do Google Classroom exclusivamente para fins
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
              Os dados são acessados em modo somente leitura — a lótus nunca cria,
              modifica ou exclui conteúdo no Google Classroom do usuário.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base sm:text-lg font-bold text-[#071245]">5. Armazenamento e segurança</h2>
            <p>
              Os dados são armazenados em servidores seguros (Supabase/PostgreSQL) com
              criptografia em trânsito (TLS) e em repouso. Tokens de acesso do Google
              são armazenados de forma segura e utilizados apenas para as operações
              descritas nesta política.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base sm:text-lg font-bold text-[#071245]">6. Compartilhamento de dados</h2>
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
            <h2 className="mb-2 text-base sm:text-lg font-bold text-[#071245]">7. Direitos do usuário</h2>
            <p>O usuário pode a qualquer momento:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Revogar o acesso da lótus à sua conta Google em <a href="https://myaccount.google.com/permissions" className="text-[#071245] underline" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a></li>
              <li>Solicitar a exclusão de seus dados enviando email para o contato abaixo</li>
              <li>Editar seu perfil de aprendizado a qualquer momento na plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base sm:text-lg font-bold text-[#071245]">8. Menores de idade</h2>
            <p>
              A lótus é destinada a estudantes do ensino médio. O uso da plataforma por
              menores de 18 anos deve ser consentido por um responsável legal. A lótus
              está em conformidade com a Lei Geral de Proteção de Dados (LGPD) no que
              diz respeito ao tratamento de dados de menores.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base sm:text-lg font-bold text-[#071245]">9. Contato</h2>
            <p>
              Para dúvidas, solicitações ou exercício de direitos relacionados a esta
              política, entre em contato:
            </p>
            <p className="mt-2 font-semibold text-[#071245]">
              Email: thiago10374@edu.sebrae.com.br
            </p>
          </section>
        </div>

        <div className="border-t border-[#E5E7EB] pt-6">
          <a
            href="/"
            className="text-sm font-medium text-[#071245] hover:underline"
          >
            ← Voltar para a lótus
          </a>
        </div>
      </div>
    </div>
  )
}
