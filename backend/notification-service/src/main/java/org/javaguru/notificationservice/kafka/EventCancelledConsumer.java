package org.javaguru.notificationservice.kafka;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.javaguru.notification.kafka.EventCancelledEvent;
import org.javaguru.notificationservice.service.FcmPushService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumer отмены ивента.
 */
@Component
@RequiredArgsConstructor
public class EventCancelledConsumer {

    private static final Logger log = LoggerFactory.getLogger(EventCancelledConsumer.class);

    private final FcmPushService fcmPushService;

    /**
     * Обрабатывает отмену ивента и отправляет push участникам.
     *
     * @param event событие из Kafka
     */
    @KafkaListener(
            topics = "${app.notification.cancelled-topic}",
            properties = {
                    "spring.json.value.default.type=org.javaguru.notification.kafka.EventCancelledEvent"
            }
    )
    public void onEventCancelled(EventCancelledEvent event) {
        log.info("Отмена eventId={} recipients={}", event.eventId(), event.recipientUserIds().size());
        fcmPushService.pushToUsers(
                event.recipientUserIds(),
                "Ивент отменён",
                event.title(),
                Map.of(
                        "type", "EVENT_CANCELLED",
                        "eventId", event.eventId()
                )
        );
    }
}
