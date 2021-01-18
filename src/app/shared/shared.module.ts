import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { TranslateModule } from "@ngx-translate/core";

import { ButtonModule } from "primeng/button";
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from "primeng/table";
import { ToolbarModule } from "primeng/toolbar";
import { TooltipModule } from 'primeng/tooltip';

import { PageNotFoundComponent } from "./components/";
import { WebviewDirective } from "./directives/";

@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective],
  imports: [CommonModule, TranslateModule, FormsModule, ButtonModule, DialogModule, InputTextModule, TableModule, ToolbarModule, TooltipModule],
  exports: [TranslateModule, WebviewDirective, FormsModule, ButtonModule, DialogModule, InputTextModule, TableModule, ToolbarModule, TooltipModule],
})
export class SharedModule {}
