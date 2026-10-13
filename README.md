# Setup (5 min)
1. `npm create vite@latest gyanu-poll -- --template react-ts` (ya is folder ki files apne Vite project mein copy karo)
2. `npm i @supabase/supabase-js tailwindcss @tailwindcss/vite`
3. `vite.config.ts` mein: `import tailwindcss from '@tailwindcss/vite'` aur `plugins: [react(), tailwindcss()]`
4. Supabase project banao, `supabase.sql` SQL Editor mein run karo
5. `.env.example` ko `.env` banao, URL + anon key daalo
6. `npm run dev`
