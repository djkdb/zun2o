import { useEffect } from 'react';
import { onSound, setAudioReady } from '../game/store';
import { LEVEL_PROFILES } from '../game/horrorEngine';
import { useGame, useHorrorLevel, useMainEventStage, usePeekAnomaly } from '../hooks/useGame';
import { audio } from '../utils/audio';

// Headless controller: owns the AudioContext lifecycle and the mix.
// Nothing plays until the visitor's first click/tap/keypress.

export function AudioController() {
  const enabled = useGame((s) => s.save.soundPreference === 'on');
  const level = useHorrorLevel();
  const stage = useMainEventStage();
  const audioFx = usePeekAnomaly('audio');

  // First gesture unlocks the context (autoplay policy).
  useEffect(() => {
    if (!enabled) return;
    let done = false;
    const unlock = async () => {
      if (done) return;
      done = true;
      const ok = await audio.unlock();
      audio.setEnabled(true);
      setAudioReady(ok);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [enabled]);

  useEffect(() => {
    audio.setEnabled(enabled);
  }, [enabled]);

  // Sound events from the store (anomalies, unlocks, the 02:00 sequence).
  useEffect(() => onSound((id) => audio.play(id)), []);

  // UI sounds via delegation: every real control clicks.
  useEffect(() => {
    const click = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target.closest('a,button') : null;
      if (el) audio.play('click');
    };
    const fine = window.matchMedia?.('(pointer: fine)').matches;
    const hover = (e: PointerEvent) => {
      const el = e.target instanceof Element ? e.target.closest('[data-record]') : null;
      if (el && fine) audio.play('hover');
    };
    const vis = () => (document.visibilityState === 'hidden' ? audio.suspend() : audio.resume());
    window.addEventListener('click', click);
    window.addEventListener('pointerover', hover);
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.removeEventListener('click', click);
      window.removeEventListener('pointerover', hover);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);

  // The mix follows the horror level, the 02:00 sequence and sound anomalies.
  const ready = useGame((s) => s.session.audioReady);
  useEffect(() => {
    if (!ready) return;
    const profile = LEVEL_PROFILES[level];
    let amb = profile.ambienceGain;
    let drone = profile.droneGain;
    let bright = 420;
    let ramp = 3;
    if (audioFx?.effect === 'fade-out') {
      amb = 0.002;
      ramp = 9;
    }
    if (audioFx?.effect === 'drone') drone += 0.07;
    audio.clickLow = audioFx?.effect === 'click-low';
    switch (stage) {
      case 'freeze':
        amb = profile.ambienceGain;
        break;
      case 'silence':
        amb = 0;
        drone = 0;
        ramp = 0.3;
        break;
      case 'fade':
      case 'retitle':
      case 'strip-menu':
        amb = 0.09;
        bright = 2400;
        drone = 0.05;
        ramp = 7;
        break;
      case 'dark':
      case 'record':
      case 'recall':
        amb = 0.015;
        drone = 0.13;
        ramp = 2;
        break;
      case 'scare':
        amb = 0;
        drone = 0;
        ramp = 0.05;
        break;
      case 'photo':
        amb = 0.1;
        bright = 3000;
        drone = 0.16;
        ramp = 0.2;
        break;
      case 'navigate':
      case 'reveal':
        amb = 0.02;
        drone = 0.07;
        ramp = 3;
        break;
      default:
        break;
    }
    audio.setMix(amb, drone, ramp, bright);
  }, [ready, level, stage, audioFx]);

  useEffect(() => () => audio.dispose(), []);
  return null;
}
