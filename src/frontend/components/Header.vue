<template>
  <header class="app-header">
    <div class="header-brand">
      <strong>Subtitle Downloader</strong>
    </div>
    <nav class="header-pages">
      <a href="#" class="active">Downloader</a>
    </nav>
    <div class="header-links">
      <a href="#">EN</a>
      <a href="#">GitHub</a>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rem;

  background-color: var(--bg-light);
  border-bottom: 1px solid rgba(var(--rgb-white), 0.09);
  padding: 0 var(--space-xl);
  
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: var(--space-lg);
  align-items: center;
}

.header-brand {
  justify-self: start;
  font-size: var(--font-size-lg);
}

.header-pages {
  justify-self: center;
  display: flex;
  gap: var(--space-lg);
  
  a {
    color: var(--text-muted);
    text-decoration: none;
    font-weight: 600;
    transition: color var(--transition-fast) ease;
    
    &.active {
      color: var(--text-accent);
    }
    
    &:hover:not(.active) {
      color: var(--text-bright);
    }
  }
}

.header-links {
  justify-self: end;
  display: flex;
  gap: var(--space-lg);
  
  a {
    color: var(--text-muted);
    text-decoration: none;
    font-weight: 600;
    transition: color var(--transition-fast) ease;
    
    &:hover {
      color: var(--text-bright);
    }
  }
}
</style>
