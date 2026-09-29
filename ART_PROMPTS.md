# 사진 슬롯 & 생성 프롬프트

게임 속 사진과 점프스케어는 기본적으로 SVG 그림입니다. 대신 **실사 이미지**를 쓰고 싶으면 아래 이름으로 `src/assets/art/`에 넣고 `npm run build` 하면 됩니다.
파일이 있는 슬롯만 사진으로 바뀌고, 없는 슬롯은 그림 그대로입니다. (jpg · png · webp · avif, 한 장당 300KB 이하 권장 — webp 추천)

- 이미지는 ChatGPT(이미지 생성), Midjourney 등으로 **직접 생성한 것**만 쓰세요. 실존 인물 사진·남의 사진·영화 스틸은 쓰지 마세요.
- 게임이 자동으로 채도를 조금 빼고 대비를 올리며, 폰 카메라 노이즈를 입힙니다. 너무 깨끗하게 뽑혀도 괜찮습니다.
- **같은 인물 유지**: 채원 셀카를 먼저 하나 뽑고, 이후 프롬프트에 그 이미지를 참고 이미지로 넣으세요 ("같은 여자, 같은 옷"). 귀신도 마찬가지.
- 생성 도구가 거절하면 "horror" 대신 "unsettling, eerie"로 바꾸고, 피·상처 표현은 빼세요. 이 게임은 피 없이 무서운 쪽입니다.

## 공통 스타일 (모든 프롬프트 끝에 붙이기)

```
shot on an old smartphone at night, harsh on-camera flash, heavy sensor noise, motion blur, crushed blacks,
slightly green color cast, amateur framing, realistic photograph, no text, no watermark
```

## 슬롯

| 파일 이름 | 비율 | 게임 속 위치 |
|---|---|---|
| `black-reveal` | 3:4 세로 | 1장. 거의 검은 마지막 사진을 밝기 끝까지 올렸을 때 |
| `selfie-far` | 3:4 세로 | 3장 숨김 앨범 4번째: 채원 셀카, 뒤 멀리 무언가 |
| `selfie-close` | 3:4 세로 | 3장 숨김 앨범 5번째: 같은 셀카, 그것이 바로 옆에 |
| `booth` | 3:2 가로 | 3장 자동 백업: 3층 창문에서 내려다본 공중전화 부스 안의 "당신" |
| `booth-behind` | 3:2 가로 | 4장 도현이 보낸 사진: 길 건너에서 찍은 부스, 당신 뒤에 누가 서 있음 |
| `booth-shelf` | 3:2 가로 | 1장 사진 앱 첫 사진(00:58): 부스 선반 위에 놓인 화면 켜진 폰 |
| `video-chaewon` | 9:16 세로 | 02:00 영상통화: 채원 얼굴 |
| `video-behind` | 9:16 세로 | 02:00 영상통화: 같은 화면, 채원 어깨 뒤에 그것 (서서히 겹쳐짐) |
| `scare-hang` | 9:16 세로 | 점프스케어 1 (검은 사진) |
| `scare-profile` | 9:16 세로 | 점프스케어 2 (셀카) |
| `scare-face` | 9:16 세로 | 점프스케어 3 (02:00, 딱 한 번 보이는 정면) |
| `reflect` | 9:16 세로 | 어두운 홈 화면에 비치는 얼굴, 통화 중 깜빡임 (아주 흐리게 쓰임) |

### black-reveal
```
Photo taken from floor level in a dark abandoned 1990s Korean government records room, empty wooden chair and desk,
metal filing cabinets. Hanging upside down from the ceiling directly above the camera: a pale gaunt woman's head and
shoulders, long wet black hair hanging straight down toward the floor, her face upside down, mouth open too wide,
one eye visible staring into the lens. Overexposed as if brightened in a photo editor, grain everywhere.
```

### selfie-far
```
Frightened young Korean woman in her twenties taking a selfie in a pitch-dark archive room, lit only from below by her
phone screen, black padded jacket, hair tied back, eyes wide. Far behind her, between two tall rows of filing shelves,
barely visible in the dark: a tall thin figure with long black hair covering its face, head tilted.
```

### selfie-close
```
Same young Korean woman, same selfie framing and lighting, now crying. Pressed right beside her cheek, half cut off by
the edge of the frame: a pale gaunt face in profile, grey skin, one eye rolled toward the camera, jaw hanging open
unnaturally long, wet black hair. The woman has not noticed.
```

### booth
```
View from a high third-floor window looking down at a dark empty street at night, a lone lit public phone booth,
inside it a person seen from above holding a glowing smartphone, face lit by the screen. Window frame edges visible,
dirty glass, telephoto zoom blur.
```

### booth-behind
```
Photo taken from across a dark empty street at eye level: a lone lit public phone booth, a person inside holding a
glowing smartphone, and directly behind them, pressed against the booth glass, a tall thin woman in a faded 1990s
office cardigan with long wet black hair covering her face, head tilted, pale hands. Shaky handheld, grainy.
```

### booth-shelf
```
Close-up inside an old Korean public phone booth at night: a smartphone lying on the metal shelf, screen on, showing
a lock screen with "12%" battery, payphone receiver hanging off its hook, scratched glass, a faded "분실물" sticker.
Harsh flash.
```

### video-chaewon
```
Front camera video call frame, vertical. Young Korean woman in a dark room lit only by her phone from below,
face close to the camera, terrified, whispering, rows of old drawers behind her, compression artifacts.
```

