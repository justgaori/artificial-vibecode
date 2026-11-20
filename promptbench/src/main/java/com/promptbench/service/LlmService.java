package com.promptbench.service;

import com.promptbench.dto.ChatResponse;
import com.promptbench.model.Problem;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class LlmService {
    
    private final RestTemplate restTemplate;
    private final MockLlmService mockLlmService;
    private final boolean mockMode;
    
    @Value("${openrouter.api.key:}")
    private String apiKey;
    
    @Value("${openrouter.api.url}")
    private String apiUrl;
    
    @Value("${openrouter.model}")
    private String model;
    
    @Value("${openrouter.price.input:0}")
    private double inputPricePerMillion;
    
    @Value("${openrouter.price.output:0}")
    private double outputPricePerMillion;
    
    public LlmService(RestTemplate restTemplate, MockLlmService mockLlmService, 
                      @Qualifier("isMockMode") boolean mockMode) {
        this.restTemplate = restTemplate;
        this.mockLlmService = mockLlmService;
        this.mockMode = mockMode;
    }
    
    public boolean isMockMode() {
        return mockMode;
    }
    
    public ChatResponse chat(String userMessage, List<Map<String, String>> conversationHistory, String systemPrompt) {
        if (mockMode) {
            return mockLlmService.generateMockResponse(userMessage);
        }
        
        return callOpenRouterApi(userMessage, conversationHistory, systemPrompt);
    }
    
    private ChatResponse callOpenRouterApi(String userMessage, List<Map<String, String>> conversationHistory, String systemPrompt) {
        ChatResponse response = new ChatResponse();
        long startTime = System.currentTimeMillis();
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("HTTP-Referer", "https://promptbench.local");
            headers.set("X-Title", "PromptBench");
            
            List<Map<String, String>> messages = new ArrayList<>();
            
            if (systemPrompt != null && !systemPrompt.isBlank()) {
                messages.add(Map.of("role", "system", "content", systemPrompt));
            }
            
            if (conversationHistory != null) {
                messages.addAll(conversationHistory);
            }
            
            messages.add(Map.of("role", "user", "content", userMessage));
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", messages);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> apiResponse = restTemplate.exchange(
                apiUrl, HttpMethod.POST, entity, Map.class
            );
            
            long responseTime = System.currentTimeMillis() - startTime;
            
            Map<String, Object> body = apiResponse.getBody();
            if (body != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    response.setMessage((String) message.get("content"));
                }
                
                Map<String, Object> usage = (Map<String, Object>) body.get("usage");
                if (usage != null) {
                    int promptTokens = ((Number) usage.get("prompt_tokens")).intValue();
                    int completionTokens = ((Number) usage.get("completion_tokens")).intValue();
                    
                    response.setPromptTokens(promptTokens);
                    response.setCompletionTokens(completionTokens);
                    
                    double cost = calculateCost(promptTokens, completionTokens);
                    response.setCost(cost);
                }
            }
            
            response.setResponseTimeMs(responseTime);
            response.setMock(false);
            
        } catch (Exception e) {
            response.setMessage("[오류] LLM API 호출 실패: " + e.getMessage());
            response.setPromptTokens(0);
            response.setCompletionTokens(0);
            response.setCost(0.0);
            response.setResponseTimeMs(System.currentTimeMillis() - startTime);
            response.setMock(false);
        }
        
        return response;
    }
    
    public Problem generateProblem(String difficulty, String category) {
        if (mockMode) {
            List<Problem> mockProblems = mockLlmService.getMockProblems();
            int index = switch (difficulty) {
                case "보통" -> 2;
                case "어려움" -> 2;
                default -> 0;
            };
            if (index >= mockProblems.size()) index = 0;
            return mockProblems.get(index);
        }
        
        String prompt = String.format("""
            JavaScript 코딩 문제를 생성해주세요.
            
            난이도: %s
            분야: %s
            
            다음 형식으로 JSON만 출력해주세요 (다른 텍스트 없이):
            {
              "title": "문제 제목",
              "description": "## 문제 설명\\n상세 설명...\\n\\n## 요구사항\\n- 함수명: functionName\\n- 매개변수: ...\\n- 반환값: ...\\n\\n## 예시\\n```javascript\\nfunctionName(input) // output\\n```",
              "testCases": [
                {"input": "입력값 (JavaScript 표현식)", "expected": "예상 출력값 (JavaScript 표현식)"},
                ...최소 5개
              ],
              "referenceSolution": "function functionName(...) { ... }",
              "templateCode": "function functionName(...) {\\n  // 여기에 코드를 작성하세요\\n}"
            }
            """, difficulty, category);
        
        ChatResponse llmResponse = callOpenRouterApi(prompt, null, 
            "당신은 JavaScript 코딩 문제를 출제하는 교수입니다. JSON 형식으로만 응답하세요.");
        
        try {
            String jsonStr = llmResponse.getMessage();
            int start = jsonStr.indexOf("{");
            int end = jsonStr.lastIndexOf("}") + 1;
            if (start >= 0 && end > start) {
                jsonStr = jsonStr.substring(start, end);
            }
            
            Problem problem = new Problem();
            problem.setDifficulty(difficulty);
            problem.setCategory(category);
            problem.setMock(false);
            
            return problem;
        } catch (Exception e) {
            List<Problem> fallback = mockLlmService.getMockProblems();
            return fallback.get(0);
        }
    }
    
    private double calculateCost(int promptTokens, int completionTokens) {
        double inputCost = (promptTokens / 1_000_000.0) * inputPricePerMillion;
        double outputCost = (completionTokens / 1_000_000.0) * outputPricePerMillion;
        return inputCost + outputCost;
    }
}
