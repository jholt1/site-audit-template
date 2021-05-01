import Head from 'next/head';
import History from '../components/history'
import Score from '../components/score'
import styles from '../styles/Home.module.css';

export async function getStaticProps({ req }) {
  const summary = await (await fetch(`${process.env.URL_PREFIX}/summary.json`)).json();
  const history = await (await fetch(`${process.env.URL_PREFIX}/history.json`)).json();

  return {
    props: {
      summary,
      history
    },
    revalidate: 10000
  };
};

export default function Home({ summary, history }) {
  return (
    <div>
      <Head>
        <title>Lighthouse Audit</title>
        <link rel="icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEhklEQVR4AWJxL/BhIAesev1U5tcflpncgNrKIsqNIwzC9feMpDUzs70kOczMzMzJJcxwCTMzncPMnOwtzBwzMzPb0vRfeZPp0VhPS5I39V5fdiXV1/VD+9QC7OVn9BsyH1XIoEI1PfmJvLFowVV564+34DFUHudbmfDh4kVXh//7XwE+WjS/YfXZe3yr4j2rqj1AIhSB7hZ8ZtPZu/zw8cK523U4wE1/rvPfWrz4zs0m9ZdC9yUJAlASdBAgocRegfF/f3/h/PuaFsxMdwjAR0vm1+06eMMfIrhLqTWqdH4EumU2SPfMhigJAlRQbZrgrRsl9U+Y2DYDFCz3ILC9kiAiqSrMwbWT0nceEnR+9Kggc2zjOJCASDENkg0a5HfZZgDP81CM3CrQs2Z1+o7DJ6ePr8sK0AOCHv5Jjdt3evyYSaZ351VIStIxPRAUtrBYbxC6w+BZ0ivVSBKkIhJhemSyZpfB00EiPO2VjzYkxhcqXQqCWCShGplvi3y0QxqbuBurMjyJeWnkHZuAEgIQGsUBqwrfjZ+IlBgKyRJzVVYF8O6qFWdh86YzQzMrZigYmxAyfvHgLZQ/LC1CbeniW2Hkqr/PH16SgvGuf2/uzNMBwJA/njxizGPtSyAf7EziJCMGRDRdhoAC4PL1A/SrKQMAAQkEfpJAcRQdrBJ7gNwjSpJsdwK+CANBkqa1LgQB4IicV9nYUct7gaxuDJUErQIiEAiMxLVOFlKzIktPpT0ggpdpC/8YAHnxbgkUY4tAAFSR7AAXNyAAWHJrA/kHGjzg5nleuwFO7Nd/IoDw4Pm58+4jNLmYG0wRA5bErc2Mr3Y+dXTDW1VvwqbJkzMCHQ4S1GTCBOIgUHJrGdEwqzR+jAp/o2qAZelUDoQnruEEdDclJI6576AlNVfc+22XN/+Y1vnJD0Yind6UpEEvn/Hqq15EYjCW7jZCJEpnNvDgkyelDjs106kuux2AAXCSobULOWP8mLhYlpoDMK4qAFXJGk+grtH8YXVz5KJblqaG1+VUdTc0I290bmUQAriGITRbdQnom0aoFj8kx1+wMD2ifncAXUQE4SkDqN1hE0jEophs1SUwZAOhUAiMCLwRtamtTZtbbmZErSAUHbSysaoEmnrsakiMiUAURi283gN6wans9oX8rOCrj7/JP35DFD+iQ7Au/K2KE1jzx6ujjUnXFH9KjEq6ZlhsTBICrNLJf47Pv/pkHzvup1w4dmUbEei0+bcXRqJuh5kVARQ8byyYxOwNGr7A87xh1tp8sGT+uMInrwi++Xj7TQz2d27NvwEkrOflAFQGIDA5khASBCGdO2/Z/MnLPwYfv5TFhjW7QhVKAB6afwe2LpFlFsCnlQEosgQgDsdOG1/LKeNqJS4JCSPJ/i+TakwEARor7gER1Iva5JmPOJK0RUqmoPnnlzFCtmIAhAAQEIQRgDaiYPIauNXcnDlRIrWNFY3hm7PG9YRqr7IV7HrCgAC17befjEvRq2nGhAHtBqDpOuI/I1diUUAMYIxEdyejBJqLnNoszGZtfiX/CztGv2mq+sdaAAAAAElFTkSuQmCC" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.h1}>
          Lighthouse audit
        </h1>
        <ul className={styles.ul}>
          {summary.sort((a, b) => a.detail.performance - b.detail.performance).map((page, key) => {
            const historyDates = history[page.url] && Object.keys(history[page.url]) || [];
            const url = `/${page.report}`;
            const score = Math.floor(page.detail.performance * 100);
            const scoreColour = score > 89 ? 'green' : score > 49 ? 'orange' : 'red';

            return (
              <li key={key} className={styles.li}>
                <details className={styles.details}>
                  <summary>
                    <div className={styles.score}><span className={styles[scoreColour]}>{score}</span></div>
                    <span className={styles.path}>{page.url.replace(process.env.SITE_URL, '')} </span>
                  </summary>
                  <div className={styles.deets}>
                    <dl className={styles.dl}>
                      {Object.keys(page.detail).map((record, k) => {
                        if (record !== 'pwa') {
                          const data = historyDates.map((date) => {
                            return Math.floor(history[page.url][date][record] * 100);
                          });
                          let labels = [...new Set(historyDates)];
                          if (historyDates.length < 2) {
                            labels.push(historyDates[0]);
                            data.push(data[0]);
                          }

                          return (
                            <div key={k}>
                              <dt>{record}</dt>
                              <dd><Score score={page.detail[record]} /></dd>
                              <dd><History labels={labels} data={data} /></dd>
                            </div>
                          )
                        }
                      })}
                    </dl>

                    <details>
                      <summary>All Reports</summary>
                      <ul>
                        {historyDates.map((date, key) => {
                          const old_url = `/old${url}?d=${date}`;
                          return (
                            <li key={key}><a href={old_url}>View {date} report</a></li>
                          )
                        })}
                      </ul>
                    </details>

                    <a href={url}>View latest report</a>
                    <a target="_blank" rel="noreferrer" href={page.url}>View Page</a>
                    
                  </div>
                </details>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
