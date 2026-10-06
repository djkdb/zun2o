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

## 시트 6 — 채원의 평범한 날 (선택, 아직 슬롯 없음)

“사라진 사람”이 아니라 “어제까지 평범했던 사람”을 보여 주는 사진 4장. 받으면 사진 앱 최근 항목의 앞쪽(9월 24~26일)에 넣는다.

```
Create ONE high-resolution image: a 2×2 contact sheet of 4 separate portrait (3:4) casual smartphone photos of the
same young Korean woman in her early 20s (match the reference: shoulder-length dark hair), warm and ordinary,
daylight or cozy indoor light, slightly imperfect framing like real phone photos. Thin black gutters, NO text.
1. A selfie in a café, holding up an iced coffee, laughing, a small handheld camera on the table.
2. A messy desk at night: laptop with a video editing timeline, a flashlight and a power bank, sticky notes.
3. A bakery display case, a sweet-potato cake circled with her finger in frame (a birthday cake for her mother).
4. A blurry, happy two-shot with a young man in a hoodie at a bus stop at dusk, both making a V sign.
```

## 시즌 2 「귀가」 — 6장 (선택, 없으면 코드로 그린 그림)

**공통.** 엄마(서미령)의 얼굴은 `src/assets/art/miryeong-id.webp`를 **참고 이미지로 같이 넣으세요**. 41세, 1990년대 뽀글 단발, 얇은 둥근 안경, 베이지 니트 카디건에 꽃무늬 블라우스입니다. 딸 소연(43)은 엄마와 닮았지만 조금 더 나이 들어 보이고, 옷은 요즘 옷입니다.
글자(특히 한글)는 넣지 마세요. 노트 글씨는 게임이 손글씨 폰트로 위에 씁니다.

| 파일 이름 | 비율 | 게임 속 위치 |
|---|---|---|
| `s2-sisters` | 3:4 세로 | 사진 앱 최근 항목: "엄마랑 나. 올봄. 가게 아줌마가 자매냐고 물었다." (이 파일이 있을 때만 사진이 나타남) |
| `s2-kitchen` | 3:2 가로 | 사진 앱: 8월 28일 01:59, 소연이 몰래 찍은 엄마 |
| `s2-kitchen-close` | 3:2 가로 | 사진 앱 9월 28일 01:52: 부스에 있는 폰이 찍은 부엌. 같은 장면을 방 안에서, 훨씬 가까이 (없으면 `s2-kitchen`을 확대해 씀) |
| `s2-home` | 3:2 가로 | 사진 앱: 엄마가 돌아온 날 아침, 의자에 걸린 1994년 외투 |
| `s2-notebook` | 3:4 세로 | 노트 사진 3장의 배경 (빈 페이지, 이름은 게임이 위에 씀) |
| `s2-window` | 9:16 세로 | 엔딩 4 「딸」 배경: 새벽 두 시, 창가에서 딸을 기다리는 엄마 |
| `avatar-soyeon` | 1:1 | 시즌 2 "나에게" 프로필 사진 |
| `s2-card` | 3:4 세로 | 엔딩 4 「딸」: 서랍에 새로 생긴 카드, 소연의 글씨 (없으면 시즌 1 `index-card`) |
| `s2-ending-home` | 9:16 세로 | 엔딩 6 「귀가」 배경: 엄마가 떠난 새벽 식탁 (없으면 시즌 1 `ending-release`) |

### s2-sisters
```
Candid smartphone photo in soft spring daylight, outside a small Korean neighborhood shop. Two Korean women stand side
by side, shoulders touching. Left: a woman of about 41 with a 1990s permed bob, thin round glasses, beige knit cardigan
over a floral blouse (match the reference face exactly), smiling a little shyly, slightly old-fashioned. Right: her
daughter, about 43, clearly resembling her but looking a bit older, shoulder-length hair, modern casual clothes, laughing.
They look like sisters, and the daughter looks like the older one. Warm, ordinary, slightly imperfect framing,
realistic photograph, no text, no watermark.
```

