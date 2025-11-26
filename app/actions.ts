'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import cloudinary from '@/lib/cloudinary'
import { db } from '@/lib/db'

export type Project = {
  id: string
  title: string
  created_at: string
}

export type MediaItem = {
  id: string
  url: string
  type: 'image' | 'video'
  comments: Comment[]
  position: number
}

export type Comment = {
  id: string
  x: number
  y: number
  text: string
  author?: string
  created_at: string
}

export async function getProjects() {
  const result = await db`
    SELECT id, title, created_at
    FROM projects
    ORDER BY created_at DESC
  `
  return result.rows as Project[]
}

export async function createProject(formData: FormData) {
  const title = formData.get('title') as string
  if (!title) return

  const result = await db`
    INSERT INTO projects (title)
    VALUES (${title})
    RETURNING id
  `
  
  const projectId = result.rows[0].id
  
  revalidatePath('/')
  redirect(`/project/${projectId}`)
}

export async function getProject(id: string) {
  const projectResult = await db`
    SELECT id, title, created_at
    FROM projects
    WHERE id = ${id}
  `
  
  if (projectResult.rows.length === 0) return null
  
  const project = projectResult.rows[0] as Project
  
  // Get media with comments
  const mediaResult = await db`
    SELECT 
      m.id, m.url, m.type, m.position,
      json_agg(
        json_build_object(
          'id', c.id,
          'x', c.x,
          'y', c.y,
          'text', c.text,
          'author', c.author,
          'created_at', c.created_at
        ) ORDER BY c.created_at
      ) FILTER (WHERE c.id IS NOT NULL) as comments
    FROM media m
    LEFT JOIN comments c ON c.media_id = m.id
    WHERE m.project_id = ${id}
    GROUP BY m.id, m.url, m.type, m.position
    ORDER BY m.position
  `
  
  return {
    ...project,
    media: mediaResult.rows.map(row => ({
      ...row,
      comments: row.comments || []
    })) as MediaItem[]
  }
}

export async function uploadMedia(projectId: string, formData: FormData) {
  try {
    const files = formData.getAll('files') as File[]
    
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')
      const dataURI = `data:${file.type};base64,${base64}`
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: `proofed/${projectId}`,
        resource_type: file.type.startsWith('video') ? 'video' : 'image',
      })
      
      // Get current max position
      const positionResult = await db`
        SELECT COALESCE(MAX(position), -1) + 1 as next_position
        FROM media
        WHERE project_id = ${projectId}
      `
      const nextPosition = positionResult.rows[0].next_position
      
      // Save to database
      await db`
        INSERT INTO media (project_id, url, type, position)
        VALUES (
          ${projectId},
          ${result.secure_url},
          ${file.type.startsWith('video') ? 'video' : 'image'},
          ${nextPosition}
        )
      `
    }

    revalidatePath(`/project/${projectId}`)
    revalidatePath(`/p/${projectId}`)
  } catch (error) {
    console.error('Error uploading media:', error)
    throw new Error('Failed to upload media')
  }
}

export async function updateProjectMedia(projectId: string, media: MediaItem[]) {
  try {
    // Update positions
    for (let i = 0; i < media.length; i++) {
      await db`
        UPDATE media
        SET position = ${i}
        WHERE id = ${media[i].id}
      `
    }
    
    revalidatePath(`/project/${projectId}`)
    revalidatePath(`/p/${projectId}`)
  } catch (error) {
    console.error('Error updating media:', error)
  }
}

export async function addComment(projectId: string, mediaId: string, comment: Omit<Comment, 'id' | 'created_at'>) {
  await db`
    INSERT INTO comments (media_id, x, y, text, author)
    VALUES (
      ${mediaId},
      ${comment.x},
      ${comment.y},
      ${comment.text},
      ${comment.author || 'Anônimo'}
    )
  `
  
  revalidatePath(`/p/${projectId}`)
  revalidatePath(`/project/${projectId}`)
}

export async function deleteProject(projectId: string) {
  try {
    // Get all media URLs to delete from Cloudinary
    const mediaResult = await db`
      SELECT url FROM media WHERE project_id = ${projectId}
    `
    
    // Delete from Cloudinary
    for (const row of mediaResult.rows) {
      const publicId = row.url.split('/').slice(-2).join('/').split('.')[0]
      try {
        await cloudinary.uploader.destroy(`proofed/${publicId}`)
      } catch (error) {
        console.error(`Failed to delete from Cloudinary: ${publicId}`, error)
      }
    }
    
    // Delete from database (cascade will handle media and comments)
    await db`
      DELETE FROM projects WHERE id = ${projectId}
    `
    
    revalidatePath('/')
    redirect('/')
  } catch (error) {
    console.error('Error deleting project:', error)
    throw error
  }
}
