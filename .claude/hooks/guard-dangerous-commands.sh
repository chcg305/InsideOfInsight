#!/bin/bash

# PreToolUse Hook: 위험한 명령 실행 차단
# 목표: git reset --hard, git clean -fd, rm -rf 등 위험 작업 사전 차단

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# COMMAND_LINE은 Claude Code 시스템에서 제공하는 환경변수
COMMAND="${1:-.}"

# 차단할 명령 패턴 정의
# 형식: "패턴|위험도|설명"
declare -a DANGEROUS_PATTERNS=(
    "git reset --hard|CRITICAL|작업 내용 영구 손실"
    "git clean -fd|CRITICAL|추적되지 않는 모든 파일 삭제"
    "rm -rf|CRITICAL|디렉토리 재귀 삭제"
    "git checkout -- \\.|HIGH|현재 디렉토리 모든 파일 복구"
    "git restore \\.|HIGH|현재 디렉토리 모든 파일 복구"
)

check_dangerous_command() {
    local cmd="$COMMAND"

    # 명령이 비어있으면 패스
    if [ -z "$cmd" ]; then
        return 0
    fi

    # 각 위험 패턴 확인
    for pattern_line in "${DANGEROUS_PATTERNS[@]}"; do
        IFS='|' read -r pattern severity description <<< "$pattern_line"

        # 정규표현식으로 매칭 (경로 무시)
        if [[ "$cmd" =~ $pattern ]]; then
            echo -e "${RED}🚫 위험한 명령 차단${NC}"
            echo ""
            echo "명령: $cmd"
            echo "위험도: $severity"
            echo "이유: $description"
            echo ""
            echo -e "이 명령을 실행하려면 다음을 수행하세요:"
            echo -e "1. Claude Code에서 ${YELLOW}! ${cmd}${NC} 로 실행"
            echo -e "2. 또는 터미널에서 직접 실행"
            echo ""

            # CRITICAL 위험도는 무조건 차단
            if [ "$severity" = "CRITICAL" ]; then
                return 1
            fi

            # HIGH 위험도는 경고만
            if [ "$severity" = "HIGH" ]; then
                echo -e "${YELLOW}⚠️  이 명령으로 미저장된 변경사항이 손실될 수 있습니다.${NC}"
                return 0
            fi
        fi
    done

    return 0
}

# 특수 케이스: 프로젝트 전체 삭제 시도
check_project_deletion() {
    local cmd="$COMMAND"

    # 프로젝트 루트를 삭제하려는 시도
    if [[ "$cmd" =~ rm.*-rf.*/home/ec2-user/cli-camp/ProjectInsight/InsideOfInsight ]]; then
        echo -e "${RED}🚫 프로젝트 전체 삭제 시도 차단${NC}"
        echo ""
        echo "프로젝트를 삭제할 수 없습니다."
        echo "이 작업을 의도한 경우, 터미널에서 직접 실행하세요."
        return 1
    fi
}

# 실행
check_dangerous_command || exit 1
check_project_deletion || exit 1

exit 0