### s2-kitchen
```
Night photo taken secretly through the gap of a half-open door into a dark small Korean apartment kitchen. A single desk
lamp on the kitchen table makes a warm pool of light. A woman with a 1990s permed bob and a beige cardigan sits at the
table with her back to the camera, very upright, writing in a notebook with a ballpoint pen; her head is tilted at a
slightly wrong angle, as if asleep. A wall clock reads 1:59. Everything else is black. Still, cold, unsettling, no face
visible. Shot on an old smartphone, no flash, heavy noise, slight motion blur, realistic, no text, no watermark.
```

### s2-kitchen-close
```
The same dark small Korean apartment kitchen at night as the previous photo, but now shot from INSIDE the room, only about
one meter behind the woman. She sits at the kitchen table under a single warm desk lamp, back to the camera, 1990s permed
bob, beige cardigan, very upright, writing in an open notebook with a ballpoint pen; her head tilted at a slightly wrong
angle, as if asleep. Over her shoulder the notebook page is just visible but unreadable. Nobody is holding this camera:
slightly too low, slightly crooked, as if the phone were lying on a chair. Wall clock reads 1:52. Black all around.
Old smartphone, no flash, heavy noise, realistic, no text, no watermark.
```

### s2-home
```
Early dawn in a small Korean apartment kitchen, blue light through the window, no lamps on. An old brown 1990s wool coat
hangs on the back of a wooden kitchen chair. On the table, a cup of barley tea nobody drank and a pair of old reading
glasses. Quiet, empty, a little sad. Smartphone photo, natural light, realistic, no people, no text, no watermark.
```

### s2-notebook
```
Top-down smartphone photo of an open, BLANK lined school notebook lying on a wooden kitchen table under a warm lamp at
night. The page fills about 80% of the frame, slightly tilted. A cheap ballpoint pen beside it, faint ink smudges near
the page edge, a soft shadow. The page must be completely empty: NO writing, NO letters, NO numbers. Realistic, no text,
no watermark.
```

### s2-window
```
Vertical night photo inside a dim Korean apartment at 2 a.m. A woman of about 41 (1990s permed bob, thin round glasses,
beige cardigan; match the reference) sits on a chair by the window with her hands folded in her lap, looking out at the
empty street lit by a single street lamp, waiting for someone. Next to her, an empty chair. Her face is half in shadow,
calm and patient, very lonely. Melancholy rather than scary. Realistic photograph, soft grain, no text, no watermark.
```

### avatar-soyeon
```
Square smartphone photo used as a messenger profile picture: on a cluttered desk, a small stack of old yellowed library
catalogue cards held with a rubber band, a mug of coffee and a laptop edge, warm desk-lamp light. No people, no text,
no watermark.
```

**한 장으로 받기(선택).** 위 6장을 "3×2 contact sheet, thin black gutters, each panel its own aspect ratio cropped inside the cell, NO text"로 한 번에 뽑아도 됩니다. 받으면 칸별로 잘라서 넣겠습니다.

### s2-card
```
Extreme close-up inside a dark library archive room at night: a long wooden card-catalogue drawer pulled open, packed
with old yellowed, water-stained index cards. ONE card in the middle is new: clean, bright white, standing slightly
higher than the others, facing the camera. It has a few lines of neat handwriting in blue ballpoint pen, out of focus
and completely unreadable. A ballpoint pen lies across the top of the drawer. Weak warm light from one side, everything
else falls off into black. Old smartphone photo, no flash, heavy noise, realistic, no readable text, no watermark.
```

### s2-ending-home
```
Early dawn in the same small Korean apartment kitchen, cold blue light through the window, no lamps on. An open
notebook lies on the kitchen table: many handwritten lines, each crossed out with a single pen stroke, and at the
bottom of the page one short line that is not crossed out; all of it blurred and unreadable. A ballpoint pen set down
neatly beside it, a cup of barley tea gone cold. The wooden chair is pulled out and empty: no coat on it anymore.
Quiet, tender, sad, nobody in the frame. Shot on an old smartphone, natural grain, realistic, no readable text,
no watermark, vertical 9:16.
```


## 영상 — 시즌 2 (선택)

