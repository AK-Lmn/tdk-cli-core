export interface StackProgress {
    /** Resources that are up. */
    ready: number;
    /** Resources Tilt is still working on. */
    building: number;
    /** Resources that have not started yet. */
    pending: number;
    /** Resources that failed. */
    failed: number;
    /** Every resource Tilt knows about. */
    total: number;
    /** The resources that are still working, with their state. */
    working: {
        name: string;
        state: string;
    }[];
    /** The resources that failed, with the reason. */
    broken: {
        name: string;
        message: string;
    }[];
    /** How long the stack has been coming up, in seconds. */
    elapsed: number;
}
/** Reads the resource states from the Tilt UI API. */
export declare function readStackProgress(port: number, tiltBin?: string): Promise<Omit<StackProgress, "elapsed"> | undefined>;
/** A one-line summary of the progress, for the progress line. */
export declare function formatProgress(progress: StackProgress): string;
