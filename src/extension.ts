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
    registerCommand('extension.convertLatexMultiline', convertLatexMultiline);
    registerCommand('extension.convertLatexAlgoU2L', convertLatexAlgoU2L);
    registerCommand('extension.convertLatexAlgoL2U', convertLatexAlgoL2U);
    registerCommand('extension.convertLatexFrac2Inline', convertLatexFrac2Inline);
    registerCommand('extension.convertLatexInline2Frac', convertLatexInline2Frac);
    registerCommand('extension.convertLatexMathDisplay2Inline', convertLatexMathDisplay2Inline);
    registerCommand('extension.removeEmph', removeEmph);
    registerCommand('extension.convertEmphToTextit', convertEmphToTextit);
    registerCommand('extension.removeThmEnvInfo', removeThmEnvInfo);
    registerCommand('extension.splitMathByQuad', splitMathByQuad);
    registerCommand('extension.recipeTotalClean', recipeTotalClean);
    registerCommand('extension.removeParagraph', removeParagraphKeyword);


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
    // Basic replacements
    content = content.replace(/\\\[/g, '\\(');
    content = content.replace(/\\\]/g, '\\)');
    content = content.replace(/\$\$/g, '\$');

    /**
     * Regex breakdown:
     * \\begin\{(equation\*?|align\*?)\} : Matches equation, equation*, align, or align*
     * (?:\\label\{([^}]*)\})?        : Optional label group ($2)
     * ([\s\S]*?)                     : The math content ($3)
     * \\end\{\1\}                    : Matches the corresponding end tag
     */
    const complexEnvRegex = /\\begin\{(equation\*?|align\*?)\}(?:\\label\{([^}]*)\})?([\s\S]*?)\\end\{\1\}/g;

    content = content.replace(complexEnvRegex, (match, envName, label, mathBody) => {
        // 1. Trim whitespace
        let cleanedMath = mathBody.trim();

        // 2. If it's an align environment, clean up alignment characters
        if (envName.startsWith('align')) {
            cleanedMath = cleanedMath
                .replace(/&/g, ' ')      // Remove alignment ampersands
                .replace(/\\\\/g, ' ');  // Replace line breaks with spaces for inline flow
        }

        // 3. Return formatted string
        if (label) {
            return `$ ${cleanedMath} $ with label as \\textit{${label}}`;
        }
        return `$ ${cleanedMath} $`;
    });

    return content;
}

// function removeEmph(content: string): string {
//     // Example: 
//     // input:  \emph{Hello \textbf{World}}
//     // output: Hello \textbf{World}
//     const macro = "\\emph{";
//     let result = content;

//     while (result.includes(macro)) {
//         const startIdx = result.indexOf(macro);
//         const contentStart = startIdx + macro.length;
//         let depth = 1;
//         let endIdx = -1;

//         // Loop through the string starting after the opening '{'
//         for (let i = contentStart; i < result.length; i++) {
//             if (result[i] === '{') depth++;
//             if (result[i] === '}') depth--;

//             if (depth === 0) {
//                 endIdx = i;
//                 break;
//             }
//         }

//         if (endIdx !== -1) {
//             // Extract the inner content
//             const innerText = result.substring(contentStart, endIdx);
//             // Reconstruct the string without the macro and outer braces
//             result = result.substring(0, startIdx) + innerText + result.substring(endIdx + 1);
//         } else {
//             // Break to avoid infinite loop if braces are unbalanced
//             break;
//         }
//     }

//     return result;
// }

/**
 * A generic helper to replace or remove a LaTeX macro while preserving balanced content
 */
