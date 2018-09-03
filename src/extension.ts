'use strict';

import * as vscode from 'vscode';
import axios from 'axios';

const FONT_LIST_URL = 'https://fontstorage.com/api/list.json';

class UiFontItem {
    label: string;
    fontObject: any;
    constructor(label: string, fontObject: any = {}) {
        this.label = label;
        this.fontObject = fontObject;
    }
}

export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "webfont-vscode" is now active!');

    async function downloadFontsList(): Promise<Array<any>> {
        let fontsList = context.globalState.get('webfontCache', []);

        if (fontsList.length > 0) {
            return fontsList;
        } else {
            try {
                const { data } = await axios.get(FONT_LIST_URL);
                context.globalState.update('webfontCache', data);
                return data;
            }
            catch (err) {
                return [{ name: "Can't download font's list. Check if you connected to the Internet." }];
            }
        }
    }

    async function prepareUIFontList() {
        const fontsList = await downloadFontsList();
        const uiFontsList: UiFontItem[] = [];

        fontsList.forEach(element => {
            uiFontsList.push(new UiFontItem(element.name, element));
        });

        return uiFontsList;
    }

    let importFontCommand = vscode.commands.registerCommand('extension.importFont', async () => {
        const uiFontsList = await prepareUIFontList();
        const selectedFont = await vscode.window.showQuickPick(uiFontsList, { placeHolder: 'Select the font' });

        if (selectedFont) {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return; // No open text editor
            }

            editor.edit((builder) => {
                if (editor) {
                    let textToInsert = `/* Please do not use this import in production. You could download this font from here ${selectedFont.fontObject.font_url} */`;
                    textToInsert += '\n';
                    textToInsert += selectedFont.fontObject.import;
                    textToInsert += '\n';
                    textToInsert += selectedFont.fontObject.comments;

                    builder.insert(editor.selection.active, textToInsert);
                    vscode.window.showInformationMessage('Font import added.');
                }
            });
        }
    });

    context.subscriptions.push(importFontCommand);

    let downloadFontCommand = vscode.commands.registerCommand('extension.downloadFont', async () => {
        const uiFontsList = await prepareUIFontList();
        const selectedFont = await vscode.window.showQuickPick(uiFontsList, { placeHolder: 'Select the font' });

        if (selectedFont) {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(selectedFont.fontObject.font_url + "?utm_source=vscode"));
        }
    });

    context.subscriptions.push(downloadFontCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {
}