시즌 1 영상 다섯 개(`src/assets/video/README.md`)와 같은 방식입니다. Gemini(Veo)에서 게임 사진을 **첫 장면**으로 넣고 아래 프롬프트로 8초짜리를 만듭니다. 받으면 워터마크를 지우고 540×960(세로)이나 960×540(가로)으로 줄여 mp4와 webm 두 벌로 넣습니다. 영상이 없거나 효과 줄이기 설정이면 지금 쓰는 사진이 그대로 나옵니다.

| # | 파일 | 첫 장면 | 비율 | 쓰이는 곳 |
|---|---|---|---|---|
| 1 | `s2-kitchen` ✅ | `src/assets/art/s2-kitchen-close.webp` (16:9로 잘라서) | 16:9 | 01:52 "방금 찍혔어요." 사진 → 영상 (시즌 2의 최고점) |
| 2 | `s2-opening` | `src/assets/art/booth-shelf.webp` | 9:16 | 시즌 2 첫 화면: 문이 닫히다가 멈춘다 |
| 3 | `s2-window` | `src/assets/art/s2-window.webp` | 9:16 | 엔딩 4 「딸」 배경: 창가에서 기다리는 엄마 |

### s2-kitchen
```
Static, locked-off shot, as if filmed by a phone lying on a chair behind her. Keep the first frame exactly.
The woman at the kitchen table keeps writing with a ballpoint pen in slow, steady, mechanical strokes, her head bowed
at the same slightly wrong angle, as if asleep. The desk lamp flickers once, very faintly. Around second 5 her pen
stops. She stays completely still. Then, very slowly, her head begins to turn to the right, toward the camera. The
clip ends before her face is visible, on the edge of her cheek. No camera movement, no zoom, no cuts. Dark, grainy
old-smartphone video, realistic. Audio: refrigerator hum, the scratch of the pen, a wall clock ticking; the ticking
stops when the pen stops. No music, no voices.
```

### s2-opening
첫 장면은 유리에 비친 얼굴을 지운 사진으로 넣으세요 (`booth-shelf`의 왼쪽 위를 흐리게 덮은 버전). 얼굴이 있으면 Gemini가 거절합니다.
```
Night, rain. A close, static view inside a public phone booth: a smartphone lies on the metal shelf next to the
hanging handset, exactly as in the first frame. Raindrops run down the glass behind it. After a moment the phone
screen lights up with a soft white glow. Then a slow draft of wind pushes the booth's glass door: its dark metal edge
slowly slides into the left side of the frame, stops halfway, and stays there, leaving the door open. Slight handheld
sway, no cuts, no zoom. Grainy old-smartphone video, realistic, quiet and moody. Audio: rain on glass, a long metal
hinge creak that stops abruptly. No music, no voices.
```

### s2-window
```
Locked-off shot. The woman sits by the window at night, exactly as in the first frame, facing the glass, waiting.
Almost nothing moves: far-away city lights flicker, her faint reflection in the window glass. Around second 4 she
slowly lifts her head toward a wall clock off-screen, then looks back out of the window. She never turns toward the
camera. Quiet, still, realistic, grainy phone video. Audio: a wall clock ticking, distant traffic. No music,
no voices.
```

## 7차 — 해상도 개선 & 새 장면 (단일 이미지로 뽑기)

예전 사진 상당수는 여러 장을 한 시트로 뽑아 잘라 쓴 것이라 한 장이 가로 540~860px입니다. 아이폰 화면(3배율)을 꽉 채우려면 1170px 이상이 필요합니다. 특히 **배경화면은 9:19.5 세로 화면에 맞추려고 3:4나 정사각 사진을 2.5~3.5배 확대해서** 흐립니다. 아래는 **한 번에 한 장씩** 세로로 뽑으세요.

새 파일 이름으로 넣으면 그 파일이 우선 쓰이고, 없으면 지금 사진을 그대로 씁니다. 기존 파일은 지우지 마세요(갤러리 사진은 그대로 씁니다).

