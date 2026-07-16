package org.javaguru.eventservice.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.javaguru.eventservice.dto.TagResponse;
import org.javaguru.eventservice.entity.TagEntity;
import org.javaguru.eventservice.mapper.EventMapper;
import org.javaguru.eventservice.repository.TagRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Справочник тегов ивентов.
 */
@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final EventMapper eventMapper;

    /**
     * Возвращает все теги.
     *
     * @return список тегов
     */
    @Transactional(readOnly = true)
    public List<TagResponse> listAll() {
        return tagRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Преобразует сущность в DTO.
     *
     * @param entity тег
     * @return DTO
     */
    private TagResponse toResponse(TagEntity entity) {
        return eventMapper.toTag(entity.getId(), entity.getLabel());
    }
}
