// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
import { effectiveRuntimeStatus } from "./tilt-resource-state.js";
import { isAdvisoryResource } from "./up-readiness.js";
/**
 * The state of each resource `flisk up` waits for, from `tilt get uiresources -o json`. Disabled, deferred, advisory and
 * the `(Tiltfile)` resource are left out, so the count matches what readiness gates on.
 */
export function classifyUpProgress(jsonText, deferred) {
    const items = JSON.parse(jsonText).items ?? [];
    const services = [];
    for (const item of items) {
        const name = item.metadata?.name;
        if (!name || name === "(Tiltfile)" || deferred.has(name) || isAdvisoryResource(name))
            continue;
        if (item.status?.disableStatus?.state === "Disabled")
            continue;
        const rawUpdate = item.status?.updateStatus ?? "";
        // A serve-only local resource has nothing to build.
        const update = rawUpdate === "not_applicable" ? "ok" : rawUpdate;
        const runtime = effectiveRuntimeStatus(item.status);
        let state;
        if (update === "error" || runtime === "error")
            state = "failed";
        else if (update === "in_progress")
            state = "building";
        else if (update === "ok")
            state = runtime === "pending" || runtime === "none" ? "starting" : "ready";
        else
            state = "waiting";
        services.push({ name, state });
    }
    return services.sort((a, b) => a.name.localeCompare(b.name));
}
/** `5/9 ready`, then the services in each unfinished state. */
export function formatUpProgressLine(services) {
    const ready = services.filter((service) => service.state === "ready").length;
    const parts = [`${ready}/${services.length} ready`];
    for (const state of ["failed", "building", "starting", "waiting"]) {
        const names = services.filter((service) => service.state === state).map((s) => s.name);
        if (names.length > 0)
            parts.push(`${state}: ${names.join(", ")}`);
    }
    return parts.join(" · ");
}
export function formatServiceFailedLine(name) {
    return `✗ ${name} failed. See its logs: flisk logs -s ${name}`;
}
/**
 * Redraw one line in place only on an interactive terminal. `--quiet`, a pipe, CI and `TERM=dumb` get plain lines with
 * no cursor control.
 */
export function shouldRedrawUpProgress(input) {
    if (!input.isTTY || input.quiet)
        return false;
    if (input.env.CI && input.env.CI !== "false" && input.env.CI !== "0")
        return false;
    return input.env.TERM?.toLowerCase().startsWith("dumb") !== true;
}
/**
 * Shows per-service progress while `flisk up` waits for Tilt. Redraw mode keeps one line current and prints a failure as
 * a line of its own; plain mode prints one line per state change.
 */
export function createUpProgressReporter(options) {
    const previous = new Map();
    let lineShown = false;
    const clearLine = () => {
        if (lineShown)
            options.write("\r\x1b[2K");
        lineShown = false;
    };
    return {
        update(jsonText) {
            let services;
            try {
                services = classifyUpProgress(jsonText, options.deferred);
            }
            catch {
                return; // Tilt can answer with partial output while it starts.
            }
            if (services.length === 0)
                return;
            const ready = services.filter((service) => service.state === "ready").length;
            const changed = services.filter((service) => previous.get(service.name) !== service.state);
            for (const service of services)
                previous.set(service.name, service.state);
            if (options.redraw) {
                const failed = changed.filter((service) => service.state === "failed");
                if (failed.length > 0)
                    clearLine();
                for (const service of failed)
                    options.write(`${formatServiceFailedLine(service.name)}\n`);
                const width = Math.max(20, (options.columns ?? 80) - 1);
                const line = `⏳ ${formatUpProgressLine(services)}`;
                options.write(`\r\x1b[2K${line.length > width ? `${line.slice(0, width - 1)}…` : line}`);
                lineShown = true;
                return;
            }
            for (const service of changed) {
                const count = `(${ready}/${services.length} ready)`;
                options.write(service.state === "failed"
                    ? `${formatServiceFailedLine(service.name)} ${count}\n`
                    : `${service.name}: ${service.state} ${count}\n`);
            }
        },
        finish: clearLine,
    };
}
/** Wraps the readiness poll so every answer from Tilt also updates the progress. */
export function fetchWithProgress(fetchJson, progress) {
    return async (port) => {
        const text = await fetchJson(port);
        if (text)
            progress.update(text);
        return text;
    };
}
