import { app, Notification, shell, dialog, Session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const configuredSessions = new WeakSet<Session>();

export function setupDownloads(ses: Session): void {
  if (configuredSessions.has(ses)) {
    return;
  }
  configuredSessions.add(ses);

  ses.on('will-download', (_event, item) => {
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
    const MAX_RENAME_ATTEMPTS = 100;

    while (fs.existsSync(filePath) && counter <= MAX_RENAME_ATTEMPTS) {
      const ext = path.extname(filename);
      const name = path.basename(filename, ext);
      filePath = path.join(downloadsPath, `${name} (${counter})${ext}`);
      counter++;
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

