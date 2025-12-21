import * as vscode from 'vscode';
import { LatexCommandProvider } from './latexProvider';

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
    // 1. Register your existing commands (removeEmph, etc.)
    registerCommand('extension.convertLatexMultiline', convertLatexMultiline);
    registerCommand('extension.convertLatexAlgoU2L', convertLatexAlgoU2L);
    registerCommand('extension.convertLatexAlgoL2U', convertLatexAlgoL2U);
    registerCommand('extension.convertLatexFrac2Inline', convertLatexFrac2Inline);
    registerCommand('extension.convertLatexInline2Frac', convertLatexInline2Frac);
    registerCommand('extension.convertLatexMathDisplay2Inline', convertLatexMathDisplay2Inline);
    registerCommand('extension.removeEmph', removeEmph);
    registerCommand('extension.removeThmEnvInfo', removeThmEnvInfo);

    // 2. Register the Sidebar View
    const latexProvider = new LatexCommandProvider();
    vscode.window.registerTreeDataProvider('latex-commands-view', latexProvider);
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


function replaceContent(content: string, mapping: Record<string, string>): string {
    let updatedContent = content;

    for (const [search, replace] of Object.entries(mapping)) {
        // Escape the backslash for Regex: \IF becomes \\IF
        // Use negative lookahead (?!...) to ensure we don't match partial commands
        // like \IFTHEN when searching for \IF
        const escapedSearch = search.replace(/\\/g, '\\\\');
        const regex = new RegExp(escapedSearch + '(?![a-zA-Z])', 'g');
        updatedContent = updatedContent.replace(regex, replace);
    }

    return updatedContent;
}

function convertLatexAlgoU2L(content: string): string {
    const replacements = {
        // Basic Blocks
        '\\STATE': '\\State',
        '\\WHILE': '\\While',
        '\\ENDWHILE': '\\EndWhile',
        '\\FOR': '\\For',
        '\\ENDFOR': '\\EndFor',
        '\\IF': '\\If',
        '\\ELSE': '\\Else',
        '\\ELSIF': '\\ElsIf',
        '\\ENDIF': '\\EndIf',
        
        // Return handling (Standardizing to \State \Return)
        '\\RETURN': '\\State \\Return',
        '\\textbf{return}': '\\State \\Return',
        
        // Advanced Blocks
        '\\PROCEDURE': '\\Procedure',
        '\\ENDPROCEDURE': '\\EndProcedure',
        '\\FUNCTION': '\\Function',
        '\\ENDFUNCTION': '\\EndFunction',
        '\\REPEAT': '\\Repeat',
        '\\UNTIL': '\\Until',
        '\\LOOP': '\\Loop',
        '\\ENDLOOP': '\\EndLoop',
        
        // Meta
        '\\REQUIRE': '\\Require',
        '\\ENSURE': '\\Ensure',
        '\\COMMENT': '\\Comment',
        '\\PRINT': '\\State \\Print'
    };
    return replaceContent(content, replacements);
}

function convertLatexAlgoL2U(content: string): string {
    const replacements = {
        // Basic Blocks
        '\\State': '\\STATE',
        '\\While': '\\WHILE',
        '\\EndWhile': '\\ENDWHILE',
        '\\For': '\\FOR',
        '\\EndFor': '\\ENDFOR',
        '\\If': '\\IF',
        '\\Else': '\\ELSE',
        '\\ElsIf': '\\ELSIF',
        '\\EndIf': '\\ENDIF',
        
        // Return handling
        '\\Return': '\\RETURN',
        
        // Advanced Blocks
        '\\Procedure': '\\PROCEDURE',
        '\\EndProcedure': '\\ENDPROCEDURE',
        '\\Function': '\\FUNCTION',
        '\\EndFunction': '\\ENDFUNCTION',
        '\\Repeat': '\\REPEAT',
        '\\Until': '\\UNTIL',
        '\\Loop': '\\LOOP',
        '\\EndLoop': '\\ENDLOOP',
        
        // Meta
        '\\Require': '\\REQUIRE',
        '\\Ensure': '\\ENSURE',
        '\\Comment': '\\COMMENT',
        '\\Print': '\\PRINT'
    };
    
    // Special clean up: If we converted "\State \Return" it becomes "\STATE \RETURN"
    // The old package usually only wants \RETURN.
    let result = replaceContent(content, replacements);
    return result.replace(/\\STATE\s+\\RETURN/g, '\\RETURN');
}

function convertLatexFrac2Inline(content: string): string {
    const regex = /\\frac\{([^}]*)\}\{([^}]*)\}/g;
    return content.replace(regex, '$1 / $2');
}

function convertLatexInline2Frac(content: string): string {
    const regex = /([^\s]+)\s*\/\s*([^\s]+)/g;
    return content.replace(regex, '\\frac{$1}{$2}');
}

function convertLatexMathDisplay2Inline(content: string): string {
    // Existing replacements
    content = content.replace(/\\\[/g, '\\(');
    content = content.replace(/\\\]/g, '\\)');
    
    // Note: Replacing $$ with $ globally can be risky if they aren't paired, 
    // but keeping it as per your original logic:
    content = content.replace(/\$\$/g, '\$');

    /**
     * New Feature: Convert \begin{equation} ... \end{equation}
     * Regex Breakdown:
     * \\begin\{equation\} : Match the opening tag
     * (?:\\label\{([^}]*)\})? : Optional non-capturing group to find \label, capturing its content in $1
     * ([\s\S]*?) : Captures the actual math content (including newlines) in $2
     * \\end\{equation\} : Match the closing tag
     */
    const equationRegex = /\\begin\{equation\}(?:\\label\{([^}]*)\})?([\s\S]*?)\\end\{equation\}/g;

    content = content.replace(equationRegex, (match, label, mathBody) => {
        const trimmedMath = mathBody.trim();
        if (label) {
            return `$ ${trimmedMath} $ with label as \\textit{${label}}`;
        }
        return `$ ${trimmedMath} $`;
    });

    return content;
}

function removeEmph(content: string): string {
    // Example: 
    // input:  \emph{Hello \textbf{World}}
    // output: Hello \textbf{World}
    const macro = "\\emph{";
    let result = content;

    while (result.includes(macro)) {
        const startIdx = result.indexOf(macro);
        const contentStart = startIdx + macro.length;
        let depth = 1;
        let endIdx = -1;

        // Loop through the string starting after the opening '{'
        for (let i = contentStart; i < result.length; i++) {
            if (result[i] === '{') depth++;
            if (result[i] === '}') depth--;

            if (depth === 0) {
                endIdx = i;
                break;
            }
        }

        if (endIdx !== -1) {
            // Extract the inner content
            const innerText = result.substring(contentStart, endIdx);
            // Reconstruct the string without the macro and outer braces
            result = result.substring(0, startIdx) + innerText + result.substring(endIdx + 1);
        } else {
            // Break to avoid infinite loop if braces are unbalanced
            break;
        }
    }

    return result;
}

function removeThmEnvInfo(content: string): string {
    /**
     * Regex breakdown:
     * \\begin\{(theorem|lemma|corollary|definition)\} : Matches the start and the specific environment name
     * \s* : Handles optional whitespace
     * \[[^\]]*\]                                    : Matches the square brackets and everything inside them
     */
    // Example Usage:
    // Input:  \begin{corollary}[Minimizing over a stability interval]
    // Output: \begin{corollary}
    const envRegex = /\\begin\{(theorem|lemma|corollary|definition)\}\s*\[[^\]]*\]/g;
    
    return content.replace(envRegex, (match, envName) => {
        return `\\begin{${envName}}`;
    });
}



export function deactivate() {}