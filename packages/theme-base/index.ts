import type { ThemeModule } from "@mnestia/schema";
import { DefaultLayout } from "./src/layouts/default";
import { CoverLayout } from "./src/layouts/cover";
import { CenterLayout } from "./src/layouts/center";
import { SplitLayout } from "./src/layouts/split";
import { GridLayout } from "./src/layouts/grid";
import { CodeBlock } from "./src/components/code-block";
import { Image } from "./src/components/image";
import { Quote } from "./src/components/quote";
import { Table } from "./src/components/table";
import { setupTheme } from "./src/setup";

export const themeBase: ThemeModule = {
  name: "@mnestia/theme-base",
  layouts: {
    default: DefaultLayout as (...args: unknown[]) => unknown,
    cover: CoverLayout as (...args: unknown[]) => unknown,
    center: CenterLayout as (...args: unknown[]) => unknown,
    split: SplitLayout as (...args: unknown[]) => unknown,
    grid: GridLayout as (...args: unknown[]) => unknown,
  },
  components: {
    CodeBlock: CodeBlock as (...args: unknown[]) => unknown,
    Image: Image as (...args: unknown[]) => unknown,
    Quote: Quote as (...args: unknown[]) => unknown,
    Table: Table as (...args: unknown[]) => unknown,
  },
  styles: {
    variables: "./src/styles/variables.css",
    global: "./src/styles/global.css",
  },
  setup: setupTheme,
};

export { setupTheme } from "./src/setup";
export * from "./src/layouts/index";
export * from "./src/components/index";

export default themeBase;
