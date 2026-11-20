package com.promptbench.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prompt_logs")
public class PromptLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String userMessage;
    
    @Column(columnDefinition = "TEXT")
    private String assistantMessage;
    
    private Integer promptTokens;
    private Integer completionTokens;
    private Long responseTimeMs;
    private Double cost;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private boolean isMock = false;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Session getSession() { return session; }
    public void setSession(Session session) { this.session = session; }
    
    public String getUserMessage() { return userMessage; }
    public void setUserMessage(String userMessage) { this.userMessage = userMessage; }
    
    public String getAssistantMessage() { return assistantMessage; }
    public void setAssistantMessage(String assistantMessage) { this.assistantMessage = assistantMessage; }
    
    public Integer getPromptTokens() { return promptTokens; }
    public void setPromptTokens(Integer promptTokens) { this.promptTokens = promptTokens; }
    
    public Integer getCompletionTokens() { return completionTokens; }
    public void setCompletionTokens(Integer completionTokens) { this.completionTokens = completionTokens; }
    
    public Long getResponseTimeMs() { return responseTimeMs; }
    public void setResponseTimeMs(Long responseTimeMs) { this.responseTimeMs = responseTimeMs; }
    
    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public boolean isMock() { return isMock; }
    public void setMock(boolean mock) { isMock = mock; }
    
    public int getTotalTokens() {
        return (promptTokens != null ? promptTokens : 0) + 
               (completionTokens != null ? completionTokens : 0);
    }
}
