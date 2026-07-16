package org.javaguru.eventservice.repository;

import java.util.List;
import org.javaguru.eventservice.entity.EventEntity;
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
}
