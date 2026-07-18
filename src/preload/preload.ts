import { contextBridge, ipcRenderer } from 'electron';
import { CHATGPT_URL } from '../main/constants';

contextBridge.exposeInMainWorld('chatgptDesktop', {
  chatgptUrl: CHATGPT_URL,
  retryLoad: (): void => {
    ipcRenderer.send('retry-load');
  },
  openExternal: (url: string): void => {
    ipcRenderer.send('open-external', url);
  },
});
