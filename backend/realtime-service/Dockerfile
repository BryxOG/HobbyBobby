# syntax=docker/dockerfile:1

FROM eclipse-temurin:25-jdk-alpine AS build

WORKDIR /workspace
COPY chat-contract/ chat-contract/
COPY realtime-service/ realtime-service/

WORKDIR /workspace/realtime-service
RUN --mount=type=cache,target=/root/.gradle \
    chmod +x gradlew && ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:25-jre-alpine

WORKDIR /app
COPY --from=build /workspace/realtime-service/build/libs/*.jar app.jar

EXPOSE 9003
ENTRYPOINT ["java", "-jar", "app.jar"]
