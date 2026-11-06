// Cloudflare Pages Function: functions/api/chat.js
// Dedicated Chatwoot API inbox for the CUSTOM website chat, not the OpenWA inbox.
const COOKIE = 'site_chat_v2';
const MAX_AGE = 30 * 24 * 60 * 60;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function reply(data, status = 200, setCookie) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  if (setCookie) headers.set('Set-Cookie', setCookie);
  return new Response(JSON.stringify(data), { status, headers });
}

function settings(env) {
  const base = (env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com').replace(/\/+$/, '');
  const inbox = (env.CHATWOOT_SITE_API_INBOX_IDENTIFIER || '').trim();
  const secret = env.CHAT_SESSION_SECRET || '';
  if (!/^https:\/\/[^/]+$/i.test(base) || !inbox || secret.length < 32) {
    throw new Error('CHAT_CONFIGURATION_MISSING');
  }
  return { base, inbox, secret, api: `${base}/public/api/v1/inboxes/${encodeURIComponent(inbox)}` };
}

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unbase64url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('BAD_ENCODING');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sessionCookie(session, cfg, request) {
  const data = base64url(encoder.encode(JSON.stringify(session)));
  const signature = new Uint8Array(await crypto.subtle.sign(
    'HMAC', await hmacKey(cfg.secret), encoder.encode(data)));
  const isHttps = new URL(request.url).protocol === 'https:';
  return [
    `${COOKIE}=${data}.${base64url(signature)}`,
    'HttpOnly', 'SameSite=Lax', 'Path=/api/chat',
    `Max-Age=${MAX_AGE}`,
    ...(isHttps ? ['Secure'] : []), // For local HTTP testing on port 2886.
  ].join('; ');
}

async function readSession(request, cfg) {
  try {
    const cookieValue = (request.headers.get('Cookie') || '')
      .split(';').map(s => s.trim())
      .find(s => s.startsWith(`${COOKIE}=`))
      ?.slice(COOKIE.length + 1);
    if (!cookieValue) return null;
    const [payload, signature, extra] = cookieValue.split('.');
    if (!payload || !signature || extra) return null;
    const valid = await crypto.subtle.verify(
      'HMAC', await hmacKey(cfg.secret),
      unbase64url(signature), encoder.encode(payload));
    if (!valid) return null;
    const session = JSON.parse(decoder.decode(unbase64url(payload)));
    // Bind session to this *specific* inbox. Old OpenWA/website cookies won't match.
    if (session.v !== 2 || session.inbox !== cfg.inbox ||
        typeof session.sourceId !== 'string' || !session.sourceId ||
        !Number.isSafeInteger(session.conversationId) || session.conversationId < 1 ||
        !Number.isFinite(session.expires) || session.expires < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

async function chatwoot(cfg, stage, path, method = 'GET', body) {
  let response;
  try {
    response = await fetch(`${cfg.api}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    console.error('Chatwoot connection failed at', stage);
    throw { stage, upstreamStatus: 0 };
  }
  if (!response.ok) {
    console.error('Chatwoot request failed:', stage, 'HTTP', response.status);
    throw { stage, upstreamStatus: response.status };
  }
  try {
    return await response.json();
  } catch {
    console.error('Chatwoot returned non-JSON:', stage);
    throw { stage, upstreamStatus: response.status };
  }
}

function conversationPath(session) {
  return `/contacts/${encodeURIComponent(session.sourceId)}` +
    `/conversations/${session.conversationId}`;
}

function normalize(message) {
  return {
    id: message.id,
    content: message.content || '',
    messageType: message.message_type,
    createdAt: message.created_at,
  };
}

function errorResponse(error, cookie) {
  const missing = error?.message === 'CHAT_CONFIGURATION_MISSING';
  return reply({
    error: missing ? 'Chat configuration is incomplete.' : 'Chat service request failed. Check chat history before retrying.',
    stage: missing ? 'configuration' : (error?.stage || 'unexpected'),
    ...(Number.isInteger(error?.upstreamStatus) ? { upstreamStatus: error.upstreamStatus } : {}),
  }, missing ? 503 : 502, cookie);
}

// GET /api/chat -> No session: {connected:false, messages:[]}; else history.
export async function onRequestGet({ request, env }) {
  try {
    const cfg = settings(env);
    const session = await readSession(request, cfg);
    if (!session) return reply({ connected: false, messages: [] });
    const data = await chatwoot(cfg, 'get_messages', `${conversationPath(session)}/messages`);
    const entries = Array.isArray(data) ? data :
      (Array.isArray(data?.payload) ? data.payload : []);
    const messages = entries
      .filter(m => [0, 1, 'incoming', 'outgoing'].includes(m.message_type) &&
        typeof m.content === 'string' && m.content.trim() && !m.private)
      .map(normalize)
      .sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
    return reply({ connected: true, conversationId: session.conversationId, messages });
  } catch (error) {
    console.error('GET /api/chat failed at', error?.stage || error?.message || 'unexpected');
    return errorResponse(error);
  }
}

// POST /api/chat -> Create contact+conversation if needed, then submit visitor message.
export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin)
    return reply({ error: 'Origin not allowed.' }, 403);
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json'))
    return reply({ error: 'Expected application/json.' }, 415);

  let cfg;
  let session;
  try {
    cfg = settings(env);
    let body;
    try { body = await request.json(); }
    catch { return reply({ error: 'Invalid JSON.' }, 400); }
    const content = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!content || content.length > 4000)
      return reply({ error: 'Message must be 1–4000 characters.' }, 400);
    if (!['message', 'quick_question'].includes(body?.type))
      return reply({ error: 'Unsupported message type.' }, 400);
    if (body.type === 'quick_question' &&
      !['quote', 'services', 'consultation', 'agent'].includes(body.optionId))
      return reply({ error: 'Unknown quick question.' }, 400);

    session = await readSession(request, cfg);
    if (!session) {
      const contact = await chatwoot(cfg, 'create_contact', '/contacts', 'POST',
        { name: 'Website Visitor' });
      if (!contact?.source_id) throw { stage: 'create_contact_response' };
      const path = `/contacts/${encodeURIComponent(contact.source_id)}/conversations`;
      const conversation = await chatwoot(cfg, 'create_conversation', path,
        'POST', { custom_attributes: {} });
      if (!Number.isSafeInteger(conversation?.id))
        throw { stage: 'create_conversation_response' };
      session = {
        v: 2,
        inbox: cfg.inbox,
        sourceId: contact.source_id,
        conversationId: conversation.id,
        expires: Date.now() + MAX_AGE * 1000,
      };
    }

    // Persist the new session even if sending subsequently times out.
    const cookie = await sessionCookie(session, cfg, request);
    const message = await chatwoot(cfg, 'send_message',
      `${conversationPath(session)}/messages`, 'POST', { content });
    if (!message?.id) throw { stage: 'send_message_response' };
    return reply({ success: true, conversationId: session.conversationId,
      message: normalize(message) }, 200, cookie);
  } catch (error) {
    console.error('POST /api/chat failed at', error?.stage || error?.message || 'unexpected');
    // Preserve session if conversation creation succeeded, even after ambiguous send failure.
    const cookie = cfg && session ? await sessionCookie(session, cfg, request) : undefined;
    return errorResponse(error, cookie);
  }
}
