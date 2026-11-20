package com.promptbench.service;

import com.promptbench.dto.*;
import com.promptbench.model.*;
import com.promptbench.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SessionService {
    
    private final SessionRepository sessionRepository;
    private final ProblemRepository problemRepository;
    private final PromptLogRepository promptLogRepository;
    private final LlmService llmService;
    
    public SessionService(SessionRepository sessionRepository, ProblemRepository problemRepository,
                          PromptLogRepository promptLogRepository, LlmService llmService) {
        this.sessionRepository = sessionRepository;
        this.problemRepository = problemRepository;
        this.promptLogRepository = promptLogRepository;
        this.llmService = llmService;
    }
    
    @Transactional
    public Session startSession(String username, Long problemId) {
        Problem problem = problemRepository.findById(problemId)
            .orElseThrow(() -> new RuntimeException("문제를 찾을 수 없습니다: " + problemId));
        
        Session session = new Session();
        session.setUsername(username);
        session.setProblem(problem);
        session.setStartedAt(LocalDateTime.now());
        session.setMockSession(llmService.isMockMode());
        
        return sessionRepository.save(session);
    }
    
    @Transactional
    public ChatResponse processChat(Long sessionId, String userMessage) {
        Session session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다: " + sessionId));
        
        if (session.isCompleted()) {
            throw new RuntimeException("이미 완료된 세션입니다");
        }
        
        List<Map<String, String>> history = session.getPromptLogs().stream()
            .flatMap(log -> {
                List<Map<String, String>> msgs = new ArrayList<>();
                msgs.add(Map.of("role", "user", "content", log.getUserMessage()));
                if (log.getAssistantMessage() != null) {
                    msgs.add(Map.of("role", "assistant", "content", log.getAssistantMessage()));
                }
                return msgs.stream();
            })
            .collect(Collectors.toList());
        
        String systemPrompt = String.format("""
            당신은 코딩 도우미입니다. 사용자가 아래 문제를 풀고 있습니다.
            
            [문제]
            %s
            
            힌트를 주되, 직접적인 정답 코드는 제공하지 마세요.
            질문에 한국어로 친절하게 답변하세요.
            """, session.getProblem().getDescription());
        
        ChatResponse response = llmService.chat(userMessage, history, systemPrompt);
        
        PromptLog log = new PromptLog();
        log.setUserMessage(userMessage);
        log.setAssistantMessage(response.getMessage());
        log.setPromptTokens(response.getPromptTokens());
        log.setCompletionTokens(response.getCompletionTokens());
        log.setResponseTimeMs(response.getResponseTimeMs());
        log.setCost(response.getCost());
        log.setMock(response.isMock());
        
        session.addPromptLog(log);
        session.setPromptCount(session.getPromptCount() + 1);
        session.setTotalPromptTokens(session.getTotalPromptTokens() + 
            (response.getPromptTokens() != null ? response.getPromptTokens() : 0));
        session.setTotalCompletionTokens(session.getTotalCompletionTokens() + 
            (response.getCompletionTokens() != null ? response.getCompletionTokens() : 0));
        
        sessionRepository.save(session);
        
        response.setTotalSessionTokens(session.getTotalTokens());
        response.setPromptCount(session.getPromptCount());
        
        return response;
    }
    
    @Transactional
    public Session submitCode(Long sessionId, String code, GradeResult gradeResult) {
        Session session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다: " + sessionId));
        
        session.setSubmittedAt(LocalDateTime.now());
        session.setSubmittedCode(code);
        session.setPassedTests(gradeResult.getPassed());
        session.setTotalTests(gradeResult.getTotal());
        session.setPassRate(gradeResult.getPassRate());
        session.setCompleted(true);
        
        return sessionRepository.save(session);
    }
    
    public SessionReport generateReport(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다: " + sessionId));
        
        SessionReport report = new SessionReport();
        report.setSessionId(session.getId());
        report.setUsername(session.getUsername());
        report.setProblemTitle(session.getProblem().getTitle());
        report.setStartedAt(session.getStartedAt());
        report.setSubmittedAt(session.getSubmittedAt());
        
        if (session.getSubmittedAt() != null) {
            long seconds = Duration.between(session.getStartedAt(), session.getSubmittedAt()).getSeconds();
            report.setElapsedTimeSeconds(seconds);
        }
        
        report.setTotalPromptTokens(session.getTotalPromptTokens() != null ? session.getTotalPromptTokens() : 0);
        report.setTotalCompletionTokens(session.getTotalCompletionTokens() != null ? session.getTotalCompletionTokens() : 0);
        report.setTotalTokens(report.getTotalPromptTokens() + report.getTotalCompletionTokens());
        report.setPromptCount(session.getPromptCount() != null ? session.getPromptCount() : 0);
        
        double totalCost = session.getPromptLogs().stream()
            .mapToDouble(log -> log.getCost() != null ? log.getCost() : 0)
            .sum();
        report.setEstimatedCost(totalCost);
        
        report.setPassRate(session.getPassRate() != null ? session.getPassRate() : 0);
        report.setPassedTests(session.getPassedTests() != null ? session.getPassedTests() : 0);
        report.setTotalTests(session.getTotalTests() != null ? session.getTotalTests() : 0);
        report.setMockSession(session.isMockSession());
        
        List<SessionReport.PromptTimeline> timeline = new ArrayList<>();
        int index = 1;
        for (PromptLog log : session.getPromptLogs()) {
            SessionReport.PromptTimeline item = new SessionReport.PromptTimeline();
            item.setIndex(index++);
            item.setElapsedSeconds(Duration.between(session.getStartedAt(), log.getCreatedAt()).getSeconds());
            item.setPromptTokens(log.getPromptTokens() != null ? log.getPromptTokens() : 0);
            item.setCompletionTokens(log.getCompletionTokens() != null ? log.getCompletionTokens() : 0);
            item.setResponseTimeMs(log.getResponseTimeMs() != null ? log.getResponseTimeMs() : 0);
            item.setCost(log.getCost() != null ? log.getCost() : 0);
            String preview = log.getUserMessage();
            if (preview.length() > 50) {
                preview = preview.substring(0, 50) + "...";
            }
            item.setUserMessagePreview(preview);
            timeline.add(item);
        }
        report.setTimeline(timeline);
        
        return report;
    }
    
    public Session getSession(Long sessionId) {
        return sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다: " + sessionId));
    }
    
    public List<LeaderboardEntry> getLeaderboard(Long problemId) {
        List<Session> sessions;
        if (problemId != null) {
            sessions = sessionRepository.findLeaderboardByProblem(problemId);
        } else {
            sessions = sessionRepository.findGlobalLeaderboard();
        }
        
        List<LeaderboardEntry> entries = new ArrayList<>();
        int rank = 1;
        for (Session session : sessions) {
            LeaderboardEntry entry = new LeaderboardEntry();
            entry.setRank(rank++);
            entry.setUsername(session.getUsername());
            entry.setProblemTitle(session.getProblem().getTitle());
            entry.setTotalTokens(session.getTotalTokens());
            entry.setPromptCount(session.getPromptCount() != null ? session.getPromptCount() : 0);
            
            if (session.getSubmittedAt() != null) {
                entry.setElapsedTimeSeconds(
                    Duration.between(session.getStartedAt(), session.getSubmittedAt()).getSeconds());
            }
            
            double cost = session.getPromptLogs().stream()
                .mapToDouble(log -> log.getCost() != null ? log.getCost() : 0)
                .sum();
            entry.setEstimatedCost(cost);
            entry.setPassRate(session.getPassRate() != null ? session.getPassRate() : 0);
            entry.setMockSession(session.isMockSession());
            
            entries.add(entry);
        }
        
        return entries;
    }
}
