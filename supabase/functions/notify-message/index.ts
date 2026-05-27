// Follow this setup guide to integrate the Deno language server with your editor:
// https://supabase.com/docs/guides/functions/local-development

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';
import { JWT } from 'https://esm.sh/google-auth-library@9.14.0';

serve(async (req) => {
  try {
    const payload = await req.json();

    // Filtra apenas mensagens novas (INSERT na tabela messages)
    if (payload.type !== 'INSERT' || payload.table !== 'messages') {
      return new Response('Not a message insert', { status: 200 });
    }

    const { sender_id, receiver_id, content, type } = payload.record;

    // Inicializa o cliente do Supabase com as chaves injetadas na Edge Function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Busca os dados do remetente
    const { data: sender } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', sender_id)
      .single();

    // 2. Busca o fcm_token do destinatário
    const { data: receiver } = await supabaseClient
      .from('profiles')
      .select('fcm_token')
      .eq('id', receiver_id)
      .single();

    if (!receiver?.fcm_token) {
      return new Response('Receiver has no FCM token', { status: 200 });
    }

    // 3. Obtém credenciais do Service Account do Firebase (Hardcoded para facilitar o deploy via Web)
    const FIREBASE_SERVICE_ACCOUNT = {
      "type": "service_account",
      "project_id": "wizzapp-8648c",
      "private_key_id": "393cba31ae207d89c4991f591d0265e63f4adcd8",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDywjZHZtNRCDGg\nzubyZ4rdA9a26eRBUG9k6ekc6vX1CEnll/QICPLAYatjNX8MsliyZuO/fIdUzUQj\neoSJvdn6bMSp/zTuOVP1gpKuWDyY185iHQyS5KKrc+/crbKxiDay0vI5A+1muBKm\nyeyUEUMGva59Sh2mUtdml9hQnIHHJyzA33QR8QoYWPtzB9dejKD6Nk8jQ/pv1w3K\nEeXLpgWzGoG21vH8kLuLnyFeWxREi2P3ZBjDiFqKPiQWuDiTrjpFLmCjOmnFR/+3\nQT5kmcKbZrP8iIMuetgPZxrFIk4OyCQqD3dO4BxIvllgu/bRO6MIK7vIT5IbpIh8\n0t1DYKobAgMBAAECggEAN+oBxIpri9N+UtK1IQo2UtfKgdD3kQ+syKqT1eRMiIbD\nNo28WIlvGF6msjAlNlBx242VUYqmRSMOWbmjg3JmHacl2R3+HAy6SOctT9jlBDNY\nxwJ33fGpgiIvEj4z1W5RYvjxb6525Nzq9t21jxk2vfu8kAEdOS0FjgzVdyPFRJBP\nfzj2XQFZo9Mqup83cWYu1cKuaCLcdstuuc9ORsC06lEQF1JSPwJCsM23jleHF7Hs\ndTOJuxsb/rX6XWZotvW6mFBt+AdjiedkiY8GiBnKN+ZZss4QT1IGxWWGxR9U1boI\nMXNutIdXDrruBBHaPQ5OAiQfxfjazqNurZlsXz98wQKBgQD/tH3eqZ4u/IBTcEpj\nbOqo1KgSoyQa60VZ7dQFe4amaIfIYCCjlvw/pmbz2ULD2NvbM+cJabWMhJHuEdLN\nuMmxCvixg96Rke0tOmL2BYaCCCVmz12HMPxRhBmQd2Pj61bEvmJJhxv5ltLQbjJU\njNSXH7uktJlQFfdLQhiAZwW7uwKBgQDzCeW4YMgZ7EMMndmwYFCt/B2KCpNJo0Rk\nuWx+6jtK9O3j2Vv4uuBhueYJvCBYcEgHf3+5RY9Seh2MZzZ7D9T98LU2gB9KVNm4\ninoeqps1jpTmhPhTONzm+/mj1VTTtXbeb/CJ0aK7mTXsLRD2qHPzkFlmbYAlB8rl\nQt3gO5V1IQKBgQDMgc91iNURoTMFCLcGA/M9qi7uEPpsaSRjQzoiVGQhrVKDqJYS\nIEyIn46Rkn66YjOcgktSlO/1fYW1ER43GIZ/CVZTqzMT29EELkE9oLeuQdOgAVM9\nL6ltjKhhiYsjm3IfEmFLizqNiNn8h1XLl4LjhyatGR/RFHBfCXLNJxhHxwKBgQDY\n6L1w2Ffe4wFYck1GYD/BeGD4wcWAlEnHR8JwZybyGDV1BJpUHJ2EOwD3MUMBC30N\nzBo3RcDLkJdspvV10cR7u+hPsvu6QI5saJLjacrKeu2j64sh438sXDkKoqxpouxr\nTCa3KjV+DxiUKAiay+9osy1HAHW9Fv5brVkO9r7GYQKBgQDP15M+ewOz4tigBUMj\nEIE9pEi24BMTq46wDrfsDNYNxSH13y6Gl0rpKm2tW5M4+J1g9rv62J3/TlULMbYO\nRH7YMzWhxPRdLAdLepXUF+nxHyZXrtsNztzKM+yKLhOuRKRBdYNOHEhvmTQew9/K\nECTS6n3UxuelvKTLA1C2uKTQxw==\n-----END PRIVATE KEY-----\n",
      "client_email": "firebase-adminsdk-fbsvc@wizzapp-8648c.iam.gserviceaccount.com"
    };
    const projectId = FIREBASE_SERVICE_ACCOUNT.project_id;

    if (!projectId) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT not configured correctly');
    }

    // 4. Gera o Access Token do Google para enviar o Push
    const jwtClient = new JWT({
      email: FIREBASE_SERVICE_ACCOUNT.client_email,
      key: FIREBASE_SERVICE_ACCOUNT.private_key,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const tokens = await jwtClient.authorize();
    const accessToken = tokens.access_token;

    // 5. Monta o corpo da notificação (HTTP v1)
    const notificationBody = type === 'shake' ? 'Você recebeu um Chamar Atenção!' : (content || 'Nova mensagem');
    const senderName = sender?.name || 'Alguém';

    const fcmMessage = {
      message: {
        token: receiver.fcm_token,
        notification: {
          title: `Nova mensagem de ${senderName}`,
          body: notificationBody,
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channel_id: 'default_channel',
          }
        },
        data: {
          route: 'chat',
          sender_id: sender_id
        }
      }
    };

    // 6. Envia a requisição para a API do Firebase
    const fcmResponse = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(fcmMessage),
    });

    const fcmResult = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error('FCM Error:', fcmResult);
      throw new Error('Falha ao enviar Push Notification');
    }

    return new Response(JSON.stringify({ success: true, result: fcmResult }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Erro geral na função:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
