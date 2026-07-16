package org.javaguru.userservice.controller;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.javaguru.userservice.dto.InterestRequest;
import org.javaguru.userservice.dto.InterestResponse;
import org.javaguru.userservice.service.InterestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * REST API для управления интересами.
 */
@RestController
@RequestMapping("/api/interests")
@RequiredArgsConstructor
public class InterestController {

    private final InterestService interestService;

    /**
     * Возвращает список всех интересов.
     *
     * @return список интересов
     */
    @GetMapping
    public List<InterestResponse> findAll() {
        return interestService.findAll();
    }

    /**
     * Возвращает интерес по идентификатору.
     *
     * @param id идентификатор интереса
     * @return данные интереса
     */
    @GetMapping("/{id}")
    public InterestResponse findById(@PathVariable Long id) {
        return interestService.findById(id);
    }

    /**
     * Создаёт новый интерес.
     *
     * @param request входные данные
     * @return созданный интерес
     */
    @PostMapping
    public ResponseEntity<InterestResponse> create(@Valid @RequestBody InterestRequest request) {
        InterestResponse created = interestService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    /**
     * Обновляет существующий интерес.
     *
     * @param id      идентификатор интереса
     * @param request входные данные
     * @return обновлённые данные
     */
    @PutMapping("/{id}")
    public InterestResponse update(@PathVariable Long id, @Valid @RequestBody InterestRequest request) {
        return interestService.update(id, request);
    }

    /**
     * Удаляет интерес.
     *
     * @param id идентификатор интереса
     * @return пустой ответ 204
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        interestService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
