package org.javaguru.eventservice.repository;

import org.javaguru.eventservice.entity.ChatReadStateEntity;
import org.javaguru.eventservice.entity.ChatReadStateEntity.ChatReadStateId;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Репозиторий состояния прочтения чатов.
 */
public interface ChatReadStateRepository extends JpaRepository<ChatReadStateEntity, ChatReadStateId> {
}
