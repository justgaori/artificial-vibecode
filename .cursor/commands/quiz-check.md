# quiz-check

퀴즈 데이터의 구조적 무결성을 검사합니다.

## 사용법

```
/quiz-check
```

## 절차

`quiz/questions.js`의 `QUIZ_BANK`를 읽어 다음을 검사한다.

## 검사 항목

1. **id 연속성**: id가 1부터 시작해 빠짐없이 연속인지
2. **필수 필드**: 모든 문항에 `id`, `category`, `difficulty`, `question`, `choices`, `answer`, `explanation`이 있는지
3. **choices 배열**: 보기가 정확히 4개인지
4. **answer 범위**: 0 이상 3 이하인지
5. **category 유효성**: history, science, geo, art 중 하나인지
6. **difficulty 유효성**: 초급 또는 중급인지
7. **빈 문자열**: question, choices, explanation에 빈 문자열이 없는지

## 출력 형식

- 오류가 없으면: "✅ 32개 문항, 오류 없음"
- 오류가 있으면: 문항 id와 오류 내용을 목록으로 표시
