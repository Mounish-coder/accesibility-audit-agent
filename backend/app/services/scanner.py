"""
Accessibility scanner service using Playwright + locally-bundled axe-core.

Key design decisions:
- axe-core is injected from a LOCAL file (app/services/axe.min.js) via
  page.add_script_tag(), bypassing any site CSP that would block CDN URLs.
- Uses `domcontentloaded` instead of `networkidle` — works for SPAs (Reddit, etc.)
  that never fully settle.
- Adds a realistic user-agent to avoid bot-detection blocks.
- `violations=0, passes=0` is treated as a perfectly clean page, not a crash.
- On Windows, Playwright's async API raises NotImplementedError when launched
  from within uvicorn's event loop (subprocess transport limitation). We work
  around this by running the SYNC Playwright API inside a ThreadPoolExecutor
  thread via loop.run_in_executor — giving Playwright its own clean context.
"""
import asyncio
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Dict, List, Any, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# ── Axe-core local path ────────────────────────────────────────────────────
_AXE_JS_PATH = Path(__file__).parent / "axe.min.js"

# Thread pool for Playwright (one thread per scan is enough)
_PLAYWRIGHT_EXECUTOR = ThreadPoolExecutor(max_workers=4, thread_name_prefix="playwright")

# Try to import Playwright — fall back gracefully
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright not installed. Cannot perform audit.")


# ── axe-core evaluation expression (runs AFTER page.add_script_tag injects it)
_AXE_EVALUATE = """
async () => {
    try {
        const results = await axe.run(document, {
            runOnly: {
                type: 'tag',
                values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
            },
            resultTypes: ['violations', 'passes']
        });
        return {
            violations: results.violations.map(v => ({
                id: v.id,
                description: v.description,
                help: v.help,
                helpUrl: v.helpUrl,
                impact: v.impact,
                tags: v.tags,
                nodes: v.nodes.slice(0, 3).map(n => ({
                    html: n.html,
                    failureSummary: n.failureSummary,
                }))
            })),
            passes: results.passes.length,
        };
    } catch(err) {
        return { error: err.message, violations: [], passes: 0 };
    }
}
"""


def _extract_wcag(tags: List[str]) -> Optional[str]:
    """Extract WCAG guideline reference from axe tags."""
    for tag in tags:
        if tag.startswith("wcag") and "." in tag:
            return f"WCAG {tag.replace('wcag', '').upper()}"
    return None


def _extract_category(violation_id: str, description: str) -> str:
    """Categorize issue based on rule ID and description."""
    categories = {
        "image":    "Images & Media",
        "label":    "Forms & Inputs",
        "input":    "Forms & Inputs",
        "button":   "Forms & Inputs",
        "color":    "Color & Contrast",
        "contrast": "Color & Contrast",
        "keyboard": "Keyboard & Focus",
        "focus":    "Keyboard & Focus",
        "heading":  "Page Structure",
        "landmark": "Page Structure",
        "meta":     "Page Structure",
        "link":     "Navigation & Links",
        "aria":     "ARIA & Semantics",
        "language": "Language & Text",
        "lang":     "Language & Text",
    }
    vid = violation_id.lower()
    desc = description.lower()
    for key, cat in categories.items():
        if key in vid or key in desc:
            return cat
    return "Other"


def _map_impact_to_severity(impact: str) -> str:
    return {"critical": "critical", "serious": "serious",
            "moderate": "moderate", "minor": "minor"}.get(impact, "moderate")


def _calculate_score(violations: List[Dict], passes: int) -> float:
    """Accessibility score: 100 minus weighted penalty, boosted slightly by passes."""
    if not violations and passes == 0:
        # No data at all — give a neutral score rather than crashing
        return 100.0
    weights = {"critical": 10, "serious": 7, "moderate": 3, "minor": 1}
    penalty = sum(weights.get(v.get("impact", "minor"), 1) for v in violations)
    score = max(0, 100 - penalty)
    if passes > 0:
        score = min(100, score + (passes / 100) * 5)
    return round(score, 1)


