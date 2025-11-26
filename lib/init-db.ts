import { sql } from '@vercel/postgres';

export async function initDatabase() {
  // Skip during build time
  if (!process.env.POSTGRES_URL) {
    console.log('Skipping database initialization (no connection string)');
    return;
  }
  
  try {
    // Check if tables already exist
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'projects'
      );
    `;

    if (result.rows[0].exists) {
      console.log('Database already initialized');
      return;
    }

    console.log('Initializing database...');

    // Create projects table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create media table
    await sql`
      CREATE TABLE IF NOT EXISTS media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('image', 'video')),
        position INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create comments table
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
        x DECIMAL(5,2) NOT NULL,
        y DECIMAL(5,2) NOT NULL,
        text TEXT NOT NULL,
        author TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_media_project_id ON media(project_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_media_id ON comments(media_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_media_position ON media(project_id, position);`;

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
