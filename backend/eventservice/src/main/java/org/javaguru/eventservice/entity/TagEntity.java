package org.javaguru.eventservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Тег ивента (справочник).
 */
@Entity
@Table(name = "tags")
@Getter
@Setter
public class TagEntity {

    @Id
    @Column(name = "id", nullable = false, length = 64)
    private String id;

    @Column(name = "label", nullable = false)
    private String label;
}