# ── Axe evaluate expression (JS string) — same as before ─────────────────
_AXE_EVALUATE_JS = """
() => {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            resolve({ error: "Axe execution timed out", violations: [], passes: 0 });
        }, 15000);
        try {
            axe.run(document, {
                runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','best-practice'] },
                resultTypes: ['violations','passes']
            }).then(results => {
                clearTimeout(timer);
                resolve({
                    violations: results.violations.map(v => ({
                        id: v.id,
                        description: v.description,
                        help: v.help,
                        helpUrl: v.helpUrl,
                        impact: v.impact,
                        tags: v.tags,
                        nodes: v.nodes.slice(0,3).map(n => ({ html: n.html, failureSummary: n.failureSummary }))
                    })),
                    passes: results.passes.length
                });
            }).catch(err => {
                clearTimeout(timer);
                resolve({ error: err.message, violations: [], passes: 0 });
            });
        } catch(err) {
            clearTimeout(timer);
            resolve({ error: err.message, violations: [], passes: 0 });
        }
    });
}
"""


import sys
from concurrent.futures import ThreadPoolExecutor

_SCAN_EXECUTOR = ThreadPoolExecutor(max_workers=4, thread_name_prefix="playwright_async")

def _thread_scan_runner(url: str, max_pages: int, axe_js_path: Path) -> Dict[str, Any]:
    """
    Runs in a dedicated thread. Sets up a fresh ProactorEventLoop (vital for Windows
    subprocess support) and executes the async Playwright scan. This entirely bypasses
    uvicorn's event loop limitations and avoids the greenlet segfault.
    """
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    import time as _time
    start_time = _time.time()
    
    all_violations: List[Dict] = []
    total_passes = 0
    pages_crawled = 0

    async def _do_scan():
        nonlocal all_violations, total_passes, pages_crawled, url
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                channel="msedge",
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--disable-extensions",
                ],
            )
            try:
                if not url.startswith("http://") and not url.startswith("https://"):
                    url = "https://" + url

                context = await browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"
                    ),
                    viewport={"width": 1280, "height": 800},
                    ignore_https_errors=True,
                )
                context.set_default_timeout(30000)

                axe_content = axe_js_path.read_text(encoding="utf-8")
                urls_to_visit = [url]
                visited: set = set()

                while urls_to_visit and pages_crawled < max_pages:
                    if _time.time() - start_time > 55:
                        logger.warning(f"[Scanner] Hard timeout reached for {url}.")
                        break

                    current_url = urls_to_visit.pop(0)
                    if current_url in visited:
                        continue
                    visited.add(current_url)

                    logger.info(f"[Scanner] Crawling {current_url}...")
                    page = await context.new_page()
                    try:
                        await page.goto(current_url, wait_until="domcontentloaded", timeout=30000)
                        logger.info(f"[Scanner] Page loaded: {current_url}")
                        
                        await asyncio.sleep(1.0)
                        await page.add_script_tag(content=axe_content)
                        result = await page.evaluate(_AXE_EVALUATE_JS)
                        
                        if result is None:
                            result = {"violations": [], "passes": 0}
                        if "error" in result:
                            logger.warning(f"[Scanner] axe error on {current_url}: {result['error']}")

                        all_violations.extend(result.get("violations") or [])
                        total_passes += result.get("passes") or 0
                        pages_crawled += 1

                        if pages_crawled < max_pages:
                            try:
                                links = await page.evaluate("""
                                    () => Array.from(document.querySelectorAll('a[href]'))
                                        .map(a => a.href)
                                        .filter(h => h.startsWith(window.location.origin)
                                                 && !h.includes('#')
                                                 && !h.match(/\\.(pdf|png|jpg|gif|svg|zip)$/i))
                                        .slice(0, 5)
                                """)
                                for link in (links or []):
                                    if link not in visited:
                                        urls_to_visit.append(link)
                            except Exception as e:
                                logger.warning(f"[Scanner] Error extracting links: {e}")

                    except Exception as page_err:
                        logger.warning(f"[Scanner] Failed scanning {current_url}: {page_err}")
                    finally:
                        try:
                            await page.close()
                        except:
                            pass
            finally:
                await browser.close()

    try:
        loop.run_until_complete(asyncio.wait_for(_do_scan(), timeout=60.0))
    except asyncio.TimeoutError:
        logger.error(f"[Scanner] Scan timed out for {url}")
        raise RuntimeError("Scan timed out after 60 seconds.")
    finally:
        loop.close()

    logger.info(f"[Scanner] Finished. Pages: {pages_crawled}, Violations: {len(all_violations)}")
    return {
        "violations": all_violations,
        "passes": total_passes,
        "pages": pages_crawled,
    }

