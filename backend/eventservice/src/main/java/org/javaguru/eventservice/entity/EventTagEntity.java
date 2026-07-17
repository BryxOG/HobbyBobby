package org.javaguru.eventservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.io.Serializable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

/**
 * Связь ивента и тега (many-to-many).
 */
@Entity
@Table(name = "event_tags")
@Getter
@Setter
public class EventTagEntity {

    @EmbeddedId
    private EventTagId id;

    /**
     * Составной ключ event_tags.
     */
    @Embeddable
    @Getter
    @Setter
    @EqualsAndHashCode
    public static class EventTagId implements Serializable {

        @Column(name = "event_id", nullable = false, length = 64)
        private String eventId;

        @Column(name = "tag_id", nullable = false, length = 64)
        private String tagId;
    }
}
