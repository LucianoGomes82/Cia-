// Cloudflare Pages Function — proxy autenticado pra Anthropic API
// Usado pela funcionalidade de contagem de estoque via foto no client.
//
// Requer variável de ambiente ANTHROPIC_API_KEY configurada no dashboard
// Cloudflare Pages → cialista → Settings → Environment variables.
// Você obtém a chave em: https://console.anthropic.com/settings/keys
//
// O client envia POST com { images: [{media_type, data(base64)}, ...], prompt }
// Esta função repassa pra api.anthropic.com com header x-api-key,
// retornando o texto de resposta do Claude.

export async function onRequestPost({ request, env }){
  // Verifica se a API key está configurada
  if(!env.ANTHROPIC_API_KEY){
    return new Response(JSON.stringify({
      error: 'ANTHROPIC_API_KEY não configurada. Configure em Cloudflare Pages → Settings → Environment variables. Obtenha a chave em https://console.anthropic.com/settings/keys',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido no body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { images, prompt, model = 'claude-sonnet-4-5', max_tokens = 4000 } = body;
  if(!Array.isArray(images) || images.length === 0){
    return new Response(JSON.stringify({ error: 'Envie ao menos 1 imagem em "images"' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if(!prompt || typeof prompt !== 'string'){
    return new Response(JSON.stringify({ error: 'Prompt é obrigatório' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Monta content pro Anthropic: cada imagem + texto do prompt
  const content = [];
  for(const img of images){
    if(!img?.data || !img?.media_type){
      return new Response(JSON.stringify({ error: 'Cada imagem precisa de {media_type, data}' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: img.media_type, data: img.data },
    });
  }
  content.push({ type: 'text', text: prompt });

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages: [{ role: 'user', content }],
      }),
    });

    const data = await anthropicRes.json();
    if(!anthropicRes.ok){
      return new Response(JSON.stringify({
        error: data.error?.message || `Anthropic API retornou ${anthropicRes.status}`,
        details: data,
      }), { status: anthropicRes.status, headers: { 'Content-Type': 'application/json' } });
    }

    // Extrai texto plano da resposta
    const textResp = (data.content || [])
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n')
      .trim();

    return new Response(JSON.stringify({
      text: textResp,
      usage: data.usage,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch(e){
    return new Response(JSON.stringify({ error: 'Erro ao chamar Anthropic: ' + e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