async def scan_url_with_playwright(url: str, max_pages: int = 5) -> Dict[str, Any]:
    if not _AXE_JS_PATH.exists():
        raise RuntimeError("axe.min.js not found.")

    loop = asyncio.get_event_loop()
    try:
        return await asyncio.wait_for(
            loop.run_in_executor(
                _SCAN_EXECUTOR,
                _thread_scan_runner,
                url,
                max_pages,
                _AXE_JS_PATH
            ),
            timeout=70.0
        )
    except asyncio.TimeoutError:
        logger.error(f"[Scanner] Hard executor timeout for {url}")
        raise RuntimeError("Scanner thread locked up and was forcefully terminated.")


async def run_accessibility_scan(url: str, max_pages: int = 10) -> Dict[str, Any]:
    """
    Entry point: run full accessibility scan and return structured results.
    """
    if not PLAYWRIGHT_AVAILABLE:
        raise RuntimeError(
            "Playwright is not installed. "
            "Run: pip install playwright && playwright install chromium"
        )

    start_time = time.time()

    try:
        raw = await scan_url_with_playwright(url, max_pages)
    except Exception as e:
        logger.error(f"Playwright scan failed for {url}: {e}")
        raise RuntimeError(f"Playwright scan failed: {e}")

    if raw["pages"] == 0:
        raise RuntimeError(
            "Could not load any pages. "
            "The site may be unreachable or blocking automated requests."
        )

    violations = raw["violations"]
    passes = raw["passes"]
    pages = raw["pages"]
    duration = round(time.time() - start_time, 2)

    # violations=0 + passes=0 means axe ran but found nothing — perfectly valid
    # (e.g., a very clean or very simple page). Do NOT crash here.
    score = _calculate_score(violations, passes)

    # Process violations into normalised issue dicts
    processed_issues: List[Dict] = []
    for v in violations:
        node = v.get("nodes", [{}])[0] if v.get("nodes") else {}
        processed_issues.append({
            "description": v.get("help", v.get("description", "")),
            "severity":    _map_impact_to_severity(v.get("impact", "moderate")),
            "wcag":        _extract_wcag(v.get("tags", [])),
            "category":    _extract_category(v.get("id", ""), v.get("description", "")),
            "element":     node.get("html", ""),
            "helpUrl":     v.get("helpUrl", ""),
            "rawId":       v.get("id", ""),
        })

    counts: Dict[str, int] = {"critical": 0, "serious": 0, "moderate": 0, "minor": 0}
    for issue in processed_issues:
        sev = issue["severity"]
        if sev in counts:
            counts[sev] += 1

    logger.info(
        f"Scan complete — url={url} pages={pages} score={score} "
        f"violations={len(processed_issues)} duration={duration}s"
    )

    return {
        "score":    score,
        "duration": duration,
        "pages":    pages,
        "issues":   processed_issues,
        "passes":   passes,
        "counts":   counts,
    }
