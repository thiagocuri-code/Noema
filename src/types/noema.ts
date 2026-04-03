export interface Course {
  id: string
  name: string
  section?: string
  descriptionHeading?: string
  ownerId?: string
  teacherFolder?: { id: string }
  alternateLink?: string
}

export interface Assignment {
  id: string
  title: string
  description?: string
  dueDate?: { year: number; month: number; day: number }
  dueTime?: { hours: number; minutes: number }
  alternateLink?: string
  state?: string
}

export interface Announcement {
  id: string
  text: string
  createdTime?: string
  alternateLink?: string
}

export interface Material {
  id: string
  title: string
  description?: string
  alternateLink?: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}
