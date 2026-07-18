import { WebContentsView, app, Notification, shell, dialog, session } from 'electron';
import * as path from 'path';
import { promises as fs } from 'fs';

let downloadHandlerInstalled = false;

export function setupDownloads(_view: WebContentsView): void {
  if (downloadHandlerInstalled) {
    return;
  }
  downloadHandlerInstalled = true;

  session.defaultSession.on('will-download', async (_event, item) => {
    const downloadsPath = app.getPath('downloads');
    let filename = item.getFilename();

    if (!filename) {
      const url = item.getURL();
      try {
        filename = path.basename(new URL(url).pathname) || 'download';
      } catch {
        filename = 'download';
      }
    }

    let filePath = path.join(downloadsPath, filename);
    let counter = 1;

    while (true) {
      try {
        await fs.access(filePath);
        const ext = path.extname(filename);
        const name = path.basename(filename, ext);
        filePath = path.join(downloadsPath, `${name} (${counter})${ext}`);
        counter++;
      } catch {
        break;
      }
    }

    item.setSavePath(filePath);

    const displayFilename = path.basename(filePath);

    item.on('done', (_doneEvent, state) => {
      if (state === 'completed') {
        const notif = new Notification({
          title: 'İndirme Tamamlandı',
          body: displayFilename,
        });
        notif.on('click', () => {
          shell.showItemInFolder(filePath);
        });
        notif.show();
      } else if (state === 'interrupted') {
        dialog.showErrorBox(
          'İndirme Hatası',
          `"${displayFilename}" indirilirken bir hata oluştu.`
        );
      }
    });
  });
}
