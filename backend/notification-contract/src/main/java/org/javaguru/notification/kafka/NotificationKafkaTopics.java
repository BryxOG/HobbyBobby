package org.javaguru.notification.kafka;

/**
 * Имена Kafka-топиков для push-уведомлений об ивентах.
 */
public final class NotificationKafkaTopics {

    /** Напоминание участникам за час до начала ивента. */
    public static final String EVENT_REMINDER_DUE = "event.reminder.due";

    /** Ивент отменён организатором. */
    public static final String EVENT_CANCELLED = "event.cancelled";

    private NotificationKafkaTopics() {
    }
}
