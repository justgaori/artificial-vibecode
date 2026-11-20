package com.promptbench.service;

import com.promptbench.dto.ChatResponse;
import com.promptbench.model.Problem;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MockLlmService {
    
    private static final List<MockProblem> MOCK_PROBLEMS = List.of(
        new MockProblem(
            "배열 합계 계산",
            "숫자 배열을 입력받아 모든 요소의 합계를 반환하는 함수 `sumArray`를 작성하세요.\n\n" +
            "## 요구사항\n" +
            "- 함수명: `sumArray`\n" +
            "- 매개변수: 숫자 배열 `arr`\n" +
            "- 반환값: 배열 요소의 합계 (숫자)\n\n" +
            "## 예시\n" +
            "```javascript\nsumArray([1, 2, 3, 4, 5]) // 15\nsumArray([]) // 0\nsumArray([-1, 1]) // 0\n```",
            "쉬움",
            "JavaScript 기초",
            "[{\"input\":\"[1, 2, 3, 4, 5]\",\"expected\":\"15\"},{\"input\":\"[]\",\"expected\":\"0\"},{\"input\":\"[-1, 1]\",\"expected\":\"0\"},{\"input\":\"[10, 20, 30]\",\"expected\":\"60\"},{\"input\":\"[100]\",\"expected\":\"100\"}]",
            "function sumArray(arr) {\n  return arr.reduce((sum, num) => sum + num, 0);\n}",
            "function sumArray(arr) {\n  // 여기에 코드를 작성하세요\n}"
        ),
        new MockProblem(
            "문자열 뒤집기",
            "문자열을 입력받아 뒤집은 문자열을 반환하는 함수 `reverseString`을 작성하세요.\n\n" +
            "## 요구사항\n" +
            "- 함수명: `reverseString`\n" +
            "- 매개변수: 문자열 `str`\n" +
            "- 반환값: 뒤집힌 문자열\n\n" +
            "## 예시\n" +
            "```javascript\nreverseString(\"hello\") // \"olleh\"\nreverseString(\"world\") // \"dlrow\"\nreverseString(\"\") // \"\"\n```",
            "쉬움",
            "JavaScript 기초",
            "[{\"input\":\"\\\"hello\\\"\",\"expected\":\"\\\"olleh\\\"\"},{\"input\":\"\\\"world\\\"\",\"expected\":\"\\\"dlrow\\\"\"},{\"input\":\"\\\"\\\"\",\"expected\":\"\\\"\\\"\"},{\"input\":\"\\\"abc123\\\"\",\"expected\":\"\\\"321cba\\\"\"},{\"input\":\"\\\"A\\\"\",\"expected\":\"\\\"A\\\"\"}]",
            "function reverseString(str) {\n  return str.split('').reverse().join('');\n}",
            "function reverseString(str) {\n  // 여기에 코드를 작성하세요\n}"
        ),
        new MockProblem(
            "팰린드롬 검사",
            "문자열이 팰린드롬(앞뒤로 읽어도 같은 문자열)인지 확인하는 함수 `isPalindrome`을 작성하세요.\n\n" +
            "## 요구사항\n" +
            "- 함수명: `isPalindrome`\n" +
            "- 매개변수: 문자열 `str`\n" +
            "- 반환값: 팰린드롬이면 `true`, 아니면 `false`\n" +
            "- 대소문자를 구분하지 않습니다\n\n" +
            "## 예시\n" +
            "```javascript\nisPalindrome(\"racecar\") // true\nisPalindrome(\"hello\") // false\nisPalindrome(\"Madam\") // true\n```",
            "보통",
            "JavaScript 문자열",
            "[{\"input\":\"\\\"racecar\\\"\",\"expected\":\"true\"},{\"input\":\"\\\"hello\\\"\",\"expected\":\"false\"},{\"input\":\"\\\"Madam\\\"\",\"expected\":\"true\"},{\"input\":\"\\\"A\\\"\",\"expected\":\"true\"},{\"input\":\"\\\"\\\"\",\"expected\":\"true\"}]",
            "function isPalindrome(str) {\n  const lower = str.toLowerCase();\n  return lower === lower.split('').reverse().join('');\n}",
            "function isPalindrome(str) {\n  // 여기에 코드를 작성하세요\n}"
        )
    );
    
    private static final Map<String, List<String>> MOCK_RESPONSES = new LinkedHashMap<>();
    
    static {
        MOCK_RESPONSES.put("힌트", List.of(
            "[모의 데이터] 이 문제는 JavaScript의 배열 메서드를 사용하면 간단히 해결할 수 있습니다. `reduce()` 메서드를 활용해보세요.",
            "[모의 데이터] 문자열을 배열로 변환한 후 처리하면 됩니다. `split()`, `reverse()`, `join()` 메서드를 순서대로 사용해보세요.",
            "[모의 데이터] 대소문자를 무시하려면 먼저 `toLowerCase()`로 통일한 후 비교하세요."
        ));
        
        MOCK_RESPONSES.put("도움", List.of(
            "[모의 데이터] 단계별로 접근해보세요:\n1. 먼저 입력값의 타입을 확인합니다\n2. 빈 배열/문자열에 대한 엣지 케이스를 처리합니다\n3. 메인 로직을 구현합니다",
            "[모의 데이터] JavaScript에서 자주 쓰이는 배열 메서드:\n- `map()`: 각 요소를 변환\n- `filter()`: 조건에 맞는 요소만 선택\n- `reduce()`: 모든 요소를 하나의 값으로 축소"
        ));
        
        MOCK_RESPONSES.put("예시", List.of(
            "[모의 데이터] 간단한 예시 코드입니다:\n```javascript\nfunction example(arr) {\n  return arr.length;\n}\n```",
            "[모의 데이터] 문자열 처리 예시:\n```javascript\nconst str = \"hello\";\nconst reversed = str.split('').reverse().join('');\nconsole.log(reversed); // \"olleh\"\n```"
        ));
        
        MOCK_RESPONSES.put("default", List.of(
            "[모의 데이터] 네, 질문을 이해했습니다. 이 문제를 풀기 위해서는 JavaScript의 기본 메서드를 활용하면 됩니다. 어떤 부분이 어려우신가요?",
            "[모의 데이터] 좋은 질문입니다! 이 문제의 핵심은 적절한 자료구조와 알고리즘을 선택하는 것입니다. 힌트가 필요하시면 말씀해주세요.",
            "[모의 데이터] 코드를 작성할 때 먼저 엣지 케이스(빈 입력, 단일 요소 등)를 고려해보세요. 테스트 케이스를 통과하려면 이런 케이스도 처리해야 합니다."
        ));
    }
    
    private final Random random = new Random(42);
    
    public List<Problem> getMockProblems() {
        List<Problem> problems = new ArrayList<>();
        for (int i = 0; i < MOCK_PROBLEMS.size(); i++) {
            MockProblem mp = MOCK_PROBLEMS.get(i);
            Problem p = new Problem();
            p.setId((long) (i + 1));
            p.setTitle(mp.title);
            p.setDescription(mp.description);
            p.setDifficulty(mp.difficulty);
            p.setCategory(mp.category);
            p.setTestCases(mp.testCases);
            p.setReferenceSolution(mp.referenceSolution);
            p.setTemplateCode(mp.templateCode);
            p.setMock(true);
            problems.add(p);
        }
        return problems;
    }
    
    public MockProblem getMockProblemData(int index) {
        if (index >= 0 && index < MOCK_PROBLEMS.size()) {
            return MOCK_PROBLEMS.get(index);
        }
        return MOCK_PROBLEMS.get(0);
    }
    
    public ChatResponse generateMockResponse(String userMessage) {
        ChatResponse response = new ChatResponse();
        
        String lowerMessage = userMessage.toLowerCase();
        List<String> responses = null;
        
        for (Map.Entry<String, List<String>> entry : MOCK_RESPONSES.entrySet()) {
            if (lowerMessage.contains(entry.getKey()) && !entry.getKey().equals("default")) {
                responses = entry.getValue();
                break;
            }
        }
        
        if (responses == null) {
            responses = MOCK_RESPONSES.get("default");
        }
        
        String responseText = responses.get(random.nextInt(responses.size()));
        response.setMessage(responseText);
        
        int promptTokens = estimateTokens(userMessage);
        int completionTokens = estimateTokens(responseText);
        
        response.setPromptTokens(promptTokens);
        response.setCompletionTokens(completionTokens);
        response.setResponseTimeMs(200L + random.nextInt(300));
        response.setCost(0.0);
        response.setMock(true);
        
        return response;
    }
    
    private int estimateTokens(String text) {
        return Math.max(1, text.length() / 4);
    }
    
    public record MockProblem(
        String title,
        String description,
        String difficulty,
        String category,
        String testCases,
        String referenceSolution,
        String templateCode
    ) {}
}
