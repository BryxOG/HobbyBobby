package org.javaguru.eventservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Метка прочтения чата пользователем.
 */
@Entity
@Table(name = "chat_read_state")
@Getter
@Setter
public class ChatReadStateEntity {

    @EmbeddedId
    private ChatReadStateId id;

    @Column(name = "last_read_at", nullable = false)
    private Instant lastReadAt;

    /**
     * Составной ключ состояния прочтения.
     */
    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class ChatReadStateId implements Serializable {

        @Column(name = "event_id", nullable = false, length = 64)
        private String eventId;

        @Column(name = "user_id", nullable = false)
        private Long userId;
    }
}
