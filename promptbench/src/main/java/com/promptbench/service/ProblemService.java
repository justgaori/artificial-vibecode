package com.promptbench.service;

import com.promptbench.model.Problem;
import com.promptbench.repository.ProblemRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProblemService {
    
    private final ProblemRepository problemRepository;
    private final MockLlmService mockLlmService;
    private final LlmService llmService;
    
    public ProblemService(ProblemRepository problemRepository, MockLlmService mockLlmService, 
                          LlmService llmService) {
        this.problemRepository = problemRepository;
        this.mockLlmService = mockLlmService;
        this.llmService = llmService;
    }
    
    @PostConstruct
    @Transactional
    public void initMockProblems() {
        if (problemRepository.count() == 0) {
            List<Problem> mockProblems = mockLlmService.getMockProblems();
            for (Problem p : mockProblems) {
                Problem newProblem = new Problem();
                newProblem.setTitle(p.getTitle());
                newProblem.setDescription(p.getDescription());
                newProblem.setDifficulty(p.getDifficulty());
                newProblem.setCategory(p.getCategory());
                newProblem.setTestCases(p.getTestCases());
                newProblem.setReferenceSolution(p.getReferenceSolution());
                newProblem.setTemplateCode(p.getTemplateCode());
                newProblem.setMock(true);
                problemRepository.save(newProblem);
            }
        }
    }
    
    public List<Problem> getAllProblems() {
        return problemRepository.findAll();
    }
    
    public Problem getProblem(Long id) {
        return problemRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("문제를 찾을 수 없습니다: " + id));
    }
    
    public List<Problem> getProblemsByDifficulty(String difficulty) {
        return problemRepository.findByDifficulty(difficulty);
    }
    
    public List<Problem> getProblemsByCategory(String category) {
        return problemRepository.findByCategory(category);
    }
    
    @Transactional
    public Problem generateProblem(String difficulty, String category) {
        Problem problem = llmService.generateProblem(difficulty, category);
        return problemRepository.save(problem);
    }
}
