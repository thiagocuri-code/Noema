import { google } from "googleapis"

export function getClassroomClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.classroom({ version: "v1", auth })
}

export async function getCourses(accessToken: string) {
  const classroom = getClassroomClient(accessToken)
  const res = await classroom.courses.list({ courseStates: ["ACTIVE"] })
  return res.data.courses ?? []
}

export async function getCourseWork(accessToken: string, courseId: string) {
  const classroom = getClassroomClient(accessToken)
  const res = await classroom.courses.courseWork.list({ courseId })
  return res.data.courseWork ?? []
}

export async function getAnnouncements(accessToken: string, courseId: string) {
  const classroom = getClassroomClient(accessToken)
  const res = await classroom.courses.announcements.list({ courseId })
  return res.data.announcements ?? []
}

export async function getCourseMaterials(accessToken: string, courseId: string) {
  const classroom = getClassroomClient(accessToken)
  const res = await classroom.courses.courseWorkMaterials.list({ courseId })
  return res.data.courseWorkMaterial ?? []
}
