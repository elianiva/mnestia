import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Check for saved slide in localStorage
    const savedSlide = localStorage.getItem("mnestia:currentSlide");
    const slideNumber = savedSlide ? parseInt(savedSlide, 10) + 1 : 1;
    throw redirect({ href: `/slide/${slideNumber}` });
  },
});
