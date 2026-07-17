package org.javaguru.eventservice.scheduler;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.javaguru.eventservice.entity.EventEntity;
import org.javaguru.eventservice.kafka.EventNotificationProducer;
import org.javaguru.eventservice.repository.EventParticipantRepository;
import org.javaguru.eventservice.repository.EventRepository;
import org.javaguru.notification.kafka.EventReminderDueEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Планировщик напоминаний об ивентах за час до начала.
 */
@Component
@RequiredArgsConstructor
public class EventReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(EventReminderScheduler.class);

    private final EventRepository eventRepository;
    private final EventParticipantRepository participantRepository;
    private final EventNotificationProducer notificationProducer;

    /**
     * Ищет ивенты, до начала которых остался примерно час, и публикует напоминания.
     */
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void sendDueReminders() {
        Instant now = Instant.now();
        Instant windowStart = now.plus(59, ChronoUnit.MINUTES);
        Instant windowEnd = now.plus(61, ChronoUnit.MINUTES);
        List<EventEntity> dueEvents = eventRepository.findDueForReminder(windowStart, windowEnd);
        for (EventEntity event : dueEvents) {
            List<Long> recipients = participantRepository.findUserIdsByEventId(event.getId());
            if (recipients.isEmpty()) {
                log.warn("Нет участников для напоминания eventId={}", event.getId());
                event.setReminderSentAt(now);
                continue;
            }
            notificationProducer.publishReminderDue(new EventReminderDueEvent(
                    event.getId(),
                    event.getTitle(),
                    event.getStartsAt(),
                    event.getAddress(),
                    recipients
            ));
            event.setReminderSentAt(now);
            log.info("Запланировано напоминание eventId={} recipients={}", event.getId(), recipients.size());
        }
    }
}
