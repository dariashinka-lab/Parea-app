import asyncio
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Greek venue names (Πέμπτη, ΜΑΡΚΙΔΕΙΟ ΘΕΑΤΡΟ) crash print() on Windows
# PowerShell's default cp1251 stdout. Force UTF-8 so logs never blow up
# mid-event and leave Supabase unwritten.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import re
from supabase import create_client
from dotenv import load_dotenv

# Load .env from project root (parent of scraper/)
load_dotenv(Path(__file__).parent.parent / '.env')

SUPABASE_URL = 'https://olvwwfgzkafdgqcvskzs.supabase.co'
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
if not SUPABASE_KEY:
    raise SystemExit('SUPABASE_SERVICE_KEY missing in .env')
BASE_URL = 'https://www.soldoutticketbox.com'

CITY_KEYWORDS = ['NICOSIA', 'LIMASSOL', 'PAPHOS', 'LARNACA', 'FAMAGUSTA', 'LEFKOSIA', 'LEMESOS']

# Greek venue names map to English city. Cyprus venue pages frequently render
# the city in Greek even on the English-locale URL (theatres like
# ΜΑΡΚΙΔΕΙΟ ΘΕΑΤΡΟ ΠΑΦΟΥ), so without this mapping `extract_city` would
# silently return '' and the app would show the raw Greek string as location.
GREEK_CITY_MAP = {
    'ΠΑΦΟΣ': 'Paphos', 'ΠΑΦΟΥ': 'Paphos',
    'ΛΕΥΚΩΣΙΑ': 'Nicosia', 'ΛΕΥΚΩΣΙΑΣ': 'Nicosia',
    'ΛΕΜΕΣΟΣ': 'Limassol', 'ΛΕΜΕΣΟΥ': 'Limassol',
    'ΛΑΡΝΑΚΑ': 'Larnaca', 'ΛΑΡΝΑΚΑΣ': 'Larnaca',
    'ΑΜΜΟΧΩΣΤΟΣ': 'Famagusta', 'ΑΜΜΟΧΩΣΤΟΥ': 'Famagusta',
}

def extract_city(venue_text):
    upper = venue_text.upper()
    for city in CITY_KEYWORDS:
        if city in upper:
            return city.capitalize()
    for greek, english in GREEK_CITY_MAP.items():
        if greek in upper:
            return english
    return ''

def clean_date(date_str):
    # Remove tabs and extra spaces
    return re.sub(r'[\t\n\r]+', ' ', date_str).strip()

def _normalize_event_url(url: str) -> str:
    """Strip query, fragment, /lang/en suffix and trailing slash so the same
    event page always produces the same ticket_link key. Without this, the
    same event scraped twice (once with lang/en, once without) hits the
    insert/update lookup as two different rows."""
    u = url.split('?')[0].split('#')[0]
    u = u.replace('/lang/en', '').replace('/lang/el', '').replace('/lang/ru', '')
    return u.rstrip('/')


async def _collect_event_links_on_page(page, links: set):
    """Scrape modern /event/<slug>/ links — skip the old easyconsole.cfm/page/event/
    URLs that point to an alternate template the parser can't read."""
    content = await page.content()
    soup = BeautifulSoup(content, 'html.parser')
    for a in soup.find_all('a', href=True):
        href = a['href']
        if '/event/' not in href or 'easyconsole' in href:
            continue
        url = href if href.startswith('http') else (BASE_URL + href if href.startswith('/') else None)
        if url:
            links.add(_normalize_event_url(url))
    return None


async def get_event_links(page):
    """Aggregate event links from calendar + on-sale-now + each category page.
    The calendar alone only shows a subset; category pages and on-sale-now
    surface July/August/etc events the calendar omits."""
    links: set = set()

    sources = [
        f'{BASE_URL}/en/calendar',
        f'{BASE_URL}/en/events/on-sale-now',
        # Category pages — cat_ids observed on the site nav menu
        f'{BASE_URL}/easyconsole.cfm/page/category/cat_id/2/',  # THEATRE
        f'{BASE_URL}/easyconsole.cfm/page/category/cat_id/3/',  # MUSIC
        f'{BASE_URL}/easyconsole.cfm/page/category/cat_id/4/',  # DANCE
        f'{BASE_URL}/easyconsole.cfm/page/category/cat_id/8/',  # KIDS
    ]

    for url in sources:
        try:
            await page.goto(url, wait_until='domcontentloaded', timeout=60000)
            await page.wait_for_timeout(1500)
            await _collect_event_links_on_page(page, links)
            print(f'  collected from {url} — total so far: {len(links)}')
        except Exception as e:
            print(f'  source nav failed ({url}): {e}')

    return list(links)

