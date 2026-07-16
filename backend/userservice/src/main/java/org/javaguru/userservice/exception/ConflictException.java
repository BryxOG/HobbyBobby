package org.javaguru.userservice.exception;

/**
 * Исключение при конфликте бизнес-правил (например, дублирование email).
 */
public class ConflictException extends RuntimeException {

    /**
     * Создаёт исключение с сообщением об ошибке.
     *
     * @param message описание проблемы
     */
    public ConflictException(String message) {
        super(message);
    }
}
