import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://eqkpugvccpolkgtnmpxs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa3B1Z3ZjY3BvbGtndG5tcHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzM5MDgsImV4cCI6MjA5MTg0OTkwOH0.T3nF1N2ivO7oPs67SOAP8AfK3M_f7EHQX6l-surmlBc'
)
