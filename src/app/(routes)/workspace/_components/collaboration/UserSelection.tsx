"use client";

import React, { useEffect, useRef, useState } from "react";

interface UserSelection {
  user: {
    id: string;
    name: string;
    color?: string;
  };
  userColor: string;
  selection: {
    text: string;
    start: number;
    end: number;
  };
}

interface UserSelectionsProps {
  users: UserSelection[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function UserSelections({ users, containerRef }: UserSelectionsProps) {
  const [highlights, setHighlights] = useState<any[]>([]);
  const renderIdRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const editorElement = containerRef.current.querySelector("#editorjs");
    if (!editorElement) return;

    console.log("🎯 UserSelections: Processing users", users);

    const newHighlights: any[] = [];
    renderIdRef.current += 1;
    const renderId = renderIdRef.current;

    users.forEach((user) => {
      if (!user || !user.selection || !user.selection.text?.trim()) {
        return;
      }

      const { selection, userColor } = user;
      const textToFind = selection.text.trim();

      console.log("🔍 Looking for text:", {
        text: textToFind,
        user: user.user.name,
        color: userColor,
      });

      try {
        const textNodes = findTextNodes(editorElement, textToFind);

        textNodes.forEach(({ node, index, nodeIndex }) => {
          const range = document.createRange();
          const startPos = index;
          const endPos = startPos + textToFind.length;

          if (node.textContent && endPos <= node.textContent.length) {
            try {
              range.setStart(node, startPos);
              range.setEnd(node, endPos);

              const rect = range.getBoundingClientRect();
              const containerRect = editorElement.getBoundingClientRect();

              if (rect.width > 0 && rect.height > 0) {
                const id = `${user.user.id}-${nodeIndex}-${startPos}-${renderId}`;

                newHighlights.push({
                  id,
                  user: user.user,
                  userColor: userColor,
                  rect: {
                    x: rect.left - containerRect.left,
                    y: rect.top - containerRect.top,
                    width: rect.width,
                    height: rect.height,
                  },
                  text: textToFind,
                });
              }
            } catch (error) {
              console.error("Error creating range:", error);
            } finally {
              range.detach?.();
            }
          }
        });
      } catch (error) {
        console.error("Error finding text nodes:", error);
      }
    });

    setHighlights(newHighlights);
  }, [users, containerRef]);

  const findTextNodes = (element: Element, text: string) => {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    const nodes: { node: Text; index: number; nodeIndex: number }[] = [];
    let node = walker.nextNode() as Text | null;
    let nodeIndex = 0;

    while (node) {
      if (node.textContent) {
        let start = 0;
        while (true) {
          const foundIndex = node.textContent.indexOf(text, start);
          if (foundIndex === -1) break;
          nodes.push({ node, index: foundIndex, nodeIndex });
          start = foundIndex + text.length;
        }
      }
      node = walker.nextNode() as Text | null;
      nodeIndex += 1;
    }

    return nodes;
  };

  if (highlights.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {highlights.map((highlight) => (
        <div
          key={highlight.id}
          className="absolute border-2 rounded-sm px-1"
          style={{
            left: `${highlight.rect.x}px`,
            top: `${highlight.rect.y}px`,
            width: `${highlight.rect.width}px`,
            height: `${highlight.rect.height}px`,
            borderColor: highlight.userColor,
            backgroundColor: `${highlight.userColor}20`,
          }}
        >
          <div
            className="absolute -top-6 left-0 text-xs text-white px-2 py-1 rounded-md whitespace-nowrap"
            style={{ backgroundColor: highlight.userColor }}
          >
            {highlight.user.name}
          </div>
        </div>
      ))}
    </div>
  );
}
