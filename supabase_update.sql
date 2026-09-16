ALTER TABLE public.books ADD COLUMN IF NOT EXISTS last_read_index integer DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS bookmarks integer[] DEFAULT '{}';
