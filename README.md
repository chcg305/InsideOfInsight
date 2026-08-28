# InsideToInsight — Local Mac Demo (Revised)

## 실행
- `index.html`을 더블클릭해 실행합니다.
- 별도 서버, Node.js, npm, AWS가 필요하지 않습니다.

## 구조
- `index.html`: 화면 골격과 모달
- `css/main.css`: 스타일 전체
- `js/app.js`: 앱 상태 연결 및 이벤트
- `js/state.js`: localStorage 상태 관리/마이그레이션
- `js/utils.js`: 공통 유틸리티
- `js/features/render.js`: 마인드맵 외 카드/타임라인/상세 렌더링
- `js/features/mindmap.js`: 마인드맵 렌더링
- `js/features/insight.js`: Insight 프롬프트 생성
- `js/data/example-data.js`: 7개 카테고리 × 10개 = 70개 장문 데모 기록

## 데이터 구조
각 다이어리는 다음 필드를 가집니다.
`category`, `title`, `label`, `content`, `date`, `createdAt`

Insight 프롬프트에는 카테고리뿐 아니라 **세부라벨(title)과 주제 라벨(label)**도 모두 전달됩니다.

## AWS 배포 아키텍처

AWS에 배포하기 위한 아키텍처 설계는 `docs/architecture.md`에 작성되어 있습니다.

- **배포 환경**: AWS S3 + CloudFront
- **리전**: us-east-1
- **구조**: 정적 웹사이트 호스팅 (Backend/DB 없음)
- **특징**: 최소 복잡성, 최소 비용 MVP

자세한 내용은 [AWS 배포 아키텍처](./docs/architecture.md)를 참고하세요.

## 주의
예제 인물은 가상의 인물이며, 제공된 기록의 범위를 벗어나는 구체적인 개인정보를 새로 만들지 않고 서술형으로 확장한 데모 데이터입니다.
