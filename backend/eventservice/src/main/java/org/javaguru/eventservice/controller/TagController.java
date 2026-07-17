package org.javaguru.eventservice.controller;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.javaguru.eventservice.dto.TagResponse;
import org.javaguru.eventservice.service.TagService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API справочника тегов.
 */
@RestController
@RequestMapping("eventservice/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    /**
     * Возвращает все теги.
     *
     * @return список тегов
     */
    @GetMapping
    public List<TagResponse> list() {
        return tagService.listAll();
    }
}
