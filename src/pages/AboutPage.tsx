import { useState } from 'react';
import { useGame, useVisualLevel } from '../hooks/useGame';
import { clearSave } from '../game/save';
import { removeItem, storageAvailable } from '../utils/storage';
import { formatHM } from '../utils/time';

export function AboutPage() {
  const level = useVisualLevel();
  const save = useGame((s) => s.save);
  const [confirming, setConfirming] = useState(false);
  const archivist = save.flags.includes('ending-true');

  const erase = () => {
    clearSave();
    removeItem('na_visit', 'session');
    window.location.hash = '#/';
    window.location.reload();
  };

  return (
    <div className="prose">
      <h2 className="page-title">About the archive</h2>
      <p>
        The Night Archive began in 1996, when a group of volunteers were allowed to remove the remaining paper records from the
        Harrow County Municipal Annex before it was sealed. Most of us had day jobs, so the scanning happened at night. The
        name stuck.
      </p>
      <p>
        {level >= 3
          ? 'We have never finished the catalogue. Every time we think we have, the index is longer.'
          : 'The catalogue is incomplete. New scans are added during the nightly archive sync.'}
      </p>
      <h3 className="section-heading">Staff</h3>
      <ul className="status-list">
        <li>
          <span>Founding archivist</span>
          <span>{level >= 3 ? 'I. Varga (1985– )' : 'I. Varga (1985–1994)'}</span>
        </li>
        <li>
          <span>Volunteers</span>
          <span>{level >= 5 ? '0' : '6'}</span>
        </li>
        <li>
          <span>Night archivist</span>
          <span>{archivist ? `VISITOR #${String(save.visitCount).padStart(4, '0')} (since ${formatHM(new Date(save.secretProgress.C.at ?? save.lastVisit))})` : level >= 5 ? 'on shift' : 'vacant'}</span>
        </li>
      </ul>
      <h3 className="section-heading" id="privacy">
        Privacy
      </h3>
      <p>
        This site remembers your visits using your browser’s local storage only: how many times you have come, which records you
        opened and what you have found. Nothing is sent to any server, there are no cookies or trackers, and the site never asks
        for your camera, microphone or location. {storageAvailable() ? '' : 'Local storage is unavailable in this browser, so your progress lasts only until you close the tab.'}
      </p>
      {!confirming ? (
        <button type="button" className="btn" onClick={() => setConfirming(true)}>
          Erase my local data
        </button>
      ) : (
        <p>
          This resets every visit, record and discovery.{' '}
          <button type="button" className="btn" onClick={erase}>
            Yes, erase
          </button>{' '}
          <button type="button" className="text-button" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </p>
      )}
    </div>
  );
}
