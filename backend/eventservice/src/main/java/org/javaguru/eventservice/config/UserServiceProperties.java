package org.javaguru.eventservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Настройки интеграции с UserService.
 */
@ConfigurationProperties(prefix = "app.user-service")
public record UserServiceProperties(String baseUrl) {
}
