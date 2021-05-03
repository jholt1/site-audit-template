# Lighthouse Site Audit

This is a template for anyone to use to audit their site.

## How it works

This uses GitHub Actions to scrape your site and then perform a Lighthouse Report on each URL.

It stores the results and each Lighthouse Report in your own AWS S3 Bucket, which called on build to create a cached version of the assets (to not increase the cost of calling S3), thanks to the setup in [Next.js](https://nextjs.org/) and [Vercel](https://vercel.com/)

## Why was this created?

I wanted to run a lighthouse on a site each day and see if there was any changes. I wanted to provide the cheapest way for this to run, currently the setup for auditing 1 site is around ~$0.10 in cost on AWS per month.

## Setup

### Prerequisites

1. Have a [Vercel account](https://vercel.com).
2. Have an [AWS account](aws.amazon.com).
3. Have a website to audit or permission to scrape someone's site.

### Environment variables

This template works on environment variables.

These need to be setup in two places.

1. The GitHub repo, where you are using this template.
2. In your Vercel account for this repo.


| Environment variable | Example | Location | Required |
--- | --- | --- | ---
| AWS_ACCESS_KEY | ***** | GitHub, Vercel | Required |
| AWS_SECRET_KEY | ***** | GitHub, Vercel | Required |
| BUCKET_NAME | random-bucket-name-123 | GitHub, Vercel | Required |
| SITE_URL | https://example.com | GitHub, Vercel | Required |
| URL_PREFIX | https://bucket-name.s3.local.amazonaws.com | Vercel | Required |
| SITE_STARTSWITH | https://www. | GitHub | Required |
| SKIP_PATHNAMES | /blog/, /corporate/ | GitHub | Optional |

### How to

1. Create your GitHub repo by using this template.
2. Add the environment variables to the GitHub repo.
3. Manually run the GitHub Action.
4. Once the Action has completed, connect the repo to Vercel, add environment variables to Vercel and deploy.
5. Review and check back at the results.

### S3 bucket

This needs to be a public visible bucket. However, due to the caching from Vercel, the S3 bucket will never be visible to an end user.

A life-cycle rule of 30 days should be added to reduce cost of storing outdated reports.

## Limitations

### Skip pathnames

It is checking the start of the path name, rather than specific paths

### Sitemap

Currently not checking for sitemaps, robots or other indicators of the urls for a website.

### Daily reporting

This has been made to check for daily changes, while it can work for longer periods of time, it would not work for multiple audits per day.

## Contributing

If you have improvements or find bugs, please raise them back with this template thank-you 🙌