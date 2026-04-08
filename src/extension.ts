import * as vscode from 'vscode';
import { SlideEditorProvider } from './slideEditorProvider';
import { importMarkdownToSlides } from './markdownImporter';
import { generateSlideshowHtml } from './exporter';
import { createDefaultDocument, SlidesDocument } from './types';

export function activate(context: vscode.ExtensionContext) {
  const provider = SlideEditorProvider.register(context);
  context.subscriptions.push(provider);

  context.subscriptions.push(
    vscode.commands.registerCommand('markSlideDown.newSlideFile', async () => {
      const uri = await vscode.window.showSaveDialog({
        filters: {
          'Mark Slides': ['mslides'],
          'Slides JSON': ['slides.json'],
        },
        saveLabel: 'Create Slide File',
      });
      if (!uri) return;

      const doc = createDefaultDocument();
      const content = JSON.stringify(doc, null, 2);
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
      await vscode.commands.executeCommand('vscode.openWith', uri, 'markSlideDown.slideEditor');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('markSlideDown.importMarkdown', async () => {
      const mdUri = await vscode.window.showOpenDialog({
        filters: { 'Markdown': ['md'] },
        canSelectMany: false,
        openLabel: 'Import Markdown',
      });
      if (!mdUri || mdUri.length === 0) return;

      const mdContent = await vscode.workspace.fs.readFile(mdUri[0]);
      const markdown = Buffer.from(mdContent).toString('utf-8');
      const doc = importMarkdownToSlides(markdown);

      const saveUri = await vscode.window.showSaveDialog({
        filters: {
          'Mark Slides': ['mslides'],
          'Slides JSON': ['slides.json'],
        },
        saveLabel: 'Save Slides',
      });
      if (!saveUri) return;

      await vscode.workspace.fs.writeFile(saveUri, Buffer.from(JSON.stringify(doc, null, 2), 'utf-8'));
      await vscode.commands.executeCommand('vscode.openWith', saveUri, 'markSlideDown.slideEditor');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('markSlideDown.preview', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active slide file.');
        return;
      }
      vscode.window.showInformationMessage('Preview mode coming soon!');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('markSlideDown.exportPdf', async () => {
      const editor = vscode.window.activeTextEditor;
      const fn = editor?.document.fileName || '';
      if (!editor || !(fn.endsWith('.slides.json') || fn.endsWith('.mslides'))) {
        vscode.window.showWarningMessage('Open a .slides.json or .mslides file first.');
        return;
      }
      try {
        const doc = JSON.parse(editor.document.getText()) as SlidesDocument;
        const html = generateSlideshowHtml(doc);

        const saveUri = await vscode.window.showSaveDialog({
          filters: { 'HTML': ['html'] },
          saveLabel: 'Export HTML',
          defaultUri: vscode.Uri.file(
            editor.document.uri.fsPath.replace(/\.slides\.json$/, '.html')
          ),
        });
        if (!saveUri) return;

        await vscode.workspace.fs.writeFile(saveUri, Buffer.from(html, 'utf-8'));
        const open = await vscode.window.showInformationMessage(
          `Exported to ${saveUri.fsPath}. Open in browser and press Ctrl+P to save as PDF.`,
          'Open in Browser'
        );
        if (open === 'Open in Browser') {
          await vscode.env.openExternal(saveUri);
        }
      } catch (err) {
        vscode.window.showErrorMessage(`Export failed: ${err}`);
      }
    })
  );
}

export function deactivate() {}
