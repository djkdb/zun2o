"""Local Korean voices with VoxCPM2 (OpenBMB, Apache-2.0) — no API key, no account.

Called by scripts/voices.mjs (TTS=voxcpm); runs on CPU (about 6× real time on 4 cores)
or a GPU if there is one. The model loads once per call.

  python scripts/voxcpm.py cast <out dir> <roles.json>   designed voices: a few candidates per role
  python scripts/voxcpm.py jobs <jobs.json>              lines in a chosen voice, with a delivery style

Environment: VOXCPM_MODEL = local folder or hub id (default openbmb/VoxCPM2).
"""

import json
import os
import sys
import time

import soundfile as sf
import torch


def load():
    from voxcpm import VoxCPM

    torch.set_num_threads(os.cpu_count() or 4)
    model_id = os.environ.get("VOXCPM_MODEL", "openbmb/VoxCPM2")
    t = time.time()
    m = VoxCPM.from_pretrained(model_id, load_denoiser=False, local_files_only=os.path.isdir(model_id), optimize=False)
    print(f"model loaded in {time.time() - t:.0f}s", flush=True)
    return m


def say(m, text, out, ref=None, seed=0):
    torch.manual_seed(seed)
    t = time.time()
    wav = m.generate(text=text, reference_wav_path=ref, cfg_value=2.0, inference_timesteps=10)
    sf.write(out, wav, m.tts_model.sample_rate)
    print(f"{out}  {len(wav) / m.tts_model.sample_rate:.1f}s audio in {time.time() - t:.0f}s", flush=True)


def cast(out_dir, roles_file):
    """Voice design: the voice comes from a description in parentheses before the line."""
    roles = json.load(open(roles_file, encoding="utf-8"))
    os.makedirs(out_dir, exist_ok=True)
    todo = [(role, r, k) for role, r in roles.items() for k in range(1, r.get("candidates", 3) + 1) if not os.path.exists(f"{out_dir}/{role}-{k}.wav")]
    if not todo:
        return
    m = load()
    for role, r, k in todo:
        say(m, f"({r['design']}){r['line']}", f"{out_dir}/{role}-{k}.wav", seed=k * 101)


def jobs(jobs_file):
    """Each job: {text, style?, ref?, out, seed?}. The style steers delivery; the reference keeps the voice."""
    todo = [j for j in json.load(open(jobs_file, encoding="utf-8")) if not os.path.exists(j["out"])]
    if not todo:
        return
    m = load()
    for j in todo:
        text = f"({j['style']}){j['text']}" if j.get("style") else j["text"]
        say(m, text, j["out"], ref=j.get("ref"), seed=j.get("seed", 0))


if __name__ == "__main__":
    {"cast": lambda: cast(sys.argv[2], sys.argv[3]), "jobs": lambda: jobs(sys.argv[2])}[sys.argv[1]]()
