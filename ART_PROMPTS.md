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
| `selfie-alone` | 3:4 세로 | 숨김 앨범 5번째, 스케어 전: 채원만 (selfie-far를 잘라 만듦 — 생성 불필요) |
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
| 9 | `room02-door.webp` | 숨김 앨범 1번: 벽돌로 막힌 제2서고 (도서관 서고) |
| 10 | `room02.webp` | 숨김 앨범 2번: 제2서고 안 · 브라우저 기록 013 |
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

---

## 3차 시트 — 엔딩·디테일·프로필 8장

1차 시트를 참고 이미지로 붙이고 요청하세요 (채원·부스 일관성).

| 칸 | 파일 이름 | 게임 속 위치 |
|---|---|---|
| 1 | `ending-poweroff.webp` | 엔딩 1 “전원 끄기” 배경: 다음 날 밤, 선반 위 폰 두 대 |
| 2 | `ending-shift.webp` | 엔딩 2 “교대” 배경: 새벽, 3층 창문에 당신 |
| 3 | `ending-release.webp` | 엔딩 3 “색인 종료” 배경: 아침, 빈 선반 |
| 4 | `booth-reflect.webp` | 3층 창문 자동 백업 사진을 오래 들여다보면 바뀌는 버전 (유리에 비친 얼굴) — **1차 4번과 같은 구도** |
| 5 | `pip-self.webp` | 02:00 영상통화의 “내 카메라” 작은 화면 |
| 6 | `avatar-dohyun.webp` | 도현 프로필 사진 |
| 7 | `avatar-mom.webp` | 엄마 프로필 사진 |
| 8 | `avatar-self.webp` | 채원 프로필 사진 (나에게) |

```
Create ONE high-resolution image: a 4×2 contact sheet of 8 separate square photographs, thin black gutters,
NO numbers or text anywhere. Keep CHAEWON and the phone booth identical to the reference sheet.
Panels 1–5 look like real old-smartphone photos at night or dawn (flash, sensor noise, crushed blacks);
panels 6–8 are ordinary, bright, everyday social-media profile photos.

1. Night, inside the same public phone booth: TWO smartphones lying side by side on the metal shelf, one dark,
   one with its screen lit showing a low-battery icon, rain on the glass, the receiver hanging off the hook.
2. Blue dawn, seen from the street: the abandoned 3-storey concrete annex; in one third-floor window a faint
   pale figure stands looking down; in the foreground the phone booth, empty, one phone left on its shelf.
3. Early morning after rain, soft sunlight: the same phone booth, door open, the shelf completely empty,
   the receiver back on its hook, puddles, birds on the power line. Peaceful, almost warm.
4. Exactly the same composition as panel 4 of the reference sheet (view from a third-floor window down to the lit
   phone booth), but in the dark window glass, top-left, a faint reflection of a pale woman's face with wet black
   hair, as if she is standing right behind the photographer.
5. Front-camera video-call frame: a person inside the dark phone booth, face lit from below by the screen and
   mostly in shadow (not identifiable), and over their shoulder, pressed against the booth glass behind them,
   a pale face with wet black hair and one bright eye.
6. A casual profile photo: a young Korean man seen from behind, sitting on a beach at sunset, hoodie, sea and
   orange sky. Face not visible.
7. A typical Korean mother's profile photo: a bright close-up of pink royal azaleas in spring sunlight.
8. CHAEWON's own profile photo in daylight: smiling, bright café, peace sign, natural and happy — the same woman
   as the reference, before that night.
```

## 발신자 정보 없음 프로필 사진 (`avatar-unknown`)

`src/assets/art/avatar-unknown.webp` (정사각형, 256px). 대화 목록·잠금화면 알림·통화 화면에 쓰입니다.
현재 들어 있는 것은 아래 프롬프트로 제작자가 생성한 이미지를 머리·어깨 중심으로 잘라 256px로 줄인 것입니다.
(“실제 사진 / 저화질 / 여성” 같은 표현을 쓰면 생성이 거부될 수 있어, 가상의 유령 캐릭터·영화 스틸로 표현했습니다.)

```
Square profile icon for a horror game character. Cinematic still from a Korean horror film:
a fictional ghost of a 1990s night-shift archivist, seen from the chest up, facing the camera,
her long straight black hair falling over her whole face. Pale grey office cardigan.
She stands in a dark archive room with rows of old wooden index drawers softly out of focus behind her.
Almost monochrome, cold grey-green grading, soft film grain, gentle vignette.
Composition is simple and centred on a grey background glow, so at small size it reads like
a plain grey default contact avatar. No text, no logo, no frame.
```

---

## 4차 시트 — 학교로 바뀐 배경 9장 (폐교된 해원고등학교)

무대가 군청 별관에서 **폐교된 해원고등학교 도서관**으로 바뀌어, 학교 느낌이 필요한 9장만 다시 뽑습니다.
`room02`(카드 목록 서랍)·`black-empty`(귀신 사진과 같은 구도)·`tower`(방송 송신탑)는 그대로 씁니다.

