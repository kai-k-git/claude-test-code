using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;

namespace NewsApp.Converters;

public class BoolToVisibilityConverter : IValueConverter
{
    public bool Invert { get; set; }
    public object Convert(object value, Type t, object p, CultureInfo c)
    {
        bool b = value is bool bv && bv;
        if (Invert) b = !b;
        return b ? Visibility.Visible : Visibility.Collapsed;
    }
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotImplementedException();
}

public class BoolToBrushConverter : IValueConverter
{
    public Brush? TrueValue { get; set; }
    public Brush? FalseValue { get; set; }
    public object? Convert(object value, Type t, object p, CultureInfo c)
        => value is bool b && b ? TrueValue : FalseValue;
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotImplementedException();
}

public class InverseBoolConverter : IValueConverter
{
    public object Convert(object value, Type t, object p, CultureInfo c)
        => value is bool b && !b;
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotImplementedException();
}

public class NullToVisibilityConverter : IValueConverter
{
    public bool Invert { get; set; }
    public object Convert(object value, Type t, object p, CultureInfo c)
    {
        bool isNull = value == null || (value is string s && string.IsNullOrWhiteSpace(s));
        bool show = Invert ? isNull : !isNull;
        return show ? Visibility.Visible : Visibility.Collapsed;
    }
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotImplementedException();
}
