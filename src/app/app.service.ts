import { ipcRenderer, IpcRendererEvent } from "electron";
import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  vscode: any;
  // tslint:disable-next-line: variable-name
  _message = new Subject();

  constructor(private zone:NgZone) {
    ipcRenderer.on('fromMain', (event: IpcRendererEvent, message: any) => {
      this.zone.run(() => {
        this._message.next(message);
      });
    });
  }

  get message(): any {
    return this._message.asObservable();
  }

  launch(url: string): void {
    ipcRenderer.send('fromRenderer', {
      command: 'launch',
      url: url
    });
  }

  runAxe(): void {
    ipcRenderer.send('fromRenderer', {
      command: 'runAxe'
    });
  }
}
