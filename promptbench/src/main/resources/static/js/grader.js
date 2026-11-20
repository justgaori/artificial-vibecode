function runTestsInWorker(code, testCases) {
    return new Promise((resolve) => {
        const results = [];
        let completedCount = 0;
        
        function checkComplete() {
            completedCount++;
            if (completedCount >= testCases.length) {
                results.sort((a, b) => a.index - b.index);
                resolve(results);
            }
        }
        
        if (testCases.length === 0) {
            resolve([]);
            return;
        }
        
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            const result = {
                index: i + 1,
                input: testCase.input,
                expected: testCase.expected,
                actual: '',
                passed: false,
                error: null
            };
            
            try {
                const workerCode = `
                    self.onmessage = function(e) {
                        try {
                            const userCode = e.data.code;
                            const inputStr = e.data.input;
                            
                            // 사용자 코드를 평가하고 함수 이름 추출
                            eval(userCode);
                            
                            // 코드에서 함수 이름 추출 (function xxx 패턴)
                            const fnMatch = userCode.match(/function\\s+(\\w+)/);
                            if (!fnMatch) {
                                throw new Error('함수를 찾을 수 없습니다');
                            }
                            const fnName = fnMatch[1];
                            
                            // 함수 호출
                            const fn = eval(fnName);
                            if (typeof fn !== 'function') {
                                throw new Error('유효한 함수가 아닙니다: ' + fnName);
                            }
                            
                            const input = eval(inputStr);
                            const result = fn(input);
                            
                            self.postMessage({ success: true, result: JSON.stringify(result) });
                        } catch (err) {
                            self.postMessage({ success: false, error: err.message });
                        }
                    };
                `;
                
                const blob = new Blob([workerCode], { type: 'application/javascript' });
                const workerUrl = URL.createObjectURL(blob);
                const worker = new Worker(workerUrl);
                
                let resolved = false;
                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        worker.terminate();
                        URL.revokeObjectURL(workerUrl);
                        result.error = '시간 초과 (3초)';
                        result.actual = 'TIMEOUT';
                        results.push(result);
                        checkComplete();
                    }
                }, 3000);
                
                worker.onmessage = function(e) {
                    if (resolved) return;
                    resolved = true;
                    clearTimeout(timeout);
                    worker.terminate();
                    URL.revokeObjectURL(workerUrl);
                    
                    if (e.data.success) {
                        result.actual = e.data.result;
                        const expected = testCase.expected.trim();
                        const actual = e.data.result.trim();
                        result.passed = expected === actual;
                    } else {
                        result.error = e.data.error;
                        result.actual = 'ERROR';
                    }
                    results.push(result);
                    checkComplete();
                };
                
                worker.onerror = function(err) {
                    if (resolved) return;
                    resolved = true;
                    clearTimeout(timeout);
                    worker.terminate();
                    URL.revokeObjectURL(workerUrl);
                    
                    result.error = err.message || '실행 오류';
                    result.actual = 'ERROR';
                    results.push(result);
                    checkComplete();
                };
                
                worker.postMessage({ code, input: testCase.input });
                
            } catch (err) {
                result.error = err.message;
                result.actual = 'ERROR';
                results.push(result);
                checkComplete();
            }
        }
    });
}