function transformMacro(content: string, targetMacro: string, newPrefix: string): string {
    const searchStr = `\\${targetMacro}{`;
    let result = content;

    while (result.includes(searchStr)) {
        const startIdx = result.indexOf(searchStr);
        const contentStart = startIdx + searchStr.length;
        let depth = 1;
        let endIdx = -1;

        for (let i = contentStart; i < result.length; i++) {
            if (result[i] === '{') depth++;
            if (result[i] === '}') depth--;
            if (depth === 0) {
                endIdx = i;
                break;
            }
        }

        if (endIdx !== -1) {
            const innerText = result.substring(contentStart, endIdx);
            // Replace the whole match with: newPrefix + { + innerText + }
            // If newPrefix is empty, it effectively "removes" the macro
            const replacement = newPrefix ? `${newPrefix}{${innerText}}` : innerText;

            result = result.substring(0, startIdx) + replacement + result.substring(endIdx + 1);
        } else {
            break;
        }
    }
    return result;
}

// --- Your specific functions ---


function convertEmphToTextit(content: string): string {
    /**
     * Converts \emph{content} -> \textit{content}
     */
    return transformMacro(content, "emph", "\\textit");
}

function removeEmph(content: string): string {
    /**
     * Removes \emph{content} -> content (Updating your old function)
     */
    return transformMacro(content, "emph", "");
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

function splitMathByQuad(content: string): string {
    /**
     * Regex Explanation:
     * (?: ... )  : Non-capturing group for the two types of math starts
     * (\\\(|\$)  : GROUP 1: Matches literal \( OR literal $
     * ([\s\S]*?) : GROUP 2: Math content before the quad
     * \\s*\\(q?quad)\\s* : Matches \quad or \qquad with optional surrounding spaces
     * ([\s\S]*?) : GROUP 3: Math content after the quad
     * (\\\)|\$)  : GROUP 4: Matches literal \) OR literal $
     */
    const splitRegex = /(\\\(|\$)([\s\S]*?)\s*\\(q?quad)\s*([\s\S]*?)(\\\)|\$)/g;

    return content.replace(splitRegex, (match, open, part1, quadType, part2, close) => {
        const p1 = part1.trim();
        const p2 = part2.trim();

        // Safety check: ensure delimiters match (don't mix $ with \)
        // If it started with \( it should end with \)
        // If it started with $ it should end with $
        const isParens = open === '\\(' && close === '\\)';
        const isDollars = open === '$' && close === '$';

        if (isParens || isDollars) {
            return `${open}${p1}${close}, ${open}${p2}${close}`;
        }
        
        // If they don't match, return the original string to avoid breaking LaTeX
        return match;
    });
    // Tests:
    // "$ a \qquad b $" -> "$ a $, $ b $"
    // "\( a^2 = c^2 \quad x=y \)" -> "\( a^2 = c^2 \), \( x=y \)"
}

function removeParagraphKeyword(content: string): string {
    const macro = "\\paragraph{";
    let result = content;

    while (result.includes(macro)) {
        const startIdx = result.indexOf(macro);
        const contentStart = startIdx + macro.length;
        let depth = 1;
        let endIdx = -1;

        for (let i = contentStart; i < result.length; i++) {
            if (result[i] === '{') depth++;
            if (result[i] === '}') depth--;

            if (depth === 0) {
                endIdx = i;
                break;
            }
        }

        if (endIdx !== -1) {
            // We want to remove the macro AND any trailing whitespace/newlines 
            // so we don't leave empty lines behind.
            let matchEnd = endIdx + 1;
            
            // Optional: Peek ahead to swallow a trailing newline
            if (result[matchEnd] === '\n') matchEnd++;
            else if (result[matchEnd] === '\r' && result[matchEnd + 1] === '\n') matchEnd += 2;

            result = result.substring(0, startIdx) + result.substring(matchEnd);
        } else {
            break;
        }
    }

    return result;
}

function recipeTotalClean(content: string): string {
    let result = content;
    
    // Chain your existing logic functions
    result = removeParagraphKeyword(result);
    result = removeEmph(result);
    result = removeThmEnvInfo(result);
    result = convertLatexMathDisplay2Inline(result);
    result = splitMathByQuad(result);
    
    return result;
}

export function deactivate() { }