| 우선 | 파일 이름 | 비율 · 크기 | 대신하는 것 | 참고 이미지 첨부 |
|---|---|---|---|---|
| 1 | `wall-lock` | 세로 (ChatGPT는 2:3 1024×1536까지 — 가운데만 9:19.5로 잘려 쓰임) | 시즌 1 잠금화면 · 첫 화면 (`wallpaper` 706px) | `wallpaper.webp` |
| 1 | `wall-home` | 9:19.5 세로 | 시즌 1 홈 화면 (`life-busstop` 537px) | `life-busstop.webp` |
| 1 | `wall-s2` | 9:19.5 세로 | 시즌 2 잠금·홈 화면 (`miryeong-daughter` 537px) | `miryeong-daughter.webp`, `miryeong-id.webp` |
| 2 | `wall-booth` | 9:19.5 세로 | 3장 재부팅 뒤 바뀐 배경화면 (가로 `booth` 사진을 세로로 잘라 씀) | `booth.webp` |
| 2 | `s2-booth` | 3:2 가로, 1536×1024 이상 | 시즌 2 사진 22:55 "여기 두고 간다" · 엔딩 5 배경 (지금은 시즌 1 부스 사진 재사용) | `booth-shelf.webp` |

### wall-lock
```
Tall portrait image, 2:3 (1024x1536), single image, full frame. It will be cropped to a 9:19.5 phone screen, so keep everything important inside the central 45% of the width. A closed-down 1990s Korean concrete high school at night,
seen from across the street through a broken chain-link gate; three storeys, rows of dark windows, one window on the
third floor faintly lit. A single public phone booth glows by the front gate at the bottom of the frame. Keep the top
40% mostly dark sky and building (the clock sits there). Same place and mood as the attached image.
```

### wall-home
```
Tall portrait image, 2:3 (1024x1536), single image, full frame. It will be cropped to a 9:19.5 phone screen, so keep everything important inside the central 45% of the width. A young Korean woman (early 20s, the woman in the attached photo) and a
young man at a bus stop at golden-hour sunset, both making V signs, candid and happy, slightly blurry phone snapshot,
warm colours. Faces in the middle third of the frame; the bottom quarter is plain pavement (the app dock sits there).
Same two people, same clothes and place as the attached image.
```
(공통 스타일의 "night, harsh flash"는 빼세요. 채원의 평범한 낮 사진입니다.)

### wall-s2
```
Tall portrait image, 2:3 (1024x1536), single image, full frame. It will be cropped to a 9:19.5 phone screen, so keep everything important inside the central 45% of the width. March 1994: a woman of 41 (the woman in the attached ID photo: short
permed bob, thin round glasses, beige knit cardigan over a floral blouse) holding hands with her 11-year-old daughter
in front of a small public library, early spring, soft overcast light, faded 1990s film-photo colours, slight grain.
Faces in the middle third; keep the top 40% calm (building and sky) for the clock.
```
(공통 스타일 대신 `1990s film photograph, faded colours, slight grain`)

### wall-booth
```
Tall portrait image, 2:3 (1024x1536), single image, full frame. It will be cropped to a 9:19.5 phone screen, so keep everything important inside the central 45% of the width. Looking straight down from a third-floor window of an abandoned school
at night onto an empty street: a single lit public phone booth, and inside it a person holding a phone, seen from
above, face not visible. Wet asphalt, one street lamp, everything else dark. The booth sits in the lower-middle of the
frame. Same booth and street as the attached image.
```

### s2-booth
```
Landscape 3:2 photo (1536x1024), single image. The same public phone booth as the attached image, one year later, at night:
the small metal shelf inside is empty and clean. A sun-faded "missing person" flyer taped to the inside of the glass
(its photo and text unreadable, washed out), a small bunch of dried chrysanthemums tied to the door handle with
string, rain spots on the glass, one street lamp. Nobody in the frame.
```

**같은 그림의 짝(귀신 있음·없음)을 다시 뽑을 때**(`stairs`↔`stairs-figure`, `reading-empty`↔`reading-figure`, `life-busstop`↔`life-busstop-ghost`): 먼저 없는 쪽을 뽑고, 그 결과를 첨부해 "같은 사진에서 ○○만 추가해 줘, 나머지는 한 픽셀도 바꾸지 말 것"으로 편집하세요. 구도가 어긋나면 게임에서 바뀌는 순간이 티 납니다.
