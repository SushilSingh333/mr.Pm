#!/usr/bin/env bash
#
# After a deploy: check the live site and the server actually have what was shipped.
# Read-only - it only makes GET requests and reads service status. Safe to run any time.
#
# Usage (on the droplet, from the project root):   bash deploy/smoke-test.sh
#        against another host:                     SITE=https://staging.example.com bash deploy/smoke-test.sh
#
# Every check prints PASS or FAIL; the script exits 1 if anything failed. Each request
# carries a throwaway query string so Cloudflare's cache cannot answer with an old page.
set -uo pipefail

SITE="${SITE:-https://mrmoverpacker.com}"
BUST="smoke=$(date +%s)"
pass=0
fail=0

ok() { pass=$((pass + 1)); printf '  PASS  %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf '  FAIL  %s%s\n' "$1" "${2:+  ($2)}"; }

# get <path> -> sets $body and $code (no subshell, so both reach the caller)
code=000
body=''
get() {
	local tmp sep='?'
	[[ $1 == *\?* ]] && sep='&'
	tmp="$(mktemp)"
	code="$(curl -sS -o "$tmp" -w '%{http_code}' --max-time 20 "${SITE}$1${sep}${BUST}")" || code=000
	body="$(cat "$tmp")"
	rm -f "$tmp"
}

# served <path> <label> - just the HTTP status (for images and other binary files)
served() {
	local c
	c="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "${SITE}$1?${BUST}")" || c=000
	if [ "$c" = 200 ]; then ok "$2"; else bad "$2" "HTTP $c"; fi
}

# page <path> <label> [must-contain...] - 200, and each phrase present
page() {
	local path="$1" label="$2"
	shift 2

	get "$path"
	if [ "$code" != 200 ]; then
		bad "$label" "HTTP $code"
		return
	fi
	local p
	for p in "$@"; do
		if ! grep -qF -- "$p" <<<"$body"; then
			bad "$label" "missing: $p"
			return
		fi
	done
	ok "$label"
}

# absent <path> <label> <must-not-contain>
absent() {

	get "$1"
	if grep -qF -- "$3" <<<"$body"; then bad "$2" "still contains: $3"; else ok "$2"; fi
}

echo "Website: $SITE"
page / "home page loads with the festive banner" "festive-dussehra-diwali-moving-offer" "Packers and movers in India"
page / "home: founder line signed Sachin Chaudhary" "Sachin Chaudhary"
absent / "home: old founder name gone" "Sachin Kumar"
served /images/promo/festive-dussehra-diwali-moving-offer-wide.webp "banner image (desktop) is served"
served /images/promo/festive-dussehra-diwali-moving-offer-tall.webp "banner image (phone) is served"
page /company/team "team page is live with the 4 people" "Sachin Chaudhary" "Akash Singh" "Akib Javed" "Sanoj Kumar" "The crew on moving day"
absent /company/team "team page: no 'Ask for' buttons" "Ask for "
page /company/about "about page names Sachin Chaudhary" "Sachin Chaudhary"
page /privacy "privacy policy updated for accounts" "17 October 2026" "If you create an account"
page /terms "terms cover accounts" "Your account."
page /get-quote "quote page shows the 20% off note" "20% off" "on every move"
page /services/home-shifting "service page form shows the 20% off note" "20% off" "Your coordinator takes it off"
page /account/login "customer sign-in page loads"
page /account/signup "customer sign-up page loads"
page /admin/login "CMS admin loads"

get /api/account/me
if [ "$code" = 401 ]; then ok "accounts API answers (401 when signed out)"; else bad "accounts API answers" "HTTP $code, expected 401"; fi

get /sitemaps/localities.xml
n="$(grep -o '<loc>' <<<"$body" | wc -l | tr -d ' ')"
if [ "$code" = 200 ] && [ "$n" -ge 91 ]; then ok "area pages in the sitemap: $n"; else bad "area pages in the sitemap" "HTTP $code, $n pages"; fi

echo
echo "Server"
if command -v systemctl >/dev/null 2>&1; then
	for unit in mrpackermover-cms mrpackermover-deploy; do
		if systemctl is-active --quiet "$unit"; then ok "$unit is running"; else bad "$unit is running" "$(systemctl is-active "$unit")"; fi
	done
	if grep -q "release-status" /etc/systemd/system/mrpackermover-release.service 2>/dev/null; then
		ok "release service has the self-stopping check installed"
	else
		bad "release service has the self-stopping check installed" "run: sudo bash deploy/install-units.sh && sudo systemctl daemon-reload"
	fi
	if systemctl is-enabled --quiet mrpackermover-release.timer 2>/dev/null; then
		echo "  INFO  release timer: still on (it switches itself off once every area page is live)"
	else
		echo "  INFO  release timer: off"
	fi
else
	echo "  INFO  not on the server (no systemctl): server checks skipped"
fi
if [ -d apps/cms ]; then
	echo "  INFO  release: $(cd apps/cms && pnpm -s release-status 2>/dev/null | tail -1)"
fi

echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
