import React from 'react';
import styles from './TransactionLoader.module.css';

type TransactionLoaderProps = {
  progress?: number;
  total?: number;
  etaSeconds?: number;
};

export const TransactionLoader: React.FC<TransactionLoaderProps> = ({ progress, total, etaSeconds }) => {
  const progressPercentage = progress && total ? Math.round((progress / total) * 100) : 0;
  const hasProgress = progress !== undefined && total !== undefined;

  return (
    <div className={styles.loaderContainer}>
      {/* Main circular loader */}
      <div className={styles.circularLoader}>
        <svg className={styles.loaderSvg} viewBox="0 0 100 100">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a90e2" />
              <stop offset="50%" stopColor="#357abd" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle
            className={styles.loaderTrack}
            cx="50"
            cy="50"
            r="40"
            fill="none"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            className={styles.loaderProgress}
            cx="50"
            cy="50"
            r="40"
            fill="none"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={hasProgress ? `${2 * Math.PI * 40 * (1 - progressPercentage / 100)}` : undefined}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className={styles.loaderCenter}>
          {hasProgress ? (
            <div className={styles.progressText}>
              {progressPercentage}%
            </div>
          ) : (
            <div className={styles.btczIcon}>
              <i className="fas fa-coins" />
            </div>
          )}
        </div>
      </div>

      {/* Status text */}
      <div className={styles.statusText}>
        <div className={styles.mainText}>Computing Transaction</div>
        <div className={styles.subText}>
          {hasProgress ? (
            <>Step {progress} of {total}</>
          ) : (
            'Please wait, this could take a while...'
          )}
        </div>
      </div>

      {/* ETA display */}
      {etaSeconds !== undefined && etaSeconds > 0 && (
        <div className={styles.etaContainer}>
          <div className={styles.etaLabel}>Estimated time:</div>
          <div className={styles.etaValue}>
            {etaSeconds > 60 
              ? `${Math.floor(etaSeconds / 60)}m ${etaSeconds % 60}s`
              : `${etaSeconds}s`
            }
          </div>
        </div>
      )}

      {/* Progress bar (secondary visualization) */}
      {hasProgress && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Animated dots */}
      <div className={styles.dots}>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
      </div>
    </div>
  );
};