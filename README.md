# latextailor README

This extension converts LaTeX `multline*` environments to `equation` environments by removing `&` and `\\` symbols.

## Environments and Build

1. install nodejs and add its installation path into path.
2. close all vscode instance and restart git bash.
3. install npm package `vsce`
```bash
npm install
npm install -g @vscode/vsce
npm install -g typescript
```
4. build 

## Development Notes

1. `src/extension.ts`: create functions and register it at function `activate`
2. `package.json`: update to add name and description of new sub-command
3. `compile_and_launch.sh`: use `vsce` to package
4. `**.vsix`: intall from vsix file

## Usage

1. Select the LaTeX content you want to convert.
2. Open the Command Palette (`Ctrl+Shift+P`).
3. Run the `Convert LaTeX` command.


