package com.promptbench.dto;

import java.time.LocalDateTime;
import java.util.List;

public class SessionReport {
    
    private Long sessionId;
    private String username;
    private String problemTitle;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private long elapsedTimeSeconds;
    private int totalPromptTokens;
    private int totalCompletionTokens;
    private int totalTokens;
    private int promptCount;
    private double estimatedCost;
    private double passRate;
    private int passedTests;
    private int totalTests;
    private boolean isMockSession;
    private List<PromptTimeline> timeline;
    private GradeResult gradeResult;
    
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getProblemTitle() { return problemTitle; }
    public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }
    
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    
    public long getElapsedTimeSeconds() { return elapsedTimeSeconds; }
    public void setElapsedTimeSeconds(long elapsedTimeSeconds) { this.elapsedTimeSeconds = elapsedTimeSeconds; }
    
    public int getTotalPromptTokens() { return totalPromptTokens; }
    public void setTotalPromptTokens(int totalPromptTokens) { this.totalPromptTokens = totalPromptTokens; }
    
    public int getTotalCompletionTokens() { return totalCompletionTokens; }
    public void setTotalCompletionTokens(int totalCompletionTokens) { this.totalCompletionTokens = totalCompletionTokens; }
    
    public int getTotalTokens() { return totalTokens; }
    public void setTotalTokens(int totalTokens) { this.totalTokens = totalTokens; }
    
    public int getPromptCount() { return promptCount; }
    public void setPromptCount(int promptCount) { this.promptCount = promptCount; }
    
    public double getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(double estimatedCost) { this.estimatedCost = estimatedCost; }
    
    public double getPassRate() { return passRate; }
    public void setPassRate(double passRate) { this.passRate = passRate; }
    
    public int getPassedTests() { return passedTests; }
    public void setPassedTests(int passedTests) { this.passedTests = passedTests; }
    
    public int getTotalTests() { return totalTests; }
    public void setTotalTests(int totalTests) { this.totalTests = totalTests; }
    
    public boolean isMockSession() { return isMockSession; }
    public void setMockSession(boolean mockSession) { isMockSession = mockSession; }
    
    public List<PromptTimeline> getTimeline() { return timeline; }
    public void setTimeline(List<PromptTimeline> timeline) { this.timeline = timeline; }
    
    public GradeResult getGradeResult() { return gradeResult; }
    public void setGradeResult(GradeResult gradeResult) { this.gradeResult = gradeResult; }
    
    public static class PromptTimeline {
        private int index;
        private long elapsedSeconds;
        private int promptTokens;
        private int completionTokens;
        private long responseTimeMs;
        private double cost;
        private String userMessagePreview;
        
        public int getIndex() { return index; }
        public void setIndex(int index) { this.index = index; }
        
        public long getElapsedSeconds() { return elapsedSeconds; }
        public void setElapsedSeconds(long elapsedSeconds) { this.elapsedSeconds = elapsedSeconds; }
        
        public int getPromptTokens() { return promptTokens; }
        public void setPromptTokens(int promptTokens) { this.promptTokens = promptTokens; }
        
        public int getCompletionTokens() { return completionTokens; }
        public void setCompletionTokens(int completionTokens) { this.completionTokens = completionTokens; }
        
        public long getResponseTimeMs() { return responseTimeMs; }
        public void setResponseTimeMs(long responseTimeMs) { this.responseTimeMs = responseTimeMs; }
        
        public double getCost() { return cost; }
        public void setCost(double cost) { this.cost = cost; }
        
        public String getUserMessagePreview() { return userMessagePreview; }
        public void setUserMessagePreview(String userMessagePreview) { this.userMessagePreview = userMessagePreview; }
    }
}
