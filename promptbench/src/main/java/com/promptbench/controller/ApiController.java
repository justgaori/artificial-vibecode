package com.promptbench.controller;

import com.promptbench.dto.*;
import com.promptbench.model.*;
import com.promptbench.service.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiController {
    
    private final ProblemService problemService;
    private final SessionService sessionService;
    private final LlmService llmService;
    
    public ApiController(ProblemService problemService, SessionService sessionService, 
                         LlmService llmService) {
        this.problemService = problemService;
        this.sessionService = sessionService;
        this.llmService = llmService;
    }
    
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
            "mockMode", llmService.isMockMode(),
            "message", llmService.isMockMode() ? 
                "API 키가 설정되지 않아 모의 모드로 실행 중입니다" : 
                "OpenRouter API 연결됨"
        ));
    }
    
    @GetMapping("/problems")
    public ResponseEntity<List<Problem>> getProblems(
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String category) {
        List<Problem> problems;
        if (difficulty != null) {
            problems = problemService.getProblemsByDifficulty(difficulty);
        } else if (category != null) {
            problems = problemService.getProblemsByCategory(category);
        } else {
            problems = problemService.getAllProblems();
        }
        return ResponseEntity.ok(problems);
    }
    
    @GetMapping("/problems/{id}")
    public ResponseEntity<Problem> getProblem(@PathVariable Long id) {
        return ResponseEntity.ok(problemService.getProblem(id));
    }
    
    @PostMapping("/problems/generate")
    public ResponseEntity<Problem> generateProblem(@RequestBody Map<String, String> request) {
        String difficulty = request.getOrDefault("difficulty", "쉬움");
        String category = request.getOrDefault("category", "JavaScript 기초");
        return ResponseEntity.ok(problemService.generateProblem(difficulty, category));
    }
    
    @PostMapping("/sessions/start")
    public ResponseEntity<Map<String, Object>> startSession(@RequestBody Map<String, Object> request) {
        String username = (String) request.getOrDefault("username", "익명");
        Long problemId = ((Number) request.get("problemId")).longValue();
        
        Session session = sessionService.startSession(username, problemId);
        Problem problem = session.getProblem();
        
        return ResponseEntity.ok(Map.of(
            "sessionId", session.getId(),
            "problemTitle", problem.getTitle(),
            "problemDescription", problem.getDescription(),
            "templateCode", problem.getTemplateCode() != null ? problem.getTemplateCode() : "",
            "startedAt", session.getStartedAt().toString(),
            "isMockSession", session.isMockSession()
        ));
    }
    
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        ChatResponse response = sessionService.processChat(request.getSessionId(), request.getMessage());
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submit(@Valid @RequestBody SubmitRequest request) {
        Session session = sessionService.getSession(request.getSessionId());
        
        return ResponseEntity.ok(Map.of(
            "sessionId", session.getId(),
            "testCases", session.getProblem().getTestCases(),
            "code", request.getCode()
        ));
    }
    
    @PostMapping("/grade")
    public ResponseEntity<SessionReport> submitGrade(@RequestBody Map<String, Object> request) {
        Long sessionId = ((Number) request.get("sessionId")).longValue();
        String code = (String) request.get("code");
        
        int passed = ((Number) request.get("passed")).intValue();
        int total = ((Number) request.get("total")).intValue();
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> testResultsRaw = (List<Map<String, Object>>) request.get("testResults");
        
        GradeResult gradeResult = new GradeResult();
        gradeResult.setPassed(passed);
        gradeResult.setTotal(total);
        gradeResult.setPassRate(total > 0 ? (passed * 100.0 / total) : 0);
        
        List<GradeResult.TestCaseResult> testResults = testResultsRaw.stream().map(tr -> {
            GradeResult.TestCaseResult result = new GradeResult.TestCaseResult();
            result.setIndex(((Number) tr.get("index")).intValue());
            result.setPassed((Boolean) tr.get("passed"));
            result.setInput((String) tr.get("input"));
            result.setExpected((String) tr.get("expected"));
            result.setActual((String) tr.get("actual"));
            result.setError((String) tr.get("error"));
            return result;
        }).toList();
        gradeResult.setTestResults(testResults);
        
        sessionService.submitCode(sessionId, code, gradeResult);
        
        SessionReport report = sessionService.generateReport(sessionId);
        report.setGradeResult(gradeResult);
        
        return ResponseEntity.ok(report);
    }
    
    @GetMapping("/sessions/{id}/report")
    public ResponseEntity<SessionReport> getReport(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.generateReport(id));
    }
    
    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard(
            @RequestParam(required = false) Long problemId) {
        return ResponseEntity.ok(sessionService.getLeaderboard(problemId));
    }
}
