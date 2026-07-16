package org.javaguru.eventservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Ивент, для которого существует групповой чат.
 */
@Entity
@Table(name = "events")
@Getter
@Setter
public class EventEntity {

    @Id
    @Column(name = "id", nullable = false, length = 64)
    private String id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "activity_id", nullable = false, length = 64)
    private String activityId;

    @Column(name = "organizer_id", nullable = false)
    private Long organizerId;
}