### video-behind
```
Same video call frame, same woman and lighting. Over her right shoulder, emerging from the dark: a pale face with
long wet black hair covering most of it, one eye visible, very close behind her.
```

### scare-hang
```
Extreme close-up, vertical, upside-down pale gaunt woman's face dropping into frame from above, long black hair
falling downward, mouth stretched open vertically, hollow dark eye sockets, one pinprick of light in one eye,
pure black background, flash-lit, grainy.
```

### scare-profile
```
Extreme close-up, vertical, side profile of a pale gaunt woman lunging toward the camera from the right edge,
jaw hanging far too low, one eye turned to stare directly at the viewer, wet black hair, black background, flash-lit, grainy.
```

### scare-face
```
Extreme close-up, vertical, frontal face of a pale gaunt woman filling the entire frame, hollow black eyes with tiny
white pupils, black streaks under the eyes, mouth open unnaturally wide, long wet black hair across the face,
black background, harsh flash, heavy grain and motion blur, as if she just leaned into a phone's front camera.
```

### reflect
```
Very dark, vertical, a faint figure of a woman with long black hair covering her face standing behind the viewer,
seen as a reflection in a black phone screen, low contrast, mostly black.
```

---

## 2차 시트 — 배경·건물 사진 12장 (한 장으로 뽑기)

첫 시트(귀신·채원·부스)와 **같은 대화에서** 첫 시트를 참고 이미지로 붙이고 요청하면 톤이 맞습니다.

| 칸 | 파일 이름 | 게임 속 위치 |
|---|---|---|
| 1 | `wallpaper.webp` | 잠금 화면 배경 (9:16) |
| 2 | `annex-gate.webp` | 사진 00:59 정문 · 브라우저 기사 사진 |
| 3 | `lobby.webp` | 사진 01:14 로비 |
| 4 | `stairs.webp` | 사진 01:25 계단 |
| 5 | `stairs-figure.webp` | 같은 계단 — 셀카 이후/오래 들여다보면 위에 누가 서 있음 |
| 6 | `corridor.webp` | 사진 01:32 3층 복도 |
| 7 | `reading-empty.webp` | 사진 01:40 열람실 · 브라우저 기록 003 |
| 8 | `reading-figure.webp` | 같은 열람실 — 나중에 보면 책상 사이에 형체 |
| 9 | `room02-door.webp` | 숨김 앨범 1번: 벽돌로 막힌 02호실 |
| 10 | `room02.webp` | 숨김 앨범 2번: 02호실 안 · 브라우저 기록 013 |
| 11 | `black-empty.webp` | 1장 검은 사진을 밝게 할 때 (귀신 없는 버전) — **1차 시트 1번과 같은 구도** |
| 12 | `tower.webp` | 브라우저 기록 001 해원방송 송신탑 |

```
Create ONE high-resolution image: a 4×3 contact sheet of 12 separate photographs for the same found-phone horror
game as the reference sheet. Thin black gutters, a small white number (1–12) in the top-left corner of each panel,
no other text anywhere (no signs, no letters on walls). Each panel a square frame.
All must look like REAL photos taken on an old smartphone at night: harsh on-camera flash falling off into
darkness, heavy sensor noise, slight motion blur, crushed blacks, faint green cast, amateur framing.
Photorealistic, empty, abandoned, quietly wrong. No people unless stated. No blood.
Setting: an abandoned 1990s Korean county-office annex (3-storey concrete building, rows of wooden index-card
drawers, reading room, beige tiles), closed since 1995, at 1 AM.

1. Vertical phone wallpaper: the annex's 3-storey concrete facade at night from across a broken chain-link gate,
   all windows dark except ONE dim yellow window on the third floor.
2. The annex's front gate close up: a rusted chain hanging cut, padlock on the ground, flashlight beam on the door.
3. Ground-floor lobby: dusty floor, papers scattered, a wall directory board (blank, no readable text), dead
   ceiling lights, doors on both sides.
4. A narrow concrete staircase going up into total darkness, handrail, flash lighting only the first steps.
5. The exact same staircase, same angle — but at the very top, at the edge of the flash, a tall thin figure with
   long black hair covering its face stands still, barely visible.
6. Third-floor corridor in one-point perspective, doors on both sides, at the far end one door open with warm
   yellow light spilling out onto the floor.
7. Old reading room: long wooden tables, green desk lamps, a woman's coat left on a chair, a wall clock stopped at
   2:00, wooden index-card cabinets along the walls, nobody there.
8. The exact same reading room, same angle — between two tables, half in shadow, a tall thin woman in a faded
   beige 1990s cardigan with wet black hair over her face, standing, facing the camera.
9. End of a corridor: a doorway filled with red bricks laid from the inside, mortar squeezed out toward the camera,
   a small metal plate on the frame showing only "02".
10. Inside a windowless room that seems too large: endless rows of wooden index-card drawers from floor to ceiling
    receding into darkness, one drawer pulled open, a single bare bulb.
11. Dark records room seen from floor level: an empty wooden chair and desk, filing drawers behind, ceiling above
    the camera empty — very underexposed, as if the photo will be brightened later. (Same room and angle as
    panel 1 of the reference sheet, without the woman.)
12. An old AM radio transmission tower on a hill at night, red warning light on top, fog, power lines.
```

팁: 5·8·11번은 “같은 구도”가 핵심입니다. 따로 다시 뽑을 때는 4·7·(1차 1번) 이미지를 참고로 넣고 “exact same composition, only add …”라고 하세요.
