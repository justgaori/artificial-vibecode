# PromptBench - AI 협업 코딩 측정 플랫폼

AI와 협업하여 코딩 문제를 해결하면서 **시간, 토큰, 비용, 프롬프트 횟수**를 자동으로 측정하는 플랫폼입니다.

## 🎯 주요 기능

- **문제 생성**: AI가 요구사항 + 테스트 케이스 + 참조 해답 생성 (자동 검증)
- **AI 채팅 프록시**: 백엔드에서 LLM API 중계, 토큰 사용량 기록
- **세션 측정**: 시작/제출 시각, 프롬프트별 토큰/지연시간 기록
- **코드 채점**: 브라우저 Web Worker에서 JavaScript 코드 안전 실행
- **결과 리포트**: 소요 시간, 총 토큰, 예상 비용, 프롬프트 수, 통과율, 타임라인
- **리더보드**: 같은 문제 기준 효율 순위 (100% 통과자 중 토큰·시간 적은 순)
- **모의 모드**: API 키 없이도 전체 흐름 테스트 가능

## 🚀 실행 방법

### 사전 요구사항
- Java 17 이상
- Gradle 8.x (또는 포함된 Gradle Wrapper 사용)

### 1. 프로젝트 클론 및 이동
```bash
cd promptbench
```

### 2. 환경 설정 (선택)
```bash
cp .env.example .env
# .env 파일을 편집하여 OPENROUTER_API_KEY 설정 (선택)
# API 키가 없으면 자동으로 모의 모드로 실행됩니다
```

### 3. 빌드 및 실행
```bash
# Linux/macOS
./gradlew bootRun

# Windows
gradlew.bat bootRun
```

### 4. 접속
브라우저에서 http://localhost:8080 접속

### 테스트 실행
```bash
./gradlew test
```

## 📊 측정 지표 정의

| 지표 | 정의 | 비고 |
|------|------|------|
| **소요 시간** | 제출 시각 − 시작 시각 | 일시정지 없음 |
| **토큰** | LLM API 응답의 `usage.prompt_tokens` + `usage.completion_tokens` | API에서 반환한 실제 값 |
| **비용** | 토큰 × 모델 단가 | 모델별 단가 테이블 기준 |
| **프롬프트 수** | 사용자가 보낸 메시지 수 | - |
| **통과율** | (통과한 테스트 / 전체 테스트) × 100 | % |

## ⚠️ 측정 범위와 한계

1. **앱 외부 AI 사용 측정 불가**: ChatGPT, Cursor 등 외부 AI 사용은 측정되지 않습니다. "앱 내 AI만 사용" 규칙을 권장합니다.

2. **토크나이저 차이**: 토큰 수는 모델마다 다르므로, 비교는 **같은 모델 기준**으로만 유의미합니다.

3. **응답 지연시간**: 무료 모델은 속도가 불안정하므로 응답 지연시간은 참고 지표로만 사용하세요.

4. **JavaScript만 지원**: 현재 JavaScript 문제만 지원합니다. 채점은 브라우저 Web Worker에서 실행됩니다 (3초 타임아웃).

5. **모의 모드**: API 키가 없으면 모의 모드로 동작합니다. 모의 데이터는 실제 LLM 응답이 아닌 사전 정의된 응답입니다.

## 🏗️ 아키텍처

```
promptbench/
├── src/main/java/com/promptbench/
│   ├── config/          # 설정 (AppConfig)
│   ├── controller/      # REST API 컨트롤러
│   ├── dto/             # 데이터 전송 객체
│   ├── model/           # JPA 엔티티
│   ├── repository/      # Spring Data JPA 레포지토리
│   └── service/         # 비즈니스 로직
├── src/main/resources/
│   ├── static/          # 프론트엔드 (HTML, JS, CSS)
│   └── application.properties
└── src/test/            # 테스트 코드
```

### 기술 스택
- **백엔드**: Spring Boot 3.2, Java 17
- **데이터베이스**: H2 (파일 모드)
- **LLM API**: OpenRouter (OpenAI 호환)
- **프론트엔드**: 순수 HTML/JS/CSS, Monaco Editor
- **채점**: Web Worker (브라우저 샌드박스)

### 주요 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/status` | 모의 모드 여부 확인 |
| GET | `/api/problems` | 문제 목록 조회 |
| POST | `/api/sessions/start` | 세션 시작 |
| POST | `/api/chat` | AI 채팅 (토큰 기록) |
| POST | `/api/submit` | 코드 제출 준비 |
| POST | `/api/grade` | 채점 결과 저장 |
| GET | `/api/sessions/{id}/report` | 결과 리포트 |
| GET | `/api/leaderboard` | 리더보드 |

## 📁 프로젝트 구조

- `Problem`: 코딩 문제 엔티티 (제목, 설명, 테스트 케이스, 참조 해답)
- `Session`: 풀이 세션 엔티티 (사용자, 문제, 시작/제출 시각, 토큰 합계)
- `PromptLog`: 프롬프트 기록 (메시지, 토큰 수, 응답 시간, 비용)

## 🔒 보안 고려사항

- API 키는 `.env` 파일에 저장하고 `.gitignore`에 추가됨
- 코드 실행은 브라우저 Web Worker 샌드박스에서 수행 (3초 타임아웃)
- H2 콘솔은 개발 환경에서만 활성화 (`/h2-console`)

## 📝 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.
