package org.javaguru.eventservice.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.javaguru.eventservice.entity.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Репозиторий сообщений чата.
 */
public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, UUID> {

    /**
     * Возвращает сообщения чата в хронологическом порядке.
     *
     * @param eventId идентификатор ивента
     * @return список сообщений
     */
    List<ChatMessageEntity> findByEventIdOrderByCreatedAtAsc(String eventId);

    /**
     * Возвращает последнее сообщение чата.
     *
     * @param eventId идентификатор ивента
     * @return последнее сообщение, если есть
     */
    Optional<ChatMessageEntity> findTopByEventIdOrderByCreatedAtDesc(String eventId);

    /**
     * Считает непрочитанные сообщения для пользователя.
     *
     * @param eventId    идентификатор ивента
     * @param userId     идентификатор пользователя
     * @param lastReadAt метка последнего прочтения
     * @return количество непрочитанных
     */
    @Query("""
            SELECT COUNT(m) FROM ChatMessageEntity m
            WHERE m.eventId = :eventId
              AND m.createdAt > :lastReadAt
              AND m.authorId <> :userId
            """)
    long countUnread(
            @Param("eventId") String eventId,
            @Param("userId") Long userId,
            @Param("lastReadAt") java.time.Instant lastReadAt
    );
}
