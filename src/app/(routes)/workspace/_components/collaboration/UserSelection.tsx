import React, { useEffect, useRef } from "react";

interface Selection {
  text: string;
}

interface UserSelection {
  userId: string;
  userColor: string;
  selection: Selection;
}

interface UserSelectionsProps {
  users: UserSelection[];
  containerRef: React.RefObject<HTMLElement | null>;
}

export const UserSelections: React.FC<UserSelectionsProps> = ({
  users,
  containerRef,
}) => {
  const selectionsRef = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    const editorElement = containerRef.current.querySelector("#editorjs");
    if (!editorElement) return;

    // Очищаем предыдущие выделения
    selectionsRef.current.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    selectionsRef.current.clear();

    // Создаем новые выделения как overlay элементы
    users.forEach((user) => {
      const { selection, userColor } = user;

      if (selection.text?.trim()) {
        const textToFind = selection.text.trim();
        const textNodes = findTextNodes(editorElement, textToFind);

        textNodes.forEach((node) => {
          createSelectionOverlay(node, textToFind, userColor, user.userId);
        });
      }
    });
  }, [users, containerRef]);

  const findTextNodes = (element: Element, text: string): Node[] => {
    const nodes: Node[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.includes(text)) {
        nodes.push(node);
      }
    }

    return nodes;
  };

  const createSelectionOverlay = (
    textNode: Node,
    textToFind: string, // Добавляем параметр textToFind
    color: string,
    userId: string
  ) => {
    const range = document.createRange();
    const textContent = textNode.textContent || "";
    const startIndex = textContent.indexOf(textToFind);

    if (startIndex === -1) return;

    range.setStart(textNode, startIndex);
    range.setEnd(textNode, startIndex + textToFind.length);

    const rects = range.getClientRects();

    Array.from(rects).forEach((rect, index) => {
      const overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.backgroundColor = `${color}40`;
      overlay.style.borderBottom = `2px solid ${color}`;
      overlay.style.borderRadius = "3px";
      overlay.style.pointerEvents = "none";
      overlay.style.zIndex = "10";

      const editorRect = containerRef.current!.getBoundingClientRect();
      overlay.style.left = `${rect.left - editorRect.left}px`;
      overlay.style.top = `${rect.top - editorRect.top}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;

      containerRef.current!.appendChild(overlay);
      selectionsRef.current.set(`${userId}-${index}-${Date.now()}`, overlay);
    });
  };

  return null;
};
