// Short found-footage clips (creator-generated, watermark removed, re-encoded
// small). Muted autoplay where they play by themselves; the recovered clip
// plays with sound only when the game's sound is on.
// Each clip comes as H.264 mp4 (Safari, Chrome, phones) and VP9 WebM (browsers without H.264);
// the browser takes the first one it can play.
import recovered from '../assets/video/recovered.mp4';
import recoveredWebm from '../assets/video/recovered.webm';
import recoveredPoster from '../assets/video/recovered-poster.jpg';
import videocall from '../assets/video/videocall.mp4';
import videocallWebm from '../assets/video/videocall.webm';

export const VIDEO = { recovered, recoveredWebm, recoveredPoster, videocall, videocallWebm };
