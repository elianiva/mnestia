import { Atom } from "@effect-atom/atom-react";
import type { Slide } from "@mnestia/schema/slide";

export const slidesAtom = Atom.make([] as Slide[]).pipe(Atom.keepAlive);
