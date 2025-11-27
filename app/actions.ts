"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import cloudinary from "@/lib/cloudinary";
import connectDB, { Project as ProjectModel } from "@/lib/db";

export type Project = {
  id: string;
  title: string;
  created_at: string;
  media: MediaItem[];
};

export type MediaItem = {
  id: string;
  url: string;
  type: "image" | "video";
  comments: Comment[];
  position: number;
};

export type Comment = {
  id: string;
  x: number;
  y: number;
  text: string;
  author?: string;
  created_at: string;
};

export async function getProjects() {
  await connectDB();
  const projects = await ProjectModel.find().sort({ created_at: -1 }).lean();

  return projects.map((p: any) => ({
    id: p._id.toString(),
    title: p.title,
    created_at: p.created_at.toISOString(),
    media: (p.media || []).map((m: any) => ({
      id: m._id.toString(),
      url: m.url,
      type: m.type,
      position: m.position,
      comments: (m.comments || []).map((c: any) => ({
        id: c._id.toString(),
        x: c.x,
        y: c.y,
        text: c.text,
        author: c.author,
        created_at: c.created_at.toISOString(),
      })),
    })),
  })) as Project[];
}

export async function createProject(formData: FormData) {
  const title = formData.get("title") as string;
  if (!title) return;

  await connectDB();
  const project = await ProjectModel.create({ title });

  revalidatePath("/");
  return { success: true, id: project._id.toString() };
}

// ... (getProject, uploadMedia, updateProjectMedia, addComment, deleteMedia remain unchanged) ...

export async function deleteProject(projectId: string) {
  try {
    await connectDB();
    const project = await ProjectModel.findById(projectId);
    if (!project) return;

    // Delete from Cloudinary
    for (const item of project.media) {
      const publicId = item.url.split("/").slice(-2).join("/").split(".")[0];
      try {
        await cloudinary.uploader.destroy(`proofed/${publicId}`, {
          resource_type: item.type === "video" ? "video" : "image",
        });
      } catch (error) {
        console.error(`Failed to delete from Cloudinary: ${publicId}`, error);
      }
    }

    // Delete folder from Cloudinary
    try {
      await cloudinary.api.delete_folder(`proofed/${projectId}`);
    } catch (error) {
      console.error(
        `Failed to delete folder from Cloudinary: proofed/${projectId}`,
        error
      );
    }

    await ProjectModel.findByIdAndDelete(projectId);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

export async function getProject(id: string) {
  await connectDB();

  try {
    const project = await ProjectModel.findById(id).lean();
    if (!project) return null;

    return {
      id: project._id.toString(),
      title: project.title,
      created_at: project.created_at.toISOString(),
      media: (project.media || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((m: any) => ({
          id: m._id.toString(),
          url: m.url,
          type: m.type,
          position: m.position,
          comments: (m.comments || []).map((c: any) => ({
            id: c._id.toString(),
            x: c.x,
            y: c.y,
            text: c.text,
            author: c.author,
            created_at: c.created_at.toISOString(),
          })),
        })),
    } as Project;
  } catch (error) {
    return null;
  }
}

export async function uploadMedia(projectId: string, formData: FormData) {
  try {
    const files = formData.getAll("files") as File[];
    await connectDB();

    const project = await ProjectModel.findById(projectId);
    if (!project) return;

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const dataURI = `data:${file.type};base64,${base64}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: `proofed/${projectId}`,
        resource_type: file.type.startsWith("video") ? "video" : "image",
      });

      // Get next position
      const nextPosition =
        project.media.length > 0
          ? Math.max(...project.media.map((m: any) => m.position)) + 1
          : 0;

      project.media.push({
        url: result.secure_url,
        type: file.type.startsWith("video") ? "video" : "image",
        position: nextPosition,
        comments: [],
      });
    }

    await project.save();

    revalidatePath(`/project/${projectId}`);
    revalidatePath(`/p/${projectId}`);
  } catch (error) {
    console.error("Error uploading media:", error);
    throw new Error("Failed to upload media");
  }
}

export async function updateProjectMedia(
  projectId: string,
  media: MediaItem[]
) {
  try {
    await connectDB();
    const project = await ProjectModel.findById(projectId);
    if (!project) return;

    // Update positions based on the order in the array
    media.forEach((item, index) => {
      const mediaItem = project.media.id(item.id);
      if (mediaItem) {
        mediaItem.position = index;
      }
    });

    await project.save();

    revalidatePath(`/project/${projectId}`);
    revalidatePath(`/p/${projectId}`);
  } catch (error) {
    console.error("Error updating media:", error);
  }
}

export async function addComment(
  projectId: string,
  mediaId: string,
  comment: Omit<Comment, "id" | "created_at">
) {
  await connectDB();
  const project = await ProjectModel.findById(projectId);
  if (!project) return;

  const mediaItem = project.media.id(mediaId);
  if (mediaItem) {
    mediaItem.comments.push({
      x: comment.x,
      y: comment.y,
      text: comment.text,
      author: comment.author || "Anônimo",
    });
    await project.save();
  }

  revalidatePath(`/p/${projectId}`);
  revalidatePath(`/project/${projectId}`);
}

export async function deleteComment(
  projectId: string,
  mediaId: string,
  commentId: string
) {
  await connectDB();
  const project = await ProjectModel.findById(projectId);
  if (!project) return;

  const mediaItem = project.media.id(mediaId);
  if (mediaItem) {
    mediaItem.comments.pull(commentId);
    await project.save();
  }

  revalidatePath(`/p/${projectId}`);
  revalidatePath(`/project/${projectId}`);
}

export async function deleteMedia(projectId: string, mediaId: string) {
  try {
    await connectDB();
    const project = await ProjectModel.findById(projectId);
    if (!project) return;

    // Find the media item
    const mediaItem = project.media.id(mediaId);
    if (!mediaItem) return;

    // Delete from Cloudinary
    const publicId = mediaItem.url.split("/").slice(-2).join("/").split(".")[0];
    try {
      await cloudinary.uploader.destroy(`proofed/${publicId}`, {
        resource_type: mediaItem.type === "video" ? "video" : "image",
      });
    } catch (error) {
      console.error(`Failed to delete from Cloudinary: ${publicId}`, error);
    }

    // Remove from MongoDB
    project.media.pull(mediaId);
    await project.save();

    revalidatePath(`/project/${projectId}`);
    revalidatePath(`/p/${projectId}`);
  } catch (error) {
    console.error("Error deleting media:", error);
    throw error;
  }
}
