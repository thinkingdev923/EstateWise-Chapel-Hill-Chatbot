import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const commandId = "estatewiseChat.openChat";

  const openChat = () => {
    const config = vscode.workspace.getConfiguration("estatewiseChat");
    // read settings
    const panelTitle = config.get<string>("panelTitle", "Estatewise Chat");
    const viewColumnNum = config.get<number>("viewColumn", 1);
    const retainContext = config.get<boolean>("retainContext", true);
    const enableScripts = config.get<boolean>("enableScripts", true);
    const iframeWidth = config.get<string>("iframeWidth", "100%");
    const iframeHeight = config.get<string>("iframeHeight", "100%");

    // map numeric setting → VSCode enum
    let column: vscode.ViewColumn;
    switch (viewColumnNum) {
      case 1:
        column = vscode.ViewColumn.One;
        break;
      case 2:
        column = vscode.ViewColumn.Two;
        break;
      case 3:
        column = vscode.ViewColumn.Three;
        break;
      default:
        column = vscode.ViewColumn.Active;
    }

    const panel = vscode.window.createWebviewPanel(
      "estatewiseChat",
      panelTitle,
      column,
      {
        enableScripts,
        retainContextWhenHidden: retainContext,
      },
    );

    panel.webview.html = getWebviewContent(iframeWidth, iframeHeight);
  };

  // register the command
  context.subscriptions.push(
    vscode.commands.registerCommand(commandId, openChat),
  );

  // auto‑open if the user wants it
  if (
    vscode.workspace
      .getConfiguration("estatewiseChat")
      .get<boolean>("openOnStartup", false)
  ) {
    openChat();
  }
}

export function deactivate() {}

function getWebviewContent(width: string, height: string): string {
  const chatUrl = "https://estatewise.vercel.app/chat";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; frame-src ${chatUrl}; style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estatewise Chat</title>
  <style>
    html, body {
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      overflow: hidden;
    }
    iframe {
      border: none;
      width: ${width};
      height: ${height};
    }
  </style>
</head>
<body>
  <iframe src="${chatUrl}"></iframe>
</body>
</html>`;
}
