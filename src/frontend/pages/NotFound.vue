<script setup lang="ts">
// Creative 404 page for SubDowns
</script>

<template>
  <section class="not-found-section">
    <div class="glow-effect"></div>
    
    <div class="illustration-container">
      <svg class="svg-illustration" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Video screen frame -->
        <rect class="screen-frame" x="20" y="20" width="360" height="200" rx="12" />
        
        <!-- Video play progress/bar track -->
        <line class="progress-track" x1="40" y1="200" x2="360" y2="200" stroke-linecap="round" />
        <line class="progress-fill" x1="40" y1="200" x2="160" y2="200" stroke-linecap="round" />
        
        <!-- Animated speech/audio waves in the background -->
        <g class="audio-waves">
          <rect class="wave-bar wave-1" x="50" y="150" width="4" height="20" rx="2" />
          <rect class="wave-bar wave-2" x="60" y="140" width="4" height="35" rx="2" />
          <rect class="wave-bar wave-3" x="70" y="145" width="4" height="28" rx="2" />
          <rect class="wave-bar wave-4" x="330" y="155" width="4" height="15" rx="2" />
          <rect class="wave-bar wave-5" x="340" y="142" width="4" height="30" rx="2" />
        </g>

        <!-- Subtitle caption boxes simulating 404 -->
        <g class="subtitle-group">
          <!-- Cue block 1 (Digit 4) -->
          <g class="cue-block cue-1">
            <rect x="100" y="80" width="50" height="60" rx="8" />
            <text x="125" y="118" text-anchor="middle">4</text>
          </g>

          <!-- Cue block 2 (Digit 0 with warning icon/design) -->
          <g class="cue-block cue-2">
            <rect x="175" y="70" width="50" height="60" rx="8" />
            <text x="200" y="108" text-anchor="middle">0</text>
            <!-- Tiny error circle inside the 0 box -->
            <circle cx="200" cy="118" r="4" class="accent-dot" />
          </g>

          <!-- Cue block 3 (Digit 4) -->
          <g class="cue-block cue-3">
            <rect x="250" y="85" width="50" height="60" rx="8" />
            <text x="275" y="123" text-anchor="middle">4</text>
          </g>
        </g>

        <!-- Centered missing indicator -->
        <g class="missing-badge">
          <rect x="140" y="160" width="120" height="22" rx="11" />
          <text x="200" y="174" text-anchor="middle" class="badge-text">CC NOT FOUND</text>
        </g>
      </svg>
    </div>

    <div class="content-container">
      <h1 class="title">{{ $t('not_found.title') }}</h1>
      <p class="description">{{ $t('not_found.description') }}</p>
      
      <router-link to="/" class="back-link">
        <i class="material-symbols-outlined">home</i>
        {{ $t('not_found.back_home') }}
      </router-link>
    </div>
  </section>
</template>

<style scoped lang="scss">

.not-found-section {
  position: relative;
  width: 100%;
  max-width: 600px;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  
  text-align: center;
  padding: var(--space-xl) 0;
}

.glow-effect {
  position: absolute;
  z-index: 0;
  width: 300px;
  height: 300px;
  top: 10%;
  
  background: radial-gradient(circle, rgba(var(--rgb-accent), 0.12) 0%, transparent 70%);
  filter: blur(40px);
  pointer-events: none;
}

.illustration-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  
  display: flex;
  justify-content: center;
}

.svg-illustration {
  width: 100%;
  height: auto;
}

.screen-frame {
  fill: rgba(var(--rgb-foreground), 0.02);
  stroke: rgba(var(--rgb-foreground), 0.1);
  stroke-width: 1.5px;
}

.progress-track {
  stroke: rgba(var(--rgb-foreground), 0.05);
  stroke-width: 4px;
}

.progress-fill {
  stroke: var(--text-accent);
  stroke-width: 4px;
  stroke-dasharray: 400;
  stroke-dashoffset: 400;
  animation: draw-progress 3s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
}

.wave-bar {
  fill: rgba(var(--rgb-foreground), 0.1);
  animation: pulse-wave 1.5s ease-in-out infinite alternate;
  
  &.wave-1 { animation-delay: 0.1s; }
  &.wave-2 { animation-delay: 0.3s; }
  &.wave-3 { animation-delay: 0.5s; }
  &.wave-4 { animation-delay: 0.2s; }
  &.wave-5 { animation-delay: 0.4s; }
}

.cue-block {
  animation: float-cue 4s ease-in-out infinite;
  
  rect {
    fill: rgba(var(--rgb-black), 0.75);
    stroke: rgba(var(--rgb-foreground), 0.15);
    stroke-width: 1px;
    transition: stroke var(--transition-normal) ease;
  }
  
  text {
    fill: var(--text-bright);
    font-size: 28px;
    font-weight: 700;
  }
  
  &.cue-1 {
    animation-delay: 0s;
  }
  
  &.cue-2 {
    animation-delay: 0.8s;
    
    rect {
      stroke: var(--text-accent);
      stroke-width: 1.5px;
    }
  }
  
  &.cue-3 {
    animation-delay: 1.6s;
  }
}

.accent-dot {
  fill: var(--text-accent);
  animation: blink-dot 1s ease-in-out infinite;
}

.missing-badge {
  rect {
    fill: var(--error-bg);
    stroke: var(--error);
    stroke-width: 1px;
  }
  
  text {
    fill: var(--error);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
  }
}

.content-container {
  position: relative;
  z-index: 1;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.title {
  color: var(--text-bright);
  font-size: 2rem;
  font-weight: 800;
}

.description {
  color: var(--text-muted);
  font-size: var(--font-size-base);
  line-height: 1.6;
}

.back-link {
  border-radius: var(--radius-full);
  padding: var(--space-sm) var(--space-xl);
  
  background-color: rgba(var(--rgb-accent), 0.08);
  border: 1px solid rgba(var(--rgb-accent), 0.2);
  color: var(--text-accent);
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-decoration: none;
  
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  
  transition: background-color var(--transition-fast) ease, border-color var(--transition-fast) ease, color var(--transition-fast) ease;
  
  &:hover {
    background-color: var(--text-accent);
    color: var(--bg);
    border-color: transparent;
  }
  
  &:active {
    background-color: rgba(var(--rgb-accent), 0.16);
  }
}

@keyframes draw-progress {
  0% {
    stroke-dashoffset: 400;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes float-cue {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes pulse-wave {
  0% {
    transform: scaleY(0.7);
    opacity: 0.5;
  }
  100% {
    transform: scaleY(1.3);
    opacity: 1;
  }
}

@keyframes blink-dot {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
