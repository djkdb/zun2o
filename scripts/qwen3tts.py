"""Korean voices with Qwen3-TTS VoiceDesign (Qwen, Apache-2.0): each line's voice and delivery come
from a written description. Called by scripts/voices.mjs (TTS=qwen3); runs on CPU (~6x real time).

  python scripts/qwen3tts.py jobs <jobs.json>   [{text, instruct, out, seed}] → wav files
  python scripts/qwen3tts.py sim <pairs.json>   [{wav, anchor}] → adds "sim" (speaker likeness, cosine)

VoiceDesign builds a new voice every time, so the pipeline makes several takes per line and keeps
the one closest to the role's anchor voice (the "sim" mode) that also says the line right.

Environment: QWEN3_MODEL = local folder or hub id (default Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign),
SPK_ONNX = CAM++ speaker-embedding model (campplus.onnx, e.g. from inclusionAI/Ming-3.0-tts-0.5B, MIT).
"""

import json
import os
import sys
import time

import numpy as np
import soundfile as sf
import torch


def jobs(jobs_file):
    todo = [j for j in json.load(open(jobs_file, encoding="utf-8")) if not os.path.exists(j["out"])]
    if not todo:
        return
    from qwen_tts import Qwen3TTSModel

    torch.set_num_threads(os.cpu_count() or 4)
    t = time.time()
    m = Qwen3TTSModel.from_pretrained(os.environ.get("QWEN3_MODEL", "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"), device_map="cpu", dtype=torch.float32, attn_implementation="sdpa")
    print(f"model loaded in {time.time() - t:.0f}s", flush=True)
    for j in todo:
        torch.manual_seed(j.get("seed", 0))
        t = time.time()
        wavs, sr = m.generate_voice_design(text=j["text"], language="Korean", instruct=j["instruct"])
        os.makedirs(os.path.dirname(j["out"]), exist_ok=True)
        sf.write(j["out"], wavs[0], sr)
        print(f"{j['out']}  {len(wavs[0]) / sr:.1f}s audio in {time.time() - t:.0f}s", flush=True)


def sim(pairs_file):
    import onnxruntime
    import torchaudio
    import torchaudio.compliance.kaldi as kaldi

    sess = onnxruntime.InferenceSession(os.environ["SPK_ONNX"], providers=["CPUExecutionProvider"])

    def emb(f):
        y, sr = sf.read(f, dtype="float32", always_2d=True)
        y = torchaudio.functional.resample(torch.from_numpy(y.mean(1))[None], sr, 16000)
        feat = kaldi.fbank(y, num_mel_bins=80, dither=0, sample_frequency=16000)
        e = sess.run(None, {sess.get_inputs()[0].name: (feat - feat.mean(0, keepdim=True))[None].numpy()})[0].flatten()
        return e / np.linalg.norm(e)

    pairs = json.load(open(pairs_file, encoding="utf-8"))
    cache = {}
    for p in pairs:
        if p["anchor"] not in cache:
            cache[p["anchor"]] = emb(p["anchor"])
        p["sim"] = round(float(emb(p["wav"]) @ cache[p["anchor"]]), 3)
    json.dump(pairs, open(pairs_file, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    {"jobs": lambda: jobs(sys.argv[2]), "sim": lambda: sim(sys.argv[2])}[sys.argv[1]]()
