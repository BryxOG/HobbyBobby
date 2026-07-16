package org.javaguru.eventservice.repository;

import java.util.List;
import org.javaguru.eventservice.entity.EventParticipantEntity;
import org.javaguru.eventservice.entity.EventParticipantEntity.EventParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Репозиторий участников ивента.
 */
public interface EventParticipantRepository extends JpaRepository<EventParticipantEntity, EventParticipantId> {

    /**
     * Проверяет членство пользователя в ивенте.
     *
     * @param eventId идентификатор ивента
     * @param userId  идентификатор пользователя
     * @return true, если пользователь участник
     */
    boolean existsByIdEventIdAndIdUserId(String eventId, Long userId);

    /**
     * Возвращает идентификаторы всех участников ивента.
     *
     * @param eventId идентификатор ивента
     * @return список user id
     */
    @Query("SELECT p.id.userId FROM EventParticipantEntity p WHERE p.id.eventId = :eventId")
    List<Long> findUserIdsByEventId(@Param("eventId") String eventId);
}
