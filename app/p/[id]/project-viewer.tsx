'use client'

import { useState, useRef, useEffect } from 'react'
import { Project, MediaItem, Comment, addComment } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, ChevronLeft, ChevronRight, Send, X } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { cn } from '@/lib/utils'

export default function ProjectViewer({ project }: { project: Project }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [commentMode, setCommentMode] = useState(false)
  const [tempComment, setTempComment] = useState<{ x: number; y: number } | null>(null)
  const [commentText, setCommentText] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [showComments, setShowComments] = useState(true)

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        setSelectedIndex(emblaApi.selectedScrollSnap())
        setTempComment(null)
        setCommentMode(false)
      })
    }
  }, [emblaApi])

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev()
  const scrollNext = () => emblaApi && emblaApi.scrollNext()

  const currentMedia = project.media[selectedIndex]

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!commentMode) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setTempComment({ x, y })
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempComment || !commentText) return

    await addComment(project.id, currentMedia.id, {
      x: tempComment.x,
      y: tempComment.y,
      text: commentText,
      author: authorName || 'Anônimo'
    })

    setTempComment(null)
    setCommentText('')
    setCommentMode(false)
  }

  if (!currentMedia) return <div className="flex h-screen items-center justify-center">Nenhuma mídia encontrada.</div>

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-black/50 p-4 backdrop-blur-md">
        <div className="text-xl font-bold tracking-tight">Proofed</div>
        <div className="flex items-center gap-4">
          <Button 
            variant={commentMode ? "default" : "secondary"}
            size="sm"
            onClick={() => {
              setCommentMode(!commentMode)
              setTempComment(null)
            }}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {commentMode ? 'Cancelar Comentário' : 'Comentar'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className={showComments ? "text-primary" : "text-muted-foreground"}
          >
            {showComments ? 'Ocultar Pins' : 'Mostrar Pins'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative flex-1 overflow-hidden">
        <div className="embla h-full" ref={emblaRef}>
          <div className="embla__container h-full">
            {project.media.map((item) => (
              <div key={item.id} className="embla__slide relative flex h-full min-w-0 flex-[0_0_100%] items-center justify-center bg-neutral-900">
                <div className="relative max-h-full max-w-full" onClick={handleImageClick}>
                   {item.type === 'video' ? (
                    <video src={item.url} controls className="max-h-[80vh] max-w-full" />
                  ) : (
                    <img 
                      src={item.url} 
                      alt="Project media" 
                      className={cn(
                        "max-h-[80vh] max-w-full object-contain select-none",
                        commentMode && "cursor-crosshair"
                      )} 
                    />
                  )}

                  {/* Existing Comments */}
                  {showComments && item.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="group absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-primary shadow-lg ring-2 ring-white transition-transform hover:scale-125"
                      style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 rounded-md bg-white p-2 text-xs text-black shadow-xl group-hover:block">
                        <p className="font-bold">{comment.author}</p>
                        <p>{comment.text}</p>
                        <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white"></div>
                      </div>
                    </div>
                  ))}

                  {/* Temp Comment Marker */}
                  {tempComment && (
                    <div
                      className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-yellow-400 ring-2 ring-white"
                      style={{ left: `${tempComment.x}%`, top: `${tempComment.y}%` }}
                    ></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
          onClick={scrollPrev}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
          onClick={scrollNext}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>

      {/* Comment Input Modal/Overlay */}
      {tempComment && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 backdrop-blur-md animate-in slide-in-from-bottom">
          <form onSubmit={handleSubmitComment} className="mx-auto flex max-w-2xl gap-4">
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Seu nome (opcional)"
              className="w-1/3 bg-white/10 text-white placeholder:text-white/50"
            />
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Digite seu comentário..."
              className="flex-1 bg-white/10 text-white placeholder:text-white/50"
              autoFocus
            />
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" />
              Enviar
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={() => setTempComment(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
