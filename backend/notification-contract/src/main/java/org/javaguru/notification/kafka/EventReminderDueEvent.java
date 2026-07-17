package org.javaguru.notification.kafka;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

/**
 * Событие Kafka: пора отправить напоминание об ивенте за час до начала.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EventReminderDueEvent(
        String eventId,
        String title,
        Instant startsAt,
        String address,
        List<Long> recipientUserIds
) {
}
