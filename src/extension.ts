import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const registerCommand = (command: string, callback: (text: string) => string) => {
        let disposable = vscode.commands.registerCommand(command, () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                const text = editor.document.getText(selection);
                const convertedText = callback(text);

                editor.edit(editBuilder => {
                    editBuilder.replace(selection, convertedText);
                });
            }
        });
        context.subscriptions.push(disposable);
    };

    registerCommand('extension.convertLatexMultiline', convertLatexMultiline);
    registerCommand('extension.convertLatexAlgoU2L', convertLatexAlgoU2L);
    registerCommand('extension.convertLatexAlgoL2U', convertLatexAlgoL2U);
    registerCommand('extension.convertLatexFrac2Inline', convertLatexFrac2Inline);
    registerCommand('extension.convertLatexInline2Frac', convertLatexInline2Frac);
}

function convertLatexMultiline(content: string): string {
    content = content.replace(/\\begin{multline\*}/g, '\\begin{equation*}');
    content = content.replace(/\\end{multline\*}/g, '\\end{equation*}');
    content = content.replace(/\\begin{multline}/g, '\\begin{equation}');
    content = content.replace(/\\end{multline}/g, '\\end{equation}');
    content = content.replace(/\\begin{align\*}/g, '\\begin{equation}');
    content = content.replace(/\\end{align\*}/g, '\\end{equation}');
    content = content.replace(/\\begin{align}/g, '\\begin{equation}');
    content = content.replace(/\\end{align}/g, '\\end{equation}');
    content = content.replace(/&/g, '');
    content = content.replace(/\\\\/g, '');
    content = content.replace(/\\quad/g, '');
    return content;
}

function replaceContent(content: string, replacements: { [key: string]: string }): string {
    for (const [key, value] of Object.entries(replacements)) {
        content = content.replace(new RegExp(key, 'g'), value);
    }
    return content;
}

function convertLatexAlgoU2L(content: string): string {
    const replacements = {
        '\\\\STATE': '\\State',
        '\\\\WHILE': '\\While',
        '\\\\ENDWHILE': '\\EndWhile',
        '\\\\IF': '\\If',
        '\\\\ENDIF': '\\EndIf',
        '\\\\FOR': '\\For',
        '\\\\ENDFOR': '\\EndFor',
        '\\\\textbf{return}': '\\Return'
    };
    return replaceContent(content, replacements);
}

function convertLatexAlgoL2U(content: string): string {
    const replacements = {
        '\\\\State': '\\STATE',
        '\\\\While': '\\WHILE',
        '\\\\EndWhile': '\\ENDWHILE',
        '\\\\If': '\\IF',
        '\\\\EndIf': '\\ENDIF',
        '\\\\For': '\\FOR',
        '\\\\EndFor': '\\ENDFOR',
        '\\\\Else': '\\ELSE',
        '\\\\Return': '\\textbf{return}'
    };
    return replaceContent(content, replacements);
}

function convertLatexFrac2Inline(content: string): string {
    const regex = /\\frac\{([^}]*)\}\{([^}]*)\}/g;
    return content.replace(regex, '$1 / $2');
}

function convertLatexInline2Frac(content: string): string {
    const regex = /([^\s]+)\s*\/\s*([^\s]+)/g;
    return content.replace(regex, '\\frac{$1}{$2}');
}

export function deactivate() {}