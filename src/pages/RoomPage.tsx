import { useEffect } from 'react';
import { ArchivePhoto } from '../components/ArchivePhoto';
import { findSecret, showNotice } from '../game/store';
import { useGame, useVisualLevel } from '../hooks/useGame';
import { NotFoundPage } from './NotFoundPage';

// Secret D — the file that "does not exist". Reachable from search.

export function RoomPage() {
  const level = useVisualLevel();
  const listed = useGame((s) => s.save.flags.includes('room02-listed'));
  const allowed = listed || level >= 5;

  useEffect(() => {
    if (allowed && findSecret('D')) showNotice('ROOM_02 recovered. 38%.');
  }, [allowed]);

  if (!allowed) return <NotFoundPage path="/room-02" />;

  return (
    <article className="prose">
      <div className="record-kicker">ROOM_02.DAT · [FILE CORRUPTED] · 38% recovered</div>
      <h2 className="record-title">ROOM 02 — Index room</h2>
      <p className="corrupt">
        ▒▒ HARROW ANNEX / LEVEL 3 / ROOM 02 / SEALED 1995 ▒▒▒▒▒▒▒▒ contents not transferred ▒▒▒▒ index cabinets: 1,208 drawers ▒▒▒
      </p>
      <ArchivePhoto scene="room-02" caption="Recovered frame. Date stamp unreadable. The lamp is on." />
      <table className="data-table">
        <tbody>
          <tr>
            <th scope="row">Occupant</th>
            <td>1</td>
          </tr>
          <tr>
            <th scope="row">Shift</th>
            <td>continuous since 14/03/1994 02:00</td>
          </tr>
          <tr>
            <th scope="row">Drawers full</th>
            <td>1,207 of 1,208</td>
          </tr>
          <tr>
            <th scope="row">Last card filed</th>
            <td>VISITOR — tonight</td>
          </tr>
        </tbody>
      </table>
      <p>The index cabinets are almost full. One drawer is open. The card inside it has not been written yet.</p>
      <p className="corrupt">▒▒▒ recovery stopped at 38% ▒▒▒ the remainder of this file is being written ▒▒▒</p>
    </article>
  );
}
