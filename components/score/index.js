import styles from './styles.module.css';

export default function Score({score}) {
  const scoreUpdate = Math.floor(score * 100);
  const scoreColour = scoreUpdate > 89 ? 'green' : scoreUpdate > 49 ? 'orange' : 'red';
  return (
    <div className={styles.score}>
      <span className={styles[scoreColour]}>{scoreUpdate}</span>
    </div>
  )
}