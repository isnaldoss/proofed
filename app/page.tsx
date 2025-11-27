import { getProjects } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Folder } from "lucide-react";
import CreateProjectForm from "./create-project-form";

// Force dynamic rendering (no pre-render at build time)
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const projects = await getProjects();

  return (
    <div className="bg-background p-4 sm:p-8 font-sans">
      <header className="mb-8 sm:mb-12 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Proofed</h1>
      </header>

      <main className="mx-auto max-w-5xl">
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Seus Projetos</h2>
          
          <CreateProjectForm />
        </div>

        {projects.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed text-muted-foreground">
            <Folder className="mb-4 h-10 w-10 opacity-20" />
            <p>Nenhum projeto criado ainda.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`} className="group">
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="truncate group-hover:text-primary">
                      {project.title}
                    </CardTitle>
                    <CardDescription>
                      {new Date(project.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Folder className="mr-2 h-4 w-4" />
                      {project.media.length} arquivos
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
