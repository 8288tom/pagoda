function normalizeTimestamp(timestamp) {
    if (isNaN(timestamp)) {
        console.error(`Invalid timestamp: ${timestamp}`);
        return timestamp;
    }
    return timestamp < 1e12 ? timestamp * 1000 : timestamp;
}

function isValueDigits(value) {
    const pattern = /^\d+$/; // Regex pattern to match digits only
    return pattern.test(value);
}

function isLocalDevEnv() {
    return process.env.NODE_ENV === "development";
}

const removeFalsyRecursively = (val) => {
    const data = Array.isArray(val) ? val.filter(Boolean) : val;
    return Object.keys(data).reduce(
        (acc, key) => {
            const value = data[key];
            // eslint-disable-next-line
            if (Boolean(value))
                acc[key] = typeof value === "object" ? removeFalsyRecursively(value) : value;
            return acc;
        },
        Array.isArray(val) ? [] : {}
    );
};


const apiCallsOptions = ["active", "notActive", "blocked"]
const accountTypeOptions = ["Full Service", "Self Serve", "Idomoo"]
const storageTypes = ['sftp', 'sftpkey', 's3cmd'];
const hostingPeriodOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "14", "15", "20", "25", "30", "45", "60", "75", "90", "120", "150", "180", "360", "365"]
export { normalizeTimestamp, isValueDigits, apiCallsOptions, accountTypeOptions, storageTypes, hostingPeriodOptions, isLocalDevEnv, removeFalsyRecursively }