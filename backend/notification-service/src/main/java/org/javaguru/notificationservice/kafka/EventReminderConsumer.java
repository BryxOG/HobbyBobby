package org.javaguru.notificationservice.kafka;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.javaguru.notification.kafka.EventReminderDueEvent;
import org.javaguru.notificationservice.service.FcmPushService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumer напоминаний об ивентах за час до начала.
 */
@Component
@RequiredArgsConstructor
public class EventReminderConsumer {

    private static final Logger log = LoggerFactory.getLogger(EventReminderConsumer.class);

    private final FcmPushService fcmPushService;

    /**
     * Обрабатывает событие напоминания и отправляет push.
     *
     * @param event событие из Kafka
     */
    @KafkaListener(
            topics = "${app.notification.reminder-topic}",
            properties = {
                    "spring.json.value.default.type=org.javaguru.notification.kafka.EventReminderDueEvent"
            }
    )
    public void onReminderDue(EventReminderDueEvent event) {
        log.info("Напоминание eventId={} recipients={}", event.eventId(), event.recipientUserIds().size());
        fcmPushService.pushToUsers(
                event.recipientUserIds(),
                "Скоро ивент",
                "Через час: " + event.title(),
                Map.of(
                        "type", "EVENT_REMINDER",
                        "eventId", event.eventId()
                )
        );
    }
}
