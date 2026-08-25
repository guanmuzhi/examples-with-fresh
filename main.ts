// main.ts Deno Deploy
Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "access‑control‑allow‑origin": "*",
    "access‑control‑allow‑methods": "POST,OPTIONS",
    "access‑control‑allow‑headers": "Content‑Type"
  };

  if(req.method === "OPTIONS"){
    return new Response(null, {headers:corsHeaders});
  }

  const url = new URL(req.url);
  // 新增搜索路由： /api/search
  if(url.pathname === "/api/search"){
    const body = await req.json();
    const anysearchKey = Deno.env.get("ANYSEARCH_API_KEY");
    const resp = await fetch("https://api.anysearch.com/v1/search",{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${anysearchKey}`,
        "Content‑Type":"application/json"
      },
      body:JSON.stringify({
        query: body.query,
        max_results: body.max_results ?? 3,
        language: body.language ?? "zh‑CN",
        zone: body.zone ?? "cn"
      })
    });
    const data = await resp.json();
    return Response.json(data, {headers:corsHeaders});
  }

  // 原有大模型中转逻辑（根路径 /）
  if(req.method === "POST" && url.pathname === "/"){
    const payload = await req.json();
    const {baseUrl, apiKey, ...rest} = payload;
    const chatUrl = new URL("/v1/chat/completions", baseUrl);
    const res = await fetch(chatUrl, {
      method:"POST",
      headers:{
        "Authorization":`Bearer ${apiKey}`,
        "Content‑Type":"application/json"
      },
      body:JSON.stringify(rest)
    });
    const result = await res.json();
    return Response.json(result, {headers:corsHeaders});
  }

  return new Response("Not Found", {status:404, headers:corsHeaders});
})
