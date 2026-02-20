import { defineDeck } from "@mnestia/core/define-deck";
import { slide } from "@mnestia/core/slide";

export default defineDeck([
	slide("./slides/01-welcome.tsx"),
	slide("./slides/02-features.tsx"),
	slide("./slides/03-mdx-demo.mdx"),
	slide("./slides/04-components.tsx"),
	slide("./slides/05-end.tsx"),
], {
	theme: "@mnestia/theme-base",
	aspectRatio: "16/9",
});