async def scrape_event(page, url):
    try:
        # Normalize before everything else — same event scraped with a trailing
        # slash and without (or with /lang/en) would create separate DB rows
        # because the existing-lookup uses the raw URL.
        url = _normalize_event_url(url)
        # Fetch the English locale via the /en/ path prefix. The bare
        # /event/<slug> URL serves Greek by default (title, venue and the
        # "Πότε:" label all come back Greek), while /en/event/<slug> returns
        # English copy AND the same Event Dates table with the start time.
        # NB: this differs from the old ?lang=en / /lang/en suffix which blanked
        # modern slug pages — that's why we strip those in _normalize_event_url.
        # We keep `url` (no /en/) as the canonical ticket_link DB key.
        en_url = url.replace('soldoutticketbox.com/event/', 'soldoutticketbox.com/en/event/')
        await page.goto(en_url, wait_until='domcontentloaded', timeout=60000)
        await page.wait_for_timeout(1500)
        content = await page.content()
        soup = BeautifulSoup(content, 'html.parser')

        # Skip events where every listed date is cancelled (CANCELLED label per row)
        date_rows = soup.find_all('tr', class_=lambda c: c and c.startswith('row'))
        if date_rows:
            def is_cancelled(row):
                span = row.find('span', class_='red')
                return span is not None and 'CANCELLED' in span.get_text(strip=True).upper()
            if all(is_cancelled(r) for r in date_rows):
                return {'_cancelled': True, 'ticket_link': url}

        # Also skip when the page itself flags the event as cancelled outside the
        # date table — some events render "When: CANCELLED" or have a CANCELLED
        # banner in the main info block, and the date table doesn't trip the
        # row-level check above.
        page_text_upper = soup.get_text(separator=' ', strip=True).upper()
        if ('WHEN: CANCELLED' in page_text_upper
                or 'EVENT CANCELLED' in page_text_upper
                or 'EVENT IS CANCELLED' in page_text_upper):
            return {'_cancelled': True, 'ticket_link': url}

        # Title
        title = ''
        og_title = soup.find('meta', {'property': 'og:title'})
        if og_title:
            title = og_title.get('content', '').strip()
        if not title:
            h1 = soup.find('h1')
            if h1: title = h1.get_text(strip=True)

        # Image
        image = ''
        og_img = soup.find('meta', {'property': 'og:image'})
        if og_img:
            image = og_img.get('content', '').strip()

        # Structured fields
        date = venue = language = price = time_str = ''
        for el in soup.find_all(['span', 'div', 'p', 'li', 'td']):
            direct = ''.join(el.find_all(string=True, recursive=False)).strip()
            if not direct:
                direct = el.get_text(strip=True)
            if direct.startswith('When:') and not date and len(direct) < 150:
                raw = direct.replace('When:', '').strip()
                cleaned = clean_date(raw)
                # Split date and time if together
                parts = cleaned.split(' ')
                date = parts[0] if parts else cleaned
                time_str = parts[1] if len(parts) > 1 else ''
            elif direct.startswith('Where:') and not venue and len(direct) < 120:
                venue = direct.replace('Where:', '').strip()
            elif direct.startswith('Language:') and not language and len(direct) < 80:
                language = direct.replace('Language:', '').strip()
            elif direct.startswith('Tickets:') and not price and len(direct) < 200:
                price = direct.replace('Tickets:', '').strip()

        # Fallback: newer soldoutticketbox layout drops the "When: / Where:" labels
        # entirely and only renders the Event Dates table — rows like:
        #   <td><strong>21/05/2026</strong></td><td><strong>19:30</strong></td><td><strong><a>Venue</a></strong></td>
        # Take the first row as the canonical start, but walk every row to
        # collect every city the event tours through — without this the city
        # filter in-app misses tours that play multiple cities (Barcelona
        # Flamenco's Paphos/Nicosia/Limassol leg, etc).
        # Run whenever date OR time is missing — the "Πότε:/When:" paragraph
        # often gives a date (or a date range) with no time, so date can be
        # set while time_str is still empty. The Event Dates table carries the
        # real start time per row, so we still need to mine it for the hour.
        # A real start time is HH:MM. The "When:" label often yields a date
        # range like "09/10/2026 - 10/10/2026" whose split leaves time_str="-",
        # so test for a proper clock value rather than mere non-emptiness.
        time_re = re.compile(r'^\d{1,2}:\d{2}$')
        all_cities = []
        if not date or not time_re.match(time_str or ''):
            date_re = re.compile(r'^\d{1,2}/\d{1,2}/\d{4}$')
            captured = False
            for tr in soup.find_all('tr'):
                strongs = [s.get_text(strip=True) for s in tr.find_all('strong')]
                cand_date = next((s for s in strongs if date_re.match(s)), None)
                if not cand_date:
                    continue
                cand_time = next((s for s in strongs if time_re.match(s)), None)
                a = tr.find('a')
                row_venue = a.get_text(strip=True) if a else ''
                if not captured:
                    captured = True
                    # Prefer the table's single date over a label-loop range.
                    date = cand_date
                    if cand_time:
                        time_str = cand_time
                    if not venue and row_venue:
                        venue = row_venue
                row_city = extract_city(row_venue) if row_venue else ''
                if row_city and row_city not in all_cities:
                    all_cities.append(row_city)
        # If we picked up multiple cities from the tour table, overwrite the
        # single-row venue with the joined city list so the in-app city filter
        # matches every leg of the tour.
        if len(all_cities) > 1:
            venue = ', '.join(all_cities)

        # Description — only text after "About the event:" marker
        desc = ''
        full_text = soup.get_text(separator=' ', strip=True)
        if 'About the event' in full_text:
            after = full_text[full_text.find('About the event') + len('About the event'):].lstrip(':').strip()
            # Remove everything after next known section markers
            for stop in ['Event Dates', 'EventDay', 'More about', 'Ticket', 'Producer', 'Organizer', 'Phone:', 'Email:', 'Website:']:
                if stop in after:
                    after = after[:after.find(stop)]
            # Cap at 5000 chars — earlier 800 truncated long Russian/multi-language
            # descriptions mid-sentence ("Анна Пл..." instead of "Анна Плетнёва").
            # Real soldout descriptions almost never exceed ~3500 chars.
            desc = after.strip()[:5000]

        # Prefer the first city encountered in the Event Dates tour (tour order
        # = canonical start). extract_city(joined-list) returns whichever city
        # matches CITY_KEYWORDS first, which is alphabetical-ish, not chronological.
        city = all_cities[0] if all_cities else extract_city(venue)

        # Category
        category = ''
        cat_map = {
            'MUSIC': 'music', 'THEATRE': 'theatre', 'THEATER': 'theatre',
            'DANCE': 'dance', 'CHILDREN': 'children', 'COMEDY': 'comedy',
            'STAND UP': 'comedy', 'ART': 'art', 'FESTIVAL': 'festival',
            'CONCERT': 'music', 'OPERA': 'theatre', 'BALLET': 'dance',
        }
        cat_el = soup.find('a', {'class': 'h3Style'})
        if cat_el:
            cat_text = cat_el.get_text(strip=True).upper()
            for key, val in cat_map.items():
                if key in cat_text:
                    category = val
                    break
            if not category:
                category = cat_text.lower()

        return {
            'title': title,
            'date_label': date,
            'time_label': time_str,
            'time': time_str,
            'location': venue,
            'city': city,
            'language': language,
            'price': price,
            'image_url': image,
            'description': desc,
            'category': category,
            'ticket_link': url,
            'source': 'soldout',
        }
    except Exception as e:
        print(f'Error scraping {url}: {e}')
        return None

