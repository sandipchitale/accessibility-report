import { remote, shell } from "electron";
import { Component } from "@angular/core";

import { ElectronService } from "./core/services";
import { TranslateService } from "@ngx-translate/core";
import { AppService } from './app.service';

interface Report {
  timestamp: string;
  url: string;
  violations: any;
  passes: any;
  inapplicable: any;
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {

  url = 'https://start.spring.io';

  reports: Report[] = [];
  selectedReport: Report;

  violations = '';
  passes = '';
  inapplicable = '';

  displayPassesDialog = false;
  displayInapplicableDialog = false;

  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private appService: AppService
  ) {
    this.translate.setDefaultLang("en");
    if (electronService.isElectron) {
      console.log(process.env);
      console.log("Run in electron");
      console.log("Electron ipcRenderer", this.electronService.ipcRenderer);
      console.log("NodeJS childProcess", this.electronService.childProcess);
    } else {
      console.log("Run in browser");
    }

    this.appService.message.subscribe((message: any) => {
      switch (message.command) {
        case 'report': {
          const report: Report = {
            timestamp: message.axeResults.timestamp,
            url: message.axeResults.url,
            violations: message.axeResults.violations,
            passes: message.axeResults.passes || [],
            inapplicable: message.axeResults.inapplicable || []
          };
          this.selectedReport = report;
          this.violations = JSON.stringify(this.selectedReport.violations, null, '  ');
          this.passes = JSON.stringify(this.selectedReport.passes, null, '  ');
          this.inapplicable = JSON.stringify(this.selectedReport.inapplicable, null, '  ');
          this.reports.push(report);
          break;
        }
      }
    });
  }

  launch(): void {
    this.appService.launch(this.url);
  }

  runAxe(): void {
    this.appService.runAxe();
  }

  onReportSelected(event: { data: Report; }): void {
    this.violations = JSON.stringify(event.data.violations, null, '  ');
    this.passes = JSON.stringify(event.data.passes, null, '  ');
    this.inapplicable = JSON.stringify(event.data.inapplicable, null, '  ');
  }

  onReportUnselected(): void {
    this.violations = '';
    this.passes = '';
    this.inapplicable = '';
  }

  clearReports(): void {
    this.reports = [];
    this.selectedReport = undefined;
    this.violations = '';
    this.passes = '';
    this.inapplicable = '';
  }

  showPasses(e): void {
    this.displayPassesDialog = true;
  }

  showInapplicableOverlay(e): void {
    this.displayInapplicableDialog = true;
  }

  showOnGitgub(): void {
    shell.openExternal('https://github.com/sandipchitale/accesibility-report');
  }

  quit(): void {
    remote.getCurrentWindow().close();
  }
}
