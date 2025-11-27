'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Loader2 } from 'lucide-react'
import { createProject } from './actions'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function CreateProjectForm() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      try {
        const result = await createProject(formData)
        if (result?.success) {
          toast.success('Projeto criado com sucesso!')
          router.push(`/project/${result.id}`)
        }
      } catch (error) {
        toast.error('Erro ao criar projeto')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:gap-2">
      <Input 
        name="title" 
        placeholder="Novo Projeto..." 
        className="w-full sm:w-64"
        required
        disabled={isPending}
      />
      <Button 
        type="submit" 
        className="cursor-pointer w-full sm:w-auto" 
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Criar
          </>
        )}
      </Button>
    </form>
  )
}
