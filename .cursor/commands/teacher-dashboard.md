# teacher-dashboard

선생님용 퀴즈 관리 대시보드 HTML을 생성합니다.

## 사용법

```
/teacher-dashboard
```

## 절차

`quiz/teacher_report.html` 파일을 생성하거나 갱신한다.

## 대시보드 기능

1. **문항 목록**: 모든 문항을 테이블로 표시
2. **분야별 필터**: 한국사, 과학, 지리, 예술과 문화 필터
3. **난이도별 필터**: 초급, 중급 필터
4. **통계 요약**: 분야별, 난이도별, 정답분포 차트
5. **검증 결과**: criteria 없는 최상급 경고 표시

## 생성할 파일 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <title>퀴즈 관리 대시보드</title>
  <!-- 스타일 포함 -->
</head>
<body>
  <header>퀴즈 관리 대시보드</header>
  <section id="stats">통계 요약</section>
  <section id="filters">필터</section>
  <section id="questions">문항 목록</section>
  <script src="questions.js"></script>
  <script>/* 대시보드 로직 */</script>
</body>
</html>
```

## 출력

생성 완료 후 파일 경로와 주요 기능을 보고한다.
