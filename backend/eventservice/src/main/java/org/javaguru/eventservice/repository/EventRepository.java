package org.javaguru.eventservice.repository;

import java.time.Instant;
import java.util.List;
import org.javaguru.eventservice.entity.EventEntity;
import org.javaguru.eventservice.entity.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Репозиторий ивентов.
 */
public interface EventRepository extends JpaRepository<EventEntity, String> {

    /**
     * Возвращает ивенты, где пользователь — организатор или участник.
     *
     * @param userId идентификатор пользователя
     * @return список ивентов
     */
    @Query("""
            SELECT DISTINCT e FROM EventEntity e
            LEFT JOIN EventParticipantEntity p ON p.id.eventId = e.id
            WHERE e.organizerId = :userId OR p.id.userId = :userId
            """)
    List<EventEntity> findAccessibleByUserId(@Param("userId") Long userId);

    /**
     * Возвращает ивенты, которые организует пользователь.
     *
     * @param userId идентификатор пользователя
     * @return список ивентов
     */
    List<EventEntity> findByOrganizerIdOrderByStartsAtAsc(Long userId);

    /**
     * Возвращает все ивенты, отсортированные по дате начала.
     *
     * @return список ивентов
     */
    List<EventEntity> findAllByOrderByStartsAtAsc();

    /**
     * Возвращает активные ивенты, для которых пора отправить напоминание.
     *
     * @param windowStart нижняя граница startsAt (now + 59 мин)
     * @param windowEnd   верхняя граница startsAt (now + 61 мин)
     * @return ивенты без отправленного напоминания
     */
    @Query("""
            SELECT e FROM EventEntity e
            WHERE e.status = org.javaguru.eventservice.entity.EventStatus.ACTIVE
              AND e.reminderSentAt IS NULL
              AND e.startsAt >= :windowStart
              AND e.startsAt <= :windowEnd
            """)
    List<EventEntity> findDueForReminder(
            @Param("windowStart") Instant windowStart,
            @Param("windowEnd") Instant windowEnd
    );
}
