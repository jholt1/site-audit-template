const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const { Cluster } = require('puppeteer-cluster');
const AWS = require('aws-sdk');
const path = require('path');
const os = require("os");

let allPages = [];
let allLinks = [process.env.SITE_URL];
let scores = [];
let reports = 0;

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

const s3_bucket = process.env.BUCKET_NAME;
const date = new Date();
const d = date.toISOString().split('T')[0];
const bucket = new AWS.S3();

const getPathFromUrl = (url) => {
  return url.split("?")[0];
}

const logger = (message) => {
  console.log(message);
};

const cleanLink = (href) => {
  if (!href.startsWith(process.env.SITE_STARTSWITH)) {
    href = href.replace(/https?:\/\/+?/, process.env.SITE_STARTSWITH);
    href = href.replace(/www.www./g, 'www.');
  }

  return getPathFromUrl(href);
};

const isNewLink = (url) => {
  const clean = cleanLink(url);
  const existing = allPages.filter(page => page === clean);

  return existing.length === 0;
};

const getNewLinks = async (page, cluster) => {
  const links = await page.evaluate(() => {
    return Array.from(document.links).reduce((acc, val) => {
      const cleanLink = (href) => {
        if (!href.startsWith(process.env.SITE_STARTSWITH)) {
          href = href.replace(/https?:\/\/+?/, process.env.SITE_STARTSWITH);
          href = href.replace(/www.www./g, 'www.');
        }

        function getPathFromUrl(url) {
          return url.split("?")[0];
        }

        return getPathFromUrl(href);
      };

      const hasIgnorePaths = (val) => {
        if (!process.env.SKIP_PATHNAMES) {
          return false;
        }

        const skipPaths = process.env.SKIP_PATHNAMES.split(',').map(path => path.trim());

        for (var i = 0; i < skipPaths.length; i++) {
          if (val.startsWith(skipPaths[i])) {
            return true;
          }
        }

        return false;
      };

      const extractHostname = (url) => {
        let hostname = url.indexOf("//") > -1 ? hostname = url.split('/')[2] : hostname = url.split('/')[0];

        hostname = hostname.split(':')[0];
        hostname = hostname.split('?')[0];

        return hostname;
      };

      const rootDomain = (url = process.env.SITE_URL) => {
        let domain = extractHostname(url);
        const splitArr = domain.split('.');
        const arrLen = splitArr.length;

        if (arrLen > 2) {
          domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];

          if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
            domain = splitArr[arrLen - 3] + '.' + domain;
          }
        }

        return domain;
      };

      if (
        (val.host === `www.${rootDomain()}` || val.host === rootDomain()) &&
        document.location.pathname !== val.pathname &&
        !hasIgnorePaths(val.pathname)
      ) {
        const href = cleanLink(val.href);

        acc.push(href);
      }

      return acc;

    }, []);
  }).catch(e => logger(e));

  links.forEach((link) => {
    if (
      !allLinks.includes(link) &&
      (link.endsWith('/') || link.endsWith('.html'))
    ) {
      allLinks.push(link);
      cluster.queue(link);
    }
  });

};

