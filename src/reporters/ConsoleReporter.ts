import chalk from 'chalk';
import type { TestResult, CoreWebVitals, LighthouseReport } from '../core/types.js';

export class ConsoleReporter {
  printResult(result: TestResult): void {
    console.log('\n');
    console.log(chalk.bold.underline('━'.repeat(60)));
    console.log(chalk.bold(`  ${result.url}`));
    console.log(chalk.bold.underline('━'.repeat(60)));

    if (!result.success) {
      console.log(chalk.red(`\n✖ Error: ${result.error}`));
      return;
    }

    console.log(chalk.green(`\n✓ Test completed in ${result.duration}ms\n`));

    if (result.metrics?.coreWebVitals) {
      this.printCoreWebVitals(result.metrics.coreWebVitals);
    }

    if (result.metrics?.lighthouse) {
      this.printLighthouse(result.metrics.lighthouse);
    }

    console.log('\n');
  }

  private printCoreWebVitals(cwv: CoreWebVitals): void {
    console.log(chalk.bold('  Core Web Vitals'));
    console.log(chalk.gray('  ' + '─'.repeat(40)));

    const metrics = [
      { label: 'LCP', value: cwv.lcp, unit: 'ms', good: 2500 },
      { label: 'FID', value: cwv.fid, unit: 'ms', good: 100 },
      { label: 'CLS', value: cwv.cls, unit: '', good: 0.1 },
      { label: 'INP', value: cwv.inp, unit: 'ms', good: 200 },
      { label: 'TTFB', value: cwv.ttfb, unit: 'ms', good: 800 },
      { label: 'FCP', value: cwv.fcp, unit: 'ms', good: 1800 },
    ];

    for (const m of metrics) {
      const value = m.value !== null ? `${Math.round(m.value)}${m.unit}` : 'N/A';
      const status = this.getStatus(m.value, m.good);
      console.log(`  ${status} ${m.label}: ${chalk.bold(value)}`);
    }
  }

  private printLighthouse(lhr: LighthouseReport): void {
    console.log(chalk.bold('\n  Lighthouse Scores'));
    console.log(chalk.gray('  ' + '─'.repeat(40)));

    const scores = [
      { label: 'Performance', value: lhr.performance },
      { label: 'Accessibility', value: lhr.accessibility },
      { label: 'Best Practices', value: lhr.bestPractices },
      { label: 'SEO', value: lhr.seo },
    ];

    for (const s of scores) {
      const status = this.getScoreStatus(s.value);
      console.log(`  ${status} ${s.label}: ${chalk.bold(s.value)}`);
    }

    if (lhr.audits.length > 0) {
      console.log(chalk.bold('\n  Top Audits'));
      console.log(chalk.gray('  ' + '─'.repeat(40)));
      
      const failed = lhr.audits.filter(a => a.score < 0.5).slice(0, 5);
      for (const audit of failed) {
        console.log(`  ${chalk.red('✖')} ${audit.title}`);
      }
    }
  }

  private getStatus(value: number | null, goodThreshold: number): string {
    if (value === null) return chalk.gray('○');
    if (value <= goodThreshold) return chalk.green('✓');
    if (value <= goodThreshold * 1.5) return chalk.yellow('◐');
    return chalk.red('✖');
  }

  private getScoreStatus(score: number): string {
    if (score >= 90) return chalk.green('✓');
    if (score >= 50) return chalk.yellow('◐');
    return chalk.red('✖');
  }

  printError(error: Error): void {
    console.error(chalk.red(`\n✖ Error: ${error.message}\n`));
  }

  printSpinner(message: string): (() => void) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    const interval = setInterval(() => {
      process.stdout.write(`\r${frames[i++ % frames.length]} ${message}`);
    }, 80);
    
    return () => {
      clearInterval(interval);
      process.stdout.write('\r' + ' '.repeat(message.length + 2) + '\r');
    };
  }
}
