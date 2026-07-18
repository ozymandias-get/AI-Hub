interface ChatGPTDesktopAPI {
  chatgptUrl: string;
  retryLoad: () => void;
  openExternal: (url: string) => void;
}

interface Window {
  chatgptDesktop: ChatGPTDesktopAPI;
}
