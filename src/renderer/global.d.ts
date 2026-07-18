export interface AiDesktopAPI {
  getServices(): Promise<any[]>;
  minimize(): void;
  maximize(): void;
  close(): void;
  selectService(id: string): void;
  retryLoad(): void;
  openExternal(url: string): void;
}

declare global {
  interface Window {
    aiDesktop: AiDesktopAPI;
    chatgptDesktop: any;
  }
}
