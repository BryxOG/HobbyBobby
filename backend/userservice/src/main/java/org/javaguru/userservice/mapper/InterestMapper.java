package org.javaguru.userservice.mapper;

import org.javaguru.userservice.dto.InterestRequest;
import org.javaguru.userservice.dto.InterestResponse;
import org.javaguru.userservice.entity.Interest;
import org.springframework.stereotype.Component;

/**
 * Преобразование сущностей интереса в DTO и обратно.
 */
@Component
public class InterestMapper {

    /**
     * Создаёт новую сущность интереса из запроса.
     *
     * @param request входные данные
     * @return сущность без идентификатора
     */
    public Interest toEntity(InterestRequest request) {
        return Interest.builder()
                .name(request.name())
                .image(request.image())
                .description(request.description())
                .tag(request.tag())
                .build();
    }

    /**
     * Обновляет существующую сущность данными из запроса.
     *
     * @param interest сущность для обновления
     * @param request  входные данные
     */
    public void updateEntity(Interest interest, InterestRequest request) {
        interest.setName(request.name());
        interest.setImage(request.image());
        interest.setDescription(request.description());
        interest.setTag(request.tag());
    }

    /**
     * Преобразует сущность в ответ API.
     *
     * @param interest сущность интереса
     * @return DTO ответа
     */
    public InterestResponse toResponse(Interest interest) {
        return new InterestResponse(
                interest.getId(),
                interest.getName(),
                interest.getImage(),
                interest.getDescription(),
                interest.getTag()
        );
    }
}