async def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=['--disable-blink-features=AutomationControlled']
        )
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 800},
        )
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        page = await context.new_page()

        if len(sys.argv) > 1:
            links = [sys.argv[1]]
            print(f'Test mode — scraping only: {links[0]}')
        else:
            print('Getting event links...')
            links = await get_event_links(page)
            print(f'Found {len(links)} events')

        inserted = 0
        skipped = 0
        cancelled_removed = 0
        for url in links:
            print(f'Scraping: {url}')
            event = await scrape_event(page, url)
            if event and event.get('_cancelled'):
                # Remove from DB if previously inserted
                deleted = supabase.table('official_events').delete().eq('ticket_link', url).execute()
                if deleted.data:
                    cancelled_removed += 1
                    print(f'  Removed cancelled')
                else:
                    print(f'  Skipped cancelled')
                skipped += 1
                continue
            if not event or not event['title']:
                skipped += 1
                continue

            # Update if exists, insert if not
            existing = supabase.table('official_events').select('id').eq('ticket_link', url).execute()
            if existing.data:
                event_id = existing.data[0]['id']
                supabase.table('official_events').update(event).eq('id', event_id).execute()
                print(f'  Updated: {event["title"]}')
                inserted += 1
            else:
                result = supabase.table('official_events').insert(event).execute()
                if result.data:
                    print(f'  Inserted: {event["title"]}')
                    inserted += 1
                else:
                    print(f'  Failed: {result}')

        await browser.close()

        # Purge events that already happened — keeps the table from filling up
        # with last year's shows. 2-day grace so multi-day runs aren't cut early.
        # Only runs on a full scrape (skip in single-URL test mode).
        purged = 0
        if len(sys.argv) <= 1:
            all_rows = supabase.table('official_events').select('id, date_label').execute()
            cutoff = datetime.now() - timedelta(days=2)
            date_pat = re.compile(r'(\d{1,2})/(\d{1,2})/(\d{4})')
            expired_ids = []
            for r in (all_rows.data or []):
                matches = date_pat.findall(r.get('date_label') or '')
                if not matches:
                    continue  # unparseable date — leave the row alone
                d, m, y = matches[-1]  # last date = end of a multi-day range
                try:
                    ev_date = datetime(int(y), int(m), int(d))
                except ValueError:
                    continue
                if ev_date < cutoff:
                    expired_ids.append(r['id'])
            if expired_ids:
                supabase.table('official_events').delete().in_('id', expired_ids).execute()
                purged = len(expired_ids)

        print(f'\nDone! Inserted: {inserted}, Skipped: {skipped}, Cancelled removed: {cancelled_removed}, Past purged: {purged}')

asyncio.run(main())