| 칸 | 파일 이름 | 게임 속 위치 |
|---|---|---|
| 1 | `wallpaper` | 잠금화면 배경 · 첫 화면: 밤의 폐교 전경 |
| 2 | `annex-gate` | 사진 00:59: 학교 정문 |
| 3 | `lobby` | 사진 01:14: 1층 현관 |
| 4 | `stairs` | 사진 01:25: 계단 |
| 5 | `stairs-figure` | 4번과 같은 구도 + 계단 위의 형체 |
| 6 | `corridor` | 사진 01:32: 3층 복도 |
| 7 | `reading-empty` | 사진 01:40: 도서관 열람실 |
| 8 | `reading-figure` | 7번과 같은 구도 + 책상 사이의 형체 |
| 9 | `room02-door` | 숨김 앨범 1번: 벽돌로 막힌 제2서고 문 |

```
Create ONE high-resolution image: a 3×3 contact sheet of 9 separate portrait (3:4) photographs for the same
found-phone horror game as the reference sheet. Thin black gutters, NO numbers, NO text overlays except signs
that are physically in the scene. Every panel looks like a real photo taken on an old smartphone at night in an
abandoned Korean high school that closed in 1995: harsh phone flash or a single flashlight, crushed blacks,
sensor noise, slight motion blur, desaturated cold green-grey tones, dust in the air. No people unless stated.

1. Night, from outside the rusty school fence: an abandoned 3-storey concrete Korean high school building,
   rows of dark classroom windows, one window on the third floor faintly lit yellow, an empty dirt sports field
   in front, a flagpole without a flag, weeds.
2. The school's main gate at night: two rusty iron sliding gates, the heavy chain cut and hanging, a padlock on
   the ground, a weathered stone plaque on the gate pillar that reads "해원고등학교".
3. The ground-floor entrance hall: rows of wooden shoe lockers with small doors hanging open, a faded floor
   directory board on the wall with Korean text "3층 도서관", dead leaves and loose papers on a terrazzo floor.
4. A narrow school stairwell seen from the bottom, green-painted lower walls, a metal handrail, a small sign
   "3층" on the landing, the top of the stairs disappearing into complete darkness.
5. EXACTLY the same photo as panel 4 — same angle, same light, same framing — but at the very top of the
   stairs, barely visible in the dark, a pale woman with long black hair covering her face stands still.
6. The third-floor corridor: long row of classroom doors with small hanging room signs, windows on one side
   showing the night, peeling paint, at the far end one door with warm yellow light leaking out.
7. The school library reading room: long wooden reading tables with chairs pushed in, tall bookshelves,
   a desk lamp that is on, an old wall clock stopped at 2:00, dust sheets over a few shelves.
8. EXACTLY the same photo as panel 7 — same angle, same light — but between two tables in the back, a dark
   figure of a woman stands with her head tilted, half hidden by shadow, very easy to miss.
9. At the end of the corridor, a door with a small plate "제2서고" whose doorway has been bricked up
   from the inside, mortar oozing between uneven red bricks, a few library cards on the floor in front of it.
```

## 시트 5 — 아직 코드로 그리는 두 장 (방문자 카드 · 평면도)

지금 사진 대신 SVG로 그리고 있는 건 이 두 장뿐이다. 글자는 AI가 틀리게 쓰기 쉬우므로 **글자 없는 이미지**를 받고, 이름·시각·방 이름은 게임이 그 위에 타자기 글씨로 얹는다(이름이 플레이어마다 바뀌기 때문에도 그래야 한다).

| # | 슬롯 | 쓰이는 곳 |
|---|---|---|
| 1 | `index-card` | 숨김 앨범 3번 “서랍 안에 내 카드가 있었다.” (01:56) |
| 2 | `floorplan` | 최근 항목 p06 “벽에 붙어 있던 평면도.”, 기록 005 |

```
Create ONE high-resolution image: a 1×2 sheet of 2 separate portrait (3:4) photographs for the same found-phone
horror game as the reference sheets. Thin black gutters, NO numbers, NO letters, NO writing anywhere.
Both look like real photos taken on an old smartphone at night with harsh flash: crushed blacks, sensor noise,
cold desaturated green-grey tones, dust in the air.

1. Extreme close-up inside a dark archive room: a long wooden library card-catalogue drawer pulled open,
   packed with old yellowed index cards; ONE card stands up higher than the others, facing the camera,
   filling the middle of the frame. The card is COMPLETELY BLANK: faint pre-printed horizontal ruled lines,
   one thin red line near the top, a round punch hole at the bottom, slightly curled and water-stained edges.
   Flash hot-spot on the card, everything around falls off into black. No text on the card.
2. A faded evacuation floor plan in a cheap plastic frame, screwed to a peeling green school corridor wall,
   photographed slightly from below with flash glare on the plastic. The plan shows a simple top-down
   outline of one floor: a long corridor with six rectangular rooms around it, one room in the upper middle
   cross-hatched in red, a small red dot for "you are here", a green running-man exit pictogram in a corner.
   The plan has NO readable text, only empty label boxes. Dust, a dead moth inside the frame.
```
