import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";
import type { CheckResult } from '../types/index.js';

function checkDocker(): CheckResult {
  try {
    execSync("docker ps", { stdio: "pipe" });
    return {
      name: "Docker",
      didPass: true,
      message: "Docker daemon is running",
    };
  } catch {
    return {
      name: "Docker",
      didPass: false,
      message: "Docker is not running",
      fix: "Start Docker Desktop or run: open -a Docker (macOS) or sudo systemctl start docker (Linux)",
    };
  }
}

function checkDockerCompose(): CheckResult {
  try {
    execSync("docker compose version", { stdio: "pipe" });
    return {
      name: "Docker Compose",
      didPass: true,
      message: "Docker Compose plugin available",
    };
  } catch {
    return {
      name: "Docker Compose",
      didPass: false,
      message: "Docker Compose plugin not found",
      fix: "Install Docker Compose: https://docs.docker.com/compose/install/",
    };
  }
}

function checkTilt(): CheckResult {
  try {
    const output = execSync("tilt version", { stdio: "pipe", encoding: "utf8" }).trim();
    return {
      name: "Tilt CLI",
      didPass: true,
      message: "Tilt CLI installed",
    };
  } catch {
    return {
      name: "Tilt CLI",
      didPass: false,
      message: "Tilt CLI not found",
      fix: "Install Tilt: brew install tilt (macOS) or see https://docs.tilt.dev/install.html",
    };
  }
}

function checkMasterConfigs(): CheckResult {
  const defaultsPath = resolve(process.cwd(), "TILT_RESOURCE_DEFAULTS.star");
  const techStackPath = resolve(process.cwd(), "TILT_TECH_STACK.star");

  const defaultsExists = existsSync(defaultsPath);
  const techStackExists = existsSync(techStackPath);

  if (defaultsExists && techStackExists) {
    return {
      name: "Master Configs",
      didPass: true,
      message: "TILT_RESOURCE_DEFAULTS.star and TILT_TECH_STACK.star found",
    };
  }

  const missing = [];
  if (!defaultsExists) missing.push("TILT_RESOURCE_DEFAULTS.star");
  if (!techStackExists) missing.push("TILT_TECH_STACK.star");

  return {
    name: "Master Configs",
    didPass: false,
    message: `Master configs missing: ${missing.join(", ")}`,
    fix: "Run: tdk project",
  };
}

export const doctorCommand = new Command('doctor')
  .description('Check environment readiness for TDK')
  .action(async () => {
    console.log(`\n${chalk.bold('🔍 TDK Doctor')}\n`);
    console.log("Checking environment...\n");

    const checks = [
      checkDocker,
      checkTilt,
      checkDockerCompose,
      checkMasterConfigs,
    ];

    let allPassed = true;

    for (const checkFn of checks) {
      const result = checkFn();

      if (result.didPass) {
        console.log(`${chalk.green('✓')} ${result.message}`);
      } else {
        console.log(`${chalk.red('✗')} ${result.message}`);
        if (result.fix) {
          console.log(`${chalk.blue('ℹ')} Fix: ${result.fix}`);
        }
        allPassed = false;
        break;
      }
    }

    console.log("");

    if (allPassed) {
      console.log(`${chalk.green(chalk.bold('✓'))} Environment ready for TDK`);
      console.log("");
      console.log("Next steps:");
      console.log("  1. Run: tdk up");
      console.log("  2. Open: http://localhost:10350");
    } else {
      console.log(`${chalk.red(chalk.bold('✗'))} Environment not ready`);
      console.log("");
      console.log("Fix the issues above, then run: tdk doctor");
      process.exit(1);
    }
  });
