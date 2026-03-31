
<img width="2752" height="1536" alt="Gemini_Generated_Image_773myd773myd773m" src="https://github.com/user-attachments/assets/433ac5ac-33f2-4086-b7bc-aa435abfabe4" />

 # 번개장터를 **CLI에서 조작**할 수 있도록 만든 실험적 커맨드라인 클라이언트입니다.

검색, 상품 상세 조회, 찜, 채팅, 가격 정렬, 다페이지 수집, 본문 포함 대량 추출까지 지원하며, 이후 AI 에이전트가 이 결과를 읽고 선별/평가/랭킹하는 용도로 사용할 수 있습니다.

---

## 핵심 기능

- 번개장터 로그인 세션 유지
- 검색
- 가격 범위 필터
- 정렬 (`score`, `date`, `price_asc`, `price_desc`)
- 다페이지 수집 (`--start-page`, `--pages`, `--max-items`)
- 상품 상세 / 본문 조회
- 결과를 JSON 파일로 저장
- 찜 추가 / 제거
- 채팅 목록 조회
- 상품 페이지에서 판매자와 새 채팅 시작
- 기존 채팅방에 메시지 전송
- AI 평가용 대량 데이터 수집

---


## 설치

### 요구 사항
- Node.js 22+

기본 실행 형식은 아래와 같습니다.
```bash
npx bunjang-cli --help
```

---

## 로그인

최초 로그인은 headful 브라우저 창을 띄워 직접 진행합니다.

```bash
npx bunjang-cli auth login
```

`auth login`은 **TTY가 붙은 interactive 터미널**에서 실행해야 하며, 브라우저에서 로그인한 뒤 **터미널로 돌아와 Enter를 눌러야** 완료됩니다.  
비-TTY 환경에서는 브라우저만 열리고 로그인 완료 처리가 멈출 수 있습니다.

JSON 출력:
```bash
npx bunjang-cli --json auth login
```

로그인 상태 확인:
```bash
npx bunjang-cli auth status
npx bunjang-cli --json auth status
```

로컬 CLI 세션/브라우저 프로필 초기화(로그아웃):
```bash
npx bunjang-cli auth logout
npx bunjang-cli --json auth logout
```

세션은 기본적으로 아래 경로에 저장됩니다.
```bash
~/.config/bunjang-cli/
```

다른 경로를 쓰고 싶다면:
```bash
BUNJANG_CONFIG_DIR=/custom/path npx bunjang-cli auth status
```

---

## 기본 사용법

```bash
npx bunjang-cli [전역옵션] <명령어>
```

### 전역 옵션
- `--json` : JSON 출력
- `--debug` : 디버그 로그 출력
- `--preferred-transport auto|browser|api` : transport 우선순위 지정

예시:
```bash
npx bunjang-cli --json --preferred-transport browser search "갤럭시 s25 울트라"
```

---

## 검색

### 기본 검색
```bash
npx bunjang-cli search "갤럭시 s25 울트라"
npx bunjang-cli --json search "갤럭시 s25 울트라"
```

### 가격 필터
```bash
npx bunjang-cli search "갤럭시 s25 울트라" \
  --price-min 900000 \
  --price-max 1100000
```

### 정렬
```bash
npx bunjang-cli search "갤럭시 s25 울트라" --sort score
npx bunjang-cli search "갤럭시 s25 울트라" --sort date
npx bunjang-cli search "갤럭시 s25 울트라" --sort price_asc
npx bunjang-cli search "갤럭시 s25 울트라" --sort price_desc
```

### 다페이지 수집
- `--start-page` : 시작 페이지
- `--pages` : 몇 페이지까지 볼지
- `--max-items` : 최대 몇 개까지 수집할지

예시:
```bash
npx bunjang-cli search "25 울트라 미개봉" \
  --start-page 1 \
  --pages 10 \
  --max-items 300 \
  --sort date
```

---

## 상품 상세 / 본문 조회

### 단일 상품 상세
```bash
npx bunjang-cli item get 396049093
npx bunjang-cli --json item get 396049093
```

### 여러 상품 상세 일괄 조회
```bash
npx bunjang-cli item list --ids 396049093,395641230,394447826
npx bunjang-cli --json item list --ids 396049093,395641230,394447826
```

가져오는 정보:
- 제목
- 가격
- 본문 / 설명
- 이미지
- 메타데이터
- transport 정보

---

## 검색 결과를 파일로 저장

### 목록만 저장
```bash
npx bunjang-cli search "갤럭시 s25 울트라" \
  --start-page 1 \
  --pages 30 \
  --max-items 300 \
  --output artifacts/galaxy-s25-ultra-300.json
```

