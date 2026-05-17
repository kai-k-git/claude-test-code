using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using NewsApp.Models;
using NewsApp.Services;
using System.Collections.ObjectModel;

namespace NewsApp.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly ClaudeService _claude;

    [ObservableProperty] private ObservableCollection<CategoryViewModel> _categories = [];
    [ObservableProperty] private CategoryViewModel? _selectedCategory;
    [ObservableProperty] private bool _isDark;
    [ObservableProperty] private AppSettings _settings;
    [ObservableProperty] private bool _isRefreshingAll;

    public MainViewModel()
    {
        _settings = AppSettings.Load();
        _claude = new ClaudeService
        {
            ApiKey = _settings.ClaudeApiKey,
            Model = _settings.ClaudeModel,
            UseWebSearch = _settings.UseWebSearch
        };
        _isDark = _settings.IsDarkMode;
        BuildCategories();
    }

    private void BuildCategories()
    {
        Categories.Clear();
        var enabled = Settings.Categories
            .Where(c => c.IsEnabled)
            .OrderBy(c => c.SortOrder);

        foreach (var cat in enabled)
            Categories.Add(new CategoryViewModel(cat, _claude, IsDark));

        SelectedCategory = Categories.FirstOrDefault();
    }

    partial void OnIsDarkChanged(bool value)
    {
        Settings.IsDarkMode = value;
        Settings.Save();
        foreach (var vm in Categories)
            vm.IsDark = value;
    }

    public void ApplySettings(AppSettings updated)
    {
        Settings = updated;
        Settings.Save();

        _claude.ApiKey = Settings.ClaudeApiKey;
        _claude.Model = Settings.ClaudeModel;
        _claude.UseWebSearch = Settings.UseWebSearch;
        IsDark = Settings.IsDarkMode;

        BuildCategories();
    }

    [RelayCommand]
    private async Task RefreshAllAsync()
    {
        if (IsRefreshingAll) return;
        IsRefreshingAll = true;
        try
        {
            foreach (var vm in Categories)
            {
                if (vm.LoadCommand.CanExecute(null))
                    await vm.LoadCommand.ExecuteAsync(null);
            }
        }
        finally
        {
            IsRefreshingAll = false;
        }
    }

    [RelayCommand]
    private void SelectCategory(CategoryViewModel vm)
    {
        SelectedCategory = vm;
    }
}
