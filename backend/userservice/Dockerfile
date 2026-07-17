# syntax=docker/dockerfile:1

FROM eclipse-temurin:25-jdk-alpine AS build

WORKDIR /workspace
COPY userservice/ userservice/

WORKDIR /workspace/userservice
RUN --mount=type=cache,target=/root/.gradle \
    chmod +x gradlew && ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:25-jre-alpine

WORKDIR /app
COPY --from=build /workspace/userservice/build/libs/*.jar app.jar

EXPOSE 9002
ENTRYPOINT ["java", "-jar", "app.jar"]
