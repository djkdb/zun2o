이 폴더에 이미지를 넣으면 해당 장면의 SVG 그림 대신 사진이 쓰입니다.
파일 이름 = 슬롯 이름 (확장자 jpg / png / webp / avif). 목록과 생성 프롬프트는 저장소 루트의 ART_PROMPTS.md 참고.

현재 들어 있는 12장은 제작자가 ChatGPT 이미지 생성으로 만든 데모 시트(4×3)를 잘라 번호를 지우고 2배 확대한 것입니다.

2차 시트(배경·건물 12장: wallpaper, annex-gate, lobby, stairs, stairs-figure, corridor, reading-empty, reading-figure, room02-door, room02, black-empty, tower)도 같은 방식으로 잘라 2배 확대했습니다. 게임 안에서는 세로 사진 그대로(420×560) 보여 줍니다.

3차 시트(엔딩 배경 3장, 오래 들여다본 부스 사진, 02:00 내 카메라, 도현·엄마·채원 프로필)도 같은 방식으로 넣었습니다. 프로필은 256px 정사각형.

`selfie-alone`은 따로 생성한 것이 아니라 `selfie-far`의 오른쪽(채원 얼굴 부분)만 잘라 420×560으로 맞춘 것입니다. 숨김 앨범 마지막 사진이 점프스케어 전까지 이 사진으로 보이고, 스케어가 끝나면 `selfie-close`로 바뀝니다.

`avatar-unknown`(발신자 정보 없음 프로필)은 제작자가 따로 생성한 1254px 이미지를 머리·어깨 중심으로 잘라 256px로 줄였습니다.

4차 시트(학교 배경 9장: wallpaper, annex-gate, lobby, stairs, stairs-figure, corridor, reading-empty, reading-figure, room02-door)는
무대가 폐교된 해원고등학교로 바뀌면서 제작자가 새로 생성한 3×3 시트를 잘라 2배 확대했습니다. 오래 보면 바뀌는 짝(stairs ↔ stairs-figure,
reading-empty ↔ reading-figure)은 두 칸의 어긋남을 계산해 같은 크기·같은 위치로 잘라, 바뀔 때 화면이 튀지 않습니다.

5차 시트(`index-card`, `floorplan`)는 제작자가 생성한 1×2 시트를 잘라 그대로 썼습니다. 둘 다 **글자 없는 사진**이고,
방문자 카드의 타자 글씨와 평면도의 방 이름(제2서고·현위치 등)은 `phonePhotos.tsx`가 그 위에 얹습니다.

6차 시트(`life-cafe`, `life-desk`, `life-cake`, `life-busstop`)는 채원의 평범한 날(9월 24~26일). 2×2 시트를 잘라 그대로 썼고,
밤 사진과 달리 색 보정 필터를 걸지 않습니다. `life-busstop`은 홈 화면 배경화면으로도 쓰입니다.

7차 시트: `miryeong-id`(1994년 실종 신고서의 서미령 증명사진 — 기록 003), `miryeong-daughter`(서미령과 11살 딸 — 진엔딩 “엄마 왔어”),
`chair-coat` / `chair-empty`(같은 열람실 의자, 외투 있음/없음 — 엔딩 2 / 진엔딩).

`life-busstop-ghost`: `life-busstop`과 같은 사진에서 왼쪽 정류장 유리에 희미한 여자 형체만 더한 변형(제작자 생성, 원본 크기로 맞춤).
4장 이전에 그 사진을 본 적이 있으면, 4장에 다시 열 때 이 사진으로 바뀐다.
