'use client'

import { useState, useTransition } from 'react'
import { Project, MediaItem, uploadMedia, updateProjectMedia, deleteProject, deleteMedia, updateProjectTitle } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Upload, Link as LinkIcon, ExternalLink, GripVertical, Trash2, ArrowLeft, Loader2, X, Pencil, Check } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableMediaItem({ item, onDelete }: { item: MediaItem; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
      {item.type === 'video' ? (
        <video src={item.url} className="h-full w-full object-cover" />
      ) : (
        <img src={item.url} alt="Project media" className="h-full w-full object-cover" />
      )}
      
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <button {...attributes} {...listeners} className="cursor-grab p-2 text-white hover:text-primary">
          <GripVertical className="h-6 w-6" />
        </button>
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-all hover:bg-black/80 hover:scale-110 group-hover:opacity-100"
        title="Excluir imagem"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
        {item.comments.length} comentários
      </div>
    </div>
  )
}

export default function ProjectEditor({ project }: { project: Project }) {
  const [media, setMedia] = useState(project.media)
  const [isPending, startTransition] = useTransition()
  const [uploadStatus, setUploadStatus] = useState('')
  const router = useRouter()
  
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(project.title)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleTitleSave() {
    if (title === project.title) {
      setIsEditingTitle(false)
      return
    }

    startTransition(async () => {
      try {
        await updateProjectTitle(project.id, title)
        setIsEditingTitle(false)
        toast.success('Título atualizado!')
      } catch (error) {
        toast.error('Erro ao atualizar título')
      }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setMedia((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Save new order
        startTransition(async () => {
          await updateProjectMedia(project.id, newItems)
        })
        
        return newItems
      })
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    
    const files = Array.from(e.target.files)
    setUploadStatus('Iniciando upload...')
    
    startTransition(async () => {
      // Upload files one by one to avoid hitting Vercel's 4.5MB request body limit
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadStatus(`Enviando ${i + 1} de ${files.length}...`)
        
        const formData = new FormData()
        formData.append('files', file)
        try {
          await uploadMedia(project.id, formData)
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          alert(`Erro ao enviar ${file.name}. Verifique se o arquivo é menor que 4.5MB.`)
        }
      }
      setUploadStatus('Finalizando...')
      window.location.reload() 
    })
  }

  function copyLink() {
    const url = `${window.location.origin}/p/${project.id}`
    navigator.clipboard.writeText(url)
    alert('Link copiado!')
  }

  const [isDeleting, setIsDeleting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // ... existing sensors ...

  // ... existing handleDragEnd ...

  // ... existing handleUpload ...

  // New Drag and Drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    
    if (!e.dataTransfer.files?.length) return

    const files = Array.from(e.dataTransfer.files)
    setUploadStatus('Iniciando upload...')
    
    startTransition(async () => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadStatus(`Enviando ${i + 1} de ${files.length}...`)
        
        const formData = new FormData()
        formData.append('files', file)
        try {
          await uploadMedia(project.id, formData)
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          toast.error(`Erro ao enviar ${file.name}. Verifique o tamanho do arquivo.`)
        }
      }
      setUploadStatus('Finalizando...')
      toast.success('Upload concluído!')
      window.location.reload() 
    })
  }

  // ... existing copyLink ...

  async function handleDeleteMedia(mediaId: string) {
    toast('Tem certeza que deseja excluir esta mídia?', {
      action: {
        label: 'Excluir',
        onClick: async () => {
          try {
            await deleteMedia(project.id, mediaId)
            toast.success('Mídia excluída com sucesso')
            window.location.reload()
          } catch (error) {
            toast.error('Erro ao excluir mídia')
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
      duration: 5000,
    })
  }

  async function handleDelete() {
    toast('Tem certeza que deseja excluir este projeto?', {
      action: {
        label: 'Excluir',
        onClick: async () => {
          setIsDeleting(true)
          try {
            const result = await deleteProject(project.id)
            if (result?.success) {
              toast.success('Projeto excluído')
              router.push('/')
            }
          } catch (error) {
            setIsDeleting(false)
            toast.error('Erro ao excluir projeto')
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
      duration: 5000,
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="cursor-pointer">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-lg font-bold w-[200px] sm:w-[300px]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave()
                  if (e.key === 'Escape') {
                    setTitle(project.title)
                    setIsEditingTitle(false)
                  }
                }}
              />
              <Button size="icon" variant="ghost" onClick={handleTitleSave} disabled={isPending} className="h-9 w-9">
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-2xl font-bold">{title}</h1>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setIsEditingTitle(true)}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            size="icon" 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="cursor-pointer"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={copyLink} className="cursor-pointer">
            <LinkIcon className="mr-2 h-4 w-4" />
            Copiar Link
          </Button>
          <Button variant="default" asChild className="cursor-pointer">
            <a href={`/p/${project.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Visualizar
            </a>
          </Button>
        </div>
      </div>

      <Card className="p-8">
        <div 
          className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed py-12 text-center text-muted-foreground transition-colors ${
            isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="rounded-full bg-muted p-4">
            <Upload className="h-8 w-8" />
          </div>
          <div>
            <p className="font-medium">Arraste e solte arquivos aqui</p>
            <p className="text-sm">ou clique para selecionar</p>
          </div>
          <Input 
            type="file" 
            multiple 
            accept="image/*,video/*" 
            className="hidden" 
            id="file-upload"
            onChange={handleUpload}
            disabled={isPending || !!uploadStatus}
          />
          <Button asChild disabled={isPending || !!uploadStatus} className={uploadStatus ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}>
            <label htmlFor="file-upload" className={uploadStatus ? "cursor-not-allowed" : "cursor-pointer"}>
              {uploadStatus ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> {uploadStatus}
                </span>
              ) : (
                "Selecionar Arquivos"
              )}
            </label>
          </Button>
        </div>
      </Card>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={media.map(m => m.id)} 
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {media.map((item) => (
              <SortableMediaItem key={item.id} item={item} onDelete={handleDeleteMedia} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
