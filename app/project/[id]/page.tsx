import { getProject } from "@/app/actions";
import ProjectEditor from "./project-editor";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
       <main className="mx-auto max-w-6xl">
        <ProjectEditor project={project} />
       </main>
    </div>
  );
}
