# export-report

퀴즈 결과 리포트를 CSV 파일로 내보냅니다.

## 사용법

```
/export-report
```

## 절차

1. localStorage의 순위 데이터를 읽는다.
2. `quiz/report_detailed.csv` 파일로 내보낸다.
3. 문항별 통계도 포함한다.

## CSV 구조

### 참여자 결과 (report_detailed.csv)

```csv
순위,이름,점수,문제수,모드,등급,참여일시
1,홍길동,100,10,일반,A,2026-11-20 14:30:00
2,김철수,80,10,스피드,B,2026-11-20 15:00:00
```

### 문항별 통계 (questions_stats.csv)

```csv
id,분야,난이도,정답인덱스,criteria유무
1,한국사,초급,0,없음
2,한국사,중급,0,있음
```

## 내보내기 방법

quiz/app.js에 내보내기 함수 추가:

```javascript
function exportToCSV() {
  const ranks = loadRanks()
  const csv = ['순위,이름,점수,문제수,모드,등급,참여일시']
  ranks.forEach((r, i) => {
    csv.push(`${i+1},${r.name},${r.score},${r.total},${r.mode},${getGrade(r)},${formatDate(r.at)}`)
  })
  downloadCSV(csv.join('\n'), 'report_detailed.csv')
}
```

## 출력

내보내기 완료 후 파일 경로와 행 수를 보고한다.
