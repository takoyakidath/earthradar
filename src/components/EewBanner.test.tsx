// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EewBanner from "./EewBanner";
import type { EewMessage } from "@/types";

const baseEew: EewMessage = {
  id: "1",
  time: "2026/01/01 00:00:00",
  code: 556,
  cancelled: false,
  earthquake: {
    originTime: "2026/01/01 00:00:00",
    arrivalTime: "2026/01/01 00:00:10",
    hypocenter: {
      name: "宗谷地方北部",
      latitude: 44.9,
      longitude: 142.1,
      depth: 10,
      magnitude: 5.5,
    },
  },
  issue: { time: "2026/01/01 00:00:24", eventId: "e1", serial: "1" },
  areas: [{ pref: "北海道道北", name: "上川地方北部", scaleFrom: 45, scaleTo: 45 }],
};

describe("EewBanner", () => {
  it("renders nothing when there is no active alert", () => {
    const { container } = render(<EewBanner eew={null} onDismiss={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders hypocenter, predicted intensity, and an explicit unofficial-source disclaimer", () => {
    render(<EewBanner eew={baseEew} onDismiss={vi.fn()} />);
    expect(screen.getByText(/宗谷地方北部/)).toBeInTheDocument();
    expect(screen.getByText(/震度5弱/)).toBeInTheDocument();
    expect(screen.getByText(/代替ではありません/)).toBeInTheDocument();
  });

  it("renders '7程度以上' for the scaleTo=99 sentinel instead of an unknown-scale label", () => {
    const overflow: EewMessage = {
      ...baseEew,
      areas: [{ pref: "北海道道北", name: "上川地方北部", scaleFrom: 70, scaleTo: 99 }],
    };
    render(<EewBanner eew={overflow} onDismiss={vi.fn()} />);
    expect(screen.getByText(/7程度以上/)).toBeInTheDocument();
  });
});
