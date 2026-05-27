-- Cria o Webhook para disparar a função 'notify-message' toda vez que uma mensagem for inserida
CREATE TRIGGER "notify_message_trigger" 
AFTER INSERT ON "public"."messages" 
FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"(
  'http://localhost:54321/functions/v1/notify-message', -- IMPORTANTE: Trocar pela URL de produção da sua Edge Function
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '5000'
);
