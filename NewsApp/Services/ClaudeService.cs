using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace NewsApp.Services;

public class ClaudeService
{
    private readonly HttpClient _http = new();
    private const string ApiUrl = "https://api.anthropic.com/v1/messages";
    private const string AnthropicVersion = "2023-06-01";
    private const string BetaHeader = "web-search-2025-03-05";

    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "claude-opus-4-5";
    public bool UseWebSearch { get; set; } = true;

    public async Task<string> FetchAsync(string prompt, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(ApiKey))
            throw new InvalidOperationException("Claude APIキーが設定されていません。設定画面からAPIキーを入力してください。");

        var today = DateTime.Now.ToString("yyyy年M月d日（ddd）", new System.Globalization.CultureInfo("ja-JP"));
        var resolvedPrompt = prompt.Replace("{today}", today);

        var tools = UseWebSearch ? new JsonArray
        {
            new JsonObject
            {
                ["type"] = "web_search_20250305",
                ["name"] = "web_search",
                ["max_uses"] = 5
            }
        } : null;

        var body = new JsonObject
        {
            ["model"] = Model,
            ["max_tokens"] = 4096,
            ["system"] = "あなたは日本語で情報を提供するニュースアシスタントです。ユーザーが求める情報を正確かつわかりやすく、マークダウン形式で整理して回答してください。専門用語は使いつつも、その場で平易な言葉での補足説明を入れてください。",
            ["messages"] = new JsonArray
            {
                new JsonObject
                {
                    ["role"] = "user",
                    ["content"] = resolvedPrompt
                }
            }
        };

        if (tools != null)
            body["tools"] = tools;

        var request = new HttpRequestMessage(HttpMethod.Post, ApiUrl)
        {
            Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json")
        };
        request.Headers.Add("x-api-key", ApiKey);
        request.Headers.Add("anthropic-version", AnthropicVersion);
        if (UseWebSearch)
            request.Headers.Add("anthropic-beta", BetaHeader);

        var response = await _http.SendAsync(request, ct);
        var responseJson = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            var errNode = JsonNode.Parse(responseJson);
            var errMsg = errNode?["error"]?["message"]?.GetValue<string>() ?? responseJson;
            throw new HttpRequestException($"APIエラー ({response.StatusCode}): {errMsg}");
        }

        return ExtractText(responseJson);
    }

    private static string ExtractText(string json)
    {
        var sb = new StringBuilder();
        var node = JsonNode.Parse(json);
        var content = node?["content"]?.AsArray();
        if (content == null) return "（応答の解析に失敗しました）";

        foreach (var block in content)
        {
            if (block?["type"]?.GetValue<string>() == "text")
            {
                var text = block["text"]?.GetValue<string>();
                if (!string.IsNullOrEmpty(text))
                    sb.AppendLine(text);
            }
        }

        return sb.ToString().Trim();
    }
}
