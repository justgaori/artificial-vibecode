# 인공지능활용실습 텀프로젝트

국립목포대학교 인공지능활용실습 과목 실습 결과물 모음입니다.

## 프로젝트 개요

이 프로젝트는 AI 도구(Cursor)를 활용하여 개발한 정적 웹 앱 모음입니다. 빌드 도구 없이 브라우저에서 바로 실행할 수 있습니다.

## 앱 목록

| 앱 | 설명 | 주요 기능 |
|---|---|---|
| [home/](home/) | 시작 페이지 | 시계, Google 검색, 서울 날씨, Hacker News, 간단한 할 일 |
| [portfolio/](portfolio/) | 마케팅 포트폴리오 | 실습용 가상 프리랜서 마케터 포트폴리오 |
| [handwrite/](handwrite/) | 손글씨 숫자 인식 | TensorFlow.js MNIST CNN으로 0-9 숫자 인식 |
| [todolist/](todolist/) | 할 일 관리 | 카테고리, 진행률, 다크모드, 자동 분류, JSON 내보내기 |
| [quiz/](quiz/) | 상식 퀴즈 | 4분야 32문항, 일반/스피드/분야별 모드, 순위, 통계 |
| [laundry/](laundry/) | 세탁실 확인 | 휴먼컴퓨터인터랙션 과목 세탁실 프로토타입 |

## 실행 방법

### 로컬에서 실행

```bash
# 방법 1: Python 사용
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속

# 방법 2: Node.js 사용
npx serve
# 브라우저에서 http://localhost:3000 접속

# 방법 3: VS Code Live Server
# VS Code에서 Live Server 확장 설치 후 index.html 우클릭 → Open with Live Server
```

### 직접 열기

`index.html` 파일을 브라우저에서 직접 열어도 대부분의 기능이 작동합니다.  
단, 날씨/뉴스 API는 CORS 정책으로 인해 로컬 서버에서 실행해야 합니다.

## 기술 스택

- **프론트엔드**: HTML, CSS, JavaScript (순수 바닐라)
- **데이터 저장**: 브라우저 localStorage
- **외부 API**:
  - [Open-Meteo](https://open-meteo.com/) - 날씨 (무료, API 키 불필요)
  - [Hacker News](https://hn.algolia.com/) - 기술 뉴스 (무료, API 키 불필요)
- **AI/ML**: [TensorFlow.js](https://www.tensorflow.org/js) - 손글씨 인식
- **폰트**: Google Fonts (IBM Plex Sans KR, Noto Sans KR, Newsreader)
- **CDN**: jsdelivr (Pretendard 폰트)

## AI 활용 범위

이 프로젝트는 **Cursor AI 에디터**를 사용하여 개발되었습니다.

### AI가 도움을 준 영역

- 초기 코드 구조 생성
- 버그 발견 및 수정 제안
- 퀴즈 문항 검증 규칙 수립
- 리팩토링 및 코드 정리
- 문서 작성 보조

### AI 활용 원칙

1. AI가 생성한 코드는 개발자가 직접 검토하고 테스트합니다.
2. 사실 정보(퀴즈 문항 등)는 출처를 확인하고 `criteria` 필드에 기준을 명시합니다.
3. AI 협업 과정은 [docs/AI_LOG.md](docs/AI_LOG.md)에 기록합니다.

### Cursor 설정

- `.cursor/rules/`: 앱별 개발 규칙 (quiz, handwrite, todolist 등)
- `.cursor/commands/`: 퀴즈 검증용 커스텀 명령어

## 외부 출처 및 크레딧

### 손글씨 인식 (handwrite/)

- **기반**: [InkNet](https://github.com/) 오픈소스 프로젝트
- **라이선스**: MIT
- **학습 데이터**: [MNIST 손글씨 숫자](http://yann.lecun.com/exdb/mnist/)
- **추론 엔진**: TensorFlow.js

### API

- **날씨**: [Open-Meteo](https://open-meteo.com/) - 무료 오픈 API
- **뉴스**: [Hacker News Algolia API](https://hn.algolia.com/api)

### 폰트

- [IBM Plex Sans KR](https://fonts.google.com/specimen/IBM+Plex+Sans+KR) - Google Fonts
- [Noto Sans KR](https://fonts.google.com/noto/specimen/Noto+Sans+KR) - Google Fonts
- [Newsreader](https://fonts.google.com/specimen/Newsreader) - Google Fonts
- [Pretendard](https://github.com/orioncactus/pretendard) - jsdelivr CDN

## 프로젝트 구조

```
├── index.html          # 프로젝트 허브 페이지
├── README.md           # 이 문서
├── .gitignore          # Git 제외 파일
├── .cursor/            # Cursor AI 설정
│   ├── rules/          # 앱별 개발 규칙
│   └── commands/       # 커스텀 명령어
├── docs/               # 문서
│   ├── AI_LOG.md       # AI 협업 기록
│   └── LIMITATIONS.md  # 알려진 한계
├── home/               # 시작 페이지
├── portfolio/          # 마케팅 포트폴리오
├── handwrite/          # 손글씨 인식
├── todolist/           # 할 일 관리
├── quiz/               # 상식 퀴즈
└── laundry/            # 세탁실 프로토타입
```

## 알려진 한계

자세한 내용은 [docs/LIMITATIONS.md](docs/LIMITATIONS.md)를 참조하세요.

### 주요 한계

- 모든 데이터는 브라우저 localStorage에만 저장됩니다 (기기 간 동기화 불가).
- 손글씨 인식은 숫자(0-9) 한 글자만 지원합니다.
- 퀴즈 문항은 32개로 고정되어 있습니다.
- 외부 API(날씨, 뉴스)는 네트워크 연결이 필요합니다.

## 라이선스

이 프로젝트는 학습 목적으로 제작되었습니다.

- 손글씨 인식 모듈: MIT 라이선스 (InkNet 기반)
- 나머지 코드: 자유롭게 참고 가능

## 연락처

- **작성자**: 김가온
- **과목**: 인공지능활용실습
- **학교**: 국립목포대학교
