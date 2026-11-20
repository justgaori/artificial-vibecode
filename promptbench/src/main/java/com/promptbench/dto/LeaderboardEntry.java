package com.promptbench.dto;

public class LeaderboardEntry {
    
    private int rank;
    private String username;
    private String problemTitle;
    private int totalTokens;
    private int promptCount;
    private long elapsedTimeSeconds;
    private double estimatedCost;
    private double passRate;
    private boolean isMockSession;
    
    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getProblemTitle() { return problemTitle; }
    public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }
    
    public int getTotalTokens() { return totalTokens; }
    public void setTotalTokens(int totalTokens) { this.totalTokens = totalTokens; }
    
    public int getPromptCount() { return promptCount; }
    public void setPromptCount(int promptCount) { this.promptCount = promptCount; }
    
    public long getElapsedTimeSeconds() { return elapsedTimeSeconds; }
    public void setElapsedTimeSeconds(long elapsedTimeSeconds) { this.elapsedTimeSeconds = elapsedTimeSeconds; }
    
    public double getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(double estimatedCost) { this.estimatedCost = estimatedCost; }
    
    public double getPassRate() { return passRate; }
    public void setPassRate(double passRate) { this.passRate = passRate; }
    
    public boolean isMockSession() { return isMockSession; }
    public void setMockSession(boolean mockSession) { isMockSession = mockSession; }
}
