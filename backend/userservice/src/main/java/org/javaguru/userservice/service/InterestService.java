package org.javaguru.userservice.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.javaguru.userservice.dto.InterestRequest;
import org.javaguru.userservice.dto.InterestResponse;
import org.javaguru.userservice.entity.Interest;
import org.javaguru.userservice.exception.ResourceNotFoundException;
import org.javaguru.userservice.mapper.InterestMapper;
import org.javaguru.userservice.repository.InterestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Сервис CRUD-операций над интересами.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InterestService {

    private final InterestRepository interestRepository;
    private final InterestMapper interestMapper;

    /**
     * Возвращает все интересы.
     *
     * @return список интересов
     */
    public List<InterestResponse> findAll() {
        return interestRepository.findAll().stream()
                .map(interestMapper::toResponse)
                .toList();
    }

    /**
     * Возвращает интерес по идентификатору.
     *
     * @param id идентификатор интереса
     * @return данные интереса
     */
    public InterestResponse findById(Long id) {
        return interestMapper.toResponse(getInterestOrThrow(id));
    }

    /**
     * Создаёт новый интерес.
     *
     * @param request входные данные
     * @return созданный интерес
     */
    @Transactional
    public InterestResponse create(InterestRequest request) {
        Interest saved = interestRepository.save(interestMapper.toEntity(request));
        return interestMapper.toResponse(saved);
    }

    /**
     * Обновляет существующий интерес.
     *
     * @param id      идентификатор интереса
     * @param request входные данные
     * @return обновлённые данные
     */
    @Transactional
    public InterestResponse update(Long id, InterestRequest request) {
        Interest interest = getInterestOrThrow(id);
        interestMapper.updateEntity(interest, request);
        return interestMapper.toResponse(interest);
    }

    /**
     * Удаляет интерес по идентификатору.
     *
     * @param id идентификатор интереса
     */
    @Transactional
    public void delete(Long id) {
        Interest interest = getInterestOrThrow(id);
        interestRepository.delete(interest);
    }

    /**
     * Загружает интерес или выбрасывает исключение, если не найден.
     *
     * @param id идентификатор интереса
     * @return сущность интереса
     */
    private Interest getInterestOrThrow(Long id) {
        return interestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Интерес с id=" + id + " не найден"));
    }
}
