# Estatewise Chat – VS Code Extension

Embed the Estatewise chatbot directly into your VS Code editor and get instant property insights without ever leaving your workspace!

<p align="center">
  <img src="images/logo.png" alt="Estatewise Chat Extension Screenshot" width="45%">
</p>

## Features

- **One‑click access** to your Estatewise chatbot via the Command Palette.
- **Persistent Webview panel** with retained context when hidden or reopened.
- **Sandboxed iframe** for secure, CSP‑compliant loading of `https://estatewise.vercel.app/chat`.
- **Customizable Webview options** (scripts enabled, context retention).
- **Zero backend code** in the extension — all logic lives in the Estatewise app itself.

## Prerequisites

- **VS Code** v1.50.0 or later  
- **Node.js** & **npm**  
- **vsce** packaging tool (install with `npm install ‑g vsce`)

## Installation

1. **Clone this repo** and navigate into the extension folder:
  ```bash
   git clone https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot.git
   cd EstateWise-Chapel-Hill-Chatbot/extension
  ```

2. **Install dependencies**:

  ```bash
  npm install
  ```

3. **Compile** the TypeScript sources:

  ```bash
  npm run compile
  ```

4. **Package** as a VSIX:

  ```bash
  vsce package
  ```

   This generates `estatewise-chat-0.0.1.vsix`.

5. **Install the VSIX**:

   * **CLI**:

     ```bash
     code --install-extension estatewise-chat-0.0.1.vsix
     ```
   * **VS Code UI**:
     Open the Extensions view → click the “...” menu → **Install from VSIX** → select the generated `.vsix` file.

## Usage

1. Open the **Command Palette** (Ctrl+Shift+P / Cmd+Shift+P).
2. Type and run **Estatewise Chat: Open Chat**.
3. The Estatewise chatbot will load in a side panel.
4. Start typing your queries—everything runs through the hosted app at `https://estatewise.vercel.app/chat`.

> **Tip:** You can keep the panel open permanently or hide it; your chat context will be preserved.

## Development

* **Watch mode**

  ```bash
  npm run watch
  ```

  Recompiles on file changes.

* **Debug in VS Code**

  1. Press F5 to launch a new Extension Development Host.
  2. In that host, open the Command Palette and run your command.

* **Re‑package**

  ```bash
  npm run package
  ```

## Extension Settings

Open **Settings** → **Extensions** → **Estatewise Chat** to configure:

| Setting                       | Type     | Default       | Description                                                      |
|-------------------------------|----------|---------------|------------------------------------------------------------------|
| `estatewiseChat.panelTitle`   | string   | `Estatewise Chat`   | Title of the chat panel.                             |
| `estatewiseChat.viewColumn`   | number   | `1`           | Which editor column to open the panel in (0=Active, 1–3).        |
| `estatewiseChat.retainContext`| boolean  | `true`        | Keep chat context alive when the panel is hidden.               |
| `estatewiseChat.enableScripts`| boolean  | `true`        | Allow scripts to run inside the Webview.                       |
| `estatewiseChat.iframeWidth`  | string   | `100%`        | CSS width of the embedded chat iframe (e.g. `80%` or `600px`).  |
| `estatewiseChat.iframeHeight` | string   | `100%`        | CSS height of the embedded chat iframe (e.g. `80%` or `500px`). |
| `estatewiseChat.openOnStartup`| boolean  | `false`       | Open the chat panel automatically when VS Code starts.          |

## Troubleshooting

* **Blank panel**: ensure you’re online and that `https://estatewise.vercel.app/chat` is reachable.
* **CSP errors**: check that the URL in `getWebviewContent()` matches exactly the iframe `src` and the CSP frame‑src directive.

## Changelog

* **0.0.1**

  * Initial release: iframe Webview of Estatewise chatbot.

## License

This extension is MIT‑licensed. See [LICENSE](../LICENSE) for details.

---

## About EstateWise

EstateWise is a full‑stack AI/ML chatbot and data analytics platform for Chapel Hill real estate. To learn more about the underlying app—its architecture, AI techniques (RAG, Mixture‑of‑Experts, etc.), data analytics pipelines, and deployment—visit the main repo:

👉 [hoangsonww/EstateWise‑Chapel‑Hill‑Chatbot](https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot)
