Deno.serve(async (req: Request) => {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  // 处理浏览器跨域预检
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "only POST method allowed" }, { status: 405, headers });
  }

  try {
    const payload = await req.json();

    // 入参字段
    const {
      baseUrl,          // 供应商接口地址，例 https://open.bigmodel.cn/api/paas/v1
      model,            // 模型名称
      apiKey,           // 模型API Key
      temperature,      // 随机度
      messages,         // 完整上下文对话数组
      attachments,      // 附件链接数组
      tools,            // 工具定义数组
      tool_results      // 工具调用返回结果
    } = payload;

    if (!baseUrl || !apiKey || !model || !messages) {
      return Response.json(
        { error: "缺少必填参数 baseUrl / apiKey / model / messages" },
        { status: 400, headers }
      );
    }

    // 组装OpenAI标准请求体，原样透传传入参数
    const requestBody: Record<string, unknown> = {
      model,
      messages,
      temperature: temperature ?? 0.7
    };

    // 可选字段，存在才加入请求体
    if (attachments) requestBody.attachments = attachments;
    if (tools) requestBody.tools = tools;
    if (tool_results) requestBody.tool_results = tool_results;

    // 请求大模型接口
    const upstreamResp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    // 直接原样把上游模型返回内容透传给前端，不做修改
    const rawData = await upstreamResp.json();
    return Response.json(rawData, {
      status: upstreamResp.status,
      headers
    });

  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 500, headers }
    );
  }
});
