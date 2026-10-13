import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.ts'

export type Choice = 'resign' | 'stay'
type Counts = Record<Choice, number>

export function usePoll() {
  const [counts, setCounts] = useState<Counts>({ resign: 0, stay: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('poll_counts').select('choice,total').then(({ data }) => {
      if (data) {
        const next = { resign: 0, stay: 0 }
        data.forEach((r) => { next[r.choice as Choice] = Number(r.total) })
        setCounts(next)
      }
      setLoading(false)
    })

    // Real-time: jaise hi kisi ka vote aaye, sabke screen par update
    const channel = supabase
      .channel('poll_counts_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_counts' }, (p) => {
        const row = p.new as { choice: Choice; total: number }
        setCounts((c) => ({ ...c, [row.choice]: Number(row.total) }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const vote = async (choice: Choice) => {
    const { error } = await supabase.rpc('cast_vote', { p_choice: choice })
    return !error
  }

  return { counts, loading, vote }
}
