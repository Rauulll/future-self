"use client";

import { depthColor } from "@/lib/color";

export default function TimeDepthMark({
  depth,
  size = 10,
}: {
  depth: number;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className="inline-block rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: depthColor(depth),
        boxShadow: `0 0 ${6 + depth * 10}px ${depthColor(depth)}55`,
      }}
    />
  );
}
