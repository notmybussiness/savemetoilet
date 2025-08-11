# Java 17 기반 이미지
FROM openjdk:17-jdk-slim

# 작업 디렉토리 설정
WORKDIR /app

# 소스코드 복사
COPY SimpleApiTest.java .

# Java 컴파일 및 실행
RUN javac SimpleApiTest.java

# 포트 노출
EXPOSE 8080

# 애플리케이션 실행
CMD ["java", "SimpleApiTest"]