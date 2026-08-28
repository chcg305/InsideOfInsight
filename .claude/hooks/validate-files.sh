#!/bin/bash

# PostToolUse Hook: 파일 수정 직후 기본 검증
# 목표: JavaScript 문법 오류, git 문제, 파일 무결성 확인

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ERRORS=""
WARNINGS=""

# 색상 정의
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# 1. JavaScript 문법 검사 (js/ 파일만 검사)
check_js_syntax() {
    # Hook 호출 시 수정된 파일이 js/로 시작하지 않으면 스킵
    # (예: .claude/rules/ 수정 시 js 검사 불필요)
    if [ ! -z "$1" ] && [[ ! "$1" =~ ^js/ ]]; then
        return 0
    fi

    # js/ 디렉토리의 모든 .js 파일 검사
    local js_errors=""
    while IFS= read -r -d '' file; do
        # 기본 문법 체크: 중괄호 균형, 괄호 균형 확인
        local open_braces=$(grep -o '{' "$file" | wc -l)
        local close_braces=$(grep -o '}' "$file" | wc -l)
        local open_parens=$(grep -o '(' "$file" | wc -l)
        local close_parens=$(grep -o ')' "$file" | wc -l)

        if [ "$open_braces" -ne "$close_braces" ]; then
            js_errors+="  ✗ $file: 중괄호 불균형 ({ $open_braces vs } $close_braces)\n"
        fi

        if [ "$open_parens" -ne "$close_parens" ]; then
            js_errors+="  ✗ $file: 괄호 불균형 (( $open_parens vs ) $close_parens)\n"
        fi
    done < <(find "$PROJECT_ROOT/js" -name "*.js" -type f -print0 2>/dev/null)

    if [ -n "$js_errors" ]; then
        ERRORS+=$(printf "JavaScript 문법 오류:\n$js_errors\n")
    fi
}

# 2. git diff --check (trailing whitespace, conflict markers)
check_git_status() {
    if ! git -C "$PROJECT_ROOT" rev-parse --git-dir > /dev/null 2>&1; then
        return 0
    fi

    local git_issues=$(cd "$PROJECT_ROOT" && git diff --check 2>/dev/null)
    if [ -n "$git_issues" ]; then
        WARNINGS+=$(printf "Git 검사 경고:\n$git_issues\n")
    fi
}

# 3. 중요 파일 무결성 확인
check_file_integrity() {
    # index.html이 존재하고 비어있지 않은지
    if [ ! -f "$PROJECT_ROOT/index.html" ] || [ ! -s "$PROJECT_ROOT/index.html" ]; then
        ERRORS+="  ✗ index.html이 없거나 비어있습니다.\n"
    fi

    # js/app.js 존재 확인
    if [ ! -f "$PROJECT_ROOT/js/app.js" ] || [ ! -s "$PROJECT_ROOT/js/app.js" ]; then
        ERRORS+="  ✗ js/app.js가 없거나 비어있습니다.\n"
    fi

    # CSS 존재 확인
    if [ ! -f "$PROJECT_ROOT/css/main.css" ] || [ ! -s "$PROJECT_ROOT/css/main.css" ]; then
        ERRORS+="  ✗ css/main.css가 없거나 비어있습니다.\n"
    fi
}

# 4. 파일 인코딩 및 라인 엔딩 확인
check_file_format() {
    # .js 파일의 라인 엔딩 확인
    while IFS= read -r -d '' file; do
        if file "$file" | grep -q "CRLF"; then
            WARNINGS+="  ⚠ $file: CRLF 라인 엔딩 감지 (Unix LF 권장)\n"
        fi
    done < <(find "$PROJECT_ROOT/js" -name "*.js" -type f -print0)
}

# 실행
check_js_syntax
check_git_status
check_file_integrity
check_file_format

# 결과 출력
if [ -n "$ERRORS" ]; then
    echo -e "${RED}❌ 파일 검증 실패${NC}"
    echo -e "$ERRORS"
    exit 1
fi

if [ -n "$WARNINGS" ]; then
    echo -e "${YELLOW}⚠️  경고${NC}"
    echo -e "$WARNINGS"
fi

exit 0
