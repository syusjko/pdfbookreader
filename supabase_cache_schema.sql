create table if not exists public.book_analysis (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books on delete cascade not null,
  chunk_index integer not null,
  target_lang text not null,
  analysis_json jsonb not null,
  unique(book_id, chunk_index, target_lang)
);
alter table public.book_analysis enable row level security;
create policy "Users can view own analysis" on public.book_analysis for select using (
  exists (select 1 from public.books where id = book_id and user_id = auth.uid())
);
create policy "Users can insert own analysis" on public.book_analysis for insert with check (
  exists (select 1 from public.books where id = book_id and user_id = auth.uid())
);
