package org.javaguru.eventservice.exception;

/**
 * Конфликт данных (например, дублирование).
 */
public class ConflictException extends RuntimeException {

    /**
     * Создаёт исключение с сообщением.
     *
     * @param message описание ошибки
     */
    public ConflictException(String message) {
        super(message);
    }
}