const getName = (url) => {
  return url.replace(process.env.SITE_STARTSWITH, '').replace(/\//g, '_').replace(/\./g, '_');
};

const getAverageScore = (report, url) => {
  let categories = report.reportCategories // lighthouse v1,2
  let total = 0

  if (report.categories) { // lighthouse v3+
    categories = Object.values(report.categories)
  }

  const detail = categories.reduce((acc, cat) => {
    if (cat.id) {
      acc[cat.id] = cat.score;
    }

    total += cat.score;

    return acc;
  }, {});

  return {
    score: (total / categories.length).toFixed(2),
    detail,
    report: `${getName(url)}`
  }
};

const getChromePath = () => {
  let browserPath;

  if (os.type() === "Windows_NT") {
    // Chrome is usually installed as a 32-bit application, on 64-bit systems it will have a different installation path.
    const programFiles = os.arch() === 'x64' ? process.env["PROGRAMFILES(X86)"] : process.env.PROGRAMFILES;
    browserPath = path.join(programFiles, "Google/Chrome/Application/chrome.exe");
  } else if (os.type() === "Linux") {
    browserPath = "/usr/bin/google-chrome";
  } else if (os.type() === "Darwin" && os.arch() == "arm64") {
    browserPath = "/opt/homebrew/bin/chromium";
  } else {
    browserPath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }

  if (browserPath && browserPath.length > 0) {
    return path.normalize(browserPath);
  }

  throw new TypeError(`Cannot run action. ${os.type} is not supported.`);
}

const launchChromeAndRunLighthouse = (urls, opts, config = null) => {
  return chromeLauncher.launch({ chromeFlags: opts.chromeFlags }).then(async (chrome) => {
    opts.port = chrome.port;

    if (urls && typeof urls.map === "function") {
      for (id in urls) {
        const url = getPathFromUrl(urls[id]);
        logger(url);

        const results = await lighthouse(url, { ...opts }, config);
        const score = getAverageScore(results.lhr, url);

        score.url = url;
        scores.push(score);

        logger('Uploading to bucket');

        bucket.upload({
          Key: `${getName(url)}.html`,
          Body: results.report[0],
          Bucket: s3_bucket,
          ContentType: 'text/html',
          ACL: 'public-read'
        }, (error, file) => {
          if (error) {
            logger(error);
          }
        });

        bucket.upload({
          Key: `${getName(url)}_${d}.html`,
          Body: results.report[0],
          Bucket: s3_bucket,
          ContentType: 'text/html',
          ACL: 'public-read'
        }, (error, file) => {
          if (error) {
            logger(error);
          }
        });

        reports += 1;
      }
    }

    return chrome;
  });
}

const run = async () => {
  logger('starting up...');
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 10,
    puppeteerOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: getChromePath()
    },
    puppeteer
  });

  logger('setup browser...');

  await cluster.task(async ({ page, data: url }) => {
    logger(`opening page ${url}`);

    const response = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(e => logger(e));

    if (isNewLink(url) && response) {
      await getNewLinks(page, cluster);

      allPages.push(cleanLink(page.url()));
    }
  });

  for (let i = 0; i < allLinks.length; i++) {
    const newUrl = cleanLink(allLinks[i]);
    cluster.queue(newUrl);
  };

  await cluster.idle().catch(e => logger(e));
  await cluster.close().catch(e => logger(e));

  // run lighthouse report
  const urls = allPages.reduce((acc, r) => {
    if (acc.indexOf(r) === -1) {
      acc.push(r);
    }

    return acc;
  }, []).sort();

  const opts = {
    output: ['html', 'json'],
    chromeFlags: ['--no-sandbox', '--headless', '--disable-gpu']
  };

  logger('starting lighthouse reporting...');

  const chromeBrowser = await launchChromeAndRunLighthouse(urls, opts).catch((e) => {
    if (e) {
      logger(e);
      process.exit(1);
    }
  });

  console.log('completed lighthouse reporting');

  bucket.upload({
    Key: `summary.json`,
    Body: JSON.stringify(scores),
    Bucket: s3_bucket,
    ContentType: 'application/json',
    ACL: 'public-read'
  }, (error, file) => {
    if (error) {
      logger(error);
    }
  });

  bucket.upload({
    Key: `summary-${d}.json`,
    Body: JSON.stringify(scores),
    Bucket: s3_bucket,
    ContentType: 'application/json',
    ACL: 'public-read'
  }, (error, file) => {
    if (error) {
      logger(error);
    }
  });

  console.log('completed uploading summaries');

  chromeBrowser.kill();

  process.exit(0);
};

process.on('exit', async (code) => {
  logger('Task has finished...', code);
  logger(`Created ${reports} lighthouse reports`);
});

run();
