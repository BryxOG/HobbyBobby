package org.javaguru.eventservice.repository;

import java.util.Collection;
import java.util.List;
import org.javaguru.eventservice.entity.EventTagEntity;
import org.javaguru.eventservice.entity.EventTagEntity.EventTagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Репозиторий связей ивент ↔ тег.
 */
public interface EventTagRepository extends JpaRepository<EventTagEntity, EventTagId> {

    /**
     * Возвращает теги для списка ивентов.
     *
     * @param eventIds идентификаторы ивентов
     * @return связи event_tags
     */
    @Query("SELECT et FROM EventTagEntity et WHERE et.id.eventId IN :eventIds")
    List<EventTagEntity> findByEventIds(@Param("eventIds") Collection<String> eventIds);

    /**
     * Удаляет все теги ивента.
     *
     * @param eventId идентификатор ивента
     */
    void deleteByIdEventId(String eventId);
}
