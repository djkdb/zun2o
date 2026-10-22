# 외부 스킬 (오픈소스)

스토리 룸(`.claude/agents/story-*.md`)이 쓰는 글쓰기 스킬입니다. 원본을 그대로 가져왔고, 각 폴더에 원본 라이선스(`LICENSE`)를 함께 두었습니다.

| 스킬 | 출처 | 라이선스 | 가져온 커밋 |
|---|---|---|---|
| interactive-fiction, genre-craft, reader-panel, scene-craft, revision-continuity | [danjdewhurst/story-skills](https://github.com/danjdewhurst/story-skills) | MIT | 57121ee |
| fiction-pressure, fiction-plausibility, fiction-gaps, fiction-relationships | [robskidmore/fiction-skills](https://github.com/robskidmore/fiction-skills) | MIT | 321f179 |
| character-sim, reader-sim, story-review | [haowjy/creative-writing-skills](https://github.com/haowjy/creative-writing-skills) | Apache-2.0 | fec5020 |

## 이 게임에서 쓰는 법

- 스킬들은 소설 원고 폴더를 전제로 합니다. 게임 대본을 그 형식으로 뽑으려면 `npm run story:export`를 실행합니다. `story/` 폴더가 생깁니다(커밋하지 않음, 대본을 고칠 때마다 다시 실행).
- story-skills가 언급하는 Story CLI(`story`, `story.js`)는 가져오지 않았습니다. 그 단계는 건너뜁니다.
- 스킬이 "파일을 쓰겠다"고 하는 단계(인물 파일 갱신 등)는 하지 않습니다. 원본은 `src/content`이고, 스토리 룸은 보고서만 씁니다.
- 스킬은 영어로 쓰여 있습니다. 판단 기준으로만 쓰고, 보고서와 대사는 한국어로 씁니다.
