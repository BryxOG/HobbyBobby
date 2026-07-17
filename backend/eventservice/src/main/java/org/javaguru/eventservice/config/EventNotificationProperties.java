package org.javaguru.eventservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Настройки Kafka-топиков уведомлений об ивентах.
 */
@ConfigurationProperties(prefix = "app.notification")
public record EventNotificationProperties(
        String reminderTopic,
        String cancelledTopic
) {
}
