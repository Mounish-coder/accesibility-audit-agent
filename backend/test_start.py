import urllib.request
import json
import urllib.error

url = 'http://localhost:8000/api/audit/start'
data = json.dumps({'url': 'https://wikipedia.org', 'wcag_level': 'AA', 'max_pages': 10, 'include_passes': True}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print("Success:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTPError {e.code}:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
