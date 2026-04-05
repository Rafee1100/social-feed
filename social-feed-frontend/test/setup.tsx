import React from "react";
import { vi } from "vitest";

type NextImageMockProps = React.ComponentProps<"img">;

type NextLinkMockProps = React.ComponentProps<"a"> & {
  href: string;
  children?: React.ReactNode;
};

vi.mock("next/image", () => ({
  default: (props: NextImageMockProps) => React.createElement("img", props),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: NextLinkMockProps) =>
    React.createElement("a", { href, ...rest }, children),
}));

vi.mock("react-toastify", () => {
  const toast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    dismiss: vi.fn(),
  };
  return {
    toast,
    ToastContainer: () => null,
  };
});
