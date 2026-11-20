package com.promptbench.dto;

public class ChatResponse {
    
    private String message;
    private Integer promptTokens;
    private Integer completionTokens;
    private Long responseTimeMs;
    private Double cost;
    private boolean isMock;
    private Integer totalSessionTokens;
    private Integer promptCount;
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public Integer getPromptTokens() { return promptTokens; }
    public void setPromptTokens(Integer promptTokens) { this.promptTokens = promptTokens; }
    
    public Integer getCompletionTokens() { return completionTokens; }
    public void setCompletionTokens(Integer completionTokens) { this.completionTokens = completionTokens; }
    
    public Long getResponseTimeMs() { return responseTimeMs; }
    public void setResponseTimeMs(Long responseTimeMs) { this.responseTimeMs = responseTimeMs; }
    
    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }
    
    public boolean isMock() { return isMock; }
    public void setMock(boolean mock) { isMock = mock; }
    
    public Integer getTotalSessionTokens() { return totalSessionTokens; }
    public void setTotalSessionTokens(Integer totalSessionTokens) { this.totalSessionTokens = totalSessionTokens; }
    
    public Integer getPromptCount() { return promptCount; }
    public void setPromptCount(Integer promptCount) { this.promptCount = promptCount; }
}
