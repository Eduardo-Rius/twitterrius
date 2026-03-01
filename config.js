// Configuración de Supabase
// REEMPLAZA ESTOS VALORES con los de tu proyecto en Supabase (Settings > API)
const SUPABASE_URL = 'https://tdypkyhqtjoqjtuwlnkk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeXBreWhxdGpvcWp0dXdsbmtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTUxOTYsImV4cCI6MjA4Nzk3MTE5Nn0.GWsMq6fKo4XCQcY0YarxSK4T34c64iX8qGsdp5b-l8c';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
