#!/usr/bin/env node

/**
 * Comprehensive test runner for SaveMeToilet
 * Runs unit tests, integration tests, and performance benchmarks
 */

import { spawn } from 'child_process'
import { writeFileSync } from 'fs'

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { 
      stdio: 'pipe',
      shell: true
    })

    let stdout = ''
    let stderr = ''

    process.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    process.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject({ code, stdout, stderr })
      }
    })
  })
}

async function runTests() {
  log('🧪 SaveMeToilet Test Suite Runner', 'bold')
  log('====================================', 'blue')

  const results = {
    unit: null,
    integration: null,
    performance: null,
    coverage: null,
    startTime: Date.now()
  }

  try {
    // Run unit tests
    log('\n📦 Running Unit Tests...', 'yellow')
    try {
      const unitResult = await runCommand('npm', ['run', 'test', '--', '--reporter=verbose', '--run'])
      results.unit = { success: true, output: unitResult.stdout }
      log('✅ Unit tests passed', 'green')
    } catch (error) {
      results.unit = { success: false, error: error.stderr }
      log('❌ Unit tests failed', 'red')
      console.log(error.stderr)
    }

    // Run integration tests
    log('\n🔗 Running Integration Tests...', 'yellow')
    try {
      const integrationResult = await runCommand('npm', ['run', 'test', '--', '--reporter=verbose', '--run', 'src/__tests__/App.integration.test.jsx'])
      results.integration = { success: true, output: integrationResult.stdout }
      log('✅ Integration tests passed', 'green')
    } catch (error) {
      results.integration = { success: false, error: error.stderr }
      log('❌ Integration tests failed', 'red')
      console.log(error.stderr)
    }

    // Run performance tests
    log('\n⚡ Running Performance Tests...', 'yellow')
    try {
      const perfResult = await runCommand('npm', ['run', 'test', '--', '--reporter=verbose', '--run', 'src/test/performance.test.js'])
      results.performance = { success: true, output: perfResult.stdout }
      log('✅ Performance tests passed', 'green')
    } catch (error) {
      results.performance = { success: false, error: error.stderr }
      log('❌ Performance tests failed', 'red')
      console.log(error.stderr)
    }

    // Generate coverage report
    log('\n📊 Generating Coverage Report...', 'yellow')
    try {
      const coverageResult = await runCommand('npm', ['run', 'test', '--', '--coverage', '--run'])
      results.coverage = { success: true, output: coverageResult.stdout }
      log('✅ Coverage report generated', 'green')
    } catch (error) {
      results.coverage = { success: false, error: error.stderr }
      log('⚠️  Coverage report failed', 'yellow')
    }

  } catch (error) {
    log(`❌ Test runner error: ${error.message}`, 'red')
  }

  // Generate summary report
  results.endTime = Date.now()
  results.duration = results.endTime - results.startTime

  generateSummaryReport(results)
}

function generateSummaryReport(results) {
  log('\n📋 Test Summary Report', 'bold')
  log('=====================', 'blue')

  const totalTests = [results.unit, results.integration, results.performance].filter(r => r?.success).length
  const totalFailures = [results.unit, results.integration, results.performance].filter(r => r && !r.success).length

  log(`\n⏱️  Total Duration: ${Math.round(results.duration / 1000)}s`)
  log(`✅ Passed: ${totalTests}`)
  log(`❌ Failed: ${totalFailures}`)

  if (results.unit?.success) {
    log('\n📦 Unit Tests: PASSED', 'green')
  } else {
    log('\n📦 Unit Tests: FAILED', 'red')
  }

  if (results.integration?.success) {
    log('🔗 Integration Tests: PASSED', 'green')
  } else {
    log('🔗 Integration Tests: FAILED', 'red')
  }

  if (results.performance?.success) {
    log('⚡ Performance Tests: PASSED', 'green')
  } else {
    log('⚡ Performance Tests: FAILED', 'red')
  }

  if (results.coverage?.success) {
    log('📊 Coverage Report: GENERATED', 'green')
  }

  // Write detailed report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalTests,
      totalFailures,
      duration: results.duration,
      success: totalFailures === 0
    }
  }

  writeFileSync('test-report.json', JSON.stringify(reportData, null, 2))
  log('\n📄 Detailed report saved to test-report.json', 'blue')

  // Exit with appropriate code
  if (totalFailures > 0) {
    log('\n❌ Some tests failed. Please check the output above.', 'red')
    process.exit(1)
  } else {
    log('\n🎉 All tests passed! 🎉', 'green')
    process.exit(0)
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch((error) => {
    log(`❌ Test runner crashed: ${error.message}`, 'red')
    process.exit(1)
  })
}

export { runTests }