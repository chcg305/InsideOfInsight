# Hook System — InsideToInsight

Claude Code에서 프로젝트 수정 시 자동으로 실행되는 검증 및 보호 시스템.

---

## Hook 설정

**위치:** `.claude/settings.json`

**Hook 스크립트:** `.claude/hooks/`

---

## PostToolUse Hook: validate-files.sh

**실행 조건:** `Edit`, `Write` 도구 사용 직후

**목적:** 파일 수정 후 기본 무결성 검증

### 검사 항목

1. **JavaScript 문법**
   - 중괄호 `{}` 균형 검사
   - 괄호 `()` 균형 검사
   - 대상: `js/**/*.js` 모든 파일

2. **Git 문제**
   - `git diff --check` 실행
   - Trailing whitespace 감지
   - Conflict marker 감지

3. **중요 파일 존재**
   - `index.html` 존재 & 비어있지 않음
   - `js/app.js` 존재 & 비어있지 않음
   - `css/main.css` 존재 & 비어있지 않음

4. **파일 포맷**
   - CRLF 라인 엔딩 경고 (Unix LF 권장)

### 실행 결과

**성공 시:**
- 조용함 (출력 없음)
- Exit code: 0

**실패 시:**
- 구체적인 오류 메시지 출력
- 파일명, 줄 번호, 이유 포함
- Exit code: 1 (수정 중단)

**경고 시:**
- 작업 계속 가능
- 경고 메시지 출력
- Exit code: 0

### 테스트 결과

✅ **정상 상태 테스트**
```
$ bash .claude/hooks/validate-files.sh
(출력 없음)
$ echo $?
0
```

✅ **오류 감지 테스트**
```
$ rm index.html
$ bash .claude/hooks/validate-files.sh
❌ 파일 검증 실패
  ✗ index.html이 없거나 비어있습니다.
$ echo $?
1
```

---

## PreToolUse Hook: guard-dangerous-commands.sh

**실행 조건:** `Bash` 도구 사용 전

**목적:** 위험한 명령 자동 차단

### 차단되는 명령

| 명령 | 위험도 | 이유 |
|------|--------|------|
| `git reset --hard` | CRITICAL | 작업 내용 영구 손실 |
| `git clean -fd` | CRITICAL | 추적되지 않는 모든 파일 삭제 |
| `rm -rf` | CRITICAL | 디렉토리 재귀 삭제 |
| `git checkout -- .` | HIGH | 현재 디렉토리 모든 파일 복구 |
| `git restore .` | HIGH | 현재 디렉토리 모든 파일 복구 |

### 특수 보호

- **프로젝트 전체 삭제** (`rm -rf /home/ec2-user/cli-camp/ProjectInsight/InsideOfInsight`) — 절대 차단

### 실행 결과

**정상 명령:**
- 통과
- Exit code: 0

**CRITICAL 위험 명령:**
- 자동 차단
- 오류 메시지 출력
- 대안 제시 (터미널 직접 실행)
- Exit code: 1

**HIGH 위험 명령:**
- 경고 출력
- 작업 계속 가능
- Exit code: 0

### 테스트 결과

✅ **정상 명령 테스트**
```
$ bash .claude/hooks/guard-dangerous-commands.sh "git status"
(출력 없음, exit code 0)
```

✅ **위험 명령 차단 테스트**
```
$ bash .claude/hooks/guard-dangerous-commands.sh "git reset --hard"
🚫 위험한 명령 차단
명령: git reset --hard
위험도: CRITICAL
이유: 작업 내용 영구 손실

이 명령을 실행하려면 다음을 수행하세요:
1. Claude Code에서 ! git reset --hard 로 실행
2. 또는 터미널에서 직접 실행

(exit code 1)
```

---

## 정상적인 개발 작업 영향

### ✅ 허용되는 작업

- `git add .` — 파일 스테이징
- `git commit` — 커밋 생성
- `git push` — 푸시
- `git branch` — 브랜치 생성/전환
- `npm install` — 패키지 설치
- `rm <file>` — 개별 파일 삭제 (재귀 아님)
- 모든 일반 개발 명령

### ⚠️ 조건부 차단

- `git checkout -- .` — 경고만 (작업 가능)
- `git restore .` — 경고만 (작업 가능)

### 🚫 차단되는 작업

- `git reset --hard` — 항상 차단
- `git clean -fd` — 항상 차단
- `rm -rf` — 항상 차단

---

## 설정

### settings.json 구조

```json
{
  "hooks": {
    "postToolUse": [
      {
        "tool": ["Edit", "Write"],
        "event": "after",
        "script": ".claude/hooks/validate-files.sh",
        "description": "파일 수정 직후 검증 (JS 문법, git 상태, 파일 무결성)"
      }
    ],
    "preToolUse": [
      {
        "tool": ["Bash"],
        "event": "before",
        "script": ".claude/hooks/guard-dangerous-commands.sh",
        "description": "위험한 명령(git reset, rm -rf 등) 차단"
      }
    ]
  }
}
```

### Hook 호출 방식

**PostToolUse Hook:**
- 파일 수정 도구(Edit/Write) 사용 직후 자동 실행
- 스크립트에 인자 전달: 수정된 파일 경로 (환경변수 또는 표준입력)
- Exit code에 따라 수정 계속 또는 중단

**PreToolUse Hook:**
- Bash 도구 실행 전 자동 실행
- 스크립트에 인자 전달: 실행할 명령어 (첫 번째 인자 또는 환경변수)
- Exit code: 0 = 허용, 1 = 차단

**주의:** 현재 구현은 수동 실행 테스트 기반입니다. Claude Code의 실제 Hook 인터페이스가 위와 다를 수 있습니다.

### Hook 스크립트 경로

- 상대 경로: `.claude/hooks/validate-files.sh`
- 절대 경로: `/home/ec2-user/cli-camp/ProjectInsight/InsideOfInsight/.claude/hooks/validate-files.sh`

---

## 문제 해결

### Hook이 실행되지 않음

1. `settings.json` 경로 확인
2. Hook 스크립트 존재 확인
3. 실행 권한 확인: `chmod +x .claude/hooks/*.sh`

### 거짓 양성 (잘못된 오류 감지)

1. Hook 스크립트 로직 검토
2. 테스트 케이스 추가
3. 필요시 검사 항목 조정

### 위험 명령이 차단되어 정상 작업 불가

**옵션 1:** 터미널에서 직접 실행
```bash
! git reset --hard
```

**옵션 2:** 실제 위험이 없으면 Hook 규칙 조정

---

## 향후 개선

- [ ] Prettier/ESLint 자동 포맷 검사
- [ ] CSS 변경 시 스타일 일관성 검사
- [ ] 데이터 파일 변경 시 스키마 검증
- [ ] 커밋 전 최종 테스트 Hook
- [ ] 성능 메트릭 수집 Hook

---

## 참고

- Hook 설정: `.claude/settings.json`
- Hook 스크립트: `.claude/hooks/`
- 프로젝트 규칙: `.claude/rules/`
- 작업 가이드: `.claude/skills/`
