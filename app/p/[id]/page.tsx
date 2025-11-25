import { getProject } from "@/app/actions";
import ProjectViewer from "./project-viewer";
import { notFound } from "next/navigation";

import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return {
      title: "Projeto não encontrado - Proofed",
    };
  }

  return {
    title: `${project.title} - Proofed`,
    description: `Visualize e aprove o projeto ${project.title} no Proofed.`,
  };
}

export default async function ViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return <ProjectViewer project={project} />;
}