### 모든 상품의 본문까지 포함해 저장
```bash
npx bunjang-cli search "갤럭시 s25 울트라" \
  --start-page 1 \
  --pages 30 \
  --max-items 300 \
  --with-detail \
  --concurrency 8 \
  --output artifacts/galaxy-s25-ultra-300-with-detail.json
```

출력 파일에는 보통 아래 구조가 들어갑니다.
- `summary` : 검색 결과 정보
- `detail` : 본문 포함 상세 정보
- `error` : 상세 추출 실패 시 에러 메시지

---

## 찜

### 찜 추가
```bash
npx bunjang-cli favorite add 396049093
npx bunjang-cli --json favorite add 396049093
```

### 찜 제거
```bash
npx bunjang-cli favorite remove 396049093
npx bunjang-cli --json favorite remove 396049093
```

### 찜 목록 보기
```bash
npx bunjang-cli favorite list
npx bunjang-cli --json favorite list
```

---

## 채팅

### 채팅 목록 보기
```bash
npx bunjang-cli chat list
npx bunjang-cli --json chat list
```

### 상품 페이지에서 판매자와 새 채팅 시작
```bash
npx bunjang-cli chat start 396049093 --message "안녕하세요"
npx bunjang-cli --json chat start 396049093 --message "안녕하세요"
```

### 기존 채팅방 읽기
```bash
npx bunjang-cli chat read 84191651
npx bunjang-cli --json chat read 84191651
```

### 기존 채팅방에 메시지 보내기
```bash
npx bunjang-cli chat send 84191651 --message "상품 상태 괜찮을까요?"
npx bunjang-cli --json chat send 84191651 --message "상품 상태 괜찮을까요?"
```

---

## 구매 관련

### 구매 가능 상태 확인
```bash
npx bunjang-cli purchase prepare 396049093
npx bunjang-cli --json purchase prepare 396049093
```

### 구매 흐름 시작
```bash
npx bunjang-cli purchase start 396049093
npx bunjang-cli --json purchase start 396049093
```

주의:
- 자동 구매확정은 하지 않습니다.
- 의도적으로 **최종 확인 직전 stop-point**에서 멈춥니다.

---

## AI 에이전트용 랭킹

```bash
npx bunjang-cli agent-search-rank "갤럭시 s25 울트라" \
  --price-min 900000 \
  --price-max 1100000 \
  --max-items 20 \
  --sort score
```

JSON:
```bash
npx bunjang-cli --json agent-search-rank "갤럭시 s25 울트라" \
  --price-min 900000 \
  --price-max 1100000 \
  --max-items 20
```

이 명령은:
1. 검색
2. 상세 조회
3. 간단한 휴리스틱 기반 점수화
4. 추천 순위 출력
을 수행합니다.

---

## 실전 예시

### 1. S25 울트라 300개 수집 + 본문 저장
```bash
npx bunjang-cli search "갤럭시 s25 울트라" \
  --start-page 1 \
  --pages 30 \
  --max-items 300 \
  --with-detail \
  --concurrency 8 \
  --output artifacts/galaxy-s25-ultra-300-with-detail.json
```

### 2. S24 울트라 가격 낮은순 수집
```bash
npx bunjang-cli search "갤럭시 s24 울트라" \
  --sort price_asc \
  --start-page 1 \
  --pages 20 \
  --max-items 200 \
  --with-detail \
  --output artifacts/galaxy-s24-ultra-price-asc.json
```

### 3. 특정 상품 찜 후 판매자에게 첫 메시지 보내기
```bash
npx bunjang-cli favorite add 396049093
npx bunjang-cli chat start 396049093 --message "안녕하세요"
```

---

## 현재 확인된 동작 수준

### 비교적 안정적
- 로그인 / 세션 재사용
- 검색
- 가격 필터
- 정렬
- 다페이지 수집
- 상품 상세 / 본문 추출
- 찜 추가 / 제거
- 채팅 목록
- 상품 페이지에서 판매자와 새 채팅 시작
- 기존 채팅방 메시지 전송

### 아직 주의가 필요한 부분
- 번개장터 UI가 바뀌면 selector가 깨질 수 있음
- 검색 결과에는 광고/교환글/액세서리/다른 모델이 많이 섞일 수 있음
- 따라서 **노이즈 제거는 AI 후처리 전제**로 사용하는 것이 좋음
- 일부 매물은 상세 페이지 구조가 달라 파싱 품질이 들쭉날쭉할 수 있음
