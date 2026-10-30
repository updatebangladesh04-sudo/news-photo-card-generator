# নিউজ ফটোকার্ড জেনারেটর (News Photo Card Generator)
এই ওয়েবসাইট তৈরি করেছেন: আসাদুল্লাহ গালিভ আল সাদি

Static React + TypeScript + Vite app. Cards render client-side on HTML5 Canvas (no backend, no API keys).

## Requirements
Node.js 18+ and npm.
## Run
```
unzip news-photo-card-generator.zip && cd news-photo-card-generator
npm install
npm run dev        # local
npm run build      # output: dist/
```
Highlight words in the statement by wrapping them in `*stars*`.
## GitHub
`git init && git add . && git commit -m init`, create a repo on github.com, then `git remote add origin <url> && git push -u origin main`.
## Cloudflare Pages
Workers & Pages → Create → Pages → Connect to Git → pick the repo. Framework: Vite (or None). Build command: `npm run build`. Output directory: `dist`. Deploy.
## Custom .dev domain
Pages project → Custom domains → Set up a domain → enter your existing domain. If its DNS is elsewhere, either add the CNAME Cloudflare shows, or move the domain's nameservers to Cloudflare. HTTPS is automatic (.dev requires it).
## Troubleshooting
- Build fails: use Node 18+ (set NODE_VERSION=20 in Pages settings).
- Bengali font missing: needs internet access to fonts.googleapis.com.
- Blank page: confirm output directory is `dist`.
