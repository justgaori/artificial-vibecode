# quiz-leaderboard

퀴즈의 순위표(리더보드) 기능을 점검합니다.

## 사용법

```
/quiz-leaderboard
```

## 절차

`quiz/app.js`와 `quiz/index.html`에서 순위표 관련 코드를 분석한다.

## 점검 항목

1. **localStorage 키**: 순위 저장에 사용되는 키 이름
2. **저장 구조**: 저장되는 데이터의 형태
3. **정렬 기준**: 점수 내림차순, 동점 시 시간순
4. **표시 개수**: 상위 몇 개까지 표시하는지
5. **UI 요소**: 순위 입력 폼, 목록 표시 영역

## 출력 형식

```
🏆 순위표 분석
━━━━━━━━━━━━━━━━━━━━
저장 키: quiz-rank.v1
최대 저장: 8개
정렬: 점수 내림차순, 동점 시 먼저 등록한 순

저장 구조:
{
  name: String (최대 12자),
  score: Number,
  total: Number (문제 수),
  mode: String,
  at: Number (타임스탬프)
}

UI 요소:
  - #rank-form: 이름 입력 폼
  - #rank-list: 순위 목록
  - #player-name: 이름 입력 필드
```
