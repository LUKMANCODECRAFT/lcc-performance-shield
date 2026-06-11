// ========================================================
// GLOBAL STATE CORE
// ========================================================
let monitorIntervalId = null;
let historicalLatencies = [];
let totalRequestsSent = 0;
let successfulRequests = 0;

// ========================================================
// DOM ELEMENT HOOKS
// ========================================================
const startButton = document.getElementById("start-btn");
const stopButton = document.getElementById("stop-btn");
const endpointSelector = document.getElementById("endpoint-selector");

const avgLatencyDisplay = document.getElementById("avg-latency");
const uptimePctDisplay = document.getElementById("uptime-pct");
const totalRequestsDisplay = document.getElementById("total-requests");
const terminalStream = document.getElementById("terminal-stream");

// ========================================================
// HELPER: TERMINAL STREAM RECORDER
// ========================================================
function logToTerminal(message, statusClass = "system-line") {
    const timestamp = new Date().toLocaleTimeString();
    const logLine = document.createElement("div");
    logLine.className = statusClass;
    logLine.textContent = `[${timestamp}] ${message}`;
    
    terminalStream.appendChild(logLine);
    
    // Auto-scroll to the bottom of the terminal to view live logs
    terminalStream.scrollTop = terminalStream.scrollHeight;
}

// ========================================================
// MODULE 1: PROGRAMMATIC LATENCY PROBING ENGINE
// ========================================================
async function pingTargetNetwork() {
    const targetUrl = endpointSelector.value;
    totalRequestsSent++;
    totalRequestsDisplay.textContent = totalRequestsSent;

    // Capture exact system timestamp prior to firing the request
    const startTime = performance.now();

    try {
        // Cache-busting parameter prevents browsers from serving fake, instant responses
        const cacheBuster = `?cb=${Date.now()}`;
        const response = await fetch(targetUrl + cacheBuster, { method: "GET", mode: "cors" });

        // Calculate precise network round-trip latency in milliseconds
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        if (response.ok) {
            successfulRequests++;
            historicalLatencies.push(latency);
            
            // Maintain a rolling data window capped at the last 20 requests
            if (historicalLatencies.length > 20) {
                historicalLatencies.shift();
            }

            // Execute live system classification based on performance thresholds
            let classificationClass = "stable-line";
            let statusTag = "STABLE";

            if (latency > 500) {
                classificationClass = "degraded-line";
                statusTag = "DEGRADED PERFORMANCE";
            } else if (latency > 200) {
                classificationClass = "warning-line";
                statusTag = "LATENCY WARNING";
            }

            logToTerminal(`PING SUCCESS // ${statusTag}: ${latency}ms response from [${new URL(targetUrl).hostname}]`, classificationClass);
        } else {
            logToTerminal(`NETWORK ALARM // SERVER ERROR: Returned status ${response.status}`, "degraded-line");
        }

    } catch (error) {
        logToTerminal(`CRITICAL SHIELD FAULT // REQUEST FAILED: Target server is unreachable or rejecting CORS requests.`, "degraded-line");
        console.error(error);
    }

    // Recalculate operational analytics across arrays
    calculateAnalyticsMetrics();
}

// ========================================================
// MODULE 2: REAL-TIME ANALYTICS CALCULATOR
// ========================================================
function calculateAnalyticsMetrics() {
    // 1. Compute rolling latency average
    if (historicalLatencies.length > 0) {
        const totalSum = historicalLatencies.reduce((acc, val) => acc + val, 0);
        const average = Math.round(totalSum / historicalLatencies.length);
        avgLatencyDisplay.textContent = `${average}ms`;
        
        // Dynamic UI color changes for the average text based on status
        if (average > 500) avgLatencyDisplay.style.color = "var(--status-degraded)";
        else if (average > 200) avgLatencyDisplay.style.color = "var(--status-warning)";
        else avgLatencyDisplay.style.color = "var(--status-stable)";
    }

    // 2. Compute true network uptime performance percentage
    const uptimePct = Math.round((successfulRequests / totalRequestsSent) * 100);
    uptimePctDisplay.textContent = `${uptimePct}%`;

    if (uptimePct < 90) uptimePctDisplay.style.color = "var(--status-degraded)";
    else if (uptimePct < 98) uptimePctDisplay.style.color = "var(--status-warning)";
    else uptimePctDisplay.style.color = "var(--status-stable)";
}

// ========================================================
// MODULE 3: INTERFACE CONTROLLER EVENT SEQUENCER
// ========================================================
startButton.addEventListener("click", function () {
    logToTerminal("SHIELD ACTIVE // Starting background polling loops at 3000ms intervals...", "stable-line");
    
    // Toggle element interaction states immediately to prevent collision bugs
    startButton.disabled = true;
    stopButton.disabled = false;
    endpointSelector.disabled = true;

    // Fire the initial ping instantly, then step into a 3-second repetitive loop
    pingTargetNetwork();
    monitorIntervalId = setInterval(pingTargetNetwork, 3000);
});

stopButton.addEventListener("click", function () {
    logToTerminal("SHIELD SUSPENDED // Halting real-time data tracking pipelines.", "warning-line");
    
    // Terminate the background thread processes completely
    clearInterval(monitorIntervalId);
    monitorIntervalId = null;

    // Reset element interactive access
    startButton.disabled = false;
    stopButton.disabled = true;
    endpointSelector.disabled = false;
});