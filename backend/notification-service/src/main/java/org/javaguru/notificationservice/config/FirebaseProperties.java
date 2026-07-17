package org.javaguru.notificationservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Настройки Firebase Admin SDK.
 */
@ConfigurationProperties(prefix = "app.firebase")
public record FirebaseProperties(
        boolean enabled,
        String serviceAccountPath,
        String serviceAccountJson
) {
}
