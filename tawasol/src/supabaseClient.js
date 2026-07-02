import { createClient } from '@supabase/supabase-js'

const supabaseUrl ='https://qpyhownfnvqzmyshgfay.supabase.co' 
const supabaseAnonKey = 'sb_publishable_GcvR4NRoVqG3JXb5VlCKdg_IEDf2ELF'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)