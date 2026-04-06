export const MOCK_COURSES = [
  {
    id: "matematica",
    name: "Matemática",
    subject: "Exatas",
    color: "#0a1a4a",
    teacher: "Prof. Carlos",
    pendingCount: 4,
    urgent: true,
    assignments: [
      {
        id: "mat-1",
        title: "Lista de Funções Quadráticas",
        description: "Resolva os exercícios 1 a 15 do capítulo 3.",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 dias
        status: "urgent",
      },
      {
        id: "mat-2",
        title: "Prova de Trigonometria",
        description: "Conteúdo: seno, cosseno, tangente e relações fundamentais.",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 dias
        status: "upcoming",
      },
      {
        id: "mat-3",
        title: "Trabalho de Geometria Analítica",
        description: "Entrega do trabalho em grupo sobre cônicas.",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 dias
        status: "ok",
      },
      {
        id: "mat-4",
        title: "Exercícios de Probabilidade",
        description: "Capítulo 7, exercícios ímpares.",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias
        status: "ok",
      },
    ],
    announcements: [
      {
        id: "ann-mat-1",
        text: "A prova de recuperação será na próxima sexta, sala 204. Tragam calculadora científica.",
      },
    ],
    materials: [
      {
        id: "mat-m1",
        title: "Apostila de Funções — Cap. 3",
        description: "Material completo com teoria e exercícios resolvidos.",
      },
      {
        id: "mat-m2",
        title: "Videoaula: Trigonometria no Ciclo Unitário",
        description: "Link para a aula gravada na plataforma da escola.",
      },
    ],
  },
  {
    id: "fisica",
    name: "Física",
    subject: "Exatas",
    color: "#0ea5e9",
    teacher: "Prof. Ana",
    pendingCount: 2,
    urgent: false,
    assignments: [
      {
        id: "fis-1",
        title: "Relatório de Laboratório — Queda Livre",
        description: "Relatório do experimento realizado em sala. Use o template fornecido.",
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        status: "upcoming",
      },
      {
        id: "fis-2",
        title: "Lista de Leis de Newton",
        description: "Exercícios sobre dinâmica — força, massa e aceleração.",
        dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        status: "ok",
      },
    ],
    announcements: [
      {
        id: "ann-fis-1",
        text: "Aula prática no laboratório na quinta-feira. Presença obrigatória.",
      },
    ],
    materials: [
      {
        id: "fis-m1",
        title: "Resumo — Leis de Newton",
        description: "PDF com resumo teórico e exemplos comentados.",
      },
    ],
  },
  {
    id: "portugues",
    name: "Português",
    subject: "Humanas",
    color: "#22c55e",
    teacher: "Prof. Mariana",
    pendingCount: 1,
    urgent: false,
    assignments: [
      {
        id: "por-1",
        title: "Redação — Tema ENEM 2024",
        description: "Escreva uma redação dissertativo-argumentativa sobre o tema proposto.",
        dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        status: "upcoming",
      },
    ],
    announcements: [
      {
        id: "ann-por-1",
        text: "Leitura obrigatória: capítulos 1-5 de 'Dom Casmurro'. Haverá discussão em sala.",
      },
      {
        id: "ann-por-2",
        text: "Monitoria de redação toda quarta às 14h, sala dos professores.",
      },
    ],
    materials: [
      {
        id: "por-m1",
        title: "Guia de Redação ENEM — Competências 1 a 5",
        description: "Material completo com exemplos de redações nota 1000.",
      },
      {
        id: "por-m2",
        title: "Dom Casmurro — Machado de Assis (PDF)",
        description: "Obra completa em domínio público.",
      },
    ],
  },
]

export function getCourseById(id: string) {
  return MOCK_COURSES.find((c) => c.id === id)
}

export function getDueDateLabel(date: Date) {
  const now = new Date()
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: "Atrasado", color: "text-red-600 bg-red-50" }
  if (diff === 0) return { label: "Hoje", color: "text-red-600 bg-red-50" }
  if (diff <= 3) return { label: `${diff}d restantes`, color: "text-amber-600 bg-amber-50" }
  return { label: `${diff}d restantes`, color: "text-green-600 bg-green-50" }
}
