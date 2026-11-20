package com.promptbench.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ChatRequest {
    
    @NotNull(message = "세션 ID가 필요합니다")
    private Long sessionId;
    
    @NotBlank(message = "메시지를 입력해주세요")
    private String message;
    
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
