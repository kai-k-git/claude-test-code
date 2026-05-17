using ModernWpf;
using NewsApp.Models;
using NewsApp.Services;
using NewsApp.ViewModels;
using NewsApp.Views;
using System.Windows;
using System.Windows.Controls;

namespace NewsApp;

public partial class MainWindow : Window
{
    private readonly MainViewModel _vm;

    public MainWindow()
    {
        InitializeComponent();
        _vm = new MainViewModel();
        DataContext = _vm;

        ApplyTheme(_vm.IsDark);
        _vm.PropertyChanged += (s, e) =>
        {
            if (e.PropertyName == nameof(MainViewModel.IsDark))
                ApplyTheme(_vm.IsDark);
            if (e.PropertyName == nameof(MainViewModel.SelectedCategory))
                OnSelectedCategoryChanged();
        };

        // Also update content when category content changes
        foreach (var cat in _vm.Categories)
            cat.PropertyChanged += CategoryVm_PropertyChanged;

        _vm.Categories.CollectionChanged += (s, e) =>
        {
            if (e.NewItems != null)
                foreach (CategoryViewModel vm in e.NewItems)
                    vm.PropertyChanged += CategoryVm_PropertyChanged;
        };
    }

    private void CategoryVm_PropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(CategoryViewModel.Content) ||
            e.PropertyName == nameof(CategoryViewModel.HasContent))
        {
            if (sender == _vm.SelectedCategory)
                UpdateFlowDocument();
        }
    }

    private void OnSelectedCategoryChanged()
    {
        UpdateFlowDocument();
    }

    private void UpdateFlowDocument()
    {
        var cat = _vm.SelectedCategory;
        if (cat == null || !cat.HasContent || string.IsNullOrWhiteSpace(cat.Content))
            return;

        var doc = MarkdownRenderer.Render(cat.Content, _vm.IsDark);
        ContentViewer.Document = doc;
        ContentViewer.Background = System.Windows.Media.Brushes.Transparent;
    }

    private static void ApplyTheme(bool isDark)
    {
        ThemeManager.Current.ApplicationTheme = isDark
            ? ApplicationTheme.Dark
            : ApplicationTheme.Light;
    }

    private void OpenSettings_Click(object sender, RoutedEventArgs e)
    {
        var win = new SettingsWindow(_vm.Settings) { Owner = this };
        if (win.ShowDialog() == true && win.Tag is AppSettings updated)
        {
            _vm.ApplySettings(updated);

            foreach (var cat in _vm.Categories)
                cat.PropertyChanged += CategoryVm_PropertyChanged;
        }
    }
}
