export const env = {
  supabaseUrl: process.env.SUPABASE_URL ?? 'https://example.supabase.co',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'demo-key',
  openAiKey: process.env.OPENAI_API_KEY ?? '',
  whatsappToken: process.env.WHATSAPP_VERIFY_TOKEN ?? 'stock-ai-verify-token',
  whatsappTokenSecret: process.env.WHATSAPP_TOKEN ?? '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? 'demo-number-id',
  googleProject: process.env.GOOGLE_CLOUD_PROJECT ?? '',
};
