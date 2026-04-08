import * as vscode from 'vscode';
import { SlidesDocument, createDefaultDocument } from './types';
import { importMarkdownToSlides } from './markdownImporter';
import { generateSlideshowHtml, exportToPdf } from './exporter';

export class SlideEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'markSlideDown.slideEditor';

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new SlideEditorProvider(context);
    return vscode.window.registerCustomEditorProvider(
      SlideEditorProvider.viewType,
      provider,
      {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false,
      }
    );
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
      ],
    };

    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    let suppressNextUpdate = false;

    const initializeIfEmpty = async () => {
      const text = document.getText().trim();
      if (text === '' || text === '{}') {
        const doc = createDefaultDocument();
        suppressNextUpdate = true;
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
          document.uri,
          new vscode.Range(0, 0, document.lineCount, 0),
          JSON.stringify(doc, null, 2)
        );
        await vscode.workspace.applyEdit(edit);
        webviewPanel.webview.postMessage({ type: 'update', data: doc });
        return true;
      }
      return false;
    };

    const updateWebview = () => {
      if (suppressNextUpdate) {
        suppressNextUpdate = false;
        return;
      }
      try {
        const json = JSON.parse(document.getText()) as SlidesDocument;
        webviewPanel.webview.postMessage({
          type: 'update',
          data: json,
        });
      } catch {
        initializeIfEmpty();
      }
    };

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'edit': {
          suppressNextUpdate = true;
          const edit = new vscode.WorkspaceEdit();
          edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            JSON.stringify(message.data, null, 2)
          );
          await vscode.workspace.applyEdit(edit);
          return;
        }

        case 'ready':
          updateWebview();
          return;

        case 'exportPdf': {
          try {
            const doc = JSON.parse(document.getText()) as SlidesDocument;
            const saveUri = await vscode.window.showSaveDialog({
              filters: { 'PDF': ['pdf'] },
              saveLabel: 'Export PDF',
              defaultUri: vscode.Uri.file(
                document.uri.fsPath.replace(/\.(slides\.json|mslides)$/, '.pdf')
              ),
            });
            if (!saveUri) return;

            await vscode.window.withProgress(
              { location: vscode.ProgressLocation.Notification, title: 'Exporting PDF...' },
              async () => {
                await exportToPdf(doc, saveUri.fsPath);
              }
            );

            const open = await vscode.window.showInformationMessage(
              `PDF exported to ${saveUri.fsPath}`,
              'Open File'
            );
            if (open === 'Open File') {
              await vscode.env.openExternal(saveUri);
            }
          } catch (err: any) {
            vscode.window.showErrorMessage(err.message || `PDF export failed: ${err}`);
          }
          return;
        }

        case 'exportHtml': {
          try {
            const doc = JSON.parse(document.getText()) as SlidesDocument;
            const html = generateSlideshowHtml(doc);

            const saveUri = await vscode.window.showSaveDialog({
              filters: { 'HTML': ['html'] },
              saveLabel: 'Export HTML',
              defaultUri: vscode.Uri.file(
                document.uri.fsPath.replace(/\.(slides\.json|mslides)$/, '.html')
              ),
            });
            if (!saveUri) return;

            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(html, 'utf-8'));
            const open = await vscode.window.showInformationMessage(
              `Exported to ${saveUri.fsPath}`,
              'Open in Browser'
            );
            if (open === 'Open in Browser') {
              await vscode.env.openExternal(saveUri);
            }
          } catch (err) {
            vscode.window.showErrorMessage(`Export failed: ${err}`);
          }
          return;
        }

        case 'importMarkdown': {
          const mdUri = await vscode.window.showOpenDialog({
            filters: { 'Markdown': ['md'] },
            canSelectMany: false,
            openLabel: 'Import Markdown',
          });
          if (!mdUri || mdUri.length === 0) return;

          try {
            const mdContent = await vscode.workspace.fs.readFile(mdUri[0]);
            const markdown = Buffer.from(mdContent).toString('utf-8');
            const imported = importMarkdownToSlides(markdown);

            suppressNextUpdate = true;
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
              document.uri,
              new vscode.Range(0, 0, document.lineCount, 0),
              JSON.stringify(imported, null, 2)
            );
            await vscode.workspace.applyEdit(edit);

            webviewPanel.webview.postMessage({
              type: 'imported',
              data: imported,
            });

            vscode.window.showInformationMessage(
              `Imported ${imported.slides.length} slides from ${mdUri[0].path.split('/').pop()}`
            );
          } catch (err) {
            vscode.window.showErrorMessage(`Import failed: ${err}`);
          }
          return;
        }
      }
    });

    initializeIfEmpty().then((initialized) => {
      if (!initialized) {
        updateWebview();
      }
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js')
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" 
    content="default-src 'none'; 
    style-src ${webview.cspSource} 'unsafe-inline'; 
    script-src 'nonce-${nonce}';
    img-src ${webview.cspSource} data: https:;
    font-src ${webview.cspSource};">
  <title>Mark Slide Down</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
