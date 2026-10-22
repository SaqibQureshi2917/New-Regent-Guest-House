import React from 'react';
import { motion } from 'framer-motion';
import styles from './LoadingScreen.module.css';

const LoadingScreen = () => (
  <main className={styles.screen} aria-busy="true" aria-label="Loading New Regent Guest House">
    <img className={styles.backdrop} src="/room-presidential-1.jpg" alt="" aria-hidden="true" />
    <div className={styles.shade} aria-hidden="true" />

    <motion.section
      className={styles.content}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      role="status"
    >
      <motion.div
        className={styles.crest}
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.12, ease: 'easeOut' }}
        aria-hidden="true"
      >
        <span>NR</span>
      </motion.div>

      <p className={styles.eyebrow}>A considered kind of stay</p>
      <h1 className={styles.name}>New Regent</h1>
      <p className={styles.descriptor}>GUEST HOUSE</p>

      <div className={styles.progressTrack} role="progressbar" aria-label="Preparing your stay">
        <motion.span
          className={styles.progressBar}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.55, ease: [0.65, 0, 0.35, 1] }}
        />
      </div>
      <p className={styles.loadingText}>Preparing your stay</p>
    </motion.section>

    <div className={styles.footer} aria-hidden="true">
      <span>Comfort, with character.</span>
      <span className={styles.footerNote}>Thoughtfully hosted</span>
    </div>
  </main>
);

export default LoadingScreen;
