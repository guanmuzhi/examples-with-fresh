// 不要import任何Fresh包！纯原生deno代码
Deno.serve(async (req: Request) => {
  const corsHeaders = new Headers();
  corsHeaders.set("Access-Control-Allow-Origin", "*");
  corsHeaders.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  corsHeaders.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  //搜索接口
  if(url.pathname === "/api/search"){
    try{
      const body = await req.json();
      const key = Deno.env.get("ANYSEARCH_API_KEY");
      if(!key) return Response.json({error:"缺少环境变量"},{status:500,headers:corsHeaders});
      const res = await fetch("https://api.anysearch.com/v1/search",{
        method:"POST",
        headers:{
          "Authorization":`Bearer ${key}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify(body)
      })
      const data = await res.json();
      return Response.json(data,{headers:corsHeaders});
    }catch(e){
      return Response.json({error:String(e)},{status:500,headers:corsHeaders});
    }
  }

  //LLM中转接口
  if(url.pathname === "/"){
    const payload = await req.json();
    const {baseUrl,apiKey,...rest} = payload;
    const chatRes = await fetch(new URL("/v1/chat/completions",baseUrl),{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${apiKey}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify(rest)
    })
    const llmData = await chatRes.json();
    return Response.json(llmData,{headers:corsHeaders});
  }

  return new Response("404",{status:404,headers:corsHeaders});
})