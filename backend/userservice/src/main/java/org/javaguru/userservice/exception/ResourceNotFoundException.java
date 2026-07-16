package org.javaguru.userservice.exception;

/**
 * Исключение при отсутствии запрашиваемого ресурса.
 */
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Создаёт исключение с сообщением об ошибке.
     *
     * @param message описание проблемы
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
