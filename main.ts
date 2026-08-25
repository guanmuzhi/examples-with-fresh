Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "Content-Type"
  };

  if(req.method === "OPTIONS"){
    return new Response(null, {headers:corsHeaders});
  }

  const url = new URL(req.url);

  // 搜索接口 /api/search
  if(url.pathname === "/api/search"){
    try {
      const body = await req.json();
      const anysearchKey = Deno.env.get("ANYSEARCH_API_KEY");

      if(!anysearchKey){
        return Response.json({error:"ANYSEARCH_API_KEY环境变量未设置"}, {status:500, headers:corsHeaders});
      }

      const resp = await fetch("https://api.anysearch.com/v1/search",{
        method:"POST",
        headers:{
          "Authorization":`Bearer ${anysearchKey}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          query: body.query,
          max_results: body.max_results ?? 3,
          language: body.language ?? "zh-CN",
          zone: body.zone ?? "cn"
        })
      });

      const data = await resp.json();
      return Response.json(data, {headers:corsHeaders});

    } catch(err){
      console.error("搜索接口异常", err);
      return Response.json({error:String(err)}, {status:500, headers:corsHeaders});
    }
  }

  // 原有大模型中转接口 /
  if(req.method === "POST" && url.pathname === "/"){
    try {
      const payload = await req.json();
      const {baseUrl, apiKey, ...rest} = payload;
      const chatUrl = new URL("/v1/chat/completions", baseUrl);
      const res = await fetch(chatUrl, {
        method:"POST",
        headers:{
          "Authorization":`Bearer ${apiKey}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify(rest)
      });
      const result = await res.json();
      return Response.json(result, {headers:corsHeaders});
    }catch(err){
      console.error("LLM代理异常",err);
      return Response.json({error:String(err)},{status:500,headers:corsHeaders})
    }
  }

  return new Response("Not Found", {status:404, headers:corsHeaders});
})
