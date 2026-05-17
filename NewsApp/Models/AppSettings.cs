using System.Text.Json;
using System.IO;

namespace NewsApp.Models;

public class AppSettings
{
    public string ClaudeApiKey { get; set; } = string.Empty;
    public string ClaudeModel { get; set; } = "claude-opus-4-5";
    public bool UseWebSearch { get; set; } = true;
    public int AutoRefreshMinutes { get; set; } = 0;
    public bool IsDarkMode { get; set; } = false;
    public List<Category> Categories { get; set; } = [];

    private static readonly string SettingsPath =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "NewsApp", "settings.json");

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static AppSettings Load()
    {
        try
        {
            if (File.Exists(SettingsPath))
            {
                var json = File.ReadAllText(SettingsPath);
                var settings = JsonSerializer.Deserialize<AppSettings>(json, JsonOptions);
                if (settings != null)
                {
                    if (settings.Categories.Count == 0)
                        settings.Categories = Category.GetDefaults();
                    return settings;
                }
            }
        }
        catch { }

        return new AppSettings { Categories = Category.GetDefaults() };
    }

    public void Save()
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(SettingsPath)!);
            var json = JsonSerializer.Serialize(this, JsonOptions);
            File.WriteAllText(SettingsPath, json);
        }
        catch { }
    }
}
