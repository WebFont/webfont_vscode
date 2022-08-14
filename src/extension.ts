'use strict';

import * as vscode from 'vscode';
import axios from 'axios';

const FONT_LIST_URL = 'https://fontstorage.com/api/plugins.json';
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

    async function downloadFontsList(): Promise<any> {
        try {
            const { data } = await axios.get(FONT_LIST_URL);
            
            context.globalState.update('webfontCache', data);
            return data;
        }
        catch (err) {
            return [{ name: "Can't download font's list. Check if you connected to the Internet." }];
        }

    }

    async function getUrls() {
        const data = await downloadFontsList();
        return data.urls;
    }

    async function prepareUIFontList() {
        const data = await downloadFontsList();
        const fontsList = data.fonts;        
        const uiFontsList: UiFontItem[] = [];

        fontsList.forEach((element:any) => {
            uiFontsList.push(new UiFontItem(element.name, element));
        });

        return uiFontsList;
    }

    let fontCommand = vscode.commands.registerCommand('webfont', async () => {
        const uiFontsList = await prepareUIFontList();   
        const urls = await getUrls();    
        const menuItems = ['Import font', 'Download font(ttf/otf)', 'Subsetting', 'View on website'];
        
        const selectedFont = await vscode.window.showQuickPick(uiFontsList, { placeHolder: 'Select the font' });

        if (selectedFont) {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return; // No open text editor
            }

            const linkToSite = `${urls.site_url}/font/${selectedFont.fontObject.font_slug}`;

            const selectedOption = await vscode.window.showQuickPick(menuItems, {title: 'Choose option', canPickMany: false});

            if (selectedOption === 'Import font') {
                editor.edit((builder) => {
                    if (editor) {
                        let textToInsert = `/* Please do not use this import in production. You could download this font from here ${linkToSite} */`;
                        textToInsert += '\n';
                        textToInsert += `@import "${urls.import_url}${selectedFont.fontObject.slug}.css";`;
                        textToInsert += '\n';
                        textToInsert += selectedFont.fontObject.comments;

                        builder.insert(editor.selection.active, textToInsert);
                        vscode.window.showInformationMessage('Font import added.');
                    }
                });
            }

            if (selectedOption === 'Download font(ttf/otf)') {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${urls.download_url}${selectedFont.fontObject.font_slug}/${selectedFont.fontObject.font_slug}.zip`))
            }

            if (selectedOption === 'Subsetting') {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${urls.converter_url}#${selectedFont.fontObject.font_slug}`));
            }

            if (selectedOption === 'View on website') {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${linkToSite}?from=vscode`));
            }

        }
    });

    context.subscriptions.push(fontCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {
}