import { createClient } from '@supabase/supabase-js'

export const supabaseUrl ='https://qpyhownfnvqzmyshgfay.supabase.co'
export const supabaseAnonKey = 'sb_publishable_GcvR4NRoVqG3JXb5VlCKdg_IEDf2ELF'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)