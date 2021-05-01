import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import styles from './styles.module.css';

const options = {
  threshold: 0.01,
  rootMargin: '150px'
};

export default function History({labels, data}) {

  const [abc, setAbc] = useState(false);

  const canvasData = (canvas) => {

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0) {
          setAbc(true);
        }
      });
    }, options);

    io.observe(canvas);

    return {
      labels,
      datasets: [
        {
          label: 'Score',
          fill: false,
          borderColor: '#5851ff',
          pointBorderColor: '#2921da',
          pointBackgroundColor: '#2921da',
          pointHoverBackgroundColor: '#2921da',
          pointHoverBorderColor: '#2921da',
          pointBorderWidth: 5,
          pointHoverRadius: 8,
          pointHoverBorderWidth: 1,
          pointRadius: 1,
          fill: true,
          pointStyle: 'rect',
          backgroundColor: '#8681ff',
          borderWidth: 4,
          hitRadius: 10,
          data
        }
      ]
    }
  };

  const opts = {
    maintainAspectRatio: false,
    layout: {
      padding: 10
    },
    scales: {
      xAxes: [
        {
          gridLines: {
            display: false,
          },
          ticks: {
            display: false
          }
        }
      ],
      yAxes: [
        {
          display: false,
          ticks: {
            min: 0,
            max: 110
          }
        }
      ]
    }
  };

  const legend = {
    display: false
  };

  return (
    <div className={styles.wrapper}>
      <Line
        data={canvasData}
        redraw={abc}
        legend={legend}
        options={opts}
        width={100}
        height={50}
      />
    </div>
  );
}