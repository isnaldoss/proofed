'use server'

import fs from 'fs/promises'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

export type Project = {
  id: string
  title: string
  createdAt: string
  media: MediaItem[]
}

export type MediaItem = {
  id: string
  url: string
  type: 'image' | 'video'
  comments: Comment[]
}

export type Comment = {
  id: string
  x: number
  y: number
  text: string
  author?: string
  createdAt: string
}

async function getDb() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(data) as { projects: Project[] }
  } catch (error) {
    return { projects: [] }
  }
}

async function saveDb(data: { projects: Project[] }) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2))
}

export async function getProjects() {
  const db = await getDb()
  return db.projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function createProject(formData: FormData) {
  const title = formData.get('title') as string
  if (!title) return

  const db = await getDb()
  const newProject: Project = {
    id: crypto.randomUUID(),
    title,
    createdAt: new Date().toISOString(),
    media: []
  }

  db.projects.push(newProject)
  await saveDb(db)
  
  revalidatePath('/')
  redirect(`/project/${newProject.id}`)
}

export async function getProject(id: string) {
  const db = await getDb()
  return db.projects.find((p) => p.id === id)
}

export async function uploadMedia(projectId: string, formData: FormData) {
  try {
    const files = formData.getAll('files') as File[]
    const db = await getDb()
    const project = db.projects.find((p) => p.id === projectId)
    
    if (!project) return

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = path.extname(file.name)
      const filename = `${crypto.randomUUID()}${ext}`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', projectId)
      
      // Ensure directory exists
      try {
        await fs.access(uploadDir)
      } catch {
        await fs.mkdir(uploadDir, { recursive: true })
      }

      await fs.writeFile(path.join(uploadDir, filename), buffer)

      const mediaItem: MediaItem = {
        id: crypto.randomUUID(),
        url: `/uploads/${projectId}/${filename}`,
        type: file.type.startsWith('video') ? 'video' : 'image',
        comments: []
      }
      
      project.media.push(mediaItem)
    }

    await saveDb(db)
    revalidatePath(`/project/${projectId}`)
    revalidatePath(`/p/${projectId}`)
  } catch (error) {
    console.error('Error uploading media:', error)
    throw new Error('Failed to upload media')
  }
}

export async function updateProjectMedia(projectId: string, media: MediaItem[]) {
  const db = await getDb()
  const project = db.projects.find((p) => p.id === projectId)
  
  if (!project) return

  await saveDb(db)
  revalidatePath(`/project/${projectId}`)
  revalidatePath(`/p/${projectId}`)
}

export async function addComment(projectId: string, mediaId: string, comment: Omit<Comment, 'id' | 'createdAt'>) {
  const db = await getDb()
  const project = db.projects.find((p) => p.id === projectId)
  
  if (!project) return

  const mediaItem = project.media.find((m) => m.id === mediaId)
  if (!mediaItem) return

  const newComment: Comment = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...comment
  }

  mediaItem.comments.push(newComment)
  await saveDb(db)
  revalidatePath(`/p/${projectId}`)
  revalidatePath(`/project/${projectId}`)
}

export async function deleteProject(projectId: string) {
  const db = await getDb()
  const project = db.projects.find((p) => p.id === projectId)

  if (project) {
    // Delete project folder
    try {
      const projectDir = path.join(process.cwd(), 'public', 'uploads', projectId)
      await fs.rm(projectDir, { recursive: true, force: true })
    } catch (error) {
      console.error(`Failed to delete project directory: ${projectId}`, error)
    }
  }

  db.projects = db.projects.filter((p) => p.id !== projectId)
  await saveDb(db)
  revalidatePath('/')
  redirect('/')
}
