package org.javaguru.eventservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Участник ивента — даёт доступ к чату.
 */
@Entity
@Table(name = "event_participants")
@Getter
@Setter
@NoArgsConstructor
public class EventParticipantEntity {

    @EmbeddedId
    private EventParticipantId id;

    /**
     * Составной ключ участника ивента.
     */
    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class EventParticipantId implements Serializable {

        @Column(name = "event_id", nullable = false, length = 64)
        private String eventId;

        @Column(name = "user_id", nullable = false)
        private Long userId;
    }
}
