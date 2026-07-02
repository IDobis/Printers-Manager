import type { Modifier } from "@dnd-kit/core";
import type { RefObject } from "react";

const BOTTOM_PADDING = 20;

export function createRestrictToListBottom(listRef: RefObject<HTMLElement | null>): Modifier {
  return ({ transform, draggingNodeRect }) => {
    if (!listRef.current || !draggingNodeRect) {
      return { ...transform, x: 0 };
    }

    const maxBottom = listRef.current.getBoundingClientRect().bottom + BOTTOM_PADDING;
    const projectedBottom = draggingNodeRect.bottom + transform.y;
    const y = projectedBottom > maxBottom ? transform.y - (projectedBottom - maxBottom) : transform.y;

    return { ...transform, x: 0, y };
  };
}
