package org.javaguru.notificationservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Настройки Kafka-топиков уведомлений.
 */
@ConfigurationProperties(prefix = "app.notification")
public record NotificationProperties(
        String reminderTopic,
        String cancelledTopic
) {
}
