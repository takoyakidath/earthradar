"use client";
import { Reception } from "@/components/reception";

export default function Home() {
  return (
    <main>
      <Reception />
      <div className="p-5">
        <small className="text-base">
          Copyright © 2024 Takoyaki. All rights reserved.
        </small>
      </div>
    </main>
  );
}
