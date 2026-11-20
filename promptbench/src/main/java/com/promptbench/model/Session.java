package com.promptbench.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sessions")
public class Session {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String username;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;
    
    @Column(nullable = false)
    private LocalDateTime startedAt;
    
    private LocalDateTime submittedAt;
    
    @Column(columnDefinition = "TEXT")
    private String submittedCode;
    
    private Integer totalPromptTokens = 0;
    private Integer totalCompletionTokens = 0;
    private Integer promptCount = 0;
    
    private Double passRate;
    private Integer passedTests;
    private Integer totalTests;
    
    @Column(nullable = false)
    private boolean completed = false;
    
    @Column(nullable = false)
    private boolean isMockSession = false;
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<PromptLog> promptLogs = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public Problem getProblem() { return problem; }
    public void setProblem(Problem problem) { this.problem = problem; }
    
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    
    public String getSubmittedCode() { return submittedCode; }
    public void setSubmittedCode(String submittedCode) { this.submittedCode = submittedCode; }
    
    public Integer getTotalPromptTokens() { return totalPromptTokens; }
    public void setTotalPromptTokens(Integer totalPromptTokens) { this.totalPromptTokens = totalPromptTokens; }
    
    public Integer getTotalCompletionTokens() { return totalCompletionTokens; }
    public void setTotalCompletionTokens(Integer totalCompletionTokens) { this.totalCompletionTokens = totalCompletionTokens; }
    
    public Integer getPromptCount() { return promptCount; }
    public void setPromptCount(Integer promptCount) { this.promptCount = promptCount; }
    
    public Double getPassRate() { return passRate; }
    public void setPassRate(Double passRate) { this.passRate = passRate; }
    
    public Integer getPassedTests() { return passedTests; }
    public void setPassedTests(Integer passedTests) { this.passedTests = passedTests; }
    
    public Integer getTotalTests() { return totalTests; }
    public void setTotalTests(Integer totalTests) { this.totalTests = totalTests; }
    
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    
    public boolean isMockSession() { return isMockSession; }
    public void setMockSession(boolean mockSession) { isMockSession = mockSession; }
    
    public List<PromptLog> getPromptLogs() { return promptLogs; }
    public void setPromptLogs(List<PromptLog> promptLogs) { this.promptLogs = promptLogs; }
    
    public void addPromptLog(PromptLog log) {
        promptLogs.add(log);
        log.setSession(this);
    }
    
    public int getTotalTokens() {
        return (totalPromptTokens != null ? totalPromptTokens : 0) + 
               (totalCompletionTokens != null ? totalCompletionTokens : 0);
    }
}
