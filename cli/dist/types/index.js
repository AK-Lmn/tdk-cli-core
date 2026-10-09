export const RESOURCE_CONFIG_APP_TYPES = [
    "backend",
    "frontend",
    "library",
    "sdk",
    "worker",
    "migrator",
    "mcp",
    "bring-your-own",
];
export const CREATABLE_RESOURCE_TYPES = [
    "backend",
    "frontend",
    "worker",
    "mcp",
    "bring-your-own",
];
export function isCreatableResourceType(value) {
    return (typeof value === "string" && CREATABLE_RESOURCE_TYPES.includes(value));
}
import { RESOURCE_DEFAULTS_FILE } from "../utils/constants.js";
/**
 * Type guard to validate filename is a known master config file.
 * Eliminates the need for 'as MasterConfigFileName' assertion.
 */
export function isMasterConfigFileName(filename) {
    const validNames = [
        "TILT_TECH_STACK.star",
        RESOURCE_DEFAULTS_FILE,
        "spec.master",
    ];
    return validNames.includes(filename);
}
//# sourceMappingURL=index.js.map