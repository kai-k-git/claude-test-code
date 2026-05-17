using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;

namespace NewsApp.Services;

public static class MarkdownRenderer
{
    public static FlowDocument Render(string markdown, bool isDark)
    {
        var doc = new FlowDocument
        {
            FontFamily = new FontFamily("Yu Gothic UI, Meiryo UI, MS UI Gothic, Segoe UI"),
            FontSize = 14,
            Foreground = isDark ? Brushes.White : Brushes.Black,
            Background = Brushes.Transparent,
            PagePadding = new Thickness(0),
            LineHeight = 24
        };

        if (string.IsNullOrWhiteSpace(markdown))
            return doc;

        var lines = markdown.Split('\n');
        Paragraph? currentParagraph = null;

        foreach (var rawLine in lines)
        {
            var line = rawLine.TrimEnd();

            if (line.StartsWith("## "))
            {
                FlushParagraph(doc, ref currentParagraph);
                var para = new Paragraph(new Run(line[3..]))
                {
                    FontSize = 17,
                    FontWeight = FontWeights.Bold,
                    Foreground = isDark
                        ? new SolidColorBrush(Color.FromRgb(100, 180, 255))
                        : new SolidColorBrush(Color.FromRgb(0, 100, 180)),
                    Margin = new Thickness(0, 14, 0, 4),
                    BorderBrush = isDark
                        ? new SolidColorBrush(Color.FromRgb(60, 120, 200))
                        : new SolidColorBrush(Color.FromRgb(0, 120, 215)),
                    BorderThickness = new Thickness(0, 0, 0, 1),
                    Padding = new Thickness(0, 0, 0, 4)
                };
                doc.Blocks.Add(para);
                continue;
            }

            if (line.StartsWith("### "))
            {
                FlushParagraph(doc, ref currentParagraph);
                var para = new Paragraph(new Run(line[4..]))
                {
                    FontSize = 15,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = isDark
                        ? new SolidColorBrush(Color.FromRgb(150, 210, 255))
                        : new SolidColorBrush(Color.FromRgb(0, 80, 160)),
                    Margin = new Thickness(0, 10, 0, 2)
                };
                doc.Blocks.Add(para);
                continue;
            }

            if (line.StartsWith("#### "))
            {
                FlushParagraph(doc, ref currentParagraph);
                var para = new Paragraph(new Run(line[5..]))
                {
                    FontSize = 14,
                    FontWeight = FontWeights.SemiBold,
                    Margin = new Thickness(0, 8, 0, 2)
                };
                doc.Blocks.Add(para);
                continue;
            }

            if (line.StartsWith("- ") || line.StartsWith("* "))
            {
                FlushParagraph(doc, ref currentParagraph);
                var bullet = new Paragraph
                {
                    Margin = new Thickness(16, 1, 0, 1),
                    TextIndent = -12
                };
                bullet.Inlines.Add(new Run("• ") { Foreground = isDark
                    ? new SolidColorBrush(Color.FromRgb(100, 180, 255))
                    : new SolidColorBrush(Color.FromRgb(0, 100, 180)) });
                AddInlineMarkdown(bullet.Inlines, line[2..], isDark);
                doc.Blocks.Add(bullet);
                continue;
            }

            if (System.Text.RegularExpressions.Regex.IsMatch(line, @"^\d+\. "))
            {
                FlushParagraph(doc, ref currentParagraph);
                var match = System.Text.RegularExpressions.Regex.Match(line, @"^(\d+)\. (.*)");
                var numbered = new Paragraph
                {
                    Margin = new Thickness(16, 1, 0, 1),
                    TextIndent = -16
                };
                numbered.Inlines.Add(new Run(match.Groups[1].Value + ". ")
                {
                    FontWeight = FontWeights.SemiBold
                });
                AddInlineMarkdown(numbered.Inlines, match.Groups[2].Value, isDark);
                doc.Blocks.Add(numbered);
                continue;
            }

            if (string.IsNullOrWhiteSpace(line))
            {
                FlushParagraph(doc, ref currentParagraph);
                continue;
            }

            if (line.StartsWith("|") && line.EndsWith("|"))
            {
                FlushParagraph(doc, ref currentParagraph);
                if (line.Replace("-", "").Replace("|", "").Trim().Length == 0)
                    continue;

                var cells = line.Split('|', StringSplitOptions.RemoveEmptyEntries);
                var tablePara = new Paragraph { Margin = new Thickness(0, 1, 0, 1) };
                for (int i = 0; i < cells.Length; i++)
                {
                    if (i > 0) tablePara.Inlines.Add(new Run(" │ ") { Foreground = Brushes.Gray });
                    AddInlineMarkdown(tablePara.Inlines, cells[i].Trim(), isDark);
                }
                doc.Blocks.Add(tablePara);
                continue;
            }

            if (currentParagraph == null)
            {
                currentParagraph = new Paragraph { Margin = new Thickness(0, 4, 0, 4) };
            }
            else
            {
                currentParagraph.Inlines.Add(new LineBreak());
            }
            AddInlineMarkdown(currentParagraph.Inlines, line, isDark);
        }

        FlushParagraph(doc, ref currentParagraph);
        return doc;
    }

    private static void FlushParagraph(FlowDocument doc, ref Paragraph? para)
    {
        if (para != null)
        {
            doc.Blocks.Add(para);
            para = null;
        }
    }

    private static void AddInlineMarkdown(InlineCollection inlines, string text, bool isDark)
    {
        var emphasisColor = isDark
            ? new SolidColorBrush(Color.FromRgb(255, 210, 100))
            : new SolidColorBrush(Color.FromRgb(180, 80, 0));

        var remaining = text;
        while (remaining.Length > 0)
        {
            int boldStart = remaining.IndexOf("**", StringComparison.Ordinal);
            int italicStart = remaining.IndexOf('*');
            int codeStart = remaining.IndexOf('`');

            // Bold check
            if (boldStart >= 0 && (italicStart < 0 || boldStart <= italicStart) && (codeStart < 0 || boldStart <= codeStart))
            {
                int boldEnd = remaining.IndexOf("**", boldStart + 2, StringComparison.Ordinal);
                if (boldEnd > boldStart)
                {
                    if (boldStart > 0)
                        inlines.Add(new Run(remaining[..boldStart]));
                    inlines.Add(new Run(remaining[(boldStart + 2)..boldEnd])
                    {
                        FontWeight = FontWeights.Bold,
                        Foreground = emphasisColor
                    });
                    remaining = remaining[(boldEnd + 2)..];
                    continue;
                }
            }

            // Code check
            if (codeStart >= 0 && (boldStart < 0 || codeStart < boldStart))
            {
                int codeEnd = remaining.IndexOf('`', codeStart + 1);
                if (codeEnd > codeStart)
                {
                    if (codeStart > 0)
                        inlines.Add(new Run(remaining[..codeStart]));
                    inlines.Add(new Run(remaining[(codeStart + 1)..codeEnd])
                    {
                        FontFamily = new FontFamily("Consolas, Courier New"),
                        Background = isDark
                            ? new SolidColorBrush(Color.FromRgb(50, 50, 70))
                            : new SolidColorBrush(Color.FromRgb(240, 240, 245))
                    });
                    remaining = remaining[(codeEnd + 1)..];
                    continue;
                }
            }

            inlines.Add(new Run(remaining));
            break;
        }
    }
}
