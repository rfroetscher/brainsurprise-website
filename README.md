# Brain Surprise — website

The marketing site for **Brain Surprise**, a full-stack web-development and
data-engineering consultancy in Oakland, CA.

A single-page static site — no build step, no dependencies. Just HTML, CSS, and
vanilla JavaScript.

```
index.html     # all markup
styles.css     # all styles (dark theme, low-poly brand palette)
script.js      # scroll reveals, animated low-poly hero, count-up stats, mobile nav
assets/        # logo + team photos (WebP)
```

## Develop locally

```bash
python3 -m http.server 4173
# open http://localhost:4173
```

## Deploy

### GitHub Pages (current)
Served from the `main` branch via GitHub Pages.

### S3 static hosting (optional)
```bash
BUCKET=brainsurprise.com
aws s3api create-bucket --bucket "$BUCKET" --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false
aws s3 website "s3://$BUCKET/" --index-document index.html --error-document index.html
aws s3 sync . "s3://$BUCKET/" --exclude ".git/*" --exclude ".claude/*" --exclude "raw.html"
```
Then apply a public-read bucket policy (see `deploy/bucket-policy.json`).

For HTTPS on the apex domain, front the bucket with CloudFront + a free ACM
certificate and point DNS at the distribution.
