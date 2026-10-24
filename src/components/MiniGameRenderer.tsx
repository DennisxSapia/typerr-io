import React, { useMemo } from "react";
import {
  Token,
  TILE_SIZE,
  PLAYER_SIZE,
  blockCompletedBase,
  blockSpaceBase,
  blockSpaceActiveBase,
  buildPath
} from "../App";

interface MiniGameRendererProps {
  tokens: Token[];
  currentIndex: number;
  theme: any;
}

export const MiniGameRenderer: React.FC<MiniGameRendererProps> = ({
  tokens,
  currentIndex,
  theme,
}) => {
  const path = useMemo(() => buildPath(tokens), [tokens]);

  const platformsData = useMemo(() => {
    const pData = [];
    const elements = [{ x: 0, y: 0 }, ...path];

    for (let i = 0; i < elements.length; i++) {
      const n = elements[i];
      const t = tokens[i];

      pData.push({
        id: `plat-${i}`,
        index: i,
        xOffset: n.x * TILE_SIZE,
        yOffset: -n.y * TILE_SIZE,
        yCoord: n.y,
        type: t ? t.type : "END",
        token: t,
        isWall: false,
      });

      if (t && (t.type === "LEFT" || t.type === "RIGHT")) {
        pData.push({
          id: `wall-${i}`,
          index: i,
          xOffset: n.x * TILE_SIZE,
          yOffset: -(n.y + 1) * TILE_SIZE,
          yCoord: n.y + 1,
          type: "WALL",
          token: null,
          isWall: true,
        });
      }
    }
    return pData;
  }, [path, tokens]);

  const drawDistance = 8;
  const DOM_KEEP_DISTANCE = 10;
  const visiblePlatforms = platformsData.filter(
    (p) =>
      p.index >= currentIndex - 2 &&
      p.index <= currentIndex + DOM_KEEP_DISTANCE,
  );

  const playerNode =
    currentIndex === 0 ? { x: 0, y: 0 } : path[currentIndex - 1];
  const pX = playerNode.x * TILE_SIZE;
  const pY = -playerNode.y * TILE_SIZE;

  // We add some jump animation state based on currentIndex changes if we want,
  // but to keep it simple, we just don't animate the jump up/down, or we simulate it.
  const isJumping = false; 

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none opacity-80">
      <div className="absolute left-1/2 top-[70%] w-0 h-0" style={{ transform: 'scale(0.75)' }}>
        <div
          className="absolute left-0 top-0 transition-transform duration-300 transform-gpu ease-out"
          style={{ transform: `translate(${-pX}px, ${-pY}px)` }}
        >
          {/* Render visible platforms */}
          {visiblePlatforms.map((p) => {
          const isActive = p.index === currentIndex;
          const isCompleted = p.index < currentIndex;
          const dist = p.index - currentIndex;

          let opacity = 1;
          if (dist < 0) {
            opacity = Math.max(0, 1 + dist * 0.5);
          } else if (dist > drawDistance - 3) {
            opacity = Math.max(0, 1 - (dist - (drawDistance - 3)) / 3);
          }

          if (p.isWall) {
            return (
              <div
                key={p.id}
                className="absolute rounded-md transition-all duration-300 ease-out block-wall"
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE * 2.5,
                  transform: `translate(${p.xOffset - TILE_SIZE / 2}px, ${p.yOffset + TILE_SIZE / 2 - TILE_SIZE * 2.5}px)`,
                  zIndex: 1000 - p.yCoord,
                  opacity,
                }}
              >
              </div>
            );
          }

          let blockClass = `block-3d text-slate-300`;
          let scaleVal = 1;
          let blockStyle: React.CSSProperties = {
            ...(theme.block as any),
          };

          if (isCompleted) {
            blockClass = "block-3d text-slate-600";
            blockStyle = blockCompletedBase;
          } else if (isActive) {
            scaleVal = 1.1;
            if (p.type === "SPACE") {
              blockClass = "block-3d text-white";
              blockStyle = blockSpaceActiveBase;
            } else {
              blockClass = `block-3d text-white`;
              blockStyle = { ...(theme.blockActive as any) };
            }
          } else {
            if (p.type === "SPACE") {
              blockClass = "block-3d text-slate-200";
              blockStyle = blockSpaceBase;
            }
          }

          const showText =
            dist >= 0 && dist <= 2 && p.type !== "LEFT" && p.type !== "RIGHT";

          return (
            <div
              key={p.id}
              className={`absolute flex items-center justify-center rounded-lg font-sans font-bold transition-all duration-300 ease-out ${blockClass}`}
              style={{
                ...blockStyle,
                width: TILE_SIZE - 6,
                height: TILE_SIZE - 6,
                transform: `translate(${p.xOffset - TILE_SIZE / 2 + 3}px, ${p.yOffset - TILE_SIZE / 2 + 3}px) scale(${scaleVal})`,
                zIndex: 1000 - p.yCoord,
                opacity,
              }}
            >
              {showText && (
                <span
                  className={`inline-block transition-transform duration-200 ${p.type === "SPACE" ? "text-[11px] tracking-widest leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" : "text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"} ${isActive ? "drop-shadow-[0_0_12px_rgba(255,255,255,1)]" : ""}`}
                >
                  {p.token && p.token.display}
                </span>
              )}
            </div>
          );
        })}

        {/* Player */}
        <div
          className="absolute rounded-full transition-transform duration-150 transform-gpu ease-out flex items-center justify-center pointer-events-none"
          style={{
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            background: theme.playerColor,
            boxShadow: theme.playerGlow,
            transform: `translate(${pX - PLAYER_SIZE / 2}px, ${pY - PLAYER_SIZE / 2}px) scale(${isJumping ? 1.6 : 1})`,
            zIndex: 1002 - playerNode.y,
          }}
        />
        </div>
      </div>
    </div>
  );
};
