---
name: bunjang-cli
description: 번개장터를 CLI로 검색, 상세조회, 찜, 채팅, 대량수집하는 도구를 사용할 때 참고하는 사용 스킬
---

# bunjang-cli Skill

## 목적
`bunjang-cli`를 이용해 번개장터에서 다음 작업을 수행한다.
- 검색
- 가격 필터 / 정렬
- 다페이지 수집
- 상품 상세 / 본문 조회
- 찜 추가 / 제거
- 채팅 목록 조회
- 판매자와 새 채팅 시작
- 기존 채팅방 메시지 전송
- 대량 결과를 JSON 파일로 저장

## 실행 원칙
- README 예시와 동일하게 **항상 `npx bunjang-cli ...` 형식**으로 실행한다.
- 검색 노이즈(광고, 타모델, 액세서리)가 섞일 수 있음을 전제하고, 필요하면 후처리로 정제한다.
- 대량 수집 시에는 `--start-page`, `--pages`, `--max-items`, `--with-detail`, `--output`을 우선 활용한다.
- 실거래 액션(찜, 채팅, 구매 관련)은 로그인 세션이 살아 있는지 먼저 확인한다.

## 기본 명령

### 로그인
```bash
npx bunjang-cli auth login
npx bunjang-cli --json auth status
```

### 검색
```bash
npx bunjang-cli search "갤럭시 s25 울트라"
npx bunjang-cli search "갤럭시 s25 울트라" --price-min 900000 --price-max 1100000
npx bunjang-cli search "갤럭시 s25 울트라" --sort price_asc
```

### 다페이지 수집
```bash
npx bunjang-cli search "갤럭시 s25 울트라" \
  --start-page 1 \
  --pages 30 \
  --max-items 300 \
  --with-detail \
  --concurrency 8 \
  --output artifacts/galaxy-s25-ultra-300-with-detail.json
```

### 상품 상세
```bash
npx bunjang-cli item get 396049093
npx bunjang-cli --json item list --ids 396049093,395641230,394447826
```

### 찜
```bash
npx bunjang-cli favorite add 396049093
npx bunjang-cli favorite remove 396049093
npx bunjang-cli --json favorite list
```

### 채팅
```bash
npx bunjang-cli --json chat list
npx bunjang-cli --json chat start 396049093 --message "안녕하세요"
npx bunjang-cli --json chat send 84191651 --message "상품 상태 괜찮을까요?"
```

### 구매 흐름 확인
```bash
npx bunjang-cli --json purchase prepare 396049093
npx bunjang-cli --json purchase start 396049093
```

## 추천 사용 흐름
1. `auth login`으로 로그인
2. `search`로 후보 수집
3. `item get` 또는 `--with-detail`로 본문 확보
4. 필요 시 AI로 후보 정제 / 랭킹
5. `favorite add`로 저장
6. `chat start` 또는 `chat send`로 판매자 문의

## 주의사항
- UI/DOM 변경에 따라 찜/채팅 동작이 깨질 수 있다.
- 검색 결과의 총 개수와 실제 페이지네이션 가능한 상품 수는 다를 수 있다.
- `chat start`는 상품 페이지에서 새 대화를 여는 용도이고, `chat send`는 기존 threadId가 있을 때 사용한다.
- `purchase start`는 최종 자동 구매확정까지 가지 않도록 설계되어 있다.
