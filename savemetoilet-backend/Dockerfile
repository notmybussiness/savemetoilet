# Java 17 기반 이미지 (Fly.io 최적화)
FROM openjdk:17-jdk-slim

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 업데이트 및 필요한 도구 설치
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 소스코드 복사
COPY SimpleApiTest.java .

# Java 컴파일
RUN javac SimpleApiTest.java

# 비루트 사용자 생성 (보안)
RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup
USER appuser

# 포트 노출 (Fly.io 기본)
EXPOSE 8080

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/test/health || exit 1

# 애플리케이션 실행
CMD ["java", "SimpleApiTest"]