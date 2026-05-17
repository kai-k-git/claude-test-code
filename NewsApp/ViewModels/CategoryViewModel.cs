using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using NewsApp.Models;
using NewsApp.Services;

namespace NewsApp.ViewModels;

public partial class CategoryViewModel : ObservableObject
{
    private readonly ClaudeService _claude;

    [ObservableProperty] private Category _category;
    [ObservableProperty] private string _content = string.Empty;
    [ObservableProperty] private bool _isLoading;
    [ObservableProperty] private bool _hasContent;
    [ObservableProperty] private bool _hasError;
    [ObservableProperty] private string _errorMessage = string.Empty;
    [ObservableProperty] private string _lastUpdated = string.Empty;
    [ObservableProperty] private bool _isDark;

    private CancellationTokenSource? _cts;

    public CategoryViewModel(Category category, ClaudeService claude, bool isDark)
    {
        _category = category;
        _claude = claude;
        _isDark = isDark;
    }

    [RelayCommand(IncludeCancelCommand = true)]
    private async Task LoadAsync(CancellationToken ct)
    {
        _cts?.Cancel();
        _cts = CancellationTokenSource.CreateLinkedTokenSource(ct);

        IsLoading = true;
        HasError = false;
        ErrorMessage = string.Empty;

        try
        {
            var result = await _claude.FetchAsync(Category.Prompt, _cts.Token);
            Content = result;
            HasContent = true;
            LastUpdated = DateTime.Now.ToString("MM/dd HH:mm 更新");
        }
        catch (OperationCanceledException)
        {
            // user cancelled
        }
        catch (Exception ex)
        {
            HasError = true;
            ErrorMessage = ex.Message;
            HasContent = false;
        }
        finally
        {
            IsLoading = false;
        }
    }

    public void CancelLoad()
    {
        _cts?.Cancel();
    }
}
