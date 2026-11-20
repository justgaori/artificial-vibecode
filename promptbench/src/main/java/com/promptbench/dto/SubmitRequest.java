package com.promptbench.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SubmitRequest {
    
    @NotNull(message = "세션 ID가 필요합니다")
    private Long sessionId;
    
    @NotBlank(message = "코드를 입력해주세요")
    private String code;
    
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
