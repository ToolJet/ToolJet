export const blobToDataURL = (blob) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
    });
};

export const blobToBinary = (blob) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsBinaryString(blob);
        reader.onloadend = () => resolve(reader.result);
    });
};

export const formatSecondsToHHMMSS = (totalSeconds) => {
    const seconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
    const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
};
