interface VSCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VSCodeApi;

let api: VSCodeApi | undefined;

export function getVSCodeApi(): VSCodeApi {
  if (!api) {
    api = acquireVsCodeApi();
  }
  return api;
}
