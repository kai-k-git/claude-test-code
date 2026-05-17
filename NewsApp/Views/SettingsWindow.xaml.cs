using NewsApp.Models;
using System.Windows;
using System.Windows.Controls;

namespace NewsApp.Views;

public partial class SettingsWindow : Window
{
    private readonly AppSettings _settings;
    private string _apiKey = string.Empty;

    public SettingsWindow(AppSettings current)
    {
        InitializeComponent();

        _settings = new AppSettings
        {
            ClaudeApiKey = current.ClaudeApiKey,
            ClaudeModel = current.ClaudeModel,
            UseWebSearch = current.UseWebSearch,
            IsDarkMode = current.IsDarkMode,
            Categories = current.Categories.Select(c => new Category
            {
                Id = c.Id,
                Name = c.Name,
                Icon = c.Icon,
                Description = c.Description,
                Prompt = c.Prompt,
                IsEnabled = c.IsEnabled,
                SortOrder = c.SortOrder
            }).OrderBy(c => c.SortOrder).ToList()
        };

        _apiKey = _settings.ClaudeApiKey;
        ApiKeyBox.Password = _apiKey;

        var modelItems = ModelCombo.Items.Cast<ComboBoxItem>().ToList();
        var match = modelItems.FirstOrDefault(i => i.Tag?.ToString() == _settings.ClaudeModel);
        ModelCombo.SelectedItem = match ?? modelItems.FirstOrDefault();

        WebSearchCheck.IsChecked = _settings.UseWebSearch;
        DarkModeCheck.IsChecked = _settings.IsDarkMode;

        CategoryList.ItemsSource = _settings.Categories;
    }

    private void ApiKeyBox_PasswordChanged(object sender, RoutedEventArgs e)
        => _apiKey = ApiKeyBox.Password;

    private void MoveUp_Click(object sender, RoutedEventArgs e)
    {
        if ((sender as Button)?.Tag is not Category cat) return;
        var idx = _settings.Categories.IndexOf(cat);
        if (idx <= 0) return;
        _settings.Categories.RemoveAt(idx);
        _settings.Categories.Insert(idx - 1, cat);
        RefreshSortOrder();
        CategoryList.Items.Refresh();
    }

    private void MoveDown_Click(object sender, RoutedEventArgs e)
    {
        if ((sender as Button)?.Tag is not Category cat) return;
        var idx = _settings.Categories.IndexOf(cat);
        if (idx < 0 || idx >= _settings.Categories.Count - 1) return;
        _settings.Categories.RemoveAt(idx);
        _settings.Categories.Insert(idx + 1, cat);
        RefreshSortOrder();
        CategoryList.Items.Refresh();
    }

    private void RefreshSortOrder()
    {
        for (int i = 0; i < _settings.Categories.Count; i++)
            _settings.Categories[i].SortOrder = i;
    }

    private void Save_Click(object sender, RoutedEventArgs e)
    {
        _settings.ClaudeApiKey = _apiKey;
        _settings.ClaudeModel = (ModelCombo.SelectedItem as ComboBoxItem)?.Tag?.ToString()
            ?? "claude-opus-4-5";
        _settings.UseWebSearch = WebSearchCheck.IsChecked == true;
        _settings.IsDarkMode = DarkModeCheck.IsChecked == true;
        RefreshSortOrder();

        Tag = _settings;
        DialogResult = true;
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
        => DialogResult = false;
}
