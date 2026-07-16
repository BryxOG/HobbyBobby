package org.javaguru.eventservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Настройки чата и Kafka.
 */
@ConfigurationProperties(prefix = "app.chat")
public record ChatProperties(String kafkaTopic) {
}
