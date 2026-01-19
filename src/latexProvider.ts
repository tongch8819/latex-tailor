import * as vscode from 'vscode';

export class LatexCommandProvider implements vscode.TreeDataProvider<LatexCommand> {
    getTreeItem(element: LatexCommand): vscode.TreeItem {
        return element;
    }

    getChildren(): LatexCommand[] {
        return [
            // --- Formatting & Cleanup ---
            new LatexCommand(
                "Remove Emph",
                "extension.removeEmph",
                new vscode.ThemeIcon("type-hierarchy-sub")
            ),
            new LatexCommand(
                "Emph to Textit",
                "extension.convertEmphToTextit",
                new vscode.ThemeIcon("italic") // Using the italic codicon
            ),
            new LatexCommand(
                "Clean Env Info",
                "extension.removeThmEnvInfo",
                new vscode.ThemeIcon("trash")
            ),

            // --- Math Conversions ---
            new LatexCommand(
                "Math: Display to Inline",
                "extension.convertLatexMathDisplay2Inline",
                new vscode.ThemeIcon("functions")
            ),
            new LatexCommand(
                "Frac: To Inline",
                "extension.convertLatexFrac2Inline",
                new vscode.ThemeIcon("divide")
            ),
            new LatexCommand(
                "Frac: To Fraction",
                "extension.convertLatexInline2Frac",
                new vscode.ThemeIcon("line-height")
            ),

            // --- Algorithm Conversions ---
            new LatexCommand(
                "Algo: Upper to Lower",
                "extension.convertLatexAlgoU2L",
                new vscode.ThemeIcon("arrow-small-down")
            ),
            new LatexCommand(
                "Algo: Lower to Upper",
                "extension.convertLatexAlgoL2U",
                new vscode.ThemeIcon("arrow-small-up")
            ),

            // --- General Utilities ---
            new LatexCommand(
                "Convert Multiline",
                "extension.convertLatexMultiline",
                new vscode.ThemeIcon("list-flat")
            ),
            new LatexCommand(
                "Split Math (Quad)",
                "extension.splitMathByQuad",
                new vscode.ThemeIcon("split-horizontal")
            ),
            new LatexCommand(
                "Remove Paragraph",
                "extension.removeParagraph",
                new vscode.ThemeIcon("remove")
            ),
            new LatexCommand(
                "Recipe: Total Clean: paragraph, emph, thm info, display math to inline, qquad split",
                "extension.recipeTotalClean",
                new vscode.ThemeIcon("zap") // Use the lighting bolt/zap icon for recipes
            ),
        ];
    }
}

class LatexCommand extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly commandId: string,
        public readonly iconPath: vscode.ThemeIcon
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);

        this.iconPath = iconPath;
        this.command = {
            title: label,
            command: commandId
        };

        // Optional: Adds a tooltip when hovering over the sidebar item
        this.tooltip = `Run ${label}`;
    }
}