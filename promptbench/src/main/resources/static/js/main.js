async function checkStatus() {
    try {
        const response = await fetch('/api/status');
        const status = await response.json();
        
        const badge = document.getElementById('status-badge');
        if (badge) {
            if (status.mockMode) {
                badge.className = 'status-badge mock';
                badge.textContent = '🔸 모의 모드 (API 키 미설정)';
            } else {
                badge.className = 'status-badge live';
                badge.textContent = '🟢 API 연결됨';
            }
        }
        
        return status;
    } catch (error) {
        console.error('Status check failed:', error);
        return { mockMode: true };
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
}

function formatTokens(tokens) {
    if (tokens >= 1000) {
        return (tokens / 1000).toFixed(1) + 'K';
    }
    return tokens.toString();
}

function formatCost(cost) {
    if (cost === 0) return '무료';
    if (cost < 0.01) return '<$0.01';
    return '$' + cost.toFixed(4);
}

function renderMarkdown(text) {
    return text
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}
