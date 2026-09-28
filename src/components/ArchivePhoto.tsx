import type { PhotoScene } from '../game/types';
import { photoStage } from '../game/horrorEngine';
import { useAnomaly, useGame, useVisualLevel } from '../hooks/useGame';
import { AnnexPhoto, CassettePhoto, FloorPlan, NoticePhoto, ReadingRoomPhoto, Room02Photo, TowerPhoto, type SceneProps } from './photos/Photos';
import type { ComponentType } from 'react';

const SCENES: Record<PhotoScene, ComponentType<SceneProps>> = {
  'reading-room': ReadingRoomPhoto,
  annex: AnnexPhoto,
  floorplan: FloorPlan,
  tower: TowerPhoto,
  cassette: CassettePhoto,
  notice: NoticePhoto,
  'room-02': Room02Photo,
};

interface Props {
  scene: PhotoScene;
  caption: string;
}

/** A captioned archive photograph that photo anomalies can disturb. */
export function ArchivePhoto({ scene, caption }: Props) {
  const level = useVisualLevel();
  const anomaly = useAnomaly('photo');
  const views003 = useGame((s) => s.save.recordViews['003'] ?? 0);
  const flags = useGame((s) => s.save.flags);
  const Scene = SCENES[scene];
  const stage = photoStage(level, views003, flags);
  const effect = anomaly?.effect ?? null;
  const className = ['photo', effect ? `fx-${effect}` : ''].filter(Boolean).join(' ');
  return (
    <figure className={className} data-scene={scene}>
      <div className="photo-frame">
        <Scene level={level} stage={stage} effect={effect} />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
