# 🔍 Performance Analysis Report

**URL**: https://www.baidu.com
**Total Events**: 16,797
**Duration Events**: 7,504
**Unique Operations**: 144

---

## 🚨 Critical Problems Found: 6


### 1. [CRITICAL] slow network
**Description**: Slow request: GET https://pss.bdstatic.com/static/superman/js/sbase-... took 1625.21ms
**Location**: https://pss.bdstatic.com/static/superman/js/sbase-cf781c97b7.js
**Suggestion**: Consider: 1) CDN 2) Compression 3) Caching 4) Code splitting


### 2. [CRITICAL] slow network
**Description**: Slow request: GET https://pss.bdstatic.com/static/superman/js/compon... took 1614.51ms
**Location**: https://pss.bdstatic.com/static/superman/js/components/hotsearch-4bcd986297.js
**Suggestion**: Consider: 1) CDN 2) Compression 3) Caching 4) Code splitting


### 3. [CRITICAL] slow network
**Description**: Slow request: GET https://pss.bdstatic.com/static/superman/js/min_su... took 1614.51ms
**Location**: https://pss.bdstatic.com/static/superman/js/min_super-7b1d78110b.js
**Suggestion**: Consider: 1) CDN 2) Compression 3) Caching 4) Code splitting


### 4. [CRITICAL] slow network
**Description**: Slow request: GET https://pss.bdstatic.com/static/superman/js/s_supe... took 1614.43ms
**Location**: https://pss.bdstatic.com/static/superman/js/s_super_index-895c0c52f8.js
**Suggestion**: Consider: 1) CDN 2) Compression 3) Caching 4) Code splitting


### 5. [CRITICAL] slow network
**Description**: Slow request: GET https://pss.bdstatic.com/r/www/cache/static/protoc... took 1005.18ms
**Location**: https://pss.bdstatic.com/r/www/cache/static/protocol/https/global/js/all_async_search_4685dfd.js
**Suggestion**: Consider: 1) CDN 2) Compression 3) Caching 4) Code splitting


### 6. [CRITICAL] long task
**Description**: Long task blocking main thread: 619.53ms
**Location**: unknown
**Suggestion**: Break up long tasks using: requestAnimationFrame, Web Workers, or async/await


---

## 📊 Render Pipeline Breakdown

| Category | Count | Total Duration |
|----------|-------|----------------|
| JavaScript | 993 | 864.79ms |
| Layout | 703 | 56.98ms |
| Paint | 252 | 7.78ms |
| Composite | 691 | 5.35ms |

---

## 🐢 Top Slowest Operations


1. **v8.parseOnBackgroundWaiting**
   - Avg: 14.29ms
   - Count: 26
   - Total: 371.45ms


2. **EvaluateScript**
   - Avg: 12.02ms
   - Count: 57
   - Total: 685.29ms


3. **HandlePostMessage**
   - Avg: 11.17ms
   - Count: 2
   - Total: 22.34ms


4. **BackgroundProcessor::RunScriptStreamingTask**
   - Avg: 10.35ms
   - Count: 39
   - Total: 403.57ms


5. **v8.parseOnBackground**
   - Avg: 10.34ms
   - Count: 39
   - Total: 403.37ms


6. **MajorGC**
   - Avg: 1.33ms
   - Count: 1
   - Total: 1.33ms


7. **V8.GC_MARK_COMPACTOR**
   - Avg: 1.27ms
   - Count: 1
   - Total: 1.27ms


8. **V8.GC_MC_BACKGROUND_MARKING**
   - Avg: 0.86ms
   - Count: 11
   - Total: 9.44ms


9. **v8.parseOnBackgroundParsing**
   - Avg: 0.49ms
   - Count: 65
   - Total: 31.77ms


10. **HTMLDocumentParser::MaybeFetchQueuedPreloads**
   - Avg: 0.39ms
   - Count: 7
   - Total: 2.71ms


---

## 🔄 Most Frequent Operations


1. **IntersectionObserverController::computeIntersections** - 1484 times (avg 0.00ms)


2. **FunctionCall** - 823 times (avg 0.21ms)


3. **PrePaint** - 761 times (avg 0.06ms)


4. **Layerize** - 691 times (avg 0.01ms)


5. **UpdateLayoutTree** - 680 times (avg 0.07ms)


6. **FireAnimationFrame** - 608 times (avg 0.18ms)


7. **V8.BytecodeBudgetInterrupt** - 382 times (avg 0.00ms)


8. **Paint** - 252 times (avg 0.03ms)


9. **V8.StackGuard** - 175 times (avg 0.00ms)


10. **TimerFire** - 159 times (avg 0.09ms)


---

## 🌐 Top Slowest Network Requests


1. **[200]** Script
   - GET https://pss.bdstatic.com/static/superman/js/sbase-cf781c97b7...
   - Time: 1625.21ms
   - Size: 20.3KB


2. **[200]** Script
   - GET https://pss.bdstatic.com/static/superman/js/components/hotse...
   - Time: 1614.51ms
   - Size: 3.2KB


3. **[200]** Script
   - GET https://pss.bdstatic.com/static/superman/js/min_super-7b1d78...
   - Time: 1614.51ms
   - Size: 22.2KB


4. **[200]** Script
   - GET https://pss.bdstatic.com/static/superman/js/s_super_index-89...
   - Time: 1614.43ms
   - Size: 1.2KB


5. **[200]** Script
   - GET https://pss.bdstatic.com/r/www/cache/static/protocol/https/g...
   - Time: 1005.18ms
   - Size: 236.3KB


6. **[200]** Script
   - GET https://pss.bdstatic.com/r/www/cache/static/protocol/https/b...
   - Time: 857.57ms
   - Size: 14.4KB


7. **[200]** Script
   - GET https://hectorstatic.baidu.com/cd37ed75a9387c5b.js...
   - Time: 845.84ms
   - Size: 31.4KB


8. **[200]** Script
   - GET https://pss.bdstatic.com/r/www/cache/static/protocol/https/b...
   - Time: 831.65ms
   - Size: 26.5KB


9. **[200]** Script
   - GET https://pss.bdstatic.com/static/superman/js/lib/esl-cf7161da...
   - Time: 824.26ms
   - Size: 5.9KB


10. **[200]** Script
   - GET https://pss.bdstatic.com/static/superman/js/lib/jquery-1-edb...
   - Time: 817.43ms
   - Size: 43.5KB


---

## 💡 Recommendations

1. Break up long JavaScript tasks to improve responsiveness
2. Optimize JS: reduce main thread work, use Web Workers

---

*Generated by AutoReview Trace Analyzer*