package com.promptbench.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "problems")
public class Problem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;
    
    @Column(nullable = false)
    private String difficulty;
    
    @Column(nullable = false)
    private String category;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String testCases;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String referenceSolution;
    
    @Column(columnDefinition = "TEXT")
    private String templateCode;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private boolean isMock;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getTestCases() { return testCases; }
    public void setTestCases(String testCases) { this.testCases = testCases; }
    
    public String getReferenceSolution() { return referenceSolution; }
    public void setReferenceSolution(String referenceSolution) { this.referenceSolution = referenceSolution; }
    
    public String getTemplateCode() { return templateCode; }
    public void setTemplateCode(String templateCode) { this.templateCode = templateCode; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public boolean isMock() { return isMock; }
    public void setMock(boolean mock) { isMock = mock; }
}
