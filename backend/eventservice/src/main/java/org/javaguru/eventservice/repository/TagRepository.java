package org.javaguru.eventservice.repository;

import org.javaguru.eventservice.entity.TagEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Репозиторий справочника тегов.
 */
public interface TagRepository extends JpaRepository<TagEntity, String> {
